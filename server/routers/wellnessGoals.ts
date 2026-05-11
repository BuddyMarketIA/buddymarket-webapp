import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { wellnessGoals } from "../../drizzle/schema";
import * as db from "../db";

export const wellnessGoalsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];
    const goals = await drizzleDb
      .select()
      .from(wellnessGoals)
      .where(eq(wellnessGoals.userId, ctx.user.id))
      .orderBy(wellnessGoals.createdAt);

    return goals.map((g) => ({
      id: String(g.id),
      title: g.title,
      category: g.category,
      currentValue: g.currentValue,
      targetValue: g.targetValue,
      unit: g.unit,
      priority: g.priority,
      status: g.status,
      daysRemaining: g.targetDate
        ? Math.max(0, Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / 86400000))
        : 30,
    }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        category: z.enum(["sleep", "recovery", "activity", "stress", "nutrition", "hydration"]),
        targetValue: z.number().positive(),
        unit: z.string(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        daysToComplete: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");

      const targetDate = input.daysToComplete
        ? new Date(Date.now() + input.daysToComplete * 86400000)
        : new Date(Date.now() + 30 * 86400000);

      const [goal] = await drizzleDb
        .insert(wellnessGoals)
        .values({
          userId: ctx.user.id,
          title: input.title,
          category: input.category,
          currentValue: 0,
          targetValue: input.targetValue,
          unit: input.unit,
          priority: input.priority ?? "medium",
          status: "active",
          targetDate,
        })
        .returning();

      return {
        id: String(goal.id),
        title: goal.title,
        category: goal.category,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        unit: goal.unit,
        priority: goal.priority,
        status: goal.status,
        daysRemaining: Math.ceil((targetDate.getTime() - Date.now()) / 86400000),
      };
    }),

  updateProgress: protectedProcedure
    .input(z.object({ goalId: z.string(), currentValue: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");

      await drizzleDb
        .update(wellnessGoals)
        .set({ currentValue: input.currentValue, updatedAt: new Date() })
        .where(
          and(
            eq(wellnessGoals.id, parseInt(input.goalId)),
            eq(wellnessGoals.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  complete: protectedProcedure
    .input(z.object({ goalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");

      await drizzleDb
        .update(wellnessGoals)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(wellnessGoals.id, parseInt(input.goalId)),
            eq(wellnessGoals.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  abandon: protectedProcedure
    .input(z.object({ goalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");

      await drizzleDb
        .update(wellnessGoals)
        .set({ status: "abandoned", updatedAt: new Date() })
        .where(
          and(
            eq(wellnessGoals.id, parseInt(input.goalId)),
            eq(wellnessGoals.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return { totalGoals: 0, activeGoals: 0, completedGoals: 0, abandonedGoals: 0, averageProgress: 0 };

    const goals = await drizzleDb
      .select()
      .from(wellnessGoals)
      .where(eq(wellnessGoals.userId, ctx.user.id));

    const active = goals.filter((g) => g.status === "active");
    const completed = goals.filter((g) => g.status === "completed");
    const abandoned = goals.filter((g) => g.status === "abandoned");

    const avgProgress = active.length > 0
      ? Math.round(active.reduce((sum, g) => sum + Math.min(100, (g.currentValue / g.targetValue) * 100), 0) / active.length)
      : 0;

    return {
      totalGoals: goals.length,
      activeGoals: active.length,
      completedGoals: completed.length,
      abandonedGoals: abandoned.length,
      averageProgress: avgProgress,
    };
  }),
});
