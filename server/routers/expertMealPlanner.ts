import { z } from "zod";
import { protectedProcedure } from "../_core/trpc";
import { router } from "../_core/trpc";
import { getDb } from "../db";
import {
  expertWeeklyPlans,
  expertWeeklyPlanSlots,
  offlinePatients,
  recipes,
} from "../../drizzle/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

const MEAL_TIMES = ["desayuno", "media_manana", "comida", "merienda", "cena"] as const;
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const expertMealPlannerRouter = router({
  // ─── Listar planes semanales del experto ──────────────────────────────────
  listPlans: protectedProcedure
    .input(z.object({
      offlinePatientId: z.number().optional(),
      isTemplate: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(expertWeeklyPlans.expertUserId, ctx.user.id)];
      if (input.offlinePatientId !== undefined) {
        conditions.push(eq(expertWeeklyPlans.offlinePatientId, input.offlinePatientId));
      }
      if (input.isTemplate !== undefined) {
        conditions.push(eq(expertWeeklyPlans.isTemplate, input.isTemplate));
      }
      const plans = await db
        .select()
        .from(expertWeeklyPlans)
        .where(and(...conditions))
        .orderBy(expertWeeklyPlans.createdAt);
      return plans.reverse();
    }),

  // ─── Obtener un plan con sus slots y recetas ──────────────────────────────
  getPlan: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [plan] = await db
        .select()
        .from(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.id, input.planId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
        ));
      if (!plan) throw new Error("Plan no encontrado");

      const slots = await db
        .select()
        .from(expertWeeklyPlanSlots)
        .where(eq(expertWeeklyPlanSlots.weeklyPlanId, input.planId))
        .orderBy(expertWeeklyPlanSlots.dayOfWeek, expertWeeklyPlanSlots.sortOrder);

      // Cargar recetas referenciadas
      const recipeIds = [...new Set(slots.filter(s => s.recipeId).map(s => s.recipeId!))];
      const recipeMap: Record<number, typeof recipes.$inferSelect> = {};
      if (recipeIds.length > 0) {
        const recipeRows = await db
          .select()
          .from(recipes)
          .where(inArray(recipes.id, recipeIds));
        for (const r of recipeRows) recipeMap[r.id] = r;
      }

      // Construir grid: { [dayOfWeek]: { [mealTime]: slot[] } }
      const grid: Record<number, Record<string, Array<typeof slots[0] & { recipe?: typeof recipes.$inferSelect }>>> = {};
      for (let d = 0; d < 7; d++) {
        grid[d] = {};
        for (const mt of MEAL_TIMES) grid[d][mt] = [];
      }
      for (const slot of slots) {
        const enriched = { ...slot, recipe: slot.recipeId ? recipeMap[slot.recipeId] : undefined };
        if (!grid[slot.dayOfWeek]) grid[slot.dayOfWeek] = {};
        if (!grid[slot.dayOfWeek][slot.mealTime]) grid[slot.dayOfWeek][slot.mealTime] = [];
        grid[slot.dayOfWeek][slot.mealTime].push(enriched);
      }

      return { plan, slots, grid, recipeMap };
    }),

  // ─── Crear plan semanal ───────────────────────────────────────────────────
  createPlan: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(256),
      description: z.string().optional(),
      offlinePatientId: z.number().optional(),
      weekStartDate: z.string().optional(), // ISO date string
      isTemplate: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [plan] = await db
        .insert(expertWeeklyPlans)
        .values({
          expertUserId: ctx.user.id,
          offlinePatientId: input.offlinePatientId ?? null,
          title: input.title,
          description: input.description ?? null,
          weekStartDate: input.weekStartDate ?? null,
          isTemplate: input.isTemplate ?? false,
          notes: input.notes ?? null,
        })
        .returning();
      return plan;
    }),

  // ─── Actualizar metadatos del plan ────────────────────────────────────────
  updatePlan: protectedProcedure
    .input(z.object({
      planId: z.number(),
      title: z.string().min(1).max(256).optional(),
      description: z.string().optional(),
      weekStartDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { planId, ...rest } = input;
      await db
        .update(expertWeeklyPlans)
        .set({ ...rest, updatedAt: new Date() })
        .where(and(
          eq(expertWeeklyPlans.id, planId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
        ));
      return { ok: true };
    }),

  // ─── Eliminar plan ────────────────────────────────────────────────────────
  deletePlan: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(expertWeeklyPlanSlots)
        .where(eq(expertWeeklyPlanSlots.weeklyPlanId, input.planId));
      await db
        .delete(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.id, input.planId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
        ));
      return { ok: true };
    }),

  // ─── Añadir receta a un slot ──────────────────────────────────────────────
  addSlot: protectedProcedure
    .input(z.object({
      weeklyPlanId: z.number(),
      dayOfWeek: z.number().min(0).max(6),
      mealTime: z.enum(MEAL_TIMES),
      recipeId: z.number().optional(),
      customName: z.string().max(256).optional(),
      customCalories: z.number().optional(),
      servings: z.number().optional(),
      notes: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Verificar que el plan pertenece al experto
      const [plan] = await db
        .select({ id: expertWeeklyPlans.id })
        .from(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.id, input.weeklyPlanId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
        ));
      if (!plan) throw new Error("Plan no encontrado");

      const [slot] = await db
        .insert(expertWeeklyPlanSlots)
        .values({
          weeklyPlanId: input.weeklyPlanId,
          dayOfWeek: input.dayOfWeek,
          mealTime: input.mealTime,
          recipeId: input.recipeId ?? null,
          customName: input.customName ?? null,
          customCalories: input.customCalories ?? null,
          servings: input.servings ?? 1,
          notes: input.notes ?? null,
          sortOrder: input.sortOrder ?? 0,
        })
        .returning();

      // Recalcular totales del plan
      await recalcPlanTotals(db, input.weeklyPlanId);

      return slot;
    }),

  // ─── Eliminar slot ────────────────────────────────────────────────────────
  removeSlot: protectedProcedure
    .input(z.object({
      slotId: z.number(),
      weeklyPlanId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Verificar propiedad
      const [plan] = await db
        .select({ id: expertWeeklyPlans.id })
        .from(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.id, input.weeklyPlanId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
        ));
      if (!plan) throw new Error("Plan no encontrado");

      await db
        .delete(expertWeeklyPlanSlots)
        .where(eq(expertWeeklyPlanSlots.id, input.slotId));

      await recalcPlanTotals(db, input.weeklyPlanId);
      return { ok: true };
    }),

  // ─── Mover slot (drag & drop) ─────────────────────────────────────────────
  moveSlot: protectedProcedure
    .input(z.object({
      slotId: z.number(),
      weeklyPlanId: z.number(),
      newDayOfWeek: z.number().min(0).max(6),
      newMealTime: z.enum(MEAL_TIMES),
      newSortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [plan] = await db
        .select({ id: expertWeeklyPlans.id })
        .from(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.id, input.weeklyPlanId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
        ));
      if (!plan) throw new Error("Plan no encontrado");

      await db
        .update(expertWeeklyPlanSlots)
        .set({
          dayOfWeek: input.newDayOfWeek,
          mealTime: input.newMealTime,
          sortOrder: input.newSortOrder ?? 0,
        })
        .where(eq(expertWeeklyPlanSlots.id, input.slotId));

      return { ok: true };
    }),

  // ─── Limpiar todos los slots de un día ───────────────────────────────────
  clearDay: protectedProcedure
    .input(z.object({
      weeklyPlanId: z.number(),
      dayOfWeek: z.number().min(0).max(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [plan] = await db
        .select({ id: expertWeeklyPlans.id })
        .from(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.id, input.weeklyPlanId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
        ));
      if (!plan) throw new Error("Plan no encontrado");

      await db
        .delete(expertWeeklyPlanSlots)
        .where(and(
          eq(expertWeeklyPlanSlots.weeklyPlanId, input.weeklyPlanId),
          eq(expertWeeklyPlanSlots.dayOfWeek, input.dayOfWeek),
        ));

      await recalcPlanTotals(db, input.weeklyPlanId);
      return { ok: true };
    }),

  // ─── Duplicar plan (para usar como plantilla) ─────────────────────────────
  duplicatePlan: protectedProcedure
    .input(z.object({
      planId: z.number(),
      newTitle: z.string().min(1).max(256),
      offlinePatientId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [original] = await db
        .select()
        .from(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.id, input.planId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
        ));
      if (!original) throw new Error("Plan no encontrado");

      const [newPlan] = await db
        .insert(expertWeeklyPlans)
        .values({
          expertUserId: ctx.user.id,
          offlinePatientId: input.offlinePatientId ?? original.offlinePatientId,
          title: input.newTitle,
          description: original.description,
          isTemplate: false,
          notes: original.notes,
          totalCalories: original.totalCalories,
          totalProtein: original.totalProtein,
          totalCarbs: original.totalCarbs,
          totalFat: original.totalFat,
        })
        .returning();

      // Copiar slots
      const originalSlots = await db
        .select()
        .from(expertWeeklyPlanSlots)
        .where(eq(expertWeeklyPlanSlots.weeklyPlanId, input.planId));

      if (originalSlots.length > 0) {
        await db.insert(expertWeeklyPlanSlots).values(
          originalSlots.map(s => ({
            weeklyPlanId: newPlan.id,
            dayOfWeek: s.dayOfWeek,
            mealTime: s.mealTime,
            recipeId: s.recipeId,
            customName: s.customName,
            customCalories: s.customCalories,
            servings: s.servings,
            notes: s.notes,
            sortOrder: s.sortOrder,
          }))
        );
      }

      return newPlan;
    }),

  // ─── Enviar plan por email al paciente ────────────────────────────────────
  sendPlanByEmail: protectedProcedure
    .input(z.object({
      planId: z.number(),
      offlinePatientId: z.number(),
      customMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [plan] = await db
        .select()
        .from(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.id, input.planId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
        ));
      if (!plan) throw new Error("Plan no encontrado");

      const [patient] = await db
        .select()
        .from(offlinePatients)
        .where(and(
          eq(offlinePatients.id, input.offlinePatientId),
          eq(offlinePatients.expertUserId, ctx.user.id),
        ));
      if (!patient || !patient.email) throw new Error("Paciente sin email");

      // Obtener slots con recetas
      const slots = await db
        .select()
        .from(expertWeeklyPlanSlots)
        .where(eq(expertWeeklyPlanSlots.weeklyPlanId, input.planId))
        .orderBy(expertWeeklyPlanSlots.dayOfWeek, expertWeeklyPlanSlots.sortOrder);

      const recipeIds = [...new Set(slots.filter(s => s.recipeId).map(s => s.recipeId!))];
      const recipeMap: Record<number, string> = {};
      if (recipeIds.length > 0) {
        const recipeRows = await db
          .select({ id: recipes.id, name: recipes.name })
          .from(recipes)
          .where(inArray(recipes.id, recipeIds));
        for (const r of recipeRows) recipeMap[r.id] = r.name;
      }

      // Construir HTML del menú
      const mealTimeLabels: Record<string, string> = {
        desayuno: "Desayuno",
        media_manana: "Media mañana",
        comida: "Comida",
        merienda: "Merienda",
        cena: "Cena",
      };

      let menuHtml = "";
      for (let d = 0; d < 7; d++) {
        const daySlots = slots.filter(s => s.dayOfWeek === d);
        if (daySlots.length === 0) continue;
        menuHtml += `<h3 style="color:#e07b39;margin:16px 0 8px">${DAYS[d]}</h3><table style="width:100%;border-collapse:collapse">`;
        for (const mt of MEAL_TIMES) {
          const mtSlots = daySlots.filter(s => s.mealTime === mt);
          if (mtSlots.length === 0) continue;
          const names = mtSlots.map(s => s.recipeId ? recipeMap[s.recipeId] ?? s.customName : s.customName).filter(Boolean).join(", ");
          menuHtml += `<tr><td style="padding:4px 8px;font-weight:600;color:#555;width:120px">${mealTimeLabels[mt]}</td><td style="padding:4px 8px;border-left:2px solid #f0e8e0">${names}</td></tr>`;
        }
        menuHtml += "</table>";
      }

      const calInfo = plan.totalCalories ? `<p style="color:#888;font-size:13px">Total estimado: ${plan.totalCalories} kcal/día</p>` : "";

      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "BuddyOne <noreply@buddyone.com>",
        to: patient.email,
        subject: `Tu menú semanal: ${plan.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#e07b39">🥗 Tu menú semanal</h2>
            <p>Hola <strong>${patient.name}</strong>,</p>
            <p>Tu nutricionista te ha preparado el siguiente plan de alimentación para esta semana:</p>
            <h3 style="margin-bottom:4px">${plan.title}</h3>
            ${plan.description ? `<p style="color:#666">${plan.description}</p>` : ""}
            ${menuHtml}
            ${calInfo}
            ${input.customMessage ? `<div style="margin-top:16px;padding:12px;background:#fdf6f0;border-radius:8px"><p style="margin:0;color:#555">${input.customMessage}</p></div>` : ""}
            ${plan.notes ? `<p style="color:#888;font-size:13px;margin-top:12px">Notas: ${plan.notes}</p>` : ""}
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
            <p style="color:#aaa;font-size:12px">Enviado desde BuddyOne — El sistema operativo de tu bienestar</p>
          </div>
        `,
      });

      // Marcar como enviado
      await db
        .update(expertWeeklyPlans)
        .set({ sentAt: new Date(), sentChannel: "email", updatedAt: new Date() })
        .where(eq(expertWeeklyPlans.id, input.planId));

      return { ok: true };
    }),

  // ─── Guardar plan actual como plantilla reutilizable ────────────────────
  saveAsTemplate: protectedProcedure
    .input(z.object({
      planId: z.number().int(),
      templateName: z.string().min(1).max(256),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [original] = await db
        .select()
        .from(expertWeeklyPlans)
        .where(and(eq(expertWeeklyPlans.id, input.planId), eq(expertWeeklyPlans.expertUserId, ctx.user.id)));
      if (!original) throw new TRPCError({ code: "NOT_FOUND", message: "Plan no encontrado" });

      const [template] = await db
        .insert(expertWeeklyPlans)
        .values({
          expertUserId: ctx.user.id,
          offlinePatientId: null,
          title: input.templateName,
          description: input.description ?? original.description,
          weekStartDate: null,
          isTemplate: true,
          totalCalories: original.totalCalories,
          totalProtein: original.totalProtein,
          totalCarbs: original.totalCarbs,
          totalFat: original.totalFat,
          notes: original.notes,
        })
        .returning();

      const slots = await db
        .select()
        .from(expertWeeklyPlanSlots)
        .where(eq(expertWeeklyPlanSlots.weeklyPlanId, input.planId));

      if (slots.length > 0) {
        await db.insert(expertWeeklyPlanSlots).values(
          slots.map(s => ({
            weeklyPlanId: template.id,
            dayOfWeek: s.dayOfWeek,
            mealTime: s.mealTime,
            recipeId: s.recipeId,
            customName: s.customName,
            customCalories: s.customCalories,
            servings: s.servings,
            notes: s.notes,
            sortOrder: s.sortOrder,
          }))
        );
      }
      return template;
    }),

  // ─── Listar plantillas del experto ───────────────────────────────────────
  listTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      const db = getDb();
      const templates = await db
        .select()
        .from(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
          eq(expertWeeklyPlans.isTemplate, true)
        ))
        .orderBy(desc(expertWeeklyPlans.createdAt));

      const result = await Promise.all(templates.map(async (t) => {
        const slots = await db
          .select({ id: expertWeeklyPlanSlots.id })
          .from(expertWeeklyPlanSlots)
          .where(eq(expertWeeklyPlanSlots.weeklyPlanId, t.id));
        return { ...t, slotCount: slots.length };
      }));
      return result;
    }),

  // ─── Aplicar plantilla a un paciente y semana concreta ───────────────────
  applyTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number().int(),
      offlinePatientId: z.number().int(),
      weekStartDate: z.string(),
      planTitle: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [template] = await db
        .select()
        .from(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.id, input.templateId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
          eq(expertWeeklyPlans.isTemplate, true)
        ));
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Plantilla no encontrada" });

      const [newPlan] = await db
        .insert(expertWeeklyPlans)
        .values({
          expertUserId: ctx.user.id,
          offlinePatientId: input.offlinePatientId,
          title: input.planTitle ?? template.title,
          description: template.description,
          weekStartDate: input.weekStartDate,
          isTemplate: false,
          totalCalories: template.totalCalories,
          totalProtein: template.totalProtein,
          totalCarbs: template.totalCarbs,
          totalFat: template.totalFat,
          notes: template.notes,
        })
        .returning();

      const templateSlots = await db
        .select()
        .from(expertWeeklyPlanSlots)
        .where(eq(expertWeeklyPlanSlots.weeklyPlanId, input.templateId));

      if (templateSlots.length > 0) {
        await db.insert(expertWeeklyPlanSlots).values(
          templateSlots.map(s => ({
            weeklyPlanId: newPlan.id,
            dayOfWeek: s.dayOfWeek,
            mealTime: s.mealTime,
            recipeId: s.recipeId,
            customName: s.customName,
            customCalories: s.customCalories,
            servings: s.servings,
            notes: s.notes,
            sortOrder: s.sortOrder,
          }))
        );
      }
      return newPlan;
    }),

  // ─── Eliminar plantilla ────────────────────────────────────────────────
  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [template] = await db
        .select({ id: expertWeeklyPlans.id })
        .from(expertWeeklyPlans)
        .where(and(
          eq(expertWeeklyPlans.id, input.templateId),
          eq(expertWeeklyPlans.expertUserId, ctx.user.id),
          eq(expertWeeklyPlans.isTemplate, true)
        ));
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Plantilla no encontrada" });
      await db.delete(expertWeeklyPlanSlots).where(eq(expertWeeklyPlanSlots.weeklyPlanId, input.templateId));
      await db.delete(expertWeeklyPlans).where(eq(expertWeeklyPlans.id, input.templateId));
      return { ok: true };
    }),
});

