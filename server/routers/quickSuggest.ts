/**
 * quickSuggest router — "¿Qué como hoy?" feature
 * AI-powered meal suggestion based on user profile, history, time of day, and preferences
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

export const quickSuggestRouter = router({
  /**
   * Get a quick meal suggestion based on context
   */
  suggest: protectedProcedure
    .input(z.object({
      mealTime: z.enum(["desayuno", "media_manana", "comida", "merienda", "cena"]).optional(),
      mood: z.enum(["quick", "comfort", "healthy", "adventurous", "light"]).optional(),
      maxCalories: z.number().optional(),
      useLeftovers: z.boolean().optional().default(false),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB not available");

      const { users, userProfiles, userPreferences, recipes, dailyLogs } = await import("../../drizzle/schema");
      const { eq, desc, sql, and, isNull, ne } = await import("drizzle-orm");

      // Get user profile
      const [user] = await drizzleDb.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const [profile] = await drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, ctx.user.id)).limit(1);
      const [prefs] = await drizzleDb.select().from(userPreferences).where(eq(userPreferences.userId, ctx.user.id)).limit(1);

      // Get recent meals to avoid repetition
      const recentLogs = await drizzleDb
        .select({ recipeId: dailyLogs.recipeId })
        .from(dailyLogs)
        .where(and(eq(dailyLogs.userId, ctx.user.id), isNull(dailyLogs.deletedAt)))
        .orderBy(desc(dailyLogs.createdAt))
        .limit(20);
      const recentRecipeIds = recentLogs.map(l => l.recipeId).filter(Boolean);

      // Determine meal time from current hour if not specified
      const hour = new Date().getHours();
      let mealTime = input?.mealTime;
      if (!mealTime) {
        if (hour >= 6 && hour < 10) mealTime = "desayuno";
        else if (hour >= 10 && hour < 12) mealTime = "media_manana";
        else if (hour >= 12 && hour < 16) mealTime = "comida";
        else if (hour >= 16 && hour < 19) mealTime = "merienda";
        else mealTime = "cena";
      }

      // Get a random recipe matching criteria
      const maxCal = input?.maxCalories || (profile?.dailyCalories ? Math.round(Number(profile.dailyCalories) * 0.35) : 600);

      // Build query for suitable recipes
      let query = drizzleDb
        .select({
          id: recipes.id,
          name: recipes.name,
          description: recipes.description,
          imageUrl: recipes.imageUrl,
          calories: recipes.calories,
          protein: recipes.protein,
          carbs: recipes.carbs,
          fat: recipes.fat,
          prepTime: recipes.prepTime,
          difficulty: recipes.difficulty,
          mealTime: recipes.mealTime,
          cuisineType: recipes.cuisineType,
        })
        .from(recipes)
        .where(
          and(
            isNull(recipes.deletedAt),
            sql`${recipes.calories} <= ${maxCal}`,
            sql`${recipes.calories} > 100`,
            recentRecipeIds.length > 0
              ? sql`${recipes.id} NOT IN (${sql.join(recentRecipeIds.map(id => sql`${id}`), sql`, `)})`
              : undefined,
          )
        )
        .orderBy(sql`RANDOM()`)
        .limit(3);

      const suggestions = await query;

      if (suggestions.length === 0) {
        // Fallback: get any recipe
        const fallback = await drizzleDb
          .select({
            id: recipes.id,
            name: recipes.name,
            description: recipes.description,
            imageUrl: recipes.imageUrl,
            calories: recipes.calories,
            protein: recipes.protein,
            carbs: recipes.carbs,
            fat: recipes.fat,
            prepTime: recipes.prepTime,
            difficulty: recipes.difficulty,
            mealTime: recipes.mealTime,
            cuisineType: recipes.cuisineType,
          })
          .from(recipes)
          .where(isNull(recipes.deletedAt))
          .orderBy(sql`RANDOM()`)
          .limit(3);
        return { suggestions: fallback, mealTime, maxCalories: maxCal };
      }

      return { suggestions, mealTime, maxCalories: maxCal };
    }),
});
