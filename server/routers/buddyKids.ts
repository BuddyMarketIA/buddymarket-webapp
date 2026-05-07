import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  childProfiles,
  childAllergies,
  childMenus,
  childLunchboxes,
  childHabits,
  childHabitLogs,
  childRecipes,
  childProgress,
  familyCalendarEvents,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

// =============================================================================
// VALIDACIÓN
// =============================================================================

const createChildProfileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(128),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  ageGroup: z.enum(["1_3", "4_6", "7_12", "13_17"]),
  height: z.number().optional(),
  weight: z.number().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  favoriteFood: z.array(z.string()).default([]),
  dislikedFood: z.array(z.string()).default([]),
  objective: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});

const updateChildProfileSchema = createChildProfileSchema.partial();

const createChildAllergySchema = z.object({
  childId: z.number(),
  allergyType: z.enum(["gluten", "lactose", "nuts", "peanuts", "shellfish", "eggs", "soy", "sesame", "fish", "other"]),
  allergyName: z.string().min(1).max(128),
  severity: z.enum(["mild", "moderate", "severe"]).optional(),
  notes: z.string().optional(),
});

const createChildHabitSchema = z.object({
  childId: z.number(),
  habitType: z.enum(["water", "fruit_vegetable", "sleep", "activity", "breakfast", "ultraprocesados", "other"]),
  habitName: z.string().min(1).max(128),
  dailyTarget: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

const logHabitSchema = z.object({
  habitId: z.number(),
  logDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  completed: z.number().min(0),
  notes: z.string().optional(),
});

// =============================================================================
// PROCEDIMIENTOS TRPC
// =============================================================================

export const buddyKidsRouter = router({
  // ─────────────────────────────────────────────────────────────────────────
  // PERFILES INFANTILES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Crear perfil de niño
   */
  createChildProfile: protectedProcedure
    .input(createChildProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await drizzleDb
        .insert(childProfiles)
        .values({
          userId: ctx.user.id,
          name: input.name,
          dateOfBirth: new Date(input.dateOfBirth),
          ageGroup: input.ageGroup,
          height: input.height ? input.height.toString() : null,
          weight: input.weight ? input.weight.toString() : null,
          gender: input.gender || null,
          favoriteFood: input.favoriteFood,
          dislikedFood: input.dislikedFood,
          objective: input.objective || null,
          notes: input.notes || null,
          imageUrl: input.imageUrl || null,
        })
        .returning();

      return result[0];
    }),

  /**
   * Obtener todos los perfiles de niños del usuario
   */
  getChildProfiles: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return await drizzleDb
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.userId, ctx.user.id));
  }),

  /**
   * Obtener un perfil de niño específico
   */
  getChildProfile: protectedProcedure
    .input(z.object({ childId: z.number() }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const child = await drizzleDb
        .select()
        .from(childProfiles)
        .where(and(eq(childProfiles.id, input.childId), eq(childProfiles.userId, ctx.user.id)))
        .then((r) => r[0]);

      if (!child) throw new TRPCError({ code: "NOT_FOUND", message: "Niño no encontrado" });

      return child;
    }),

  /**
   * Actualizar perfil de niño
   */
  updateChildProfile: protectedProcedure
    .input(z.object({ childId: z.number(), ...updateChildProfileSchema.shape }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { childId, ...updateData } = input;

      // Verificar que el niño pertenece al usuario
      const child = await drizzleDb
        .select()
        .from(childProfiles)
        .where(and(eq(childProfiles.id, childId), eq(childProfiles.userId, ctx.user.id)))
        .then((r) => r[0]);

      if (!child) throw new TRPCError({ code: "FORBIDDEN" });

      const result = await drizzleDb
        .update(childProfiles)
        .set({
          ...updateData,
          dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
          height: updateData.height ? updateData.height.toString() : undefined,
          weight: updateData.weight ? updateData.weight.toString() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(childProfiles.id, childId))
        .returning();

      return result[0];
    }),

  /**
   * Eliminar perfil de niño
   */
  deleteChildProfile: protectedProcedure
    .input(z.object({ childId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar que el niño pertenece al usuario
      const child = await drizzleDb
        .select()
        .from(childProfiles)
        .where(and(eq(childProfiles.id, input.childId), eq(childProfiles.userId, ctx.user.id)))
        .then((r) => r[0]);

      if (!child) throw new TRPCError({ code: "FORBIDDEN" });

      await drizzleDb.delete(childProfiles).where(eq(childProfiles.id, input.childId));

      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // ALERGIAS E INTOLERANCIAS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Añadir alergia a un niño
   */
  addChildAllergy: protectedProcedure
    .input(createChildAllergySchema)
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar que el niño pertenece al usuario
      const child = await drizzleDb
        .select()
        .from(childProfiles)
        .where(and(eq(childProfiles.id, input.childId), eq(childProfiles.userId, ctx.user.id)))
        .then((r) => r[0]);

      if (!child) throw new TRPCError({ code: "FORBIDDEN" });

      const result = await drizzleDb
        .insert(childAllergies)
        .values({
          childId: input.childId,
          allergyType: input.allergyType,
          allergyName: input.allergyName,
          severity: input.severity || "moderate",
          notes: input.notes || null,
        })
        .returning();

      return result[0];
    }),

  /**
   * Obtener alergias de un niño
   */
  getChildAllergies: protectedProcedure
    .input(z.object({ childId: z.number() }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar que el niño pertenece al usuario
      const child = await drizzleDb
        .select()
        .from(childProfiles)
        .where(and(eq(childProfiles.id, input.childId), eq(childProfiles.userId, ctx.user.id)))
        .then((r) => r[0]);

      if (!child) throw new TRPCError({ code: "FORBIDDEN" });

      return await drizzleDb
        .select()
        .from(childAllergies)
        .where(eq(childAllergies.childId, input.childId));
    }),

  /**
   * Eliminar alergia
   */
  deleteChildAllergy: protectedProcedure
    .input(z.object({ allergyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar permisos (el usuario debe ser dueño del niño)
      const allergy = await drizzleDb
        .select()
        .from(childAllergies)
        .leftJoin(childProfiles, eq(childAllergies.childId, childProfiles.id))
        .where(eq(childAllergies.id, input.allergyId))
        .then((r) => r[0]);

      if (!allergy || allergy.childProfiles?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await drizzleDb.delete(childAllergies).where(eq(childAllergies.id, input.allergyId));

      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // HÁBITOS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Crear hábito para un niño
   */
  createChildHabit: protectedProcedure
    .input(createChildHabitSchema)
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar que el niño pertenece al usuario
      const child = await drizzleDb
        .select()
        .from(childProfiles)
        .where(and(eq(childProfiles.id, input.childId), eq(childProfiles.userId, ctx.user.id)))
        .then((r) => r[0]);

      if (!child) throw new TRPCError({ code: "FORBIDDEN" });

      const result = await drizzleDb
        .insert(childHabits)
        .values({
          childId: input.childId,
          habitType: input.habitType,
          habitName: input.habitName,
          dailyTarget: input.dailyTarget || null,
          unit: input.unit || null,
          notes: input.notes || null,
        })
        .returning();

      return result[0];
    }),

  /**
   * Obtener hábitos de un niño
   */
  getChildHabits: protectedProcedure
    .input(z.object({ childId: z.number() }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar que el niño pertenece al usuario
      const child = await drizzleDb
        .select()
        .from(childProfiles)
        .where(and(eq(childProfiles.id, input.childId), eq(childProfiles.userId, ctx.user.id)))
        .then((r) => r[0]);

      if (!child) throw new TRPCError({ code: "FORBIDDEN" });

      return await drizzleDb
        .select()
        .from(childHabits)
        .where(eq(childHabits.childId, input.childId));
    }),

  /**
   * Registrar progreso de un hábito
   */
  logHabitProgress: protectedProcedure
    .input(logHabitSchema)
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar que el hábito pertenece al usuario (a través del niño)
      const habit = await drizzleDb
        .select()
        .from(childHabits)
        .leftJoin(childProfiles, eq(childHabits.childId, childProfiles.id))
        .where(eq(childHabits.id, input.habitId))
        .then((r) => r[0]);

      if (!habit || habit.childProfiles?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const result = await drizzleDb
        .insert(childHabitLogs)
        .values({
          habitId: input.habitId,
          logDate: new Date(input.logDate),
          completed: input.completed,
          notes: input.notes || null,
        })
        .returning();

      return result[0];
    }),

  /**
   * Obtener progreso de hábitos de un niño en un período
   */
  getHabitProgress: protectedProcedure
    .input(
      z.object({
        childId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar que el niño pertenece al usuario
      const child = await drizzleDb
        .select()
        .from(childProfiles)
        .where(and(eq(childProfiles.id, input.childId), eq(childProfiles.userId, ctx.user.id)))
        .then((r) => r[0]);

      if (!child) throw new TRPCError({ code: "FORBIDDEN" });

      // Obtener hábitos
      const habits = await drizzleDb
        .select()
        .from(childHabits)
        .where(eq(childHabits.childId, input.childId));

      return { habits };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // EVENTOS DEL CALENDARIO FAMILIAR
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Crear evento en el calendario familiar
   */
  createFamilyCalendarEvent: protectedProcedure
    .input(
      z.object({
        childId: z.number().optional(),
        eventType: z.string(),
        eventDate: z.string(),
        eventTime: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await drizzleDb
        .insert(familyCalendarEvents)
        .values({
          userId: ctx.user.id,
          childId: input.childId || null,
          eventType: input.eventType,
          eventDate: new Date(input.eventDate),
          eventTime: input.eventTime || null,
          title: input.title,
          description: input.description || null,
          notes: input.notes || null,
        })
        .returning();

      return result[0];
    }),

  /**
   * Obtener eventos del calendario familiar
   */
  getFamilyCalendarEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return await drizzleDb
        .select()
        .from(familyCalendarEvents)
        .where(eq(familyCalendarEvents.userId, ctx.user.id));
    }),
});
