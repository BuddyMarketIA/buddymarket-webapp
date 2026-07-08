import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

/**
 * Wearables Router - Oura Ring & Whoop Integration
 * Manages connections and data synchronization with fitness wearables
 */

// ─── Token Refresh Helper ──────────────────────────────────────────────────
async function refreshTokenIfNeeded(connection: any): Promise<string> {
  if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) > new Date()) {
    return connection.accessToken;
  }
  if (!connection.refreshToken) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: `${connection.wearableType} token expired. Please reconnect.` });
  }

  let tokenUrl: string;
  let clientId: string | undefined;
  let clientSecret: string | undefined;

  if (connection.wearableType === "oura") {
    tokenUrl = "https://api.ouraring.com/oauth/token";
    clientId = process.env.OURA_CLIENT_ID;
    clientSecret = process.env.OURA_CLIENT_SECRET;
  } else {
    tokenUrl = "https://api.prod.whoop.com/oauth/oauth2/token";
    clientId = process.env.WHOOP_CLIENT_ID;
    clientSecret = process.env.WHOOP_CLIENT_SECRET;
  }

  if (!clientId || !clientSecret) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `${connection.wearableType} not configured` });
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: `Failed to refresh ${connection.wearableType} token. Please reconnect.` });
  }

  const tokenData = await response.json();
  const drizzleDb = await db.getDb();
  if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const { wearableConnections } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  await drizzleDb.update(wearableConnections).set({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || connection.refreshToken,
    tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in || 86400) * 1000),
  }).where(eq(wearableConnections.id, connection.id));

  return tokenData.access_token;
}

