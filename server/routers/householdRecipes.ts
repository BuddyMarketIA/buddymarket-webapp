import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  households,
  householdMembers,
  householdRecipeAssignments,
  recipes,
  users,
} from "../../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { Resend } from "resend";

// ─── Email helper ─────────────────────────────────────────────────────────────
async function sendRecipeAssignedEmail(params: {
  memberEmail: string;
  memberName: string;
  assignerName: string;
  householdName: string;
  recipeName: string;
  recipeImageUrl?: string | null;
  mealType?: string | null;
  note?: string | null;
  appUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const mealLabel = params.mealType
    ? { desayuno: "Desayuno", almuerzo: "Almuerzo", cena: "Cena", snack: "Snack" }[params.mealType] ?? params.mealType
    : null;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Luis de BuddyOne <luis@buddyone.io>",
    to: params.memberEmail,
    subject: `${params.assignerName} te ha asignado una receta 🍽️`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">🍽️ Nueva receta asignada</h1>
          <p style="color:#fed7aa;margin:6px 0 0;font-size:14px">Hogar: <strong>${params.householdName}</strong></p>
        </div>
        <div style="padding:28px 32px">
          <p style="color:#374151;font-size:15px;margin:0 0 16px">Hola <strong>${params.memberName}</strong>,</p>
          <p style="color:#374151;font-size:15px;margin:0 0 20px">
            <strong>${params.assignerName}</strong> te ha asignado la siguiente receta:
          </p>
          ${params.recipeImageUrl ? `<img src="${params.recipeImageUrl}" alt="${params.recipeName}" style="width:100%;border-radius:8px;margin-bottom:16px;object-fit:cover;max-height:200px">` : ""}
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:20px">
            <p style="margin:0;font-size:18px;font-weight:700;color:#c2410c">${params.recipeName}</p>
            ${mealLabel ? `<p style="margin:4px 0 0;font-size:13px;color:#9a3412">🕐 ${mealLabel}</p>` : ""}
            ${params.note ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280;font-style:italic">"${params.note}"</p>` : ""}
          </div>
          <a href="${params.appUrl}/familia" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:14px">
            Ver mis recetas asignadas →
          </a>
        </div>
        <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
          <p style="margin:0;font-size:12px;color:#9ca3af">BuddyOne · Tu gestor nutricional inteligente</p>
        </div>
      </div>
    `,
  });
}

// ─── Helper: verificar que el usuario es admin/owner del hogar ─────────────────
async function getHouseholdAsAdmin(householdId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB no disponible" });

  const member = await db
    .select({ role: householdMembers.role, householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.userId, userId)))
    .limit(1);

  if (!member.length || (member[0].role !== "owner" && member[0].role !== "admin")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo el propietario o administrador puede asignar recetas" });
  }

  const household = await db
    .select({ id: households.id, name: households.name })
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  if (!household.length) throw new TRPCError({ code: "NOT_FOUND", message: "Hogar no encontrado" });
  return { db, household: household[0] };
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const householdRecipesRouter = router({
  // Asignar una receta a un miembro del hogar
  assign: protectedProcedure
    .input(z.object({
      householdId: z.number().int().positive(),
      memberId: z.number().int().positive(),       // householdMembers.id
      recipeId: z.number().int().positive(),
      mealType: z.enum(["desayuno", "almuerzo", "cena", "snack"]).optional(),
      note: z.string().max(300).optional(),
      scheduledDate: z.string().optional(),        // ISO date string
      origin: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, household } = await getHouseholdAsAdmin(input.householdId, ctx.user.id);

      // Verificar que el miembro pertenece al hogar
      const member = await db
        .select({ id: householdMembers.id, userId: householdMembers.userId, displayName: householdMembers.displayName })
        .from(householdMembers)
        .where(and(eq(householdMembers.id, input.memberId), eq(householdMembers.householdId, input.householdId)))
        .limit(1);
      if (!member.length) throw new TRPCError({ code: "NOT_FOUND", message: "Miembro no encontrado en este hogar" });

      // Verificar que la receta existe
      const recipe = await db
        .select({ id: recipes.id, name: recipes.name, imageUrl: recipes.imageUrl })
        .from(recipes)
        .where(eq(recipes.id, input.recipeId))
        .limit(1);
      if (!recipe.length) throw new TRPCError({ code: "NOT_FOUND", message: "Receta no encontrada" });

      // Insertar (ignorar si ya existe)
      const [assignment] = await db
        .insert(householdRecipeAssignments)
        .values({
          householdId: input.householdId,
          memberId: input.memberId,
          recipeId: input.recipeId,
          assignedByUserId: ctx.user.id,
          mealType: input.mealType ?? null,
          note: input.note ?? null,
          scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
          isCompleted: false,
        })
        .onConflictDoNothing()
        .returning();

      if (!assignment) {
        throw new TRPCError({ code: "CONFLICT", message: "Esta receta ya está asignada a este miembro" });
      }

      // Enviar email de notificación al miembro
      try {
        const memberUser = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, member[0].userId ?? 0))
          .limit(1);

        if (memberUser.length && memberUser[0].email) {
          await sendRecipeAssignedEmail({
            memberEmail: memberUser[0].email,
            memberName: member[0].displayName ?? memberUser[0].name ?? "Miembro",
            assignerName: ctx.user.name ?? "Un administrador",
            householdName: household.name,
            recipeName: recipe[0].name,
            recipeImageUrl: recipe[0].imageUrl,
            mealType: input.mealType ?? null,
            note: input.note ?? null,
            appUrl: input.origin ?? "https://buddyone.io",
          });
        }
      } catch (_) { /* email no crítico */ }

      return { success: true, assignment };
    }),

  // Desasignar una receta de un miembro
  unassign: protectedProcedure
    .input(z.object({
      assignmentId: z.number().int().positive(),
      householdId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = await getHouseholdAsAdmin(input.householdId, ctx.user.id);

      const deleted = await db
        .delete(householdRecipeAssignments)
        .where(and(
          eq(householdRecipeAssignments.id, input.assignmentId),
          eq(householdRecipeAssignments.householdId, input.householdId),
        ))
        .returning({ id: householdRecipeAssignments.id });

      if (!deleted.length) throw new TRPCError({ code: "NOT_FOUND", message: "Asignación no encontrada" });
      return { success: true };
    }),

  // Marcar una receta como completada (el miembro puede marcarla)
  markCompleted: protectedProcedure
    .input(z.object({
      assignmentId: z.number().int().positive(),
      householdId: z.number().int().positive(),
      completed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar que el usuario es miembro del hogar
      const member = await db
        .select({ id: householdMembers.id })
        .from(householdMembers)
        .where(and(eq(householdMembers.householdId, input.householdId), eq(householdMembers.userId, ctx.user.id)))
        .limit(1);
      if (!member.length) throw new TRPCError({ code: "FORBIDDEN", message: "No eres miembro de este hogar" });

      await db
        .update(householdRecipeAssignments)
        .set({
          isCompleted: input.completed,
          completedAt: input.completed ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(householdRecipeAssignments.id, input.assignmentId),
          eq(householdRecipeAssignments.householdId, input.householdId),
        ));

      return { success: true };
    }),

  // Obtener todas las asignaciones de un miembro específico
  getForMember: protectedProcedure
    .input(z.object({
      householdId: z.number().int().positive(),
      memberId: z.number().int().positive(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar que el usuario es miembro del hogar
      const isMember = await db
        .select({ id: householdMembers.id })
        .from(householdMembers)
        .where(and(eq(householdMembers.householdId, input.householdId), eq(householdMembers.userId, ctx.user.id)))
        .limit(1);
      if (!isMember.length) throw new TRPCError({ code: "FORBIDDEN", message: "No eres miembro de este hogar" });

      const assignments = await db
        .select({
          id: householdRecipeAssignments.id,
          memberId: householdRecipeAssignments.memberId,
          mealType: householdRecipeAssignments.mealType,
          note: householdRecipeAssignments.note,
          scheduledDate: householdRecipeAssignments.scheduledDate,
          isCompleted: householdRecipeAssignments.isCompleted,
          completedAt: householdRecipeAssignments.completedAt,
          createdAt: householdRecipeAssignments.createdAt,
          recipe: {
            id: recipes.id,
            name: recipes.name,
            imageUrl: recipes.imageUrl,
            description: recipes.description,
            preparationTime: recipes.preparationTime,
            cookTime: recipes.cookTime,
            servings: recipes.servings,
            difficulty: recipes.difficulty,
            caloriesPerServing: recipes.caloriesPerServing,
            proteinsPerServing: recipes.proteinsPerServing,
            carbsPerServing: recipes.carbsPerServing,
            fatsPerServing: recipes.fatsPerServing,
            mealTime: recipes.mealTime,
            category: recipes.category,
          },
          assignedBy: {
            id: users.id,
            name: users.name,
          },
        })
        .from(householdRecipeAssignments)
        .innerJoin(recipes, eq(householdRecipeAssignments.recipeId, recipes.id))
        .innerJoin(users, eq(householdRecipeAssignments.assignedByUserId, users.id))
        .where(and(
          eq(householdRecipeAssignments.householdId, input.householdId),
          eq(householdRecipeAssignments.memberId, input.memberId),
        ))
        .orderBy(desc(householdRecipeAssignments.createdAt));

      return assignments;
    }),

  // Obtener todas las asignaciones del hogar (vista de admin)
  getForHousehold: protectedProcedure
    .input(z.object({
      householdId: z.number().int().positive(),
    }))
    .query(async ({ ctx, input }) => {
      const { db } = await getHouseholdAsAdmin(input.householdId, ctx.user.id);

      const assignments = await db
        .select({
          id: householdRecipeAssignments.id,
          memberId: householdRecipeAssignments.memberId,
          mealType: householdRecipeAssignments.mealType,
          note: householdRecipeAssignments.note,
          scheduledDate: householdRecipeAssignments.scheduledDate,
          isCompleted: householdRecipeAssignments.isCompleted,
          completedAt: householdRecipeAssignments.completedAt,
          createdAt: householdRecipeAssignments.createdAt,
          recipe: {
            id: recipes.id,
            name: recipes.name,
            imageUrl: recipes.imageUrl,
            caloriesPerServing: recipes.caloriesPerServing,
            mealTime: recipes.mealTime,
          },
          member: {
            id: householdMembers.id,
            displayName: householdMembers.displayName,
            userId: householdMembers.userId,
          },
          assignedBy: {
            id: users.id,
            name: users.name,
          },
        })
        .from(householdRecipeAssignments)
        .innerJoin(recipes, eq(householdRecipeAssignments.recipeId, recipes.id))
        .innerJoin(householdMembers, eq(householdRecipeAssignments.memberId, householdMembers.id))
        .innerJoin(users, eq(householdRecipeAssignments.assignedByUserId, users.id))
        .where(eq(householdRecipeAssignments.householdId, input.householdId))
        .orderBy(desc(householdRecipeAssignments.createdAt));

      return assignments;
    }),

  // Buscar recetas disponibles para asignar (recetas del hogar o públicas)
  searchRecipes: protectedProcedure
    .input(z.object({
      householdId: z.number().int().positive(),
      query: z.string().min(1).max(100),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar membresía
      const isMember = await db
        .select({ id: householdMembers.id })
        .from(householdMembers)
        .where(and(eq(householdMembers.householdId, input.householdId), eq(householdMembers.userId, ctx.user.id)))
        .limit(1);
      if (!isMember.length) throw new TRPCError({ code: "FORBIDDEN" });

      const { ilike, or: drizzleOr } = await import("drizzle-orm");

      const results = await db
        .select({
          id: recipes.id,
          name: recipes.name,
          imageUrl: recipes.imageUrl,
          caloriesPerServing: recipes.caloriesPerServing,
          preparationTime: recipes.preparationTime,
          cookTime: recipes.cookTime,
          difficulty: recipes.difficulty,
          mealTime: recipes.mealTime,
          category: recipes.category,
        })
        .from(recipes)
        .where(
          drizzleOr(
            ilike(recipes.name, `%${input.query}%`),
            ilike(recipes.category, `%${input.query}%`),
          )
        )
        .limit(20);

      return results;
    }),

  // Obtener recetas del hogar agrupadas por semana para el calendario
  getWeekCalendar: protectedProcedure
    .input(z.object({
      householdId: z.number().int().positive(),
      weekStart: z.string(), // ISO date string del lunes de la semana (YYYY-MM-DD)
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar membresía
      const isMember = await db
        .select({ id: householdMembers.id, role: householdMembers.role })
        .from(householdMembers)
        .where(and(eq(householdMembers.householdId, input.householdId), eq(householdMembers.userId, ctx.user.id)))
        .limit(1);
      if (!isMember.length) throw new TRPCError({ code: "FORBIDDEN", message: "No eres miembro de este hogar" });

      // Calcular rango de la semana
      const weekStartDate = new Date(input.weekStart + "T00:00:00Z");
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 7);

      const { gte, lt } = await import("drizzle-orm");

      // Obtener todas las asignaciones de la semana para el hogar
      const assignments = await db
        .select({
          id: householdRecipeAssignments.id,
          memberId: householdRecipeAssignments.memberId,
          mealType: householdRecipeAssignments.mealType,
          note: householdRecipeAssignments.note,
          scheduledDate: householdRecipeAssignments.scheduledDate,
          isCompleted: householdRecipeAssignments.isCompleted,
          completedAt: householdRecipeAssignments.completedAt,
          createdAt: householdRecipeAssignments.createdAt,
          recipe: {
            id: recipes.id,
            name: recipes.name,
            imageUrl: recipes.imageUrl,
            caloriesPerServing: recipes.caloriesPerServing,
            preparationTime: recipes.preparationTime,
            cookTime: recipes.cookTime,
            difficulty: recipes.difficulty,
          },
          member: {
            id: householdMembers.id,
            displayName: householdMembers.displayName,
            userId: householdMembers.userId,
            role: householdMembers.role,
          },
          assignedBy: {
            id: users.id,
            name: users.name,
          },
        })
        .from(householdRecipeAssignments)
        .innerJoin(recipes, eq(householdRecipeAssignments.recipeId, recipes.id))
        .innerJoin(householdMembers, eq(householdRecipeAssignments.memberId, householdMembers.id))
        .innerJoin(users, eq(householdRecipeAssignments.assignedByUserId, users.id))
        .where(
          and(
            eq(householdRecipeAssignments.householdId, input.householdId),
            gte(householdRecipeAssignments.scheduledDate, weekStartDate),
            lt(householdRecipeAssignments.scheduledDate, weekEndDate),
          )
        )
        .orderBy(householdRecipeAssignments.scheduledDate);

      // Obtener todos los miembros del hogar para mostrarlos en el calendario
      const members = await db
        .select({
          id: householdMembers.id,
          displayName: householdMembers.displayName,
          userId: householdMembers.userId,
          role: householdMembers.role,
          memberUser: {
            name: users.name,
            imageUrl: users.imageUrl,
          },
        })
        .from(householdMembers)
        .innerJoin(users, eq(householdMembers.userId, users.id))
        .where(eq(householdMembers.householdId, input.householdId));

      return { assignments, members, weekStart: input.weekStart };
    }),

  // Obtener las recetas asignadas al usuario actual (en todos sus hogares)
  getMyAssignments: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar todas las membresías del usuario
      const myMemberships = await db
        .select({ memberId: householdMembers.id, householdId: householdMembers.householdId })
        .from(householdMembers)
        .where(eq(householdMembers.userId, ctx.user.id));

      if (!myMemberships.length) return [];

      const memberIds = myMemberships.map((m) => m.memberId);

      const assignments = await db
        .select({
          id: householdRecipeAssignments.id,
          householdId: householdRecipeAssignments.householdId,
          isCompleted: householdRecipeAssignments.isCompleted,
          completedAt: householdRecipeAssignments.completedAt,
          mealType: householdRecipeAssignments.mealType,
          note: householdRecipeAssignments.note,
          scheduledDate: householdRecipeAssignments.scheduledDate,
          createdAt: householdRecipeAssignments.createdAt,
          recipe: {
            id: recipes.id,
            name: recipes.name,
            imageUrl: recipes.imageUrl,
            caloriesPerServing: recipes.caloriesPerServing,
            preparationTime: recipes.preparationTime,
            cookTime: recipes.cookTime,
          },
          assignedBy: {
            id: users.id,
            name: users.name,
          },
        })
        .from(householdRecipeAssignments)
        .innerJoin(recipes, eq(householdRecipeAssignments.recipeId, recipes.id))
        .innerJoin(users, eq(householdRecipeAssignments.assignedByUserId, users.id))
        .where(inArray(householdRecipeAssignments.memberId, memberIds))
        .orderBy(desc(householdRecipeAssignments.createdAt));

      return assignments;
    }),

  // ── Generar menú familiar unificado con IA ───────────────────────────────
  generateFamilyMenu: protectedProcedure
    .input(z.object({
      days: z.number().int().min(1).max(14).default(7),
      mealsPerDay: z.number().int().min(2).max(5).default(3),
      menuType: z.enum(["equilibrado", "mediterraneo", "bajo_carbohidratos", "alto_proteina", "familiar"]).default("familiar"),
      startDate: z.string().optional(), // ISO date
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get household
      const [myMembership] = await db.select().from(householdMembers)
        .where(eq(householdMembers.userId, ctx.user.id)).limit(1);
      if (!myMembership) throw new TRPCError({ code: "NOT_FOUND", message: "No perteneces a ningún hogar." });

      // Get all members with their profiles
      const members = await db.select({
        id: householdMembers.id,
        displayName: householdMembers.displayName,
        memberType: householdMembers.memberType,
        birthDate: householdMembers.birthDate,
        dietaryRestrictions: householdMembers.dietaryRestrictions,
        allergies: householdMembers.allergies,
        dislikedFoods: householdMembers.dislikedFoods,
        feedingPhase: householdMembers.feedingPhase,
        userName: users.name,
      })
        .from(householdMembers)
        .leftJoin(users, eq(householdMembers.userId, users.id))
        .where(eq(householdMembers.householdId, myMembership.householdId));

      // Build member profiles for the AI prompt
      const memberProfiles = members.map((m) => {
        const ageYears = m.birthDate
          ? Math.floor((Date.now() - new Date(m.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
          : null;
        const restrictions = m.dietaryRestrictions ? JSON.parse(m.dietaryRestrictions) : [];
        const allergies = m.allergies ? JSON.parse(m.allergies) : [];
        const disliked = m.dislikedFoods ? JSON.parse(m.dislikedFoods) : [];
        const name = m.displayName ?? m.userName ?? "Miembro";
        const typeLabel = m.memberType === "baby" ? "Bebé" : m.memberType === "child" ? "Niño" : "Adulto";
        const ageLabel = ageYears !== null ? ` (${ageYears} años)` : "";
        const feedLabel = m.feedingPhase ? ` | Fase: ${m.feedingPhase}` : "";
        return `- ${name}: ${typeLabel}${ageLabel}${feedLabel}${restrictions.length ? ` | Restricciones: ${restrictions.join(", ")}` : ""}${allergies.length ? ` | Alergias: ${allergies.join(", ")}` : ""}${disliked.length ? ` | No le gusta: ${disliked.join(", ")}` : ""}`;
      }).join("\n");

      const mealNames = { 2: ["Comida", "Cena"], 3: ["Desayuno", "Comida", "Cena"], 4: ["Desayuno", "Comida", "Merienda", "Cena"], 5: ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"] };
      const meals = mealNames[input.mealsPerDay as keyof typeof mealNames] ?? mealNames[3];

      const { invokeLLM } = await import("../_core/llm.js");
      const prompt = `Eres un nutricionista experto en alimentación familiar e infantil. Genera un menú familiar de ${input.days} días con ${input.mealsPerDay} comidas por día (${meals.join(", ")}) para el siguiente hogar:

MIEMBROS DEL HOGAR:
${memberProfiles}

TIPO DE MENÚ: ${input.menuType}
${input.notes ? `NOTAS ADICIONALES: ${input.notes}` : ""}

REGLAS IMPORTANTES:
1. Para niños <1 año: solo papillas y purés sin sal ni azúcar
2. Para niños 1-3 años: texturas blandas, sin picante, poca sal
3. Para niños >3 años: comida normal adaptada, sin picante
4. NUNCA incluyas alimentos de las listas de alergias o restricciones
5. Intenta que los platos sean compatibles para toda la familia (adaptando porciones/condimentos)
6. Incluye recetas ricas en hierro y calcio al menos 3 veces por semana para los niños

Responde con JSON válido con esta estructura exacta:
{
  "menuName": "string (nombre descriptivo del menú)",
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Lunes",
      "meals": [
        {
          "mealType": "desayuno|almuerzo|comida|merienda|cena",
          "recipeName": "string",
          "description": "string (breve descripción)",
          "isKidFriendly": true,
          "isBabyFriendly": false,
          "kcalEstimate": 450,
          "notes": "string (adaptaciones para niños si aplica, puede ser null)"
        }
      ]
    }
  ],
  "nutritionSummary": "string (resumen nutricional del menú para toda la familia)",
  "shoppingTips": ["string"]
}`;

      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : (Array.isArray(rawContent) ? (rawContent as any[]).map((c: any) => c.text ?? '').join('') : '');
      if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La IA no generó respuesta" });

      let menuData: Record<string, unknown>;
      try {
        menuData = JSON.parse(content);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error al procesar la respuesta de la IA" });
      }

      return {
        success: true,
        menu: menuData,
        memberCount: members.length,
        generatedAt: new Date().toISOString(),
      };
    }),
});
