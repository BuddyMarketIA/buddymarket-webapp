import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { wearableConnections, ouraRingData, whoopData, wearableInsights } from "../../drizzle/schema";
import * as db from "../db";

export const healthHubRouter = router({
  // Get all wearable connections for user
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];
    const connections = await drizzleDb
      .select()
      .from(wearableConnections)
      .where(eq(wearableConnections.userId, ctx.user.id));
    return connections;
  }),

  // Get Oura Ring data
  getOuraData: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const since = new Date(Date.now() - input.days * 86400000).toISOString().split("T")[0];
      const data = await drizzleDb
        .select()
        .from(ouraRingData)
        .where(and(eq(ouraRingData.userId, ctx.user.id), eq(ouraRingData.date, since)))
        .orderBy(desc(ouraRingData.date))
        .limit(input.days);
      return data;
    }),

  // Get Whoop data
  getWhoopData: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const since = new Date(Date.now() - input.days * 86400000).toISOString().split("T")[0];
      const data = await drizzleDb
        .select()
        .from(whoopData)
        .where(and(eq(whoopData.userId, ctx.user.id), eq(whoopData.date, since)))
        .orderBy(desc(whoopData.date))
        .limit(input.days);
      return data;
    }),

  // Get insights
  getInsights: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const insights = await drizzleDb
        .select()
        .from(wearableInsights)
        .where(eq(wearableInsights.userId, ctx.user.id))
        .orderBy(desc(wearableInsights.createdAt))
        .limit(input.limit);
      return insights;
    }),

  // Disconnect wearable
  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");
      await drizzleDb
        .update(wearableConnections)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(wearableConnections.id, input.connectionId),
            eq(wearableConnections.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
