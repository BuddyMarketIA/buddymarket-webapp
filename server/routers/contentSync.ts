/**
 * contentSync router
 * Provides endpoints for offline-first synchronization of recipes and menus.
 * Clients can request only items updated after a given timestamp.
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

export const contentSyncRouter = router({
  /**
   * Returns recipes updated after `since` timestamp (ms).
   * Used by the offline cache to keep local data fresh without a full reload.
   */
  syncRecipes: publicProcedure
    .input(
      z.object({
        since: z.number().optional(), // Unix ms; if omitted → return all
        limit: z.number().int().min(1).max(500).optional().default(200),
        offset: z.number().int().min(0).optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { recipes: [], total: 0, serverTime: Date.now() };

      const { recipes } = await import("../../drizzle/schema");
      const { gte, and, isNull, count, desc } = await import("drizzle-orm");

      const sinceDate = input.since ? new Date(input.since) : undefined;
      const whereClause = sinceDate
        ? and(gte(recipes.updatedAt, sinceDate), isNull(recipes.deletedAt))
        : isNull(recipes.deletedAt);

      const [rows, countRows] = await Promise.all([
        drizzleDb
          .select({
            id: recipes.id,
            name: recipes.name,
            description: recipes.description,
            imageUrl: recipes.imageUrl,
            mealTime: recipes.mealTime,
            difficulty: recipes.difficulty,
            preparationTime: recipes.preparationTime,
            cookTime: recipes.cookTime,
            servings: recipes.servings,
            caloriesPerServing: recipes.caloriesPerServing,
            proteinsPerServing: recipes.proteinsPerServing,
            carbsPerServing: recipes.carbsPerServing,
            fatsPerServing: recipes.fatsPerServing,
            fiberPerServing: recipes.fiberPerServing,
            allergens: recipes.allergens,
            tags: recipes.tags,
            ingredientsJson: recipes.ingredientsJson,
            instructionsJson: recipes.instructionsJson,
            cuisineType: recipes.cuisineType,
            cookingMethod: recipes.cookingMethod,
            isPublic: recipes.isPublic,
            buddyMakerId: recipes.buddyMakerId,
            isKidFriendly: recipes.isKidFriendly,
            isBabyFriendly: recipes.isBabyFriendly,
            updatedAt: recipes.updatedAt,
            createdAt: recipes.createdAt,
          })
          .from(recipes)
          .where(whereClause)
          .orderBy(desc(recipes.updatedAt))
          .limit(input.limit)
          .offset(input.offset),
        drizzleDb.select({ total: count() }).from(recipes).where(whereClause),
      ]);

      return {
        recipes: rows,
        total: countRows[0]?.total ?? 0,
        serverTime: Date.now(),
      };
    }),

  /**
   * Returns public menus (seeded library) updated after `since` timestamp.
   */
  syncMenus: publicProcedure
    .input(
      z.object({
        since: z.number().optional(),
        limit: z.number().int().min(1).max(200).optional().default(100),
        offset: z.number().int().min(0).optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { menus: [], total: 0, serverTime: Date.now() };

      const { menuOrganizers, menuOrganizerDayParts, menuOrganizerDayPartRecipes, recipes } = await import("../../drizzle/schema");
      const { gte, and, eq, count, desc } = await import("drizzle-orm");

      const sinceDate = input.since ? new Date(input.since) : undefined;
      const whereClause = sinceDate
        ? and(eq(menuOrganizers.isPublic, true), gte(menuOrganizers.updatedAt, sinceDate))
        : eq(menuOrganizers.isPublic, true);

      const [rows, countRows] = await Promise.all([
        drizzleDb
          .select({
            id: menuOrganizers.id,
            name: menuOrganizers.name,
            goal: menuOrganizers.goal,
            type: menuOrganizers.type,
            dailyCalories: menuOrganizers.dailyCalories,
            difficulty: menuOrganizers.difficulty,
            coverImage: menuOrganizers.coverImage,
            objective: menuOrganizers.objective,
            persons: menuOrganizers.persons,
            dailyMealsCount: menuOrganizers.dailyMealsCount,
            isSeeded: menuOrganizers.isSeeded,
            generatedByAI: menuOrganizers.generatedByAI,
            updatedAt: menuOrganizers.updatedAt,
            createdAt: menuOrganizers.createdAt,
          })
          .from(menuOrganizers)
          .where(whereClause)
          .orderBy(desc(menuOrganizers.updatedAt))
          .limit(input.limit)
          .offset(input.offset),
        drizzleDb.select({ total: count() }).from(menuOrganizers).where(whereClause),
      ]);

      return {
        menus: rows,
        total: countRows[0]?.total ?? 0,
        serverTime: Date.now(),
      };
    }),

  /**
   * Returns a lightweight catalog of all public recipe IDs + updatedAt
   * so the client can detect which items need refreshing without fetching full data.
   */
  getRecipeCatalog: publicProcedure.query(async () => {
    const { getDb } = await import("../db");
    const drizzleDb = await getDb();
    if (!drizzleDb) return { catalog: [], serverTime: Date.now() };

    const { recipes } = await import("../../drizzle/schema");
    const { isNull, desc } = await import("drizzle-orm");

    const rows = await drizzleDb
      .select({ id: recipes.id, updatedAt: recipes.updatedAt })
      .from(recipes)
      .where(isNull(recipes.deletedAt))
      .orderBy(desc(recipes.updatedAt));

    return { catalog: rows, serverTime: Date.now() };
  }),

  /**
   * Admin: create a full recipe with all fields from the admin panel.
   * This allows adding new recipes without any code deployment.
   */
  adminCreateRecipe: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        mealTime: z.enum(["desayuno", "media_manana", "comida", "merienda", "cena", "cualquiera"]).optional().default("cualquiera"),
        difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
        preparationTime: z.number().int().min(0).optional(),
        cookTime: z.number().int().min(0).optional(),
        servings: z.number().int().min(1).optional().default(2),
        caloriesPerServing: z.number().int().optional(),
        proteinsPerServing: z.number().optional(),
        carbsPerServing: z.number().optional(),
        fatsPerServing: z.number().optional(),
        fiberPerServing: z.number().optional(),
        allergens: z.string().optional(), // JSON array string
        tags: z.string().optional(),
        ingredientsJson: z.string().optional(),
        instructionsJson: z.string().optional(),
        cuisineType: z.string().optional(),
        cookingMethod: z.string().optional(),
        isPublic: z.boolean().optional().default(true),
        isKidFriendly: z.boolean().optional().default(false),
        isBabyFriendly: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { recipes } = await import("../../drizzle/schema");
      const [inserted] = await drizzleDb
        .insert(recipes)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          mealTime: input.mealTime as any,
          difficulty: input.difficulty as any,
          preparationTime: input.preparationTime,
          cookTime: input.cookTime,
          servings: input.servings,
          caloriesPerServing: input.caloriesPerServing,
          proteinsPerServing: input.proteinsPerServing,
          carbsPerServing: input.carbsPerServing,
          fatsPerServing: input.fatsPerServing,
          fiberPerServing: input.fiberPerServing,
          allergens: input.allergens,
          tags: input.tags,
          ingredientsJson: input.ingredientsJson,
          instructionsJson: input.instructionsJson,
          cuisineType: input.cuisineType,
          cookingMethod: input.cookingMethod,
          isPublic: input.isPublic,
          isKidFriendly: input.isKidFriendly,
          isBabyFriendly: input.isBabyFriendly,
          isSeeded: false,
        })
        .returning({ id: recipes.id });

      return { success: true, id: inserted?.id };
    }),

  /**
   * Admin: full update of any recipe field.
   */
  adminUpdateRecipe: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        mealTime: z.enum(["desayuno", "media_manana", "comida", "merienda", "cena", "cualquiera"]).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        preparationTime: z.number().int().min(0).optional(),
        cookTime: z.number().int().min(0).optional(),
        servings: z.number().int().min(1).optional(),
        caloriesPerServing: z.number().int().optional(),
        proteinsPerServing: z.number().optional(),
        carbsPerServing: z.number().optional(),
        fatsPerServing: z.number().optional(),
        fiberPerServing: z.number().optional(),
        allergens: z.string().optional(),
        tags: z.string().optional(),
        ingredientsJson: z.string().optional(),
        instructionsJson: z.string().optional(),
        cuisineType: z.string().optional(),
        cookingMethod: z.string().optional(),
        isPublic: z.boolean().optional(),
        isKidFriendly: z.boolean().optional(),
        isBabyFriendly: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { recipes } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { id, ...data } = input;
      const now = new Date();

      await drizzleDb
        .update(recipes)
        .set({ ...data as any, updatedAt: now })
        .where(eq(recipes.id, id));

      return { success: true };
    }),

  /**
   * Admin: delete (soft-delete) a recipe.
   */
  adminDeleteRecipe: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { recipes } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await drizzleDb
        .update(recipes)
        .set({ deletedAt: new Date(), active: false })
        .where(eq(recipes.id, input.id));

      return { success: true };
    }),

  /**
   * Admin: create a public seeded menu (library menu).
   */
  adminCreateMenu: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        goal: z.enum(["perdida_peso", "ganancia_muscular", "tonificacion", "perdida_grasa", "mantenimiento", "bienestar", "vegano"]).optional(),
        dailyCalories: z.number().int().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional().default("easy"),
        coverImage: z.string().optional(),
        objective: z.string().optional(),
        persons: z.number().int().min(1).optional().default(1),
        dailyMealsCount: z.number().int().min(1).max(6).optional().default(3),
        durationDays: z.number().int().min(1).max(30).optional().default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { menuOrganizers } = await import("../../drizzle/schema");
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (input.durationDays ?? 7) - 1);

      const [inserted] = await drizzleDb
        .insert(menuOrganizers)
        .values({
          userId: ctx.user.id,
          name: input.name,
          startDate: now.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          type: "weekly" as any,
          isPublic: true,
          isSeeded: true,
          goal: input.goal as any,
          dailyCalories: input.dailyCalories,
          difficulty: input.difficulty as any,
          coverImage: input.coverImage,
          objective: input.objective,
          persons: input.persons,
          dailyMealsCount: input.dailyMealsCount,
        })
        .returning({ id: menuOrganizers.id });

      return { success: true, id: inserted?.id };
    }),

  /**
   * Admin: update a public menu.
   */
  adminUpdateMenu: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(2).optional(),
        goal: z.enum(["perdida_peso", "ganancia_muscular", "tonificacion", "perdida_grasa", "mantenimiento", "bienestar", "vegano"]).optional(),
        dailyCalories: z.number().int().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        coverImage: z.string().optional(),
        objective: z.string().optional(),
        persons: z.number().int().min(1).optional(),
        dailyMealsCount: z.number().int().min(1).max(6).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { menuOrganizers } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { id, ...data } = input;

      await drizzleDb
        .update(menuOrganizers)
        .set({ ...data as any, updatedAt: new Date() })
        .where(eq(menuOrganizers.id, id));

      return { success: true };
    }),

  /**
   * Admin: delete a public menu.
   */
  adminDeleteMenu: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { menuOrganizers } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await drizzleDb.delete(menuOrganizers).where(eq(menuOrganizers.id, input.id));
      return { success: true };
    }),

  /**
   * Admin: list public menus with pagination.
   */
  adminListMenus: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(200).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { menus: [], total: 0 };

      const { menuOrganizers } = await import("../../drizzle/schema");
      const { like, count, desc } = await import("drizzle-orm");

      const whereClause = input.search
        ? like(menuOrganizers.name, `%${input.search}%`)
        : undefined;

      const [rows, countRows] = await Promise.all([
        drizzleDb
          .select()
          .from(menuOrganizers)
          .where(whereClause)
          .orderBy(desc(menuOrganizers.updatedAt))
          .limit(input.limit)
          .offset(input.offset),
        drizzleDb.select({ total: count() }).from(menuOrganizers).where(whereClause),
      ]);

      return { menus: rows, total: countRows[0]?.total ?? 0 };
    }),

  /**
   * Returns a manifest with counts and last-updated timestamps.
   * Used by the SW to decide whether to trigger a full sync.
   */
  getSyncManifest: publicProcedure.query(async () => {
    const { getDb } = await import("../db");
    const drizzleDb = await getDb();
    if (!drizzleDb) return { recipesCount: 0, menusCount: 0, serverTime: Date.now() };
    const { recipes, menuOrganizers } = await import("../../drizzle/schema");
    const { count, isNull, max } = await import("drizzle-orm");
    const [recipeStats, menuStats] = await Promise.all([
      drizzleDb.select({ total: count(), lastUpdated: max(recipes.updatedAt) }).from(recipes).where(isNull(recipes.deletedAt)),
      drizzleDb.select({ total: count(), lastUpdated: max(menuOrganizers.updatedAt) }).from(menuOrganizers),
    ]);
    return {
      recipesCount: recipeStats[0]?.total ?? 0,
      menusCount: menuStats[0]?.total ?? 0,
      recipesLastUpdated: recipeStats[0]?.lastUpdated?.getTime() ?? null,
      menusLastUpdated: menuStats[0]?.lastUpdated?.getTime() ?? null,
      serverTime: Date.now(),
    };
  }),

  /**
   * Returns all public menus for the catalog (offline-cacheable).
   */
  getMenuCatalog: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).optional().default(100), offset: z.number().int().min(0).optional().default(0) }).optional().default({}))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { menus: [], total: 0, serverTime: Date.now() };
      const { menuOrganizers } = await import("../../drizzle/schema");
      const { count, desc, eq } = await import("drizzle-orm");
      const [rows, countRows] = await Promise.all([
        drizzleDb.select().from(menuOrganizers).where(eq(menuOrganizers.isPublic, true)).orderBy(desc(menuOrganizers.updatedAt)).limit(input.limit).offset(input.offset),
        drizzleDb.select({ total: count() }).from(menuOrganizers).where(eq(menuOrganizers.isPublic, true)),
      ]);
      return { menus: rows, total: countRows[0]?.total ?? 0, serverTime: Date.now() };
    }),
});
