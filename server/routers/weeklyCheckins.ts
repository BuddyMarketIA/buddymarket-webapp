import { hasRole } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const weeklyCheckinsRouter = router({
  // ─── Paciente: enviar check-in semanal ───────────────────────────────────
  submitCheckin: protectedProcedure
    .input(z.object({
      expertPatientId: z.number().int().positive(),
      weekStart: z.string(), // YYYY-MM-DD (lunes de la semana)
      weight: z.number().optional(),
      photoUrl: z.string().optional(),
      energyLevel: z.number().int().min(1).max(10).optional(),
      adherenceScore: z.number().int().min(1).max(10).optional(),
      hunger: z.number().int().min(1).max(10).optional(),
      mood: z.number().int().min(1).max(10).optional(),
      sleepQuality: z.number().int().min(1).max(10).optional(),
      difficulties: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { weeklyCheckins, expertPatients } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      // Verificar que el paciente pertenece al usuario
      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(
          eq(expertPatients.id, input.expertPatientId),
          eq(expertPatients.patientUserId, ctx.user.id)
        )).limit(1);
      if (!rel) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes acceso a este check-in" });

      // Upsert: si ya existe para esa semana, actualizar
      const [existing] = await drizzleDb.select().from(weeklyCheckins)
        .where(and(
          eq(weeklyCheckins.expertPatientId, input.expertPatientId),
          eq(weeklyCheckins.weekStart, input.weekStart)
        )).limit(1);

      if (existing) {
        const [updated] = await drizzleDb.update(weeklyCheckins)
          .set({
            weight: input.weight,
            photoUrl: input.photoUrl,
            energyLevel: input.energyLevel,
            adherenceScore: input.adherenceScore,
            hunger: input.hunger,
            mood: input.mood,
            sleepQuality: input.sleepQuality,
            difficulties: input.difficulties,
            notes: input.notes,
            completedAt: new Date(),
          })
          .where(eq(weeklyCheckins.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await drizzleDb.insert(weeklyCheckins).values({
        expertPatientId: input.expertPatientId,
        patientUserId: ctx.user.id,
        weekStart: input.weekStart,
        weight: input.weight,
        photoUrl: input.photoUrl,
        energyLevel: input.energyLevel,
        adherenceScore: input.adherenceScore,
        hunger: input.hunger,
        mood: input.mood,
        sleepQuality: input.sleepQuality,
        difficulties: input.difficulties,
        notes: input.notes,
        completedAt: new Date(),
      }).returning();
      return created;
    }),

  // ─── Paciente: obtener mis check-ins pendientes ───────────────────────────
  getMyPendingCheckins: protectedProcedure
    .query(async ({ ctx }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { weeklyCheckins, expertPatients, buddyExperts, users } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");

      // Obtener relaciones activas del paciente
      const relations = await drizzleDb.select({
        rel: expertPatients,
        expert: buddyExperts,
        expertUser: { name: users.name, imageUrl: users.imageUrl },
      })
        .from(expertPatients)
        .leftJoin(buddyExperts, eq(buddyExperts.id, expertPatients.expertId))
        .leftJoin(users, eq(users.id, buddyExperts.userId))
        .where(and(
          eq(expertPatients.patientUserId, ctx.user.id),
          eq(expertPatients.status, "active")
        ));

      // Calcular el lunes de la semana actual
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const weekStart = monday.toISOString().split("T")[0];

      const pending = [];
      for (const r of relations) {
        const [existing] = await drizzleDb.select().from(weeklyCheckins)
          .where(and(
            eq(weeklyCheckins.expertPatientId, r.rel.id),
            eq(weeklyCheckins.weekStart, weekStart)
          )).limit(1);

        if (!existing || !existing.completedAt) {
          pending.push({
            expertPatientId: r.rel.id,
            expertName: r.expertUser?.name ?? "Tu nutricionista",
            expertImageUrl: r.expertUser?.imageUrl,
            weekStart,
          });
        }
      }
      return pending;
    }),

  // ─── Experto: obtener check-ins de un paciente ───────────────────────────
  getPatientCheckins: protectedProcedure
    .input(z.object({
      expertPatientId: z.number().int().positive(),
      limit: z.number().int().min(1).max(52).optional().default(12),
    }))
    .query(async ({ ctx, input }) => {
      if (!hasRole(ctx.user, "buddyexpert") && !hasRole(ctx.user, "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { weeklyCheckins, expertPatients, buddyExperts } = await import("../../drizzle/schema.js");
      const { eq, and, desc } = await import("drizzle-orm");

      const [expert] = await drizzleDb.select().from(buddyExperts)
        .where(eq(buddyExperts.userId, ctx.user.id)).limit(1);
      if (!expert) throw new TRPCError({ code: "FORBIDDEN" });

      const [rel] = await drizzleDb.select().from(expertPatients)
        .where(and(
          eq(expertPatients.id, input.expertPatientId),
          eq(expertPatients.expertId, expert.id)
        )).limit(1);
      if (!rel) throw new TRPCError({ code: "FORBIDDEN" });

      return drizzleDb.select().from(weeklyCheckins)
        .where(eq(weeklyCheckins.expertPatientId, input.expertPatientId))
        .orderBy(desc(weeklyCheckins.weekStart))
        .limit(input.limit);
    }),
});