export const wearablesRouter = router({
  // ─────────────────────────────────────────────────────────────────────────
  // Connection Management
  // ─────────────────────────────────────────────────────────────────────────

  getOuraAuthUrl: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .query(({ ctx, input }) => {
      const clientId = process.env.OURA_CLIENT_ID;
      if (!clientId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Oura not configured" });

      const redirectUri = `${input.origin}/api/wearables/callback`;
      const state = Buffer.from(JSON.stringify({
        userId: ctx.user.id,
        origin: input.origin,
        provider: "oura",
      })).toString("base64url");

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "email personal daily heartrate workout session spo2",
        state,
      });

      return { url: `https://cloud.ouraring.com/oauth/authorize?${params.toString()}` };
    }),

  getWhoopAuthUrl: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .query(({ ctx, input }) => {
      const clientId = process.env.WHOOP_CLIENT_ID;
      if (!clientId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Whoop not configured" });

      const redirectUri = `${input.origin}/api/wearables/callback`;
      const state = Buffer.from(JSON.stringify({
        userId: ctx.user.id,
        origin: input.origin,
        provider: "whoop",
      })).toString("base64url");

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "read:cycles read:recovery read:sleep read:workout read:profile read:body_measurement",
        state,
      });

      return { url: `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}` };
    }),

  connectOura: protectedProcedure
    .input(z.object({ code: z.string(), redirectUri: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const clientId = process.env.OURA_CLIENT_ID;
      const clientSecret = process.env.OURA_CLIENT_SECRET;
      if (!clientId || !clientSecret) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Oura not configured" });

      const tokenResponse = await fetch("https://api.ouraring.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code: input.code, redirect_uri: input.redirectUri, client_id: clientId, client_secret: clientSecret }).toString(),
      });
      if (!tokenResponse.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to exchange code" });

      const tokenData = await tokenResponse.json();
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { wearableConnections } = await import("../../drizzle/schema");

      await drizzleDb.insert(wearableConnections).values({
        userId: ctx.user.id, wearableType: "oura", accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token, tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        externalUserId: tokenData.user_id, lastSyncedAt: new Date(),
      });
      return { success: true, message: "Oura Ring connected successfully" };
    }),

  connectWhoop: protectedProcedure
    .input(z.object({ code: z.string(), redirectUri: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const clientId = process.env.WHOOP_CLIENT_ID;
      const clientSecret = process.env.WHOOP_CLIENT_SECRET;
      if (!clientId || !clientSecret) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Whoop not configured" });

      const tokenResponse = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code: input.code, redirect_uri: input.redirectUri, client_id: clientId, client_secret: clientSecret }).toString(),
      });
      if (!tokenResponse.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to exchange code" });

      const tokenData = await tokenResponse.json();
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { wearableConnections } = await import("../../drizzle/schema");

      await drizzleDb.insert(wearableConnections).values({
        userId: ctx.user.id, wearableType: "whoop", accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token, tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        externalUserId: tokenData.user_id, lastSyncedAt: new Date(),
      });
      return { success: true, message: "Whoop connected successfully" };
    }),

  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];
    const { wearableConnections } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    return drizzleDb.select().from(wearableConnections).where(eq(wearableConnections.userId, ctx.user.id));
  }),

  disconnect: protectedProcedure
    .input(z.object({ wearableType: z.enum(["oura", "whoop"]) }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { wearableConnections } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await drizzleDb.delete(wearableConnections).where(and(eq(wearableConnections.userId, ctx.user.id), eq(wearableConnections.wearableType, input.wearableType)));
      return { success: true, message: `${input.wearableType} disconnected` };
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // Data Retrieval
  // ─────────────────────────────────────────────────────────────────────────

  getOuraData: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { ouraRingData } = await import("../../drizzle/schema");
      const { eq, and, gte, lte } = await import("drizzle-orm");
      return drizzleDb.select().from(ouraRingData).where(and(eq(ouraRingData.userId, ctx.user.id), gte(ouraRingData.date, input.startDate), lte(ouraRingData.date, input.endDate))).orderBy((t) => t.date);
    }),

  getWhoopData: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { whoopData } = await import("../../drizzle/schema");
      const { eq, and, gte, lte } = await import("drizzle-orm");
      return drizzleDb.select().from(whoopData).where(and(eq(whoopData.userId, ctx.user.id), gte(whoopData.date, input.startDate), lte(whoopData.date, input.endDate))).orderBy((t) => t.date);
    }),

  getInsights: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { wearableInsights } = await import("../../drizzle/schema");
      const { eq, and, gte, lte } = await import("drizzle-orm");
      return drizzleDb.select().from(wearableInsights).where(and(eq(wearableInsights.userId, ctx.user.id), gte(wearableInsights.date, input.startDate), lte(wearableInsights.date, input.endDate))).orderBy((t) => t.date);
    }),

  // ─────────────────────────────────────────────────────────────────────────
  // Data Synchronization (with automatic token refresh)
  // ─────────────────────────────────────────────────────────────────────────

  syncOuraData: protectedProcedure.mutation(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { wearableConnections, ouraRingData } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const [connection] = await drizzleDb.select().from(wearableConnections).where(and(eq(wearableConnections.userId, ctx.user.id), eq(wearableConnections.wearableType, "oura"))).limit(1);
    if (!connection) throw new TRPCError({ code: "NOT_FOUND", message: "Oura Ring not connected" });

    const accessToken = await refreshTokenIfNeeded(connection);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const response = await fetch(`https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch Oura data" });

    const data = await response.json();
    for (const day of data.data || []) {
      await drizzleDb.insert(ouraRingData).values({
        userId: ctx.user.id, date: day.day,
        sleepDuration: day.total_sleep_duration ? Math.round(day.total_sleep_duration / 60) : null,
        sleepScore: day.sleep_score, deepSleep: day.deep_sleep ? Math.round(day.deep_sleep / 60) : null,
        remSleep: day.rem_sleep ? Math.round(day.rem_sleep / 60) : null,
        lightSleep: day.light_sleep ? Math.round(day.light_sleep / 60) : null,
        rawData: JSON.stringify(day),
      }).onConflictDoUpdate({
        target: [ouraRingData.userId, ouraRingData.date],
        set: {
          sleepDuration: day.total_sleep_duration ? Math.round(day.total_sleep_duration / 60) : null,
          sleepScore: day.sleep_score, deepSleep: day.deep_sleep ? Math.round(day.deep_sleep / 60) : null,
          remSleep: day.rem_sleep ? Math.round(day.rem_sleep / 60) : null,
          lightSleep: day.light_sleep ? Math.round(day.light_sleep / 60) : null,
          rawData: JSON.stringify(day),
        },
      });
    }
    await drizzleDb.update(wearableConnections).set({ lastSyncedAt: new Date() }).where(eq(wearableConnections.id, connection.id));
    return { success: true, message: "Oura data synced", recordsCount: (data.data || []).length };
  }),

  syncWhoopData: protectedProcedure.mutation(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { wearableConnections, whoopData } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const [connection] = await drizzleDb.select().from(wearableConnections).where(and(eq(wearableConnections.userId, ctx.user.id), eq(wearableConnections.wearableType, "whoop"))).limit(1);
    if (!connection) throw new TRPCError({ code: "NOT_FOUND", message: "Whoop not connected" });

    const accessToken = await refreshTokenIfNeeded(connection);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const response = await fetch(`https://api.prod.whoop.com/developer/v1/cycle/collection?start=${startDate.toISOString()}&end=${endDate.toISOString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch Whoop data" });

    const data = await response.json();
    for (const cycle of data.records || []) {
      const cycleDate = new Date(cycle.start).toISOString().split("T")[0];
      await drizzleDb.insert(whoopData).values({
        userId: ctx.user.id, date: cycleDate,
        strain: cycle.strain?.score, strainScore: Math.round((cycle.strain?.score || 0) * 100 / 21),
        recovery: cycle.recovery?.score, recoveryScore: Math.round((cycle.recovery?.score || 0) * 100),
        sleepDuration: cycle.sleep?.total_sleep_duration ? Math.round(cycle.sleep.total_sleep_duration / 60) : null,
        sleepScore: cycle.sleep?.sleep_score, rawData: JSON.stringify(cycle),
      }).onConflictDoUpdate({
        target: [whoopData.userId, whoopData.date],
        set: {
          strain: cycle.strain?.score, strainScore: Math.round((cycle.strain?.score || 0) * 100 / 21),
          recovery: cycle.recovery?.score, recoveryScore: Math.round((cycle.recovery?.score || 0) * 100),
          sleepDuration: cycle.sleep?.total_sleep_duration ? Math.round(cycle.sleep.total_sleep_duration / 60) : null,
          sleepScore: cycle.sleep?.sleep_score, rawData: JSON.stringify(cycle),
        },
      });
    }
    await drizzleDb.update(wearableConnections).set({ lastSyncedAt: new Date() }).where(eq(wearableConnections.id, connection.id));
    return { success: true, message: "Whoop data synced", recordsCount: (data.records || []).length };
  }),

  // ─────────────────────────────────────────────────────────────────────────
  // Metrics History (for charts)
  // ─────────────────────────────────────────────────────────────────────────

  getMetrics: protectedProcedure
    .input(z.object({
      days: z.number().int().min(7).max(90).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return { oura: [], whoop: [], userMetrics: [] };
      const { ouraRingData, whoopData, userHealthMetrics } = await import("../../drizzle/schema");
      const { eq, and, gte } = await import("drizzle-orm");
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateStr = startDate.toISOString().split("T")[0];
      const [ouraRows, whoopRows, healthRows] = await Promise.all([
        drizzleDb.select({
          date: ouraRingData.date,
          sleepDuration: ouraRingData.sleepDuration,
          sleepScore: ouraRingData.sleepScore,
          steps: ouraRingData.steps,
          activeCalories: ouraRingData.activeCalories,
          activityScore: ouraRingData.activityScore,
          readinessScore: ouraRingData.readinessScore,
          restingHeartRate: ouraRingData.restingHeartRate,
          heartRateVariability: ouraRingData.heartRateVariability,
        }).from(ouraRingData)
          .where(and(eq(ouraRingData.userId, ctx.user.id), gte(ouraRingData.date, startDateStr)))
          .orderBy(ouraRingData.date),
        drizzleDb.select({
          date: whoopData.date,
          strain: whoopData.strain,
          strainScore: whoopData.strainScore,
          recovery: whoopData.recovery,
          recoveryScore: whoopData.recoveryScore,
          sleepDuration: whoopData.sleepDuration,
          sleepScore: whoopData.sleepScore,
        }).from(whoopData)
          .where(and(eq(whoopData.userId, ctx.user.id), gte(whoopData.date, startDateStr)))
          .orderBy(whoopData.date),
        drizzleDb.select().from(userHealthMetrics)
          .where(and(eq(userHealthMetrics.userId, ctx.user.id), gte(userHealthMetrics.recordedAt, startDateStr)))
          .orderBy(userHealthMetrics.recordedAt),
      ]);
      return { oura: ouraRows, whoop: whoopRows, userMetrics: healthRows };
    }),

  getSyncStatus: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];
    const { wearableConnections } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const connections = await drizzleDb.select().from(wearableConnections).where(eq(wearableConnections.userId, ctx.user.id));
    return connections.map((conn) => ({
      wearableType: conn.wearableType, isConnected: conn.isActive,
      lastSyncedAt: conn.lastSyncedAt, connectedAt: conn.connectedAt,
    }));
  }),
});