// ─── Helper: recalcular totales del plan ─────────────────────────────────────
async function recalcPlanTotals(db: ReturnType<typeof getDb>, planId: number) {
  const slots = await db
    .select({ recipeId: expertWeeklyPlanSlots.recipeId, servings: expertWeeklyPlanSlots.servings, customCalories: expertWeeklyPlanSlots.customCalories })
    .from(expertWeeklyPlanSlots)
    .where(eq(expertWeeklyPlanSlots.weeklyPlanId, planId));

  const recipeIds = [...new Set(slots.filter(s => s.recipeId).map(s => s.recipeId!))];
  const recipeMap: Record<number, { calories?: number | null; protein?: number | null; carbs?: number | null; fat?: number | null }> = {};
  if (recipeIds.length > 0) {
    const recipeRows = await db
      .select({ id: recipes.id, calories: recipes.calories, protein: recipes.protein, carbs: recipes.carbs, fat: recipes.fat })
      .from(recipes)
      .where(inArray(recipes.id, recipeIds));
    for (const r of recipeRows) recipeMap[r.id] = r;
  }

  let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
  for (const slot of slots) {
    const servings = slot.servings ?? 1;
    if (slot.recipeId && recipeMap[slot.recipeId]) {
      const r = recipeMap[slot.recipeId];
      totalCal += (r.calories ?? 0) * servings;
      totalProt += (r.protein ?? 0) * servings;
      totalCarbs += (r.carbs ?? 0) * servings;
      totalFat += (r.fat ?? 0) * servings;
    } else if (slot.customCalories) {
      totalCal += slot.customCalories * servings;
    }
  }

  // Dividir entre 7 días para obtener media diaria
  const days = 7;
  await db
    .update(expertWeeklyPlans)
    .set({
      totalCalories: Math.round(totalCal / days),
      totalProtein: Math.round(totalProt / days * 10) / 10,
      totalCarbs: Math.round(totalCarbs / days * 10) / 10,
      totalFat: Math.round(totalFat / days * 10) / 10,
      updatedAt: new Date(),
    })
    .where(eq(expertWeeklyPlans.id, planId));
}
