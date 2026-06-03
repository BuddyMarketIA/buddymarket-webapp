import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  householdMembers,
  householdMenuPlans,
  users,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

// ─── Helper: get Monday of the week for a given date ─────────────────────────
// ─── Helper: get membership and verify household ──────────────────────────────
async function getMyMembership(db: Awaited<ReturnType<typeof getDb>>, userId: number) {
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const [membership] = await db!.select().from(householdMembers)
    .where(eq(householdMembers.userId, userId)).limit(1);
  if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "No perteneces a ningún hogar." });
  return membership;
}

export const householdMenusRouter = router({
  // ─── List menu plans for the household ─────────────────────────────────────
  listMenuPlans: protectedProcedure
    .input(z.object({
      memberId: z.number().optional(), // null = all plans
      weekStartDate: z.string().optional(), // ISO date string
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const membership = await getMyMembership(db, ctx.user.id);
      const conditions = [eq(householdMenuPlans.householdId, membership.householdId)];
      if (input?.memberId !== undefined) {
        conditions.push(eq(householdMenuPlans.memberId, input.memberId));
      }
      const plans = await db!.select({
        id: householdMenuPlans.id,
        householdId: householdMenuPlans.householdId,
        memberId: householdMenuPlans.memberId,
        name: householdMenuPlans.name,
        menuType: householdMenuPlans.menuType,
        weekStartDate: householdMenuPlans.weekStartDate,
        meals: householdMenuPlans.meals,
        notes: householdMenuPlans.notes,
        isActive: householdMenuPlans.isActive,
        generatedByAI: householdMenuPlans.generatedByAI,
        createdAt: householdMenuPlans.createdAt,
        memberName: householdMembers.displayName,
        memberType: householdMembers.memberType,
        creatorName: users.name,
      })
        .from(householdMenuPlans)
        .leftJoin(householdMembers, eq(householdMenuPlans.memberId, householdMembers.id))
        .leftJoin(users, eq(householdMenuPlans.createdByUserId, users.id))
        .where(and(...conditions))
        .orderBy(desc(householdMenuPlans.weekStartDate));
      return plans.map(p => ({
        ...p,
        meals: p.meals ? JSON.parse(p.meals) : null,
      }));
    }),

  // ─── Create a menu plan for a member ───────────────────────────────────────
  createMenuPlan: protectedProcedure
    .input(z.object({
      memberId: z.number().nullable().optional(),
      name: z.string().min(1).max(120),
      menuType: z.enum(["adults", "kids", "baby", "custom", "family"]).default("adults"),
      weekStartDate: z.string(), // ISO date string (Monday)
      meals: z.record(z.string(), z.object({
        breakfast: z.string().optional(),
        lunch: z.string().optional(),
        dinner: z.string().optional(),
        snack: z.string().optional(),
        snack2: z.string().optional(),
      })).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const membership = await getMyMembership(db, ctx.user.id);
      const weekStart = new Date(input.weekStartDate);
      const [plan] = await db!.insert(householdMenuPlans).values({
        householdId: membership.householdId,
        memberId: input.memberId ?? null,
        createdByUserId: ctx.user.id,
        name: input.name,
        menuType: input.menuType,
        weekStartDate: weekStart,
        meals: input.meals ? JSON.stringify(input.meals) : null,
        notes: input.notes ?? null,
        isActive: true,
        generatedByAI: false,
      }).returning();
      return plan;
    }),

  // ─── Update a menu plan ─────────────────────────────────────────────────────
  updateMenuPlan: protectedProcedure
    .input(z.object({
      planId: z.number(),
      name: z.string().min(1).max(120).optional(),
      meals: z.record(z.string(), z.object({
        breakfast: z.string().optional(),
        lunch: z.string().optional(),
        dinner: z.string().optional(),
        snack: z.string().optional(),
        snack2: z.string().optional(),
      })).optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const membership = await getMyMembership(db, ctx.user.id);
      const [plan] = await db!.select().from(householdMenuPlans)
        .where(and(
          eq(householdMenuPlans.id, input.planId),
          eq(householdMenuPlans.householdId, membership.householdId)
        )).limit(1);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan no encontrado." });
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.meals !== undefined) updateData.meals = JSON.stringify(input.meals);
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      await db!.update(householdMenuPlans)
        .set(updateData as Partial<typeof householdMenuPlans.$inferInsert>)
        .where(eq(householdMenuPlans.id, input.planId));
      return { success: true };
    }),

  // ─── Delete a menu plan ─────────────────────────────────────────────────────
  deleteMenuPlan: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const membership = await getMyMembership(db, ctx.user.id);
      await db!.delete(householdMenuPlans)
        .where(and(
          eq(householdMenuPlans.id, input.planId),
          eq(householdMenuPlans.householdId, membership.householdId)
        ));
      return { success: true };
    }),

  // ─── Generate AI menu plan for a member ────────────────────────────────────
  generateAIMenuPlan: protectedProcedure
    .input(z.object({
      memberId: z.number().nullable().optional(),
      memberName: z.string().optional(),
      menuType: z.enum(["adults", "kids", "baby", "custom", "family"]).default("adults"),
      weekStartDate: z.string(),
      ageYears: z.number().optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      medicalConditions: z.string().optional(),
      calorieTarget: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const membership = await getMyMembership(db, ctx.user.id);

      // Build AI prompt
      const memberDesc = input.memberName || (input.menuType === "family" ? "toda la familia" : "el miembro del hogar");
      const ageDesc = input.ageYears ? `${input.ageYears} años` : "";
      const restrictionsDesc = input.dietaryRestrictions?.length
        ? `Restricciones: ${input.dietaryRestrictions.join(", ")}.`
        : "";
      const allergiesDesc = input.allergies?.length
        ? `Alergias: ${input.allergies.join(", ")}.`
        : "";
      const medDesc = input.medicalConditions
        ? `Condiciones médicas: ${input.medicalConditions}.`
        : "";
      const calDesc = input.calorieTarget
        ? `Objetivo calórico: ~${input.calorieTarget} kcal/día.`
        : "";

      const systemPrompt = `Eres un nutricionista experto especializado en planificación de menús familiares.
Genera un menú semanal equilibrado y variado para ${memberDesc}${ageDesc ? ` (${ageDesc})` : ""}.
${restrictionsDesc} ${allergiesDesc} ${medDesc} ${calDesc}
El menú debe ser práctico, con recetas sencillas y nombres en español.
Responde SOLO con JSON válido, sin texto adicional.`;

      const userPrompt = `Genera un menú semanal (lunes a domingo) con desayuno, comida, merienda y cena para cada día.
Formato JSON exacto:
{
  "monday": {"breakfast": "nombre del desayuno", "lunch": "nombre de la comida", "snack": "nombre de la merienda", "dinner": "nombre de la cena"},
  "tuesday": {...},
  "wednesday": {...},
  "thursday": {...},
  "friday": {...},
  "saturday": {...},
  "sunday": {...}
}`;

      let meals: Record<string, Record<string, string>> = {};
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" } as any,
        });
        const rawContent = response.choices?.[0]?.message?.content || "{}";
        meals = JSON.parse(typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent));
      } catch {
        // Fallback: basic menu structure
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        for (const day of days) {
          meals[day] = {
            breakfast: "Tostadas con aguacate y huevo",
            lunch: "Ensalada mediterránea con pollo",
            snack: "Fruta de temporada",
            dinner: "Salmón al horno con verduras",
          };
        }
      }

      const weekStart = new Date(input.weekStartDate);
      const planName = input.memberName
        ? `Menú de ${input.memberName} — semana del ${weekStart.toLocaleDateString("es-ES")}`
        : `Menú familiar — semana del ${weekStart.toLocaleDateString("es-ES")}`;

      const [plan] = await db!.insert(householdMenuPlans).values({
        householdId: membership.householdId,
        memberId: input.memberId ?? null,
        createdByUserId: ctx.user.id,
        name: planName,
        menuType: input.menuType,
        weekStartDate: weekStart,
        meals: JSON.stringify(meals),
        notes: input.notes ?? null,
        isActive: true,
        generatedByAI: true,
      }).returning();

      return { ...plan, meals };
    }),

  // ─── Get current week plan for a member ────────────────────────────────────
  getCurrentWeekPlan: protectedProcedure
    .input(z.object({ memberId: z.number().nullable().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const membership = await getMyMembership(db, ctx.user.id);
      const conditions = [
        eq(householdMenuPlans.householdId, membership.householdId),
        eq(householdMenuPlans.isActive, true),
      ];
      if (input?.memberId !== undefined && input.memberId !== null) {
        conditions.push(eq(householdMenuPlans.memberId, input.memberId));
      }
      const [plan] = await db!.select().from(householdMenuPlans)
        .where(and(...conditions))
        .orderBy(desc(householdMenuPlans.weekStartDate))
        .limit(1);
      if (!plan) return null;
      return { ...plan, meals: plan.meals ? JSON.parse(plan.meals) : null };
    }),
});
