/**
 * marketplace router — Marketplace de Menús
 * Allows BuddyExperts and BuddyMakers to publish and sell custom menus
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

export const marketplaceRouter = router({
  /**
   * List published marketplace menus
   */
  listMenus: publicProcedure
    .input(z.object({
      category: z.enum(["all", "perdida_peso", "ganancia_muscular", "vegano", "sin_gluten", "deportistas", "familiar"]).default("all"),
      sortBy: z.enum(["popular", "newest", "price_asc", "price_desc", "rating"]).default("popular"),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { menus: [], total: 0 };

      const { specialMenus, users } = await import("../../drizzle/schema");
      const { eq, desc, asc, sql, and, like, count } = await import("drizzle-orm");

      const filters: any[] = [eq(specialMenus.isPublished, true)];

      if (input?.category && input.category !== "all") {
        filters.push(eq(specialMenus.category, input.category));
      }
      if (input?.search) {
        filters.push(like(specialMenus.title, `%${input.search}%`));
      }

      const whereClause = filters.length > 1 ? and(...filters) : filters[0];

      // Count total
      const [countResult] = await drizzleDb
        .select({ total: count() })
        .from(specialMenus)
        .where(whereClause);

      // Get menus with creator info
      const orderBy = input?.sortBy === "newest" ? desc(specialMenus.createdAt)
        : input?.sortBy === "price_asc" ? asc(specialMenus.price)
        : input?.sortBy === "price_desc" ? desc(specialMenus.price)
        : desc(specialMenus.purchaseCount);

      const menus = await drizzleDb
        .select({
          id: specialMenus.id,
          title: specialMenus.title,
          description: specialMenus.description,
          category: specialMenus.category,
          price: specialMenus.price,
          currency: specialMenus.currency,
          duration: specialMenus.duration,
          imageUrl: specialMenus.imageUrl,
          rating: specialMenus.rating,
          reviewCount: specialMenus.reviewCount,
          purchaseCount: specialMenus.purchaseCount,
          creatorId: specialMenus.creatorId,
          creatorName: users.name,
          creatorAvatar: users.avatarUrl,
          createdAt: specialMenus.createdAt,
        })
        .from(specialMenus)
        .leftJoin(users, eq(specialMenus.creatorId, users.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(input?.limit ?? 20)
        .offset(input?.offset ?? 0);

      return { menus, total: countResult?.total ?? 0 };
    }),

  /**
   * Get menu details
   */
  getMenuDetail: publicProcedure
    .input(z.object({ menuId: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { specialMenus, users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const [menu] = await drizzleDb
        .select({
          id: specialMenus.id,
          title: specialMenus.title,
          description: specialMenus.description,
          category: specialMenus.category,
          price: specialMenus.price,
          currency: specialMenus.currency,
          duration: specialMenus.duration,
          imageUrl: specialMenus.imageUrl,
          rating: specialMenus.rating,
          reviewCount: specialMenus.reviewCount,
          purchaseCount: specialMenus.purchaseCount,
          features: specialMenus.features,
          sampleDays: specialMenus.sampleDays,
          creatorId: specialMenus.creatorId,
          creatorName: users.name,
          creatorAvatar: users.avatarUrl,
          createdAt: specialMenus.createdAt,
        })
        .from(specialMenus)
        .leftJoin(users, eq(specialMenus.creatorId, users.id))
        .where(eq(specialMenus.id, input.menuId))
        .limit(1);

      if (!menu) throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });

      return menu;
    }),

  /**
   * Publish a menu to the marketplace (experts/makers only)
   */
  publishMenu: protectedProcedure
    .input(z.object({
      title: z.string().min(3).max(200),
      description: z.string().min(10).max(2000),
      category: z.enum(["perdida_peso", "ganancia_muscular", "vegano", "sin_gluten", "deportistas", "familiar"]),
      price: z.number().min(0).max(500),
      currency: z.enum(["EUR", "USD"]).default("EUR"),
      duration: z.enum(["1_week", "2_weeks", "1_month"]).default("1_week"),
      features: z.array(z.string()).optional(),
      menuId: z.number().optional(), // Link to existing menu
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { specialMenus } = await import("../../drizzle/schema");

      const [newMenu] = await drizzleDb.insert(specialMenus).values({
        title: input.title,
        description: input.description,
        category: input.category,
        price: input.price.toString(),
        currency: input.currency,
        duration: input.duration,
        features: JSON.stringify(input.features || []),
        creatorId: ctx.user.id,
        isPublished: true,
        purchaseCount: 0,
        rating: "0",
        reviewCount: 0,
      }).returning({ id: specialMenus.id });

      return { id: newMenu.id, success: true };
    }),
});
