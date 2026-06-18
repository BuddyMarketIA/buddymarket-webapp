import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { patientDailyLog } from "../../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export const patientDiaryRouter = router({
  // ─── Get diary entries ────────────────────────────────────────────────────
  getEntries: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(90).default(30),
      from: z.string().optional(), // YYYY-MM-DD
      to: z.string().optional(),   // YYYY-MM-DD
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const conditions = [eq(patientDailyLog.userId, ctx.user.id)];
      if (input.from) conditions.push(gte(patientDailyLog.logDate, input.from));
      if (input.to) conditions.push(lte(patientDailyLog.logDate, input.to));
      return db
        .select()
        .from(patientDailyLog)
        .where(and(...conditions))
        .orderBy(desc(patientDailyLog.logDate))
        .limit(input.limit);
    }),

  // ─── Get single entry by date ─────────────────────────────────────────────
  getByDate: protectedProcedure
    .input(z.object({ logDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const [entry] = await db
        .select()
        .from(patientDailyLog)
        .where(and(
          eq(patientDailyLog.userId, ctx.user.id),
          eq(patientDailyLog.logDate, input.logDate),
        ))
        .limit(1);
      return entry ?? null;
    }),

  // ─── Upsert diary entry ───────────────────────────────────────────────────
  upsertEntry: protectedProcedure
    .input(z.object({
      logDate: z.string(), // YYYY-MM-DD
      expertPatientId: z.number().optional(),
      weight: z.number().min(20).max(500).optional(),
      energyLevel: z.number().min(1).max(5).optional(),
      moodLevel: z.number().min(1).max(5).optional(),
      sleepHours: z.number().min(0).max(24).optional(),
      waterLiters: z.number().min(0).max(20).optional(),
      symptoms: z.string().max(500).optional(),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const existing = await db
        .select({ id: patientDailyLog.id })
        .from(patientDailyLog)
        .where(and(
          eq(patientDailyLog.userId, ctx.user.id),
          eq(patientDailyLog.logDate, input.logDate),
        ))
        .limit(1);

      const payload = {
        userId: ctx.user.id,
        logDate: input.logDate,
        expertPatientId: input.expertPatientId ?? null,
        weight: input.weight ?? null,
        energyLevel: input.energyLevel ?? null,
        moodLevel: input.moodLevel ?? null,
        sleepHours: input.sleepHours ?? null,
        waterLiters: input.waterLiters ?? null,
        symptoms: input.symptoms ?? null,
        notes: input.notes ?? null,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        const [updated] = await db
          .update(patientDailyLog)
          .set(payload)
          .where(eq(patientDailyLog.id, existing[0].id))
          .returning();
        // Sync weight to user profile if provided
        if (input.weight) {
          const { userProfiles } = await import("../../drizzle/schema");
          await db
            .update(userProfiles)
            .set({ weight: input.weight, updatedAt: new Date() })
            .where(eq(userProfiles.userId, ctx.user.id));
        }
        return updated;
      } else {
        const [created] = await db
          .insert(patientDailyLog)
          .values(payload)
          .returning();
        if (input.weight) {
          const { userProfiles } = await import("../../drizzle/schema");
          await db
            .update(userProfiles)
            .set({ weight: input.weight, updatedAt: new Date() })
            .where(eq(userProfiles.userId, ctx.user.id));
        }
        return created;
      }
    }),

  // ─── Delete diary entry ───────────────────────────────────────────────────
  deleteEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db
        .delete(patientDailyLog)
        .where(and(
          eq(patientDailyLog.id, input.id),
          eq(patientDailyLog.userId, ctx.user.id),
        ));
      return { success: true };
    }),
});
