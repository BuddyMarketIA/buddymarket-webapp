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

  // Get BuddyCare wellness summary
  getBuddyCareSummary: protectedProcedure.query(async ({ ctx }) => {
    const BUDDYCARE_URL = process.env.BUDDYCARE_API_URL || "https://api.buddycare.com";
    const BUDDYCARE_KEY = process.env.BUDDYCARE_API_KEY || "";
    const ECOSYSTEM_SECRET = process.env.ECOSYSTEM_SECRET || "";

    try {
      const res = await fetch(
        `${BUDDYCARE_URL}/api/ecosystem/data?openId=${encodeURIComponent(ctx.user.openId)}`,
        {
          headers: {
            "x-api-key": BUDDYCARE_KEY,
            "x-ecosystem-secret": ECOSYSTEM_SECRET,
            "x-source-app": "buddyone",
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!res.ok) return null;
      const data = await res.json() as any;
      return data.wellness ?? data;
    } catch {
      return null;
    }
  }),

  // Get BuddyCoach training summary
  getBuddyCoachSummary: protectedProcedure.query(async ({ ctx }) => {
    const BUDDYCOACH_URL = process.env.BUDDYCOACH_API_URL ?? "https://buddycoach.io";
    const ECOSYSTEM_SECRET = process.env.ECOSYSTEM_SECRET ?? "";

    try {
      const res = await fetch(
        `${BUDDYCOACH_URL}/api/ecosystem/data?openId=${encodeURIComponent(ctx.user.openId)}`,
        {
          headers: {
            "x-ecosystem-secret": ECOSYSTEM_SECRET,
            "x-source-app": "buddyone",
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!res.ok) return null;
      const data = await res.json() as any;
      return data.workout ?? data;
    } catch {
      return null;
    }
  }),

  // Get BuddyShop featured products
  getBuddyShopProducts: protectedProcedure
    .input(z.object({ category: z.string().optional(), limit: z.number().default(6) }))
    .query(async ({ ctx, input }) => {
      const BUDDYSHOP_URL = process.env.BUDDYSHOP_API_URL || "https://www.buddyoneshop.com/api/buddyone";
      const BUDDYSHOP_KEY = process.env.BUDDYSHOP_API_KEY || "";
      const baseUrl = BUDDYSHOP_URL.replace("/api/buddyone", "/api/trpc");

      try {
        let endpoint = "shop.getFeaturedProducts";
        let apiInput: any = {};
        if (input.category) {
          endpoint = "shop.getProductsByCategory";
          apiInput = { categorySlug: input.category };
        }

        const url = `${baseUrl}/${endpoint}?input=${encodeURIComponent(JSON.stringify({ json: apiInput }))}`;
        const res = await fetch(url, {
          headers: { "x-api-key": BUDDYSHOP_KEY, "x-source-app": "buddyone" },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) return [];
        const data = await res.json() as any;
        const products = data?.result?.data?.json || [];
        return products.slice(0, input.limit).map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          comparePrice: p.comparePrice,
          imageUrl: p.imageUrl,
          category: p.categorySlug,
          rating: p.rating,
          badge: p.badge,
          shortDescription: p.shortDescription,
        }));
      } catch {
        return [];
      }
    }),

  // Get ecosystem status summary (all apps)
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const connections = drizzleDb
      ? await drizzleDb
          .select()
          .from(ecosystemConnections)
          .where(and(eq(ecosystemConnections.userId, ctx.user.id), eq(ecosystemConnections.status, "active")))
      : [];

    const apps = [
      { id: "buddycoach", name: "BuddyCoach", description: "Entrenamiento y fitness personalizado", icon: "🏋️", url: "https://buddycoach.io" },
      { id: "buddyshop", name: "BuddyShop", description: "Productos de cocina y hogar premium", icon: "🛍️", url: "https://www.buddyoneshop.com" },
      { id: "buddycare", name: "BuddyCare", description: "Bienestar y suplementación personalizada", icon: "💚", url: "https://buddycare.app" },
    ];

    return apps.map((app) => ({
      ...app,
      connected: connections.some((c) => c.targetApp === app.id),
      connectionId: connections.find((c) => c.targetApp === app.id)?.id,
      connectedAt: connections.find((c) => c.targetApp === app.id)?.createdAt,
    }));
  }),
});
