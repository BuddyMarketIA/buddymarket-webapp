import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { createCheckoutSession } from "./stripe-webhook";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import * as db from "./db";

// =============================================================================
// HELPERS
// =============================================================================

function requireOwnership(resourceUserId: number, ctxUserId: number, role: string) {
  if (resourceUserId !== ctxUserId && role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permiso para realizar esta acción" });
  }
}

// =============================================================================
// MAIN ROUTER
// =============================================================================

export const appRouter = router({
  system: systemRouter,

  // ---------------------------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------------------------
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ---------------------------------------------------------------------------
  // SEED (admin only - initialize catalogs)
  // ---------------------------------------------------------------------------
  seed: router({
    catalogs: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await db.seedCatalogs();
      return { success: true };
    }),
  }),

  // ---------------------------------------------------------------------------
  // USER PROFILE
  // ---------------------------------------------------------------------------
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const [profile, medicalProfile, prefs, allergiesData, restrictions, categories, subscription] = await Promise.all([
        db.getUserProfile(ctx.user.id),
        db.getUserMedicalProfile(ctx.user.id),
        db.getUserPreferences(ctx.user.id),
        db.getUserAllergies(ctx.user.id),
        db.getUserDietRestrictions(ctx.user.id),
        db.getUserFoodCategories(ctx.user.id),
        db.getUserSubscription(ctx.user.id),
      ]);
      return {
        user: ctx.user,
        profile,
        medicalProfile,
        preferences: prefs,
        allergies: allergiesData.map((a) => a.allergy),
        dietRestrictions: restrictions.map((r) => r.restriction),
        foodCategories: categories.map((c) => c.category),
        subscription,
      };
    }),

    updateBasic: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          description: z.string().optional(),
          locale: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, input);
        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          age: z.number().optional(),
          height: z.number().optional(),
          weight: z.number().optional(),
          targetWeight: z.number().optional(),
          gender: z.enum(["male", "female", "other"]).optional(),
          cookingLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
          activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
          mainGoal: z.enum(["lose_weight", "gain_muscle", "maintain", "improve_health", "eat_healthier"]).optional(),
          dailyCalorieGoal: z.number().optional(),
          dailyProteinGoal: z.number().optional(),
          dailyCarbsGoal: z.number().optional(),
          dailyFatGoal: z.number().optional(),
          sleepHours: z.number().optional(),
          dailyMeals: z.number().optional(),
          practicesSports: z.boolean().optional(),
          heightUnit: z.enum(["cm", "ft"]).optional(),
          weightUnit: z.enum(["kg", "lb"]).optional(),
          // Extended lifestyle
          sportsFrequency: z.enum(["never", "1_2_week", "3_4_week", "5_plus_week", "daily"]).optional(),
          sportsTypes: z.string().optional(),
          workType: z.enum(["sedentary_desk", "light_standing", "moderate_physical", "heavy_physical"]).optional(),
          stressLevel: z.enum(["low", "moderate", "high", "very_high"]).optional(),
          waterIntake: z.number().optional(),
          alcoholConsumption: z.enum(["none", "occasional", "moderate", "frequent"]).optional(),
          smokingStatus: z.enum(["non_smoker", "ex_smoker", "smoker"]).optional(),
          weightChangeRate: z.number().optional(),
          mealPrepTime: z.enum(["under_15", "15_30", "30_60", "over_60"]).optional(),
          budgetPerWeek: z.number().optional(),
          favoriteCuisines: z.string().optional(),
          dislikedIngredients: z.string().optional(),
          cookingEquipment: z.string().optional(),
          mealsPerDayDetail: z.string().optional(),
          snackingHabits: z.enum(["never", "rarely", "sometimes", "often"]).optional(),
          eatOutFrequency: z.enum(["never", "1_2_month", "1_2_week", "3_plus_week"]).optional(),
          fitnessGoalDetail: z.string().optional(),
          motivationLevel: z.enum(["low", "medium", "high", "very_high"]).optional(),
          previousDietExperience: z.string().optional(),
          birthYear: z.number().optional(),
          bodyFatPercentage: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserProfile(ctx.user.id, input);
        return { success: true };
      }),

    updateMedical: protectedProcedure
      .input(
        z.object({
          nutritionalSupplements: z.string().optional(),
          useNutritionalSupplements: z.boolean().optional(),
          medicalDiet: z.string().optional(),
          hasMedicalDiet: z.boolean().optional(),
          surgery: z.string().optional(),
          hasSurgery: z.boolean().optional(),
          medicalFamilyBackground: z.string().optional(),
          hasMedicalFamilyBackground: z.boolean().optional(),
          metabolismMedication: z.string().optional(),
          useMetabolismMedication: z.boolean().optional(),
          medicalConditions: z.string().optional(),
          hasMedicalConditions: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserMedicalProfile(ctx.user.id, input);
        return { success: true };
      }),

    updatePreferences: protectedProcedure
      .input(
        z.object({
          purchaseFrequency: z.string().optional(),
          purchaseLocation: z.string().optional(),
          suggestHealthierProducts: z.boolean().optional(),
          suggestCheaperProducts: z.boolean().optional(),
          organicProducts: z.boolean().optional(),
          interestedInNutritionalAdvices: z.boolean().optional(),
          notifications: z.boolean().optional(),
          newsletter: z.boolean().optional(),
          acceptTerms: z.boolean().optional(),
          preferredMealComplexity: z.enum(["simple", "moderate", "complex"]).optional(),
          portionSize: z.enum(["small", "medium", "large"]).optional(),
          preferSeasonalIngredients: z.boolean().optional(),
          preferLocalProducts: z.boolean().optional(),
          avoidProcessedFood: z.boolean().optional(),
          interestedInMealPrep: z.boolean().optional(),
          wantsShoppingListAutomation: z.boolean().optional(),
          wantsCalorieTracking: z.boolean().optional(),
          wantsMacroTracking: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserPreferences(ctx.user.id, input);
        return { success: true };
      }),

    setAllergies: protectedProcedure
      .input(z.object({ allergyIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        await db.setUserAllergies(ctx.user.id, input.allergyIds);
        return { success: true };
      }),


    setDietRestrictions: protectedProcedure
      .input(z.object({ restrictionIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        await db.setUserDietRestrictions(ctx.user.id, input.restrictionIds);
        return { success: true };
      }),

    setFoodCategories: protectedProcedure
      .input(z.object({ categoryIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        await db.setUserFoodCategories(ctx.user.id, input.categoryIds);
        return { success: true };
      }),

    completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
      await db.updateUser(ctx.user.id, { onboardingCompleted: true });
      return { success: true };
    }),

    deleteAccount: protectedProcedure
      .input(z.object({ confirmation: z.literal("DELETE MY ACCOUNT") }))
      .mutation(async ({ ctx }) => {
        await db.deleteUserAccount(ctx.user.id);
        return { success: true };
      }),
  }),

  // ---------------------------------------------------------------------------
  // CATALOGS
  // ---------------------------------------------------------------------------
  catalogs: router({
    allergies: publicProcedure.query(() => db.getAllAllergies()),
    dietRestrictions: publicProcedure.query(() => db.getAllDietRestrictions()),
    foodCategories: publicProcedure.query(() => db.getAllFoodCategories()),
    measures: publicProcedure.query(() => db.getAllMeasures()),
    dayParts: publicProcedure.query(() => db.getAllDayParts()),
    storageLocations: publicProcedure.query(() => db.getAllStorageLocations()),
  }),

  // ---------------------------------------------------------------------------
  // INGREDIENTS
  // ---------------------------------------------------------------------------
  ingredients: router({
    search: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().optional() }))
      .query(({ input }) => db.searchIngredients(input.query, input.limit)),

    getAll: publicProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(({ input }) => db.getAllIngredients(input.limit, input.offset)),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getIngredientById(input.id)),

    create: protectedProcedure
      .input(
        z.object({
          apiParam: z.string(),
          nameEs: z.string(),
          nameEn: z.string().optional(),
          imageUrl: z.string().optional(),
          calories: z.number().optional(),
          proteins: z.number().optional(),
          carbohydrates: z.number().optional(),
          fats: z.number().optional(),
          fiber: z.number().optional(),
          sugars: z.number().optional(),
          sodium: z.number().optional(),
          allergyIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { allergyIds, ...data } = input;
        return db.createIngredientWithAllergies(data as any, allergyIds || []);
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.unknown()) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.updateIngredient(input.id, input.data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.deleteIngredient(input.id);
        return { success: true };
      }),
  }),

  // ---------------------------------------------------------------------------
  // RECIPES
  // ---------------------------------------------------------------------------
  recipes: router({
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          userId: z.number().optional(),
          categoryIds: z.array(z.number()).optional(),
          allergyIds: z.array(z.number()).optional(),
          restrictionIds: z.array(z.number()).optional(),
          difficulty: z.string().optional(),
          maxTime: z.number().optional(),
          isPublic: z.boolean().optional(),
          mealTime: z.string().optional(),
          tag: z.string().optional(),
          buddyMakerId: z.number().optional(),
          isSeeded: z.boolean().optional(),
          excludeUserAllergens: z.boolean().optional(),
          cuisineType: z.string().optional(),
          cookingMethod: z.string().optional(),
          limit: z.number().optional(),
          cursor: z.number().optional(), // offset cursor for infinite scroll
        })
      )
      .query(async ({ input, ctx }) => {
        const limit = input.limit ?? 20;
        const offset = input.cursor ?? 0;
        const items = await db.getRecipes({ ...input, limit: limit + 1, offset, currentUserId: ctx.user?.id });
        const hasMore = items.length > limit;
        const recipes = hasMore ? items.slice(0, limit) : items;
        const nextCursor = hasMore ? offset + limit : undefined;
        return { recipes, nextCursor, total: undefined };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const recipe = await db.getRecipeById(input.id);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        const [ingredients, steps, categories, recipeAllergies] = await Promise.all([
          db.getRecipeIngredients(input.id),
          db.getRecipeSteps(input.id),
          db.getRecipeCategories(input.id),
          db.getRecipeAllergies(input.id),
        ]);
        return { ...recipe, ingredients, steps, categories: categories.map((c) => c.category), allergies: recipeAllergies.map((a) => a.allergy) };
      }),

    searchSuggestions: publicProcedure
      .input(z.object({ query: z.string(), limit: z.number().optional() }))
      .query(({ input }) => db.searchRecipeSuggestions(input.query, input.limit ?? 8)),
    myRecipes: protectedProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(({ ctx, input }) => db.getRecipes({ userId: ctx.user.id, ...input })),

    favorites: protectedProcedure.query(async ({ ctx }) => {
      const favs = await db.getFavoriteRecipes(ctx.user.id);
      return favs.map((f) => f.recipe);
    }),

    toggleFavorite: protectedProcedure
      .input(z.object({ recipeId: z.number() }))
      .mutation(({ ctx, input }) => db.toggleFavoriteRecipe(ctx.user.id, input.recipeId)),

    isFavorite: protectedProcedure
      .input(z.object({ recipeId: z.number() }))
      .query(({ ctx, input }) => db.isRecipeFavorite(ctx.user.id, input.recipeId)),

    getFavoriteIds: protectedProcedure.query(async ({ ctx }) => {
      const favs = await db.getFavoriteRecipes(ctx.user.id);
      return favs.map((f) => f.recipe.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          preparationTime: z.number().optional(),
          cookTime: z.number().optional(),
          servings: z.number().optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
          isPublic: z.boolean().optional(),
          categoryIds: z.array(z.number()).optional(),
          allergyIds: z.array(z.number()).optional(),
          restrictionIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { categoryIds, allergyIds, restrictionIds, ...recipeData } = input;
        const result = await db.createRecipe({ ...recipeData, userId: ctx.user.id });
        if (result) {
          await Promise.all([
            categoryIds?.length ? db.setRecipeCategories(result.id, categoryIds) : Promise.resolve(),
            allergyIds?.length ? db.setRecipeAllergies(result.id, allergyIds) : Promise.resolve(),
            restrictionIds?.length ? db.setRecipeDietRestrictions(result.id, restrictionIds) : Promise.resolve(),
          ]);
        }
        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          preparationTime: z.number().optional(),
          cookTime: z.number().optional(),
          servings: z.number().optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
          isPublic: z.boolean().optional(),
          categoryIds: z.array(z.number()).optional(),
          allergyIds: z.array(z.number()).optional(),
          restrictionIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.id);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        const { id, categoryIds, allergyIds, restrictionIds, ...data } = input;
        await db.updateRecipe(id, data);
        if (categoryIds) await db.setRecipeCategories(id, categoryIds);
        if (allergyIds) await db.setRecipeAllergies(id, allergyIds);
        if (restrictionIds) await db.setRecipeDietRestrictions(id, restrictionIds);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.id);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        await db.deleteRecipe(input.id);
        return { success: true };
      }),

    addIngredient: protectedProcedure
      .input(
        z.object({
          recipeId: z.number(),
          ingredientId: z.number(),
          measureId: z.number().optional(),
          amount: z.number(),
          optional: z.boolean().optional(),
          notes: z.string().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.recipeId);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        await db.addRecipeIngredient(input);
        return { success: true };
      }),

    removeIngredient: protectedProcedure
      .input(z.object({ id: z.number(), recipeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.recipeId);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        await db.deleteRecipeIngredient(input.id);
        return { success: true };
      }),

    addStep: protectedProcedure
      .input(
        z.object({
          recipeId: z.number(),
          stepNumber: z.number(),
          instruction: z.string(),
          imageUrl: z.string().optional(),
          timing: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.recipeId);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        await db.addRecipeStep(input);
        return { success: true };
      }),

    removeStep: protectedProcedure
      .input(z.object({ id: z.number(), recipeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const recipe = await db.getRecipeById(input.recipeId);
        if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(recipe.userId, ctx.user.id, ctx.user.role);
        await db.deleteRecipeStep(input.id);
        return { success: true };
      }),

    generateWithAI: protectedProcedure
      .input(
        z.object({
          prompt: z.string(),
          servings: z.number().optional(),
          difficulty: z.string().optional(),
          maxTime: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Eres un chef experto en nutrición. Genera recetas saludables y deliciosas en formato JSON. 
              Responde SOLO con JSON válido con esta estructura:
              {
                "name": "nombre de la receta",
                "description": "descripción breve",
                "preparationTime": número en minutos,
                "cookTime": número en minutos,
                "servings": número,
                "difficulty": "easy"|"medium"|"hard",
                "ingredients": [{"name": "nombre", "amount": número, "unit": "unidad"}],
                "steps": [{"stepNumber": 1, "instruction": "instrucción"}],
                "caloriesPerServing": número aproximado,
                "proteinsPerServing": número en gramos,
                "carbsPerServing": número en gramos,
                "fatsPerServing": número en gramos
              }`,
            },
            {
              role: "user",
              content: `Genera una receta para: ${input.prompt}. ${input.servings ? `Para ${input.servings} personas.` : ""} ${input.maxTime ? `Tiempo máximo: ${input.maxTime} minutos.` : ""} ${input.difficulty ? `Dificultad: ${input.difficulty}.` : ""}`,
            },
          ],
          response_format: { type: "json_object" },
        });
        const content = response.choices[0]?.message?.content as string | undefined;
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error generando receta con IA. Inténtalo de nuevo." });
        try {
          return JSON.parse(content);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La IA devolvió una respuesta inválida. Inténtalo de nuevo." });
        }
      }),
  }),
  // ---------------------------------------------------------------------------
  // MENU ORGANIZERS
  // ---------------------------------------------------------------------------
  menus: router({
    list: protectedProcedure.query(({ ctx }) => db.getMenuOrganizers(ctx.user.id)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.id);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        const dayParts = await db.getMenuDayParts(input.id);
        return { ...menu, dayParts };
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          type: z.enum(["weekly", "monthly", "custom"]).optional(),
          objective: z.string().optional(),
          dailyMealsCount: z.number().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createMenuOrganizer({ ...input, userId: ctx.user.id, startDate: new Date(input.startDate), endDate: new Date(input.endDate) })
      ),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          objective: z.string().optional(),
          dailyMealsCount: z.number().optional(),
          isPublic: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.id);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        const { id, ...data } = input;
        await db.updateMenuOrganizer(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.id);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        await db.deleteMenuOrganizer(input.id);
        return { success: true };
      }),

    addRecipeToDayPart: protectedProcedure
      .input(z.object({ menuOrganizerDayPartId: z.number(), recipeId: z.number(), servings: z.number().optional() }))
      .mutation(({ input }) => db.addRecipeToMenuDayPart(input.menuOrganizerDayPartId, input.recipeId, input.servings)),

    removeRecipeFromDayPart: protectedProcedure
      .input(z.object({ menuOrganizerDayPartId: z.number(), recipeId: z.number() }))
      .mutation(({ input }) => db.removeRecipeFromMenuDayPart(input.menuOrganizerDayPartId, input.recipeId)),

    // Get all items for a specific date across all user menus
    getItemsByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        const userMenus = await db.getMenuOrganizers(ctx.user.id);
        if (!userMenus.length) return [];
        const results: any[] = [];
        for (const menu of userMenus) {
          const dayParts = await db.getMenuDayParts(menu.id);
          const dateMatchingParts = dayParts.filter((dp: any) => dp.dayPart.date === input.date);
          for (const dp of dateMatchingParts) {
            const recipeItems = await db.getMenuDayPartRecipes(dp.dayPart.id);
            results.push({
              menuId: menu.id,
              menuName: menu.name,
              dayPartId: dp.dayPart.id,
              dayPartName: dp.dayPartInfo?.nameEs ?? dp.dayPartInfo?.apiParam ?? "Comida",
              dayPartKey: dp.dayPartInfo?.apiParam ?? "meal",
              recipes: recipeItems.map((r: any) => ({ ...r.menuRecipe, recipe: r.recipe })),
            });
          }
        }
        return results;
      }),

    // Ensure a day part exists for a date+mealType, return its id
    ensureDayPart: protectedProcedure
      .input(z.object({ menuId: z.number(), date: z.string(), mealType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const menu = await db.getMenuOrganizerById(input.menuId);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(menu.userId, ctx.user.id, ctx.user.role);
        // Find or create the day part
        const dayParts = await db.getMenuDayParts(input.menuId);
        const existing = dayParts.find((dp: any) => dp.dayPart.date === input.date && (dp.dayPartInfo?.name === input.mealType || dp.dayPartInfo?.nameEs === input.mealType));
        if (existing) return { id: existing.dayPart.id };
        // Create new day part - find the dayPartId from catalog
        const dayPartId = await db.getDayPartIdByName(input.mealType);
        const id = await db.createMenuDayPart(input.menuId, dayPartId, input.date);
        return { id };
      }),

    generateWithAI: protectedProcedure
      .input(
        z.object({
          days: z.number().min(1).max(30),
          mealsPerDay: z.number().min(1).max(6),
          objective: z.string().optional(),
          preferences: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [profile, allergies, restrictions] = await Promise.all([
          db.getUserProfile(ctx.user.id),
          db.getUserAllergies(ctx.user.id),
          db.getUserDietRestrictions(ctx.user.id),
        ]);

        const profileInfo = profile
          ? `Objetivo: ${profile.mainGoal || "mantener peso"}, Actividad: ${profile.activityLevel || "moderada"}, Calorías diarias: ${profile.dailyCalorieGoal || 2000}`
          : "";
        const allergyInfo = allergies.length > 0 ? `Alergias: ${allergies.map((a) => a.allergy?.nameEs).join(", ")}` : "";
        const restrictionInfo = restrictions.length > 0 ? `Restricciones: ${restrictions.map((r) => r.restriction?.nameEs).join(", ")}` : "";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Eres un nutricionista experto. Genera planes de menú semanales personalizados en formato JSON.
              Responde SOLO con JSON válido con esta estructura:
              {
                "menuName": "nombre del menú",
                "days": [
                  {
                    "dayNumber": 1,
                    "meals": [
                      {
                        "mealType": "desayuno|comida|cena|merienda",
                        "recipeName": "nombre de la receta",
                        "description": "descripción breve",
                        "estimatedCalories": número,
                        "preparationTime": número en minutos
                      }
                    ]
                  }
                ]
              }`,
            },
            {
              role: "user",
              content: `Genera un menú para ${input.days} días con ${input.mealsPerDay} comidas por día.
              ${profileInfo}
              ${allergyInfo}
              ${restrictionInfo}
              ${input.objective ? `Objetivo específico: ${input.objective}` : ""}
              ${input.preferences ? `Preferencias: ${input.preferences}` : ""}`,
            },
          ],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content as string | undefined;
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error generando menú con IA" });
        return JSON.parse(content);
      }),
    // ── Library: predefined seeded menus ─────────────────────────────────────────
    library: publicProcedure
      .input(
        z.object({
          goal: z.enum(["perdida_peso", "ganancia_muscular", "tonificacion", "perdida_grasa", "mantenimiento", "bienestar", "vegano"]).optional(),
          difficulty: z.enum(["facil", "medio", "dificil"]).optional(),
          limit: z.number().optional().default(50),
        })
      )
      .query(async ({ input }) => {
        const allMenus = await db.getSeededMenus();
        let filtered = allMenus;
        if (input.goal) filtered = filtered.filter((m: any) => m.goal === input.goal);
        if (input.difficulty) filtered = filtered.filter((m: any) => m.difficulty === input.difficulty);
        return filtered.slice(0, input.limit ?? 50);
      }),
    libraryDetail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const menu = await db.getSeededMenuDetail(input.id);
        if (!menu) throw new TRPCError({ code: "NOT_FOUND" });
        return menu;
      }),
    saveFromLibrary: protectedProcedure
      .input(
        z.object({
          menuId: z.number(),
          persons: z.number().min(1).max(20).default(1),
          startDate: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.copyMenuForUser(input.menuId, ctx.user.id, input.persons, input.startDate);
        return result;
      }),
  }),

  // ---------------------------------------------------------------------------
  // SHOPPING LISTS
  // ---------------------------------------------------------------------------
  shoppingLists: router({
    list: protectedProcedure.query(({ ctx }) => db.getShoppingLists(ctx.user.id)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const list = await db.getShoppingListById(input.id);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        const items = await db.getShoppingListItems(input.id);
        return { ...list, items };
      }),

    create: protectedProcedure
      .input(z.object({ name: z.string(), menuOrganizerId: z.number().optional() }))
      .mutation(({ ctx, input }) => db.createShoppingList({ ...input, userId: ctx.user.id })),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const list = await db.getShoppingListById(input.id);
        if (!list) throw new TRPCError({ code: "NOT_FOUND" });
        requireOwnership(list.userId, ctx.user.id, ctx.user.role);
        await db.deleteShoppingList(input.id);
        return { success: true };
      }),

    addItem: protectedProcedure
      .input(
        z.object({
          shoppingListId: z.number(),
          ingredientId: z.number().optional(),
          customName: z.string().optional(),
          amount: z.number().optional(),
          measureId: z.number().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.addShoppingListItem(input)),

    updateItem: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          amount: z.number().optional(),
          checked: z.boolean().optional(),
          customName: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateShoppingListItem(id, data);
      }),

    toggleItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.toggleShoppingListItem(input.id)),

    removeItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteShoppingListItem(input.id)),
    // ── Generate shopping list from a menu ──────────────────────────────────
    generateFromMenu: protectedProcedure
      .input(
        z.object({
          menuId: z.number(),
          persons: z.number().min(1).max(20).default(1),
          supermarket: z.enum(["general", "mercadona", "lidl", "carrefour", "alcampo", "dia", "el_corte_ingles"]).default("general"),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.generateShoppingListFromMenu(ctx.user.id, input.menuId, input.persons, input.supermarket, input.name);
        return result;
      }),
  }),
  // ---------------------------------------------------------------------------
  // INVENTORYY
  // ---------------------------------------------------------------------------
  inventory: router({
    list: protectedProcedure.query(({ ctx }) => db.getInventoryItems(ctx.user.id)),

    add: protectedProcedure
      .input(
        z.object({
          ingredientId: z.number().optional(),
          customName: z.string().max(100, "Nombre máximo 100 caracteres").optional(),
          amount: z.number().min(0, "Cantidad no puede ser negativa").max(99999, "Cantidad demasiado grande"),
          measureId: z.number().optional(),
          storageLocationId: z.number().optional(),
          expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido").optional(),
          purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido").optional(),
          notes: z.string().max(200, "Notas máximo 200 caracteres").optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        if (!input.ingredientId && !input.customName?.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Debes indicar el nombre del alimento" });
        }
        return db.addInventoryItem({ ...input, userId: ctx.user.id } as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          amount: z.number().min(0, "Cantidad no puede ser negativa").max(99999).optional(),
          expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido").optional(),
          storageLocationId: z.number().optional(),
          notes: z.string().max(200, "Notas máximo 200 caracteres").optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateInventoryItem(id, data as any);
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userInventoryItems } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Verify ownership before deleting
        const existing = await drizzleDb.select().from(userInventoryItems)
          .where(and(eq(userInventoryItems.id, input.id), eq(userInventoryItems.userId, ctx.user.id)))
          .limit(1);
        if (existing.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
        await drizzleDb.delete(userInventoryItems).where(eq(userInventoryItems.id, input.id));
        return { success: true };
      }),

    // Analyse a photo of fridge/pantry with vision LLM and return detected products
    analyzePhoto: protectedProcedure
      .input(z.object({ imageUrl: z.string() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Eres un asistente de nutrición. Analiza la imagen del frigorífico o despensa y devuelve ÚNICAMENTE un JSON válido con los productos detectados. Formato exacto:
{"products": [{"name": "Leche entera", "amount": 1, "unit": "litro", "category": "lácteo"}, ...]}
Si no puedes detectar productos, devuelve {"products": []}. No incluyas texto adicional fuera del JSON.`,
            },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: input.imageUrl, detail: "high" } },
                { type: "text", text: "Lista todos los productos alimenticios que ves en esta imagen con su cantidad aproximada y unidad." },
              ],
            },
          ],
        });
        const rawContent = response?.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{\"products\": []}";
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          return JSON.parse(jsonMatch ? jsonMatch[0] : content) as { products: { name: string; amount: number; unit: string; category: string }[] };
        } catch {
          return { products: [] };
        }
      }),

    // Get items expiring soon (within N days)
    getExpiringItems: protectedProcedure
      .input(z.object({ days: z.number().default(7) }))
      .query(async ({ ctx, input }) => {
        const items = await db.getInventoryItems(ctx.user.id);
        const now = new Date();
        const cutoff = new Date(now.getTime() + input.days * 24 * 60 * 60 * 1000);
        return items.filter((item: any) => {
          if (!item.expirationDate) return false;
          const exp = new Date(item.expirationDate);
          return exp <= cutoff;
        }).sort((a: any, b: any) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
      }),

    // Get recipe recommendations based on expiring inventory ingredients
    getRecipesByExpiring: protectedProcedure
      .query(async ({ ctx }) => {
        const items = await db.getInventoryItems(ctx.user.id);
        const now = new Date();
        const cutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiring = items
          .filter((item: any) => item.expirationDate && new Date(item.expirationDate) <= cutoff)
          .map((item: any) => item.customName || item.ingredientId)
          .filter(Boolean)
          .slice(0, 10);
        if (expiring.length === 0) {
          // Return some recent recipes if nothing is expiring
          const result = await db.getRecipes({ userId: ctx.user.id, limit: 6 });
          const recipes = Array.isArray(result) ? result : (result as any).recipes ?? result;
          return { recipes, expiringIngredients: [] };
        }
        // Search recipes that match expiring ingredients
        const result = await db.getRecipes({ userId: ctx.user.id, search: expiring[0] as string, limit: 6 });
        const recipes = Array.isArray(result) ? result : (result as any).recipes ?? result;
        return { recipes, expiringIngredients: expiring };
      }),
  }),
  // ---------------------------------------------------------------------------
  // MEAL LOGSS
  // ---------------------------------------------------------------------------
  mealLogs: router({
    list: protectedProcedure
      .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(({ ctx, input }) => db.getMealLogs(ctx.user.id, input.startDate, input.endDate)),

    dailySummary: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(({ ctx, input }) => db.getDailyNutritionSummary(ctx.user.id, input.date)),

    add: protectedProcedure
      .input(
        z.object({
          recipeId: z.number().optional(),
          customMealName: z.string().max(100, "Nombre máximo 100 caracteres").optional(),
          dayPartId: z.number().optional(),
          logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
          servings: z.number().min(0.1, "Raciones mínimas 0.1").max(20, "Raciones máximas 20").optional(),
          calories: z.number().min(0, "Calorías no pueden ser negativas").max(10000, "Calorías demasiado altas").optional(),
          proteins: z.number().min(0).max(1000).optional(),
          carbohydrates: z.number().min(0).max(1000).optional(),
          fats: z.number().min(0).max(1000).optional(),
          notes: z.string().max(300, "Notas máximo 300 caracteres").optional(),
          photoUrl: z.string().url("URL de foto inválida").optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        if (!input.recipeId && !input.customMealName?.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Debes indicar el nombre de la comida" });
        }
        return db.addMealLog({ ...input, userId: ctx.user.id, logDate: new Date(input.logDate) } as any);
      }),

    analyzeFood: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ ctx, input }) => {
        // 1. Upload image to S3
        const imageBuffer = Buffer.from(input.imageBase64, "base64");
        const fileKey = `meal-photos/${ctx.user.id}-${Date.now()}.jpg`;
        const { url: photoUrl } = await storagePut(fileKey, imageBuffer, input.mimeType);
        // 2. Analyze with vision AI
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Eres un nutricionista experto. Analiza la imagen de comida y devuelve SOLO un JSON válido con los alimentos detectados y sus valores nutricionales estimados.`,
            },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: photoUrl, detail: "high" } },
                {
                  type: "text",
                  text: `Analiza esta imagen y devuelve SOLO este JSON (sin texto adicional, sin markdown):
{"mealName":"nombre del plato","foods":[{"name":"alimento","quantity":"cantidad estimada","calories":0,"proteins":0,"carbs":0,"fats":0}],"totalCalories":0,"totalProteins":0,"totalCarbs":0,"totalFats":0,"confidence":"alta","notes":"observaciones"}`,
                },
              ],
            },
          ],
        });
        // 3. Parse AI response
        let analysis: { mealName: string; foods: Array<{ name: string; quantity: string; calories: number; proteins: number; carbs: number; fats: number }>; totalCalories: number; totalProteins: number; totalCarbs: number; totalFats: number; confidence: string; notes: string };
        try {
          const content = response.choices[0]?.message?.content ?? "{}";
          const jsonStr = typeof content === "string" ? content : JSON.stringify(content);
          const cleaned = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          analysis = JSON.parse(cleaned);
        } catch {
          analysis = { mealName: "Comida detectada", foods: [], totalCalories: 0, totalProteins: 0, totalCarbs: 0, totalFats: 0, confidence: "baja", notes: "No se pudo analizar la imagen" };
        }
        return { photoUrl, analysis };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { mealLogs } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Verify ownership before deleting
        const existing = await drizzleDb.select().from(mealLogs)
          .where(and(eq(mealLogs.id, input.id), eq(mealLogs.userId, ctx.user.id)))
          .limit(1);
        if (existing.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Registro no encontrado" });
        await drizzleDb.delete(mealLogs).where(eq(mealLogs.id, input.id));
        return { success: true };
      }),

    getStreak: protectedProcedure.query(async ({ ctx }) => {
      try {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { currentStreak: 0, longestStreak: 0 };
        const { mealLogs: logsTable } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        // Get all unique log dates (descending)
        const rows = await drizzleDb
          .selectDistinct({ logDate: logsTable.logDate })
          .from(logsTable)
          .where(eq(logsTable.userId, ctx.user.id))
          .orderBy(desc(logsTable.logDate));
        if (rows.length === 0) return { currentStreak: 0, longestStreak: 0 };
        // Sort dates descending
        const dates = rows
          .map(r => new Date(r.logDate).toISOString().split("T")[0])
          .sort()
          .reverse();
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        // Current streak: must include today or yesterday
        let currentStreak = 0;
        if (dates[0] === today || dates[0] === yesterday) {
          currentStreak = 1;
          for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1]);
            const curr = new Date(dates[i]);
            const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
            if (diffDays === 1) currentStreak++;
            else break;
          }
        }
        // Longest streak
        let longestStreak = currentStreak;
        let tempStreak = 1;
        for (let i = 1; i < dates.length; i++) {
          const prev = new Date(dates[i - 1]);
          const curr = new Date(dates[i]);
          const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
          if (diffDays === 1) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else {
            tempStreak = 1;
          }
        }
        return { currentStreak, longestStreak };
      } catch {
        return { currentStreak: 0, longestStreak: 0 };
      }
    }),

    nutritionalHistory: protectedProcedure
      .input(z.object({ days: z.number().min(7).max(90).default(30) }))
      .query(async ({ ctx, input }) => {
        try {
          const drizzleDb = await db.getDb();
          if (!drizzleDb) return { data: [] };
          const { mealLogs: logsTable } = await import("../drizzle/schema");
          const { eq, gte, sql } = await import("drizzle-orm");
          // Calculate start date
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);
          const startDateStr = startDate.toISOString().split("T")[0];
          // Get daily aggregated data
          const rows = await drizzleDb
            .select({
              date: logsTable.logDate,
              calories: sql<number>`COALESCE(SUM(${logsTable.calories}), 0)`,
              proteins: sql<number>`COALESCE(SUM(${logsTable.proteins}), 0)`,
              carbohydrates: sql<number>`COALESCE(SUM(${logsTable.carbohydrates}), 0)`,
              fats: sql<number>`COALESCE(SUM(${logsTable.fats}), 0)`,
            })
            .from(logsTable)
            .where(eq(logsTable.userId, ctx.user.id))
            .groupBy(logsTable.logDate)
            .orderBy(logsTable.logDate);
          // Filter by date range and format
          const data = rows
            .filter(r => {
              const dateStr = new Date(r.date).toISOString().split("T")[0];
              return dateStr >= startDateStr;
            })
            .map(r => ({
              date: new Date(r.date).toISOString().split("T")[0],
              calories: Math.round(Number(r.calories) || 0),
              proteins: Math.round(Number(r.proteins) || 0),
              carbohydrates: Math.round(Number(r.carbohydrates) || 0),
              fats: Math.round(Number(r.fats) || 0),
            }));
          return { data };
        } catch {
          return { data: [] };
        }
      }),
  }),

  // ---------------------------------------------------------------------------
  // STRIPE SUBSCRIPTIONS
  // ---------------------------------------------------------------------------
  subscriptions: router({
    createCheckout: protectedProcedure
      .input(z.object({
        plan: z.enum(["basic", "premium", "pro_max"]),
        origin: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await createCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          userName: ctx.user.name,
          plan: input.plan,
          origin: input.origin,
        });
        return { url: session.url };
      }),
    getStatus: protectedProcedure.query(({ ctx }) => db.getUserSubscription(ctx.user.id)),
  }),
  // ---------------------------------------------------------------------------
  // HEALTH METRICS
  // ---------------------------------------------------------------------------
  healthMetrics: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(({ ctx, input }) => db.getHealthMetrics(ctx.user.id, input.limit)),

    add: protectedProcedure
      .input(
        z.object({
          weight: z.number().optional(),
          bodyFatPercentage: z.number().optional(),
          muscleMass: z.number().optional(),
          recordedAt: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => db.addHealthMetric({ ...input, userId: ctx.user.id, recordedAt: new Date(input.recordedAt) } as any)),
  }),

  // ---------------------------------------------------------------------------
  // ADMIN
  // ---------------------------------------------------------------------------
  admin: router({
    users: protectedProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return db.getAllUsers(input.limit, input.offset);
      }),

    updateUserRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "buddyexpert"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.updateUser(input.userId, { role: input.role });
        return { success: true };
      }),

    grantProAccess: protectedProcedure
      .input(z.object({ userId: z.number(), plan: z.enum(["basic", "premium", "pro_max"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.upsertUserSubscription(input.userId, {
          status: "active",
          plan: input.plan,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
        return { success: true };
      }),

    createAllergy: protectedProcedure
      .input(z.object({ apiParam: z.string(), nameEs: z.string(), nameEn: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return db.createAllergy(input);
      }),

    updateAllergy: protectedProcedure
      .input(z.object({ id: z.number(), nameEs: z.string().optional(), nameEn: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await db.updateAllergy(id, data);
        return { success: true };
      }),

    deleteAllergy: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.deleteAllergy(input.id);
        return { success: true };
      }),

    createDietRestriction: protectedProcedure
      .input(z.object({ apiParam: z.string(), nameEs: z.string(), nameEn: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return db.createDietRestriction(input);
      }),

    updateDietRestriction: protectedProcedure
      .input(z.object({ id: z.number(), nameEs: z.string().optional(), nameEn: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await db.updateDietRestriction(id, data);
        return { success: true };
      }),

    createFoodCategory: protectedProcedure
      .input(z.object({ apiParam: z.string(), nameEs: z.string(), nameEn: z.string().optional(), imageUrl: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return db.createFoodCategory(input);
      }),

    updateFoodCategory: protectedProcedure
      .input(z.object({ id: z.number(), nameEs: z.string().optional(), nameEn: z.string().optional(), imageUrl: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await db.updateFoodCategory(id, data);
        return { success: true };
      }),

    createMeasure: protectedProcedure
      .input(z.object({ apiParam: z.string(), nameEs: z.string(), nameEn: z.string().optional(), abbreviation: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return db.createMeasure(input);
      }),
    deleteDietRestriction: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.deleteDietRestriction(input.id);
        return { success: true };
      }),
    deleteFoodCategory: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.deleteFoodCategory(input.id);
        return { success: true };
      }),
    deleteMeasure: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await db.deleteMeasure(input.id);
        return { success: true };
      }),
    stats: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const [users, recipesList, ingredients, menus] = await Promise.all([
          db.getAllUsers(1000, 0),
          db.getAllRecipes(1000),
          db.getAllIngredients(1000, 0),
          db.getAllMenus(1000),
        ]);
        return {
          totalUsers: users.length,
          totalRecipes: recipesList.length,
          totalIngredients: ingredients.length,
          totalMenus: menus.length,
        };
      }),
  }),

  // Mercadona integration — proxy to tienda.mercadona.es unofficial API
  mercadona: router({
    // Search products from local DB (fast, no external API calls)
    searchProducts: publicProcedure
      .input(z.object({ query: z.string().min(1), limit: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { mercadonaProducts } = await import("../drizzle/schema");
        const { like, or } = await import("drizzle-orm");
        const q = `%${input.query}%`;
        const rows = await drizzleDb
          .select()
          .from(mercadonaProducts)
          .where(or(
            like(mercadonaProducts.name, q),
            like(mercadonaProducts.subcategoryName, q),
            like(mercadonaProducts.categoryName, q)
          ))
          .limit(input.limit);
        return rows.map(p => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          packaging: p.packaging,
          thumbnail: p.thumbnail,
          price: p.unitPrice ? parseFloat(p.unitPrice) : 0,
          priceStr: p.unitPrice ? `${p.unitPrice}€` : "—",
          unit: p.referenceFormat ?? "",
          category: p.categoryName,
          subcategory: p.subcategoryName,
          shareUrl: p.shareUrl,
        }));
      }),

    // Get all categories from DB
    categories: publicProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { mercadonaProducts } = await import("../drizzle/schema");
      const { sql } = await import("drizzle-orm");
      const [rows] = await drizzleDb.execute(
        sql`SELECT category_name, subcategory_name, COUNT(*) as count FROM mercadona_products GROUP BY category_name, subcategory_name ORDER BY category_name, count DESC`
      ) as any;
      return (rows as any[]).map((r: any) => ({
        categoryName: r.category_name as string,
        subcategoryName: r.subcategory_name as string,
        count: Number(r.count),
      }));
    }),

    // Get products by category from DB
    byCategory: publicProcedure
      .input(z.object({ categoryName: z.string(), subcategoryName: z.string().optional(), limit: z.number().optional().default(50) }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { mercadonaProducts } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const conditions: any[] = [eq(mercadonaProducts.categoryName, input.categoryName)];
        if (input.subcategoryName) conditions.push(eq(mercadonaProducts.subcategoryName, input.subcategoryName));
        const rows = await drizzleDb
          .select()
          .from(mercadonaProducts)
          .where(and(...conditions))
          .limit(input.limit);
        return rows.map(p => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          packaging: p.packaging,
          thumbnail: p.thumbnail,
          price: p.unitPrice ? parseFloat(p.unitPrice) : 0,
          priceStr: p.unitPrice ? `${p.unitPrice}€` : "—",
          unit: p.referenceFormat ?? "",
          category: p.categoryName,
          subcategory: p.subcategoryName,
          shareUrl: p.shareUrl,
        }));
      }),

    // ── Mercadona Account Integration ──────────────────────────────────────────
    // Authenticate with Mercadona account and get token + customer info
    login: protectedProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1), postalCode: z.string().optional().default("28001") }))
      .mutation(async ({ input }) => {
        const MERC_BASE = "https://tienda.mercadona.es/api";
        const HEADERS = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          "Origin": "https://tienda.mercadona.es",
          "Referer": "https://tienda.mercadona.es/",
        };
        // Step 1: Set warehouse by postal code
        await fetch(`${MERC_BASE}/postal_codes/${input.postalCode}/`, { headers: HEADERS }).catch(() => {});
        // Step 2: Authenticate
        const authRes = await fetch(`${MERC_BASE}/auth/tokens/`, {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify({ username: input.email, password: input.password }),
        });
        if (!authRes.ok) {
          const errText = await authRes.text();
          if (authRes.status === 400 || authRes.status === 401) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Email o contraseña incorrectos" });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Error de Mercadona: ${errText}` });
        }
        const authData = await authRes.json() as { access_token: string; customer_id: string };
        // Step 3: Get customer info (includes cart_id)
        const custRes = await fetch(`${MERC_BASE}/customers/${authData.customer_id}/`, {
          headers: { ...HEADERS, "Authorization": `Bearer ${authData.access_token}` },
        });
        const custData = custRes.ok ? await custRes.json() as any : {};
        return {
          accessToken: authData.access_token,
          customerId: authData.customer_id,
          cartId: custData.cart_id ?? null,
          customerName: custData.first_name ?? null,
        };
      }),

    // Add a list of products to the Mercadona cart
    addToCart: protectedProcedure
      .input(z.object({
        accessToken: z.string(),
        customerId: z.string(),
        cartId: z.string(),
        items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })),
      }))
      .mutation(async ({ input }) => {
        const MERC_BASE = "https://tienda.mercadona.es/api";
        const HEADERS = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${input.accessToken}`,
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          "Origin": "https://tienda.mercadona.es",
          "Referer": "https://tienda.mercadona.es/",
        };
        // Get current cart to get its version
        const cartRes = await fetch(`${MERC_BASE}/customers/${input.customerId}/cart/`, { headers: HEADERS });
        const cartData = cartRes.ok ? await cartRes.json() as any : { id: input.cartId, version: 1, lines: [] };
        const currentVersion = cartData.version ?? 1;
        const existingLines: any[] = cartData.lines ?? [];
        // Merge existing lines with new items
        const newLines = [...existingLines];
        for (const item of input.items) {
          const existingIdx = newLines.findIndex((l: any) => String(l.product_id) === String(item.productId));
          if (existingIdx >= 0) {
            newLines[existingIdx] = { ...newLines[existingIdx], quantity: newLines[existingIdx].quantity + item.quantity };
          } else {
            newLines.push({ quantity: item.quantity, product_id: String(item.productId), sources: [] });
          }
        }
        // PUT updated cart
        const putRes = await fetch(`${MERC_BASE}/customers/${input.customerId}/cart/`, {
          method: "PUT",
          headers: HEADERS,
          body: JSON.stringify({ id: input.cartId, version: currentVersion, lines: newLines }),
        });
        if (!putRes.ok) {
          const errText = await putRes.text();
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Error al añadir al carrito: ${errText}` });
        }
        const result = await putRes.json() as any;
        return {
          success: true,
          itemsAdded: input.items.length,
          cartLines: result.lines?.length ?? newLines.length,
          cartTotal: result.total_price ?? null,
        };
      }),
  }),

  // ===========================================================================
  // CARREFOUR INTEGRATION
  // ===========================================================================
  carrefour: router({
    searchProducts: publicProcedure
      .input(z.object({ q: z.string().optional(), category: z.string().optional(), subcategory: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { carrefourProducts } = await import("../drizzle/schema");
        const { like, eq, and, or, desc } = await import("drizzle-orm");
        const q = input.q?.trim();
        const conditions: any[] = [];
        if (q && q.length > 0) {
          conditions.push(or(
            like(carrefourProducts.name, `%${q}%`),
            like(carrefourProducts.subcategory, `%${q}%`),
            like(carrefourProducts.category, `%${q}%`),
            like(carrefourProducts.brand, `%${q}%`),
          ));
        }
        if (input.category) conditions.push(eq(carrefourProducts.category, input.category));
        if (input.subcategory) conditions.push(eq(carrefourProducts.subcategory, input.subcategory));
        const rows = await drizzleDb
          .select()
          .from(carrefourProducts)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(carrefourProducts.price))
          .limit(input.limit ?? 48);
        return rows;
      }),
    categories: publicProcedure.query(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { sql } = await import("drizzle-orm");
      const rows = await drizzleDb.execute(
        sql`SELECT category, subcategory, COUNT(*) as count FROM carrefour_products GROUP BY category, subcategory ORDER BY category, count DESC`
      ) as any;
      const result = rows[0] as Array<{ category: string; subcategory: string; count: number }>;
      return result;
    }),
    byCategory: publicProcedure
      .input(z.object({ category: z.string(), subcategory: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { carrefourProducts } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(carrefourProducts.category, input.category)];
        if (input.subcategory) conditions.push(eq(carrefourProducts.subcategory, input.subcategory));
        return drizzleDb
          .select()
          .from(carrefourProducts)
          .where(and(...conditions))
          .orderBy(desc(carrefourProducts.price))
          .limit(input.limit ?? 48);
      }),
  }),

  // ===========================================================================
  // USER BODY METRICS
  // ===========================================================================
  metrics: router({
    add: protectedProcedure
      .input(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
        weight: z.number().min(20, "Peso mínimo 20kg").max(500, "Peso máximo 500kg").optional(),
        bodyFat: z.number().min(1, "% grasa mínimo 1%").max(70, "% grasa máximo 70%").optional(),
        muscleMass: z.number().min(5, "Masa muscular mínima 5kg").max(200, "Masa muscular máxima 200kg").optional(),
        bmi: z.number().min(10, "IMC mínimo 10").max(80, "IMC máximo 80").optional(),
        waist: z.number().min(30, "Cintura mínima 30cm").max(300, "Cintura máxima 300cm").optional(),
        hip: z.number().min(30, "Cadera mínima 30cm").max(300, "Cadera máxima 300cm").optional(),
        chest: z.number().min(30, "Pecho mínimo 30cm").max(300, "Pecho máximo 300cm").optional(),
        arm: z.number().min(10, "Brazo mínimo 10cm").max(100, "Brazo máximo 100cm").optional(),
        thigh: z.number().min(10, "Muslo mínimo 10cm").max(150, "Muslo máximo 150cm").optional(),
        calf: z.number().min(10, "Gemelo mínimo 10cm").max(100, "Gemelo máximo 100cm").optional(),
        neck: z.number().min(10, "Cuello mínimo 10cm").max(80, "Cuello máximo 80cm").optional(),
        visceralFat: z.number().min(1, "Grasa visceral mínima 1").max(30, "Grasa visceral máxima 30").optional(),
        boneMass: z.number().min(0.5, "Masa ósea mínima 0.5kg").max(10, "Masa ósea máxima 10kg").optional(),
        waterPercentage: z.number().min(20, "% agua mínimo 20%").max(80, "% agua máximo 80%").optional(),
        metabolicAge: z.number().min(10, "Edad metabólica mínima 10").max(100, "Edad metabólica máxima 100").optional(),
        basalMetabolism: z.number().min(500, "Metabolismo basal mínimo 500kcal").max(5000, "Metabolismo basal máximo 5000kcal").optional(),
        notes: z.string().max(500, "Notas máximo 500 caracteres").optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validar que al menos un campo numérico esté presente
        const hasData = input.weight || input.bodyFat || input.muscleMass || input.bmi || 
          input.waist || input.hip || input.chest || input.arm || input.thigh || 
          input.calf || input.neck || input.visceralFat || input.boneMass || 
          input.waterPercentage || input.metabolicAge || input.basalMetabolism;
        if (!hasData && !input.notes) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Debes proporcionar al menos una medición o nota" 
          });
        }
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userMetrics } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Upsert: si ya existe una medición para ese día, la actualiza
        const existing = await drizzleDb.select().from(userMetrics)
          .where(and(eq(userMetrics.userId, ctx.user.id), eq(userMetrics.date, input.date as any)))
          .limit(1);
        const data = {
          userId: ctx.user.id,
          date: input.date as any,
          weight: input.weight ?? null,
          bodyFat: input.bodyFat ?? null,
          muscleMass: input.muscleMass ?? null,
          bmi: input.bmi ?? null,
          waist: input.waist ?? null,
          hip: input.hip ?? null,
          chest: input.chest ?? null,
          arm: input.arm ?? null,
          thigh: input.thigh ?? null,
          calf: input.calf ?? null,
          neck: input.neck ?? null,
          visceralFat: input.visceralFat ?? null,
          boneMass: input.boneMass ?? null,
          waterPercentage: input.waterPercentage ?? null,
          metabolicAge: input.metabolicAge ?? null,
          basalMetabolism: input.basalMetabolism ?? null,
          notes: input.notes ?? null,
        };
        if (existing.length > 0) {
          await drizzleDb.update(userMetrics).set(data).where(eq(userMetrics.id, existing[0].id));
          return { id: existing[0].id, updated: true };
        } else {
          const result = await drizzleDb.insert(userMetrics).values(data);
          return { id: (result as any).insertId, updated: false };
        }
      }),
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { userMetrics } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        return drizzleDb.select().from(userMetrics)
          .where(eq(userMetrics.userId, ctx.user.id))
          .orderBy(desc(userMetrics.date))
          .limit(input?.limit ?? 90);
      }),
    getLatest: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { userMetrics } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const rows = await drizzleDb.select().from(userMetrics)
        .where(eq(userMetrics.userId, ctx.user.id))
        .orderBy(desc(userMetrics.date))
        .limit(1);
      return rows[0] ?? null;
    }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { userMetrics } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        await drizzleDb.delete(userMetrics)
          .where(and(eq(userMetrics.id, input.id), eq(userMetrics.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // ===========================================================================
  // BUDDY APPLICATIONS — Solicitudes Expert/Maker
  // ===========================================================================
  buddyApplications: router({
    submitApplication: protectedProcedure
      .input(z.object({
        type: z.enum(["expert", "maker"]),
        displayName: z.string().min(2),
        bio: z.string().optional(),
        specialty: z.string().optional(),
        instagramHandle: z.string().optional(),
        youtubeHandle: z.string().optional(),
        tiktokHandle: z.string().optional(),
        websiteUrl: z.string().optional(),
        motivation: z.string().optional(),
        experience: z.string().optional(),
        expertCategory: z.string().optional(),
        certifications: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyApplications: appsTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Check if already has a pending/approved application of this type
        const existing = await drizzleDb.select().from(appsTable)
          .where(and(eq(appsTable.userId, ctx.user.id), eq(appsTable.type, input.type)))
          .limit(1);
        if (existing.length > 0 && existing[0].status !== "rejected") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ya tienes una solicitud activa para este rol" });
        }
        if (existing.length > 0 && existing[0].status === "rejected") {
          // Allow re-apply after rejection — update the existing record
          await drizzleDb.update(appsTable).set({
            ...input,
            status: "pending",
            adminNote: null,
            reviewedAt: null,
            reviewedBy: null,
          }).where(eq(appsTable.id, existing[0].id));
          // Notify owner
          try { const { notifyOwner } = await import("./_core/notification"); await notifyOwner({ title: `Nueva solicitud ${input.type}: ${input.displayName}`, content: `${ctx.user.name || ctx.user.email} quiere ser ${input.type === "expert" ? "BuddyExpert" : "BuddyMaker"}. Especialidad: ${input.specialty || "N/A"}` }); } catch {}
          return { success: true, id: existing[0].id };
        }
        const result = await drizzleDb.insert(appsTable).values({
          userId: ctx.user.id,
          type: input.type,
          status: "pending",
          displayName: input.displayName,
          bio: input.bio ?? null,
          specialty: input.specialty ?? null,
          instagramHandle: input.instagramHandle ?? null,
          youtubeHandle: input.youtubeHandle ?? null,
          tiktokHandle: input.tiktokHandle ?? null,
          websiteUrl: input.websiteUrl ?? null,
          motivation: input.motivation ?? null,
          experience: input.experience ?? null,
          expertCategory: input.expertCategory ?? null,
          certifications: input.certifications ?? null,
        });
        // Notify owner
        try { const { notifyOwner } = await import("./_core/notification"); await notifyOwner({ title: `Nueva solicitud ${input.type}: ${input.displayName}`, content: `${ctx.user.name || ctx.user.email} quiere ser ${input.type === "expert" ? "BuddyExpert" : "BuddyMaker"}. Especialidad: ${input.specialty || "N/A"}` }); } catch {}
        return { success: true, id: (result as any).insertId };
      }),
    getMyApplication: protectedProcedure
      .input(z.object({ type: z.enum(["expert", "maker"]) }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return null;
        const { buddyApplications: appsTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const rows = await drizzleDb.select().from(appsTable)
          .where(and(eq(appsTable.userId, ctx.user.id), eq(appsTable.type, input.type)))
          .orderBy(desc(appsTable.appliedAt))
          .limit(1);
        return rows[0] ?? null;
      }),
    // ADMIN: list all pending applications
    listPending: protectedProcedure
      .input(z.object({ type: z.enum(["expert", "maker", "all"]).optional(), status: z.enum(["pending", "approved", "rejected", "all"]).optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { buddyApplications: appsTable, users: usersTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [];
        if (input?.type && input.type !== "all") conditions.push(eq(appsTable.type, input.type));
        const statusFilter = input?.status ?? "pending";
        if (statusFilter !== "all") conditions.push(eq(appsTable.status, statusFilter as any));
        const rows = await drizzleDb
          .select({ app: appsTable, user: { name: usersTable.name, email: usersTable.email, imageUrl: usersTable.imageUrl } })
          .from(appsTable)
          .leftJoin(usersTable, eq(appsTable.userId, usersTable.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(appsTable.appliedAt))
          .limit(100);
        return rows;
      }),
    // ADMIN: approve or reject application
    review: protectedProcedure
      .input(z.object({
        id: z.number(),
        action: z.enum(["approve", "reject"]),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyApplications: appsTable, buddyExperts, buddyMakers, users: usersTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const apps = await drizzleDb.select().from(appsTable).where(eq(appsTable.id, input.id)).limit(1);
        if (!apps.length) throw new TRPCError({ code: "NOT_FOUND" });
        const app = apps[0];
        const newStatus = input.action === "approve" ? "approved" : "rejected";
        await drizzleDb.update(appsTable).set({
          status: newStatus,
          adminNote: input.adminNote ?? null,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
        }).where(eq(appsTable.id, input.id));
        // If approved, create the expert/maker profile if it doesn't exist
        if (input.action === "approve") {
          const userRows = await drizzleDb.select().from(usersTable).where(eq(usersTable.id, app.userId)).limit(1);
          const user = userRows[0];
          if (app.type === "expert") {
            const existing = await drizzleDb.select().from(buddyExperts).where(eq(buddyExperts.userId, app.userId)).limit(1);
            if (!existing.length) {
              await drizzleDb.insert(buddyExperts).values({
                userId: app.userId,
                displayName: app.displayName,
                bio: app.bio ?? null,
                avatarUrl: user?.imageUrl ?? null,
                instagramHandle: app.instagramHandle ?? null,
                specialty: app.specialty ?? null,
                category: (app.expertCategory as any) ?? "dieta_equilibrada",
                verified: true,
              });
            } else {
              await drizzleDb.update(buddyExperts).set({ verified: true }).where(eq(buddyExperts.userId, app.userId));
            }
          } else {
            const existing = await drizzleDb.select().from(buddyMakers).where(eq(buddyMakers.userId, app.userId)).limit(1);
            if (!existing.length) {
              await drizzleDb.insert(buddyMakers).values({
                userId: app.userId,
                displayName: app.displayName,
                bio: app.bio ?? null,
                avatarUrl: user?.imageUrl ?? null,
                instagramHandle: app.instagramHandle ?? null,
                youtubeHandle: app.youtubeHandle ?? null,
                tiktokHandle: app.tiktokHandle ?? null,
                specialty: app.specialty ?? null,
                verified: true,
              });
            } else {
              await drizzleDb.update(buddyMakers).set({ verified: true }).where(eq(buddyMakers.userId, app.userId));
            }
          }
        }
        return { success: true };
      }),
  }),

  // ===========================================================================
  // BUDDY EXPERTS
  // ===========================================================================
  buddyExperts: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional(), search: z.string().optional(), featured: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { buddyExperts: beTable, users: usersTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(beTable.verified, true)];
        if (input?.category) conditions.push(eq(beTable.category, input.category as any));
        if (input?.featured) conditions.push(eq(beTable.featured, true));
        const rows = await drizzleDb
          .select({ expert: beTable, user: { name: usersTable.name, imageUrl: usersTable.imageUrl, email: usersTable.email } })
          .from(beTable)
          .leftJoin(usersTable, eq(beTable.userId, usersTable.id))
          .where(and(...conditions))
          .orderBy(desc(beTable.followersCount))
          .limit(50);
        return rows;
      }),

    getPlans: publicProcedure
      .input(z.object({ expertId: z.number(), category: z.string().optional() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { expertPlans: epTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(epTable.expertId, input.expertId), eq(epTable.isPublic, true)];
        if (input.category) conditions.push(eq(epTable.category, input.category as any));
        return drizzleDb.select().from(epTable).where(and(...conditions)).orderBy(desc(epTable.copiesCount)).limit(20);
      }),

    getAllPlans: publicProcedure
      .input(z.object({ category: z.string().optional(), search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { expertPlans: epTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(epTable.isPublic, true)];
        if (input?.category) conditions.push(eq(epTable.category, input.category as any));
        return drizzleDb
          .select({ plan: epTable, expert: { id: beTable.id, displayName: beTable.displayName, specialty: beTable.specialty, avatarUrl: beTable.avatarUrl, verified: beTable.verified } })
          .from(epTable)
          .leftJoin(beTable, eq(epTable.expertId, beTable.id))
          .where(and(...conditions))
          .orderBy(desc(epTable.copiesCount))
          .limit(30);
      }),

    getMenus: publicProcedure
      .input(z.object({ expertId: z.number().optional(), category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { expertMenus: emTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(emTable.isPublic, true)];
        if (input?.expertId) conditions.push(eq(emTable.expertId, input.expertId));
        if (input?.category) conditions.push(eq(emTable.category, input.category as any));
        return drizzleDb
          .select({ menu: emTable, expert: { id: beTable.id, displayName: beTable.displayName, avatarUrl: beTable.avatarUrl, verified: beTable.verified, specialty: beTable.specialty } })
          .from(emTable)
          .leftJoin(beTable, eq(emTable.expertId, beTable.id))
          .where(and(...conditions))
          .orderBy(desc(emTable.copiesCount))
          .limit(30);
      }),

    copyPlan: protectedProcedure
      .input(z.object({ planId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertPlans: epTable, userExpertPlanCopies: copiesTable } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        const plan = await drizzleDb.select().from(epTable).where(eq(epTable.id, input.planId)).limit(1);
        if (!plan[0]) throw new TRPCError({ code: "NOT_FOUND" });
        await drizzleDb.insert(copiesTable).values({ userId: ctx.user.id, planId: input.planId, expertId: plan[0].expertId });
        await drizzleDb.update(epTable).set({ copiesCount: sql`${epTable.copiesCount} + 1` }).where(eq(epTable.id, input.planId));
        return { success: true };
      }),

    follow: protectedProcedure
      .input(z.object({ expertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertFollowers: efTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, sql, and } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(efTable).where(and(eq(efTable.userId, ctx.user.id), eq(efTable.expertId, input.expertId))).limit(1);
        if (existing[0]) {
          await drizzleDb.delete(efTable).where(and(eq(efTable.userId, ctx.user.id), eq(efTable.expertId, input.expertId)));
          await drizzleDb.update(beTable).set({ followersCount: sql`${beTable.followersCount} - 1` }).where(eq(beTable.id, input.expertId));
          return { following: false };
        }
        await drizzleDb.insert(efTable).values({ userId: ctx.user.id, expertId: input.expertId });
        await drizzleDb.update(beTable).set({ followersCount: sql`${beTable.followersCount} + 1` }).where(eq(beTable.id, input.expertId));
        return { following: true };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return null;
        const { buddyExperts: beTable, users: usersTable, expertPlans: epTable, expertMenus: emTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const rows = await drizzleDb
          .select({ expert: beTable, user: { name: usersTable.name, imageUrl: usersTable.imageUrl, email: usersTable.email } })
          .from(beTable)
          .leftJoin(usersTable, eq(beTable.userId, usersTable.id))
          .where(eq(beTable.id, input.id))
          .limit(1);
        if (!rows[0]) return null;
        const plans = await drizzleDb.select().from(epTable).where(and(eq(epTable.expertId, input.id), eq(epTable.isPublic, true))).orderBy(desc(epTable.copiesCount)).limit(6);
        const menus = await drizzleDb.select().from(emTable).where(and(eq(emTable.expertId, input.id), eq(emTable.isPublic, true))).orderBy(desc(emTable.copiesCount)).limit(3);
        return { ...rows[0], plans, menus };
      }),

    isFollowing: protectedProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { following: false };
        const { expertFollowers: efTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const row = await drizzleDb.select().from(efTable).where(and(eq(efTable.userId, ctx.user.id), eq(efTable.expertId, input.expertId))).limit(1);
        return { following: !!row[0] };
      }),

    getFollowing: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { expertFollowers: efTable, buddyExperts: beTable } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      return drizzleDb
        .select({ expert: beTable, followedAt: efTable.followedAt })
        .from(efTable)
        .leftJoin(beTable, eq(efTable.expertId, beTable.id))
        .where(eq(efTable.userId, ctx.user.id))
        .orderBy(desc(efTable.followedAt))
        .limit(50);
    }),

    seedDemoExperts: publicProcedure.mutation(async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { buddyExperts: beTable, expertPlans: epTable, expertMenus: emTable, users: usersTable } = await import("../drizzle/schema");
      const existing = await drizzleDb.select().from(beTable).limit(1);
      if (existing.length > 0) return { seeded: false, message: "Already seeded" };
      const demoExperts = [
        { displayName: "Miranda Jiménez", specialty: "Dietista", bio: "Especialista en pérdida de peso saludable con más de 10 años de experiencia.", category: "perdida_peso" as const, verified: true, featured: true, followersCount: 12400, plansCount: 8, rating: 4.9, reviewsCount: 234, avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80" },
        { displayName: "Carlos Ruiz", specialty: "Nutricionista deportivo", bio: "Nutricionista especializado en rendimiento deportivo y ganancia muscular.", category: "ganancia_muscular" as const, verified: true, featured: true, followersCount: 28900, plansCount: 12, rating: 4.8, reviewsCount: 456, avatarUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80" },
        { displayName: "Laura Gómez", specialty: "Nutricionista", bio: "Experta en dietas antiinflamatorias y bienestar digestivo.", category: "bienestar" as const, verified: true, featured: false, followersCount: 8700, plansCount: 6, rating: 4.7, reviewsCount: 189, avatarUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80" },
        { displayName: "Enrique Ortiz", specialty: "Dietista", bio: "Especialista en nutrición vegana y plant-based.", category: "vegano" as const, verified: true, featured: false, followersCount: 15200, plansCount: 9, rating: 4.6, reviewsCount: 312, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80" },
      ];
      for (const expert of demoExperts) {
        const [userRes] = await drizzleDb.insert(usersTable).values({ openId: `demo_expert_${expert.displayName.replace(/ /g, "_")}`, name: expert.displayName, email: `${expert.displayName.toLowerCase().replace(/ /g, ".")}@buddymarket.io`, role: "buddyexpert" });
        const userId = (userRes as any).insertId as number;
        const [expRes] = await drizzleDb.insert(beTable).values({ userId, ...expert });
        const expertId = (expRes as any).insertId as number;
        await drizzleDb.insert(epTable).values({
          expertId,
          title: `Plan ${expert.category === "perdida_peso" ? "pérdida de peso" : expert.category === "ganancia_muscular" ? "fitness" : expert.category === "bienestar" ? "antiinflamatorio" : "vegano"}`,
          description: `Plan nutricional de 4 semanas creado por ${expert.displayName}.`,
          category: expert.category,
          durationWeeks: 4,
          dailyCalories: expert.category === "perdida_peso" ? 1500 : expert.category === "ganancia_muscular" ? 2200 : 1700,
          level: "principiante",
          isPublic: true,
          isFeatured: expert.featured,
          coverUrl: expert.coverUrl,
        });
        // Menú semanal gratuito para ganar seguidores
        await drizzleDb.insert(emTable).values({
          expertId,
          title: `Menú semanal de ${expert.displayName}`,
          description: `Menú semanal gratuito compartido por ${expert.displayName} para que puedas conocer su estilo de alimentación.`,
          category: expert.category,
          dailyCalories: expert.category === "perdida_peso" ? 1500 : expert.category === "ganancia_muscular" ? 2200 : 1700,
          isFree: true,
          isPublic: true,
          coverUrl: expert.coverUrl,
          menuData: JSON.stringify({
            days: [
              { day: "Lunes", meals: [{ name: "Desayuno", food: "Avena con frutas" }, { name: "Comida", food: "Pollo a la plancha con ensalada" }, { name: "Cena", food: "Salmón con verduras" }] },
              { day: "Martes", meals: [{ name: "Desayuno", food: "Tostadas con aguacate" }, { name: "Comida", food: "Lentejas con arroz" }, { name: "Cena", food: "Tortilla de espinacas" }] },
              { day: "Miércoles", meals: [{ name: "Desayuno", food: "Yogur con granola" }, { name: "Comida", food: "Pasta integral con atún" }, { name: "Cena", food: "Crema de verduras" }] },
              { day: "Jueves", meals: [{ name: "Desayuno", food: "Batido de proteínas" }, { name: "Comida", food: "Arroz con pollo" }, { name: "Cena", food: "Ensalada César" }] },
              { day: "Viernes", meals: [{ name: "Desayuno", food: "Frutas con queso" }, { name: "Comida", food: "Merluza al horno" }, { name: "Cena", food: "Revuelto de champiñones" }] },
              { day: "Sábado", meals: [{ name: "Desayuno", food: "Pancakes de avena" }, { name: "Comida", food: "Paella de verduras" }, { name: "Cena", food: "Gazpacho con tostadas" }] },
              { day: "Domingo", meals: [{ name: "Desayuno", food: "Huevos revueltos" }, { name: "Comida", food: "Cocido tradicional" }, { name: "Cena", food: "Sopa de pollo" }] },
            ]
          }),
        });
      }
      return { seeded: true };
    }),

    // ── Expert self-management (panel propio) ────────────────────────────────────────
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { buddyExperts: beTable } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [row] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
      return row ?? null;
    }),

    createProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(128),
        bio: z.string().optional(),
        specialty: z.string().max(128).optional(),
        avatarUrl: z.string().url().optional(),
        coverUrl: z.string().url().optional(),
        category: z.enum(["perdida_peso","ganancia_muscular","definicion","dieta_equilibrada","rendimiento","bienestar","vegano"]).optional(),
        instagramHandle: z.string().max(64).optional(),
        websiteUrl: z.string().url().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Ya tienes un perfil de experto" });
        const [res] = await drizzleDb.insert(beTable).values({
          userId: ctx.user.id,
          displayName: input.displayName,
          bio: input.bio,
          specialty: input.specialty,
          avatarUrl: input.avatarUrl,
          coverUrl: input.coverUrl,
          category: input.category ?? "dieta_equilibrada",
          instagramHandle: input.instagramHandle,
          websiteUrl: input.websiteUrl,
          verified: false,
          featured: false,
        });
        return { id: (res as any).insertId as number };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(128).optional(),
        bio: z.string().optional(),
        specialty: z.string().max(128).optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        coverUrl: z.string().url().optional().or(z.literal("")),
        category: z.enum(["perdida_peso","ganancia_muscular","definicion","dieta_equilibrada","rendimiento","bienestar","vegano"]).optional(),
        instagramHandle: z.string().max(64).optional(),
        youtubeHandle: z.string().max(64).optional(),
        tiktokHandle: z.string().max(64).optional(),
        priceMonthly: z.number().positive().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const updates: Record<string, any> = {};
        if (input.displayName !== undefined) updates.displayName = input.displayName;
        if (input.bio !== undefined) updates.bio = input.bio;
        if (input.specialty !== undefined) updates.specialty = input.specialty;
        if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;
        if (input.coverUrl !== undefined) updates.coverUrl = input.coverUrl;
        if (input.category !== undefined) updates.category = input.category;
        if (input.instagramHandle !== undefined) updates.instagramHandle = input.instagramHandle;
        if (input.youtubeHandle !== undefined) updates.youtubeHandle = input.youtubeHandle;
        if (input.tiktokHandle !== undefined) updates.tiktokHandle = input.tiktokHandle;
        if (input.priceMonthly !== undefined) updates.priceMonthly = input.priceMonthly;
        await drizzleDb.update(beTable).set(updates).where(eq(beTable.userId, ctx.user.id));
        return { success: true };
      }),

    getMyMenus: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { expertMenus: emTable, buddyExperts: beTable } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
      if (!expert) return [];
      return drizzleDb.select().from(emTable).where(eq(emTable.expertId, expert.id));
    }),

    createMenu: protectedProcedure
      .input(z.object({
        title: z.string().min(2).max(256),
        description: z.string().optional(),
        coverUrl: z.string().url().optional().or(z.literal("")),
        category: z.enum(["perdida_peso","ganancia_muscular","definicion","dieta_equilibrada","rendimiento","bienestar","vegano"]).optional(),
        dailyCalories: z.number().int().positive().optional(),
        isPublic: z.boolean().optional().default(true),
        menuData: z.string().optional(), // JSON string
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertMenus: emTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN", message: "Necesitas un perfil de experto para publicar menús" });
        const [res] = await drizzleDb.insert(emTable).values({
          expertId: expert.id,
          title: input.title,
          description: input.description,
          coverUrl: input.coverUrl,
          category: input.category ?? "dieta_equilibrada",
          dailyCalories: input.dailyCalories,
          isFree: true,
          isPublic: input.isPublic ?? true,
          menuData: input.menuData,
        });
        return { id: (res as any).insertId as number };
      }),

    updateMenu: protectedProcedure
      .input(z.object({
        menuId: z.number().int(),
        title: z.string().min(2).max(256).optional(),
        description: z.string().optional(),
        coverUrl: z.string().url().optional().or(z.literal("")),
        category: z.enum(["perdida_peso","ganancia_muscular","definicion","dieta_equilibrada","rendimiento","bienestar","vegano"]).optional(),
        dailyCalories: z.number().int().positive().optional(),
        isPublic: z.boolean().optional(),
        menuData: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertMenus: emTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        const updates: Record<string, any> = {};
        if (input.title !== undefined) updates.title = input.title;
        if (input.description !== undefined) updates.description = input.description;
        if (input.coverUrl !== undefined) updates.coverUrl = input.coverUrl;
        if (input.category !== undefined) updates.category = input.category;
        if (input.dailyCalories !== undefined) updates.dailyCalories = input.dailyCalories;
        if (input.isPublic !== undefined) updates.isPublic = input.isPublic;
        if (input.menuData !== undefined) updates.menuData = input.menuData;
        await drizzleDb.update(emTable).set(updates).where(and(eq(emTable.id, input.menuId), eq(emTable.expertId, expert.id)));
        return { success: true };
      }),

    deleteMenu: protectedProcedure
      .input(z.object({ menuId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { expertMenus: emTable, buddyExperts: beTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [expert] = await drizzleDb.select().from(beTable).where(eq(beTable.userId, ctx.user.id)).limit(1);
        if (!expert) throw new TRPCError({ code: "FORBIDDEN" });
        await drizzleDb.delete(emTable).where(and(eq(emTable.id, input.menuId), eq(emTable.expertId, expert.id)));
        return { success: true };
      }),
  }),
  // ===========================================================================
  // BUDDY MAKERSS
  // ===========================================================================
  buddyMakers: router({
    list: publicProcedure
      .input(z.object({ featured: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return [];
        const { buddyMakers: bmTable, users: usersTable } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const conditions: any[] = [eq(bmTable.verified, true)];
        if (input?.featured) conditions.push(eq(bmTable.featured, true));
        return drizzleDb
          .select({ maker: bmTable, user: { name: usersTable.name, imageUrl: usersTable.imageUrl } })
          .from(bmTable)
          .leftJoin(usersTable, eq(bmTable.userId, usersTable.id))
          .where(and(...conditions))
          .orderBy(desc(bmTable.followersCount))
          .limit(50);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return null;
        const { buddyMakers: bmTable, users: usersTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await drizzleDb
          .select({ maker: bmTable, user: { name: usersTable.name, imageUrl: usersTable.imageUrl } })
          .from(bmTable)
          .leftJoin(usersTable, eq(bmTable.userId, usersTable.id))
          .where(eq(bmTable.id, input.id))
          .limit(1);
        return rows[0] ?? null;
      }),

    isFollowing: protectedProcedure
      .input(z.object({ makerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) return { following: false };
        const { makerFollowers: mfTable } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const row = await drizzleDb.select().from(mfTable).where(and(eq(mfTable.userId, ctx.user.id), eq(mfTable.makerId, input.makerId))).limit(1);
        return { following: !!row[0] };
      }),

    getFollowing: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { makerFollowers: mfTable, buddyMakers: bmTable } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      return drizzleDb
        .select({ maker: bmTable, followedAt: mfTable.followedAt })
        .from(mfTable)
        .leftJoin(bmTable, eq(mfTable.makerId, bmTable.id))
        .where(eq(mfTable.userId, ctx.user.id))
        .orderBy(desc(mfTable.followedAt))
        .limit(50);
    }),

    follow: protectedProcedure
      .input(z.object({ makerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { makerFollowers: mfTable, buddyMakers: bmTable } = await import("../drizzle/schema");
        const { eq, sql, and } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(mfTable).where(and(eq(mfTable.userId, ctx.user.id), eq(mfTable.makerId, input.makerId))).limit(1);
        if (existing[0]) {
          await drizzleDb.delete(mfTable).where(and(eq(mfTable.userId, ctx.user.id), eq(mfTable.makerId, input.makerId)));
          await drizzleDb.update(bmTable).set({ followersCount: sql`${bmTable.followersCount} - 1` }).where(eq(bmTable.id, input.makerId));
          return { following: false };
        }
        await drizzleDb.insert(mfTable).values({ userId: ctx.user.id, makerId: input.makerId });
        await drizzleDb.update(bmTable).set({ followersCount: sql`${bmTable.followersCount} + 1` }).where(eq(bmTable.id, input.makerId));
        return { following: true };
      }),

    // -- Maker self-management (panel propio) --
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;
      const { buddyMakers: bmSelf } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [row] = await drizzleDb.select().from(bmSelf).where(eq(bmSelf.userId, ctx.user.id)).limit(1);
      return row ?? null;
    }),

    createProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(128),
        bio: z.string().optional(),
        specialty: z.string().max(128).optional(),
        avatarUrl: z.string().url().optional(),
        coverUrl: z.string().url().optional(),
        instagramHandle: z.string().max(64).optional(),
        youtubeHandle: z.string().max(64).optional(),
        tiktokHandle: z.string().max(64).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyMakers: bmSelf } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const existing = await drizzleDb.select().from(bmSelf).where(eq(bmSelf.userId, ctx.user.id)).limit(1);
        if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Ya tienes un perfil de creador" });
        const [res] = await drizzleDb.insert(bmSelf).values({
          userId: ctx.user.id,
          displayName: input.displayName,
          bio: input.bio,
          specialty: input.specialty,
          avatarUrl: input.avatarUrl,
          coverUrl: input.coverUrl,
          instagramHandle: input.instagramHandle,
          youtubeHandle: input.youtubeHandle,
          tiktokHandle: input.tiktokHandle,
          verified: false,
          featured: false,
        });
        return { id: (res as any).insertId as number };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(128).optional(),
        bio: z.string().optional(),
        specialty: z.string().max(128).optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        coverUrl: z.string().url().optional().or(z.literal("")),
        instagramHandle: z.string().max(64).optional(),
        youtubeHandle: z.string().max(64).optional(),
        tiktokHandle: z.string().max(64).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { buddyMakers: bmSelf } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const updates: Record<string, any> = {};
        if (input.displayName !== undefined) updates.displayName = input.displayName;
        if (input.bio !== undefined) updates.bio = input.bio;
        if (input.specialty !== undefined) updates.specialty = input.specialty;
        if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;
        if (input.coverUrl !== undefined) updates.coverUrl = input.coverUrl;
        if (input.instagramHandle !== undefined) updates.instagramHandle = input.instagramHandle;
        if (input.youtubeHandle !== undefined) updates.youtubeHandle = input.youtubeHandle;
        if (input.tiktokHandle !== undefined) updates.tiktokHandle = input.tiktokHandle;
        await drizzleDb.update(bmSelf).set(updates).where(eq(bmSelf.userId, ctx.user.id));
        return { success: true };
      }),

    getMyRecipes: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const { recipes: rSelf, buddyMakers: bmSelf } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [maker] = await drizzleDb.select().from(bmSelf).where(eq(bmSelf.userId, ctx.user.id)).limit(1);
      if (!maker) return [];
      return drizzleDb.select().from(rSelf).where(eq(rSelf.buddyMakerId, maker.id));
    }),

    createRecipe: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(256),
        description: z.string().optional(),
        imageUrl: z.string().url().optional().or(z.literal("")),
        prepTime: z.number().int().positive().optional(),
        cookTime: z.number().int().positive().optional(),
        servings: z.number().int().positive().optional(),
        calories: z.number().int().positive().optional(),
        protein: z.number().nonnegative().optional(),
        carbs: z.number().nonnegative().optional(),
        fat: z.number().nonnegative().optional(),
        mealTime: z.enum(["desayuno","media_manana","comida","merienda","cena","cualquiera"]).optional(),
        cookingMethod: z.string().optional(),
        cuisineType: z.string().optional(),
        difficulty: z.enum(["easy","medium","hard"]).optional(),
        ingredientsJson: z.string().optional(),
        instructionsJson: z.string().optional(),
        allergens: z.string().optional(),
        tags: z.string().optional(),
        isPublic: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { recipes: rSelf, buddyMakers: bmSelf } = await import("../drizzle/schema");
        const { eq, sql: sqlFn } = await import("drizzle-orm");
        const [maker] = await drizzleDb.select().from(bmSelf).where(eq(bmSelf.userId, ctx.user.id)).limit(1);
        if (!maker) throw new TRPCError({ code: "FORBIDDEN", message: "Necesitas un perfil de BuddyMaker para publicar recetas" });
        const [res] = await drizzleDb.insert(rSelf).values({
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          preparationTime: input.prepTime,
          cookTime: input.cookTime,
          servings: input.servings ?? 2,
          caloriesPerServing: input.calories,
          proteinsPerServing: input.protein,
          carbsPerServing: input.carbs,
          fatsPerServing: input.fat,
          mealTime: input.mealTime,
          cookingMethod: input.cookingMethod,
          cuisineType: input.cuisineType,
          difficulty: input.difficulty ?? "medium",
          ingredientsJson: input.ingredientsJson,
          instructionsJson: input.instructionsJson,
          allergens: input.allergens,
          tags: input.tags,
          isPublic: input.isPublic ?? true,
          buddyMakerId: maker.id,
          isSeeded: false,
          userId: ctx.user.id,
        });
        await drizzleDb.update(bmSelf).set({ recipesCount: sqlFn`${bmSelf.recipesCount} + 1` }).where(eq(bmSelf.id, maker.id));
        return { id: (res as any).insertId as number };
      }),

    updateRecipe: protectedProcedure
      .input(z.object({
        recipeId: z.number().int(),
        name: z.string().min(2).max(256).optional(),
        description: z.string().optional(),
        imageUrl: z.string().url().optional().or(z.literal("")),
        prepTime: z.number().int().positive().optional(),
        cookTime: z.number().int().positive().optional(),
        servings: z.number().int().positive().optional(),
        calories: z.number().int().positive().optional(),
        protein: z.number().nonnegative().optional(),
        carbs: z.number().nonnegative().optional(),
        fat: z.number().nonnegative().optional(),
        mealTime: z.enum(["desayuno","media_manana","comida","merienda","cena","cualquiera"]).optional(),
        cookingMethod: z.string().optional(),
        cuisineType: z.string().optional(),
        difficulty: z.enum(["easy","medium","hard"]).optional(),
        ingredientsJson: z.string().optional(),
        instructionsJson: z.string().optional(),
        allergens: z.string().optional(),
        tags: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { recipes: rSelf, buddyMakers: bmSelf } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [maker] = await drizzleDb.select().from(bmSelf).where(eq(bmSelf.userId, ctx.user.id)).limit(1);
        if (!maker) throw new TRPCError({ code: "FORBIDDEN" });
        const updates: Record<string, any> = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.description !== undefined) updates.description = input.description;
        if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl;
        if (input.prepTime !== undefined) updates.preparationTime = input.prepTime;
        if (input.cookTime !== undefined) updates.cookTime = input.cookTime;
        if (input.servings !== undefined) updates.servings = input.servings;
        if (input.calories !== undefined) updates.caloriesPerServing = input.calories;
        if (input.protein !== undefined) updates.proteinsPerServing = input.protein;
        if (input.carbs !== undefined) updates.carbsPerServing = input.carbs;
        if (input.fat !== undefined) updates.fatsPerServing = input.fat;
        if (input.mealTime !== undefined) updates.mealTime = input.mealTime;
        if (input.cookingMethod !== undefined) updates.cookingMethod = input.cookingMethod;
        if (input.cuisineType !== undefined) updates.cuisineType = input.cuisineType;
        if (input.difficulty !== undefined) updates.difficulty = input.difficulty;
        if (input.ingredientsJson !== undefined) updates.ingredientsJson = input.ingredientsJson;
        if (input.instructionsJson !== undefined) updates.instructionsJson = input.instructionsJson;
        if (input.allergens !== undefined) updates.allergens = input.allergens;
        if (input.tags !== undefined) updates.tags = input.tags;
        if (input.isPublic !== undefined) updates.isPublic = input.isPublic;
        await drizzleDb.update(rSelf).set(updates).where(and(eq(rSelf.id, input.recipeId), eq(rSelf.buddyMakerId, maker.id)));
        return { success: true };
      }),

    deleteRecipe: protectedProcedure
      .input(z.object({ recipeId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { recipes: rSelf, buddyMakers: bmSelf } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [maker] = await drizzleDb.select().from(bmSelf).where(eq(bmSelf.userId, ctx.user.id)).limit(1);
        if (!maker) throw new TRPCError({ code: "FORBIDDEN" });
        await drizzleDb.delete(rSelf).where(and(eq(rSelf.id, input.recipeId), eq(rSelf.buddyMakerId, maker.id)));
        return { success: true };
      }),
  }),

  // ===========================================================================
  // STRIPE CONNECT — Onboarding y comisiones para creadores
  // ===========================================================================
  stripeConnect: router({
    getOnboardingLink: protectedProcedure
      .input(z.object({ creatorType: z.enum(["buddyexpert", "buddymaker"]) }))
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const account = await stripe.accounts.create({
          type: "express",
          email: ctx.user.email ?? undefined,
          capabilities: { transfers: { requested: true } },
          metadata: { userId: ctx.user.id.toString(), creatorType: input.creatorType },
        });
        const drizzleDb = await db.getDb();
        if (drizzleDb) {
          const { buddyExperts: beTable, buddyMakers: bmTable } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          if (input.creatorType === "buddyexpert") {
            await drizzleDb.update(beTable).set({ stripeAccountId: account.id }).where(eq(beTable.userId, ctx.user.id));
          } else {
            await drizzleDb.update(bmTable).set({ stripeAccountId: account.id }).where(eq(bmTable.userId, ctx.user.id));
          }
        }
        const origin = (ctx.req.headers.origin as string) || "https://buddymarket-ndjzmo7p.manus.space";
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${origin}/creator/onboarding?refresh=true`,
          return_url: `${origin}/creator/onboarding?success=true`,
          type: "account_onboarding",
        });
        return { url: accountLink.url, accountId: account.id };
      }),

     getEarnings: protectedProcedure.query(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return { earnings: [], totalPaid: 0, totalPending: 0 };
      const { creatorEarnings: ceTable } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const earnings = await drizzleDb.select().from(ceTable).where(eq(ceTable.creatorUserId, ctx.user.id)).orderBy(desc(ceTable.createdAt)).limit(50);
      const totalPaid = earnings.filter((e) => e.status === "paid").reduce((acc: number, e) => acc + (e.commissionAmount ?? 0), 0);
      const totalPending = earnings.filter((e) => e.status === "pending").reduce((acc: number, e) => acc + (e.commissionAmount ?? 0), 0);
      return { earnings, totalPaid, totalPending };
    }),
  }),

  // ===========================================================================
  // BUDDY IA — Asistente nutricional con IA
  // ===========================================================================
  buddyIA: router({
    chat: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          ),
          userProfile: z
            .object({
              goal: z.string().optional(),
              calories: z.number().optional(),
              restrictions: z.array(z.string()).optional(),
            })
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const systemPrompt = `Eres BuddyIA, el asistente nutricional inteligente de BuddyMarket. Eres un experto en nutrición, dietética y alimentación saludable. Tu objetivo es ayudar a los usuarios a:
- Crear menús semanales personalizados
- Calcular calorías y macronutrientes
- Sugerir recetas saludables y deliciosas
- Resolver dudas sobre nutrición y dieta
- Adaptar la alimentación a sus objetivos (pérdida de peso, ganancia muscular, etc.)

Siempre responde en español, de forma amigable, clara y motivadora. Usa emojis ocasionalmente para hacer las respuestas más visuales. Cuando sugiereas menús o recetas, incluye información nutricional aproximada (calorías, proteínas, carbohidratos, grasas).

IMPORTANTE: No eres un médico. Siempre recomienda consultar con un profesional de la salud para condiciones médicas específicas.${input.userProfile ? `

Perfil del usuario:
- Objetivo: ${input.userProfile.goal || "no especificado"}
- Calorías diarias objetivo: ${input.userProfile.calories || "no especificado"}
- Restricciones alimentarias: ${input.userProfile.restrictions?.join(", ") || "ninguna"}` : ""}`;

        const messagesWithSystem = [
          { role: "system" as const, content: systemPrompt },
          ...input.messages,
        ];

        try {
          const response = await invokeLLM({ messages: messagesWithSystem });
          const content = response.choices?.[0]?.message?.content ?? "Lo siento, no pude procesar tu consulta en este momento. Por favor, inténtalo de nuevo.";
          return { content };
        } catch (err: any) {
          console.error("[BuddyIA] Error calling LLM:", err?.message || err);
          // Return a friendly fallback instead of throwing
          return {
            content: "Lo siento, estoy teniendo dificultades para conectarme en este momento. Por favor, inténtalo de nuevo en unos segundos. Si el problema persiste, revisa tu conexión a internet. 🤖",
          };
        }
      }),

    generateWeeklyMenu: publicProcedure
      .input(
        z.object({
          calories: z.number().min(1000).max(5000),
          goal: z.enum(["perdida_peso", "ganancia_muscular", "mantenimiento", "definicion"]),
          restrictions: z.array(z.string()).optional(),
          preferences: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const goalLabels: Record<string, string> = {
          perdida_peso: "pérdida de peso",
          ganancia_muscular: "ganancia muscular",
          mantenimiento: "mantenimiento",
          definicion: "definición corporal",
        };
        const prompt = `Crea un menú semanal completo (7 días) para un objetivo de ${goalLabels[input.goal]} con ${input.calories} kcal/día.${input.restrictions?.length ? ` Restricciones: ${input.restrictions.join(", ")}.` : ""}${input.preferences ? ` Preferencias: ${input.preferences}.` : ""}

Formato JSON estricto:
{
  "days": [
    {
      "day": "Lunes",
      "totalCalories": 2000,
      "meals": [
        { "name": "Desayuno", "food": "descripción del desayuno", "calories": 400, "protein": 20, "carbs": 50, "fat": 10 },
        { "name": "Media mañana", "food": "descripción", "calories": 200, "protein": 10, "carbs": 25, "fat": 5 },
        { "name": "Comida", "food": "descripción", "calories": 700, "protein": 40, "carbs": 80, "fat": 20 },
        { "name": "Merienda", "food": "descripción", "calories": 200, "protein": 10, "carbs": 25, "fat": 5 },
        { "name": "Cena", "food": "descripción", "calories": 500, "protein": 35, "carbs": 50, "fat": 15 }
      ]
    }
  ]
}`;

        try {
          const response = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          const rawContent = response.choices?.[0]?.message?.content ?? "{}";
          const content = typeof rawContent === "string" ? rawContent : "{}";
          return { menu: JSON.parse(content) };
        } catch (err: any) {
          console.error("[BuddyIA] generateWeeklyMenu error:", err?.message || err);
          return { menu: null, error: "Error al generar el menú. El servicio de IA no está disponible en este momento. Inténtalo de nuevo." };
        }
      }),

    // New: generate menu from full questionnaire answers
    generateMenuWithQuestionnaire: protectedProcedure
      .input(
        z.object({
          startDate: z.string(), // ISO date string YYYY-MM-DD
          cookingStyle: z.enum(["batch_cooking", "tuppers", "rapido", "trabajo", "restaurante", "mixto"]),
          persons: z.number().min(1).max(20),
          mealsPerDay: z.number().min(2).max(6),
          goal: z.enum(["perdida_peso", "ganancia_muscular", "tonificacion", "perdida_grasa", "mantenimiento", "definicion", "salud"]),
          calories: z.number().min(1000).max(5000).optional(),
          restrictions: z.array(z.string()).optional(),
          preferences: z.string().optional(),
          daysCount: z.number().min(1).max(7).default(7),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const goalLabels: Record<string, string> = {
          perdida_peso: "pérdida de peso",
          ganancia_muscular: "ganancia muscular",
          tonificacion: "tonificación",
          perdida_grasa: "pérdida de grasa",
          mantenimiento: "mantenimiento",
          definicion: "definición corporal",
          salud: "salud y bienestar",
        };
        const cookingStyleLabels: Record<string, string> = {
          batch_cooking: "batch cooking (cocinar todo el domingo para la semana)",
          tuppers: "preparar tuppers para llevar al trabajo",
          rapido: "recetas rápidas de menos de 20 minutos",
          trabajo: "comidas para llevar al trabajo",
          restaurante: "comidas en restaurante o fuera de casa",
          mixto: "combinación de cocina en casa y fuera",
        };

        const mealNames = [
          "Desayuno",
          input.mealsPerDay >= 3 ? "Media mañana" : null,
          "Comida",
          input.mealsPerDay >= 4 ? "Merienda" : null,
          "Cena",
          input.mealsPerDay >= 6 ? "Recena" : null,
        ].filter(Boolean) as string[];

        const targetCalories = input.calories || (input.goal === "perdida_peso" || input.goal === "perdida_grasa" ? 1600 : input.goal === "ganancia_muscular" ? 2800 : 2000);

        const prompt = `Eres un nutricionista experto. Crea un menú semanal personalizado de ${input.daysCount} días.

Perfil del usuario:
- Objetivo: ${goalLabels[input.goal]}
- Estilo de cocina: ${cookingStyleLabels[input.cookingStyle]}
- Número de personas: ${input.persons}
- Comidas al día: ${input.mealsPerDay} (${mealNames.join(", ")})
- Calorías objetivo: ${targetCalories} kcal/día por persona
${input.restrictions?.length ? `- Restricciones/alergias: ${input.restrictions.join(", ")}` : ""}
${input.preferences ? `- Preferencias adicionales: ${input.preferences}` : ""}

IMPORTANTE para el estilo "${cookingStyleLabels[input.cookingStyle]}":
${input.cookingStyle === "batch_cooking" ? "- Agrupa ingredientes para cocinar en grandes cantidades el domingo\n- Reutiliza preparaciones base durante la semana (arroz, legumbres, proteínas)" : ""}
${input.cookingStyle === "tuppers" ? "- Todas las comidas deben ser aptas para tupper y microondas\n- Evita ensaladas que se pongan malas, prioriza guisos y platos calientes" : ""}
${input.cookingStyle === "rapido" ? "- Tiempo máximo de preparación: 20 minutos\n- Usa ingredientes fáciles de encontrar y preparar" : ""}

Devuelve SOLO JSON válido con esta estructura exacta:
{
  "menuName": "nombre descriptivo del menú",
  "targetCalories": ${targetCalories},
  "persons": ${input.persons},
  "cookingTips": "consejo rápido sobre este estilo de cocina",
  "shoppingListSummary": "resumen de los ingredientes principales a comprar",
  "days": [
    {
      "day": "Lunes",
      "date": "${input.startDate}",
      "totalCalories": ${targetCalories},
      "meals": [
        ${mealNames.map(m => `{ "name": "${m}", "food": "descripción detallada del plato", "calories": 400, "protein": 20, "carbs": 50, "fat": 10, "prepTime": "15 min", "ingredients": ["ingrediente 1 - cantidad", "ingrediente 2 - cantidad"] }`).join(",\n        ")}
      ]
    }
  ]
}`;

        try {
          const response = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          const rawContent = response.choices?.[0]?.message?.content ?? "{}";
          const content = typeof rawContent === "string" ? rawContent : "{}";
          const menu = JSON.parse(content);
          return { menu, userId: ctx.user.id };
        } catch (err: any) {
          console.error("[BuddyIA] generateMenuWithQuestionnaire error:", err?.message || err);
          return { menu: null, error: "Error al generar el menú. El servicio de IA no está disponible en este momento. Inténtalo de nuevo en unos segundos." };
        }
      }),

    // Save a generated menu to the planner
    saveGeneratedMenu: protectedProcedure
      .input(
        z.object({
          menuName: z.string(),
          startDate: z.string(),
          goal: z.string(),
          persons: z.number().min(1).max(20),
          targetCalories: z.number(),
          days: z.array(
            z.object({
              day: z.string(),
              date: z.string().optional(),
              totalCalories: z.number().optional(),
              meals: z.array(
                z.object({
                  name: z.string(),
                  food: z.string(),
                  calories: z.number().optional(),
                  protein: z.number().optional(),
                  carbs: z.number().optional(),
                  fat: z.number().optional(),
                  prepTime: z.string().optional(),
                  ingredients: z.array(z.string()).optional(),
                })
              ),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const drizzleDb = await db.getDb();
        const { menuOrganizers, menuOrganizerDayParts, dayParts } = await import("../drizzle/schema.js");

        if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

        // Get day parts
        const allDayParts = await drizzleDb.select().from(dayParts);
        const dayPartMap: Record<string, number> = {};
        for (const dp of allDayParts) {
          dayPartMap[dp.nameEs.toLowerCase()] = dp.id;
          dayPartMap[dp.apiParam.toLowerCase()] = dp.id;
        }

        const startDateObj = new Date(input.startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(endDateObj.getDate() + input.days.length - 1);

        // Create menu organizer
        const [menu] = await drizzleDb.insert(menuOrganizers).values({
          userId: ctx.user.id,
          name: input.menuName,
          startDate: startDateObj,
          endDate: endDateObj,
          goal: input.goal,
          dailyCalories: input.targetCalories,
          persons: input.persons,
          isSeeded: false,
        } as any).$returningId();

        const menuId = menu.id;

        // Insert day parts and meals
        for (const dayData of input.days) {
          for (const meal of dayData.meals) {
            const dpId = dayPartMap[meal.name.toLowerCase()] || dayPartMap["comida"] || allDayParts[0]?.id;
            if (!dpId) continue;

            await drizzleDb.insert(menuOrganizerDayParts).values({
              menuOrganizerId: menuId,
              dayPartId: dpId,
              date: new Date(dayData.date || input.startDate),
              notes: meal.food,
            } as any);
          }
        }

        return { menuId, success: true };
      }),
  }),

  // ---------------------------------------------------------------------------
  // EVENTS - Asistente de menús para eventos especiales
  // ---------------------------------------------------------------------------
  events: router({
    generateMenu: protectedProcedure
      .input(z.object({
        eventType: z.string(),
        eventName: z.string().optional(),
        persons: z.number().min(1).max(500),
        hasChildren: z.boolean().optional(),
        intolerances: z.array(z.string()).optional(),
        servesAlcohol: z.boolean().optional(),
        alcoholTypes: z.array(z.string()).optional(),
        courses: z.object({
          aperitivo: z.boolean().optional(),
          primero: z.boolean().optional(),
          segundo: z.boolean().optional(),
          postre: z.boolean().optional(),
          cafe: z.boolean().optional(),
        }).optional(),
        cuisineStyle: z.string().optional(),
        budget: z.string().optional(),
        season: z.string().optional(),
        extraNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const eventLabels: Record<string, string> = {
          cena_amigos: "Cena con amigos en casa",
          barbacoa: "Barbacoa",
          navidad: "Cena/Comida de Navidad",
          cumpleanos: "Cumpleaños",
          brunch: "Brunch dominical",
          aperitivo: "Aperitivo/Vermut",
          cena_romantica: "Cena romántica",
          fin_de_ano: "Cena de Fin de Año",
          reyes: "Comida de Reyes",
          semana_santa: "Semana Santa",
          otro: input.eventName || "Evento especial",
        };

        const eventLabel = eventLabels[input.eventType] || input.eventName || input.eventType;
        const courses = input.courses || { aperitivo: true, primero: true, segundo: true, postre: true };
        const courseList = Object.entries(courses)
          .filter(([, v]) => v)
          .map(([k]) => ({
            aperitivo: "Aperitivo",
            primero: "Primer plato",
            segundo: "Segundo plato",
            postre: "Postre",
            cafe: "Café y petit fours",
          }[k] || k))
          .join(", ");

        const systemPrompt = `Eres un chef experto y anfitrión profesional español. Creas menús completos, deliciosos y prácticos para eventos especiales. Siempre respondes con JSON válido y bien estructurado. Tus menús son creativos, adaptados a la temporada y al número de comensales, con consejos útiles para el anfitrión.`;

        const userPrompt = `Crea un menú completo para:

**Evento:** ${eventLabel}
**Personas:** ${input.persons}${input.hasChildren ? " (incluyendo niños)" : ""}
**Intolerancias/alergias:** ${input.intolerances?.length ? input.intolerances.join(", ") : "Ninguna"}
**Alcohol:** ${input.servesAlcohol ? `Sí (${input.alcoholTypes?.join(", ") || "a elección"})` : "No"}
**Platos:** ${courseList}
${input.cuisineStyle ? `**Estilo:** ${input.cuisineStyle}` : ""}
${input.budget ? `**Presupuesto:** ${input.budget}` : ""}
${input.season ? `**Temporada:** ${input.season}` : ""}
${input.extraNotes ? `**Notas:** ${input.extraNotes}` : ""}

Devuelve EXACTAMENTE este JSON:
{
  "eventTitle": "Título del menú",
  "intro": "Descripción del menú y estilo (2-3 frases)",
  "timeline": "Horario sugerido del evento",
  "courses": [
    {
      "name": "Aperitivo",
      "emoji": "🥂",
      "description": "Descripción breve del momento",
      "dishes": [
        {
          "name": "Nombre del plato",
          "description": "Descripción apetitosa",
          "servingTip": "Consejo de presentación",
          "prepTime": "20 min",
          "canPrepAhead": true,
          "difficulty": "Fácil",
          "ingredients": ["Ingrediente 1 (cantidad para ${input.persons} personas)"],
          "steps": ["Paso 1", "Paso 2"]
        }
      ]
    }
  ],
  "drinks": {
    "nonAlcoholic": ["Agua con gas", "Limonada"],
    "alcoholic": ${input.servesAlcohol ? '["Vino blanco fresco", "Cava brut"]' : "null"}
  },
  "shoppingList": [
    { "category": "Carnes y pescados", "items": ["Producto (cantidad total)"] },
    { "category": "Verduras y frutas", "items": [] },
    { "category": "Lácteos y huevos", "items": [] },
    { "category": "Despensa y conservas", "items": [] },
    { "category": "Pan y repostería", "items": [] }
  ],
  "hostingTips": ["Consejo 1 para ser un anfitrión 10", "Consejo 2", "Consejo 3", "Consejo 4"],
  "estimatedBudget": "Estimación del coste total",
  "prepSchedule": [
    { "when": "2 días antes", "tasks": ["Tarea 1", "Tarea 2"] },
    { "when": "El día anterior", "tasks": ["Tarea 1"] },
    { "when": "El mismo día", "tasks": ["Tarea 1", "Tarea 2"] }
  ]
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        });

        const content = String(response.choices[0]?.message?.content || "{}");
        try {
          return JSON.parse(content) as Record<string, unknown>;
        } catch {
          return { error: "No se pudo generar el menú. Inténtalo de nuevo.", raw: content };
        }
      }),
  }),

  // ─── Saved Events ────────────────────────────────────────────────────────────
  savedEvents: router({
    save: protectedProcedure
      .input(z.object({
        eventType: z.string(),
        eventName: z.string(),
        persons: z.number().int().min(1).default(4),
        categories: z.string().optional(),
        menuData: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { savedEvents } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        await drizzleDb!.insert(savedEvents).values({
          userId: ctx.user.id,
          eventType: input.eventType,
          eventName: input.eventName,
          persons: input.persons,
          categories: input.categories,
          menuData: input.menuData,
        });
        return { success: true };
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const { savedEvents } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, desc } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        const rows = await drizzleDb!
          .select()
          .from(savedEvents)
          .where(eq(savedEvents.userId, ctx.user.id))
          .orderBy(desc(savedEvents.createdAt));
        return rows;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const { savedEvents } = await import("../drizzle/schema");
        const { getDb } = await import("./db");
        const { eq, and } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        await drizzleDb!
          .delete(savedEvents)
          .where(and(eq(savedEvents.id, input.id), eq(savedEvents.userId, ctx.user.id)));
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
