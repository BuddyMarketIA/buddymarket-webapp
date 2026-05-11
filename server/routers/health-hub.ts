/**
 * Health Hub Router
 * Endpoints for managing wearable connections (Oura, Whoop) and health data
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { wearableConnections, ouraRingData, whoopData } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { generateOuraAuthUrl, exchangeOuraCode } from "../_core/oura-oauth";
import { generateWhoopAuthUrl, exchangeWhoopCode } from "../_core/whoop-oauth";

export const healthHubRouter = router({
  /**
   * Get all wearable connections for the current user
   */
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const connections = await db
      .select()
      .from(wearableConnections)
      .where(eq(wearableConnections.userId, ctx.user.id));

    return connections.map((conn) => ({
      id: conn.id,
      wearableType: conn.wearableType,
      externalId: conn.externalId,
      isConnected: !!conn.accessToken,
      lastSyncAt: conn.lastSyncAt,
      createdAt: conn.createdAt,
    }));
  }),

  /**
   * Get Oura authorization URL
   */
  getOuraAuthUrl: protectedProcedure
    .input(z.object({ redirectUri: z.string().url() }))
    .query(({ input }) => {
      const state = `oura_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const authUrl = generateOuraAuthUrl(state, input.redirectUri);
      return { authUrl, state };
    }),

  /**
   * Exchange Oura authorization code for tokens
   */
  connectOura: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        redirectUri: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const tokenData = await exchangeOuraCode(input.code, input.redirectUri);

        // Store connection in database
        const connection = await db
          .insert(wearableConnections)
          .values({
            userId: ctx.user.id,
            wearableType: "oura",
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || null,
            expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            lastSyncAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [wearableConnections.userId, wearableConnections.wearableType],
            set: {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token || null,
              expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
              updatedAt: new Date(),
            },
          })
          .returning();

        return { success: true, connection: connection[0] };
      } catch (error: any) {
        throw new Error(`Failed to connect Oura: ${error.message}`);
      }
    }),

  /**
   * Get Whoop authorization URL
   */
  getWhoopAuthUrl: protectedProcedure
    .input(z.object({ redirectUri: z.string().url() }))
    .query(({ input }) => {
      const state = `whoop_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const authUrl = generateWhoopAuthUrl(state, input.redirectUri);
      return { authUrl, state };
    }),

  /**
   * Exchange Whoop authorization code for tokens
   */
  connectWhoop: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        redirectUri: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const tokenData = await exchangeWhoopCode(input.code, input.redirectUri);

        // Store connection in database
        const connection = await db
          .insert(wearableConnections)
          .values({
            userId: ctx.user.id,
            wearableType: "whoop",
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || null,
            expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            lastSyncAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [wearableConnections.userId, wearableConnections.wearableType],
            set: {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token || null,
              expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
              updatedAt: new Date(),
            },
          })
          .returning();

        return { success: true, connection: connection[0] };
      } catch (error: any) {
        throw new Error(`Failed to connect Whoop: ${error.message}`);
      }
    }),

  /**
   * Disconnect a wearable device
   */
  disconnect: protectedProcedure
    .input(z.object({ wearableType: z.enum(["oura", "whoop"]) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(wearableConnections)
        .where(
          and(
            eq(wearableConnections.userId, ctx.user.id),
            eq(wearableConnections.wearableType, input.wearableType)
          )
        );

      return { success: true };
    }),

  /**
   * Get Oura Ring data for the current user
   */
  getOuraData: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const data = await db
        .select()
        .from(ouraRingData)
        .where(
          and(
            eq(ouraRingData.userId, ctx.user.id),
            // Add date range filtering if needed
          )
        );

      return data;
    }),

  /**
   * Get Whoop data for the current user
   */
  getWhoopData: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const data = await db
        .select()
        .from(whoopData)
        .where(
          and(
            eq(whoopData.userId, ctx.user.id),
            // Add date range filtering if needed
          )
        );

      return data;
    }),

  /**
   * Trigger manual sync of wearable data
   */
  syncNow: protectedProcedure
    .input(z.object({ wearableType: z.enum(["oura", "whoop"]) }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement actual sync logic
      return { success: true, message: "Sync initiated" };
    }),
});
