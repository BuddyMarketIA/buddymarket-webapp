import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { ecosystemConnections, ecosystemSyncLogs, ecosystemSharedData } from "../../drizzle/schema";
import * as db from "../db";

export const ecosystemSyncRouter = router({
  // Get user's ecosystem connections
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];
    const connections = await drizzleDb
      .select()
      .from(ecosystemConnections)
      .where(eq(ecosystemConnections.userId, ctx.user.id));
    return connections;
  }),

  // Connect to ecosystem app
  connect: protectedProcedure
    .input(z.object({
      targetApp: z.string(),
      permissions: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");

      const [connection] = await drizzleDb
        .insert(ecosystemConnections)
        .values({
          userId: ctx.user.id,
          targetApp: input.targetApp,
          targetUserId: ctx.user.openId,
          status: "active",
          permissions: JSON.stringify(input.permissions ?? ["read_nutrition", "read_goals"]),
        })
        .returning();

      return connection;
    }),

  // Disconnect from ecosystem app
  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");

      await drizzleDb
        .update(ecosystemConnections)
        .set({ status: "revoked", updatedAt: new Date() })
        .where(
          and(
            eq(ecosystemConnections.id, input.connectionId),
            eq(ecosystemConnections.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // Get sync history
  getSyncLogs: protectedProcedure
    .input(z.object({ connectionId: z.number(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];

      const logs = await drizzleDb
        .select()
        .from(ecosystemSyncLogs)
        .where(eq(ecosystemSyncLogs.connectionId, input.connectionId))
        .orderBy(desc(ecosystemSyncLogs.startedAt))
        .limit(input.limit);
      return logs;
    }),

  // Get shared data summary
  getSharedData: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];

      const data = await drizzleDb
        .select()
        .from(ecosystemSharedData)
        .where(eq(ecosystemSharedData.connectionId, input.connectionId))
        .orderBy(desc(ecosystemSharedData.updatedAt));
      return data;
    }),
});
