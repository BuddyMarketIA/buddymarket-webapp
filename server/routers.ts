import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { createCheckoutSession } from "./stripe-webhook";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
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
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(({ input }) => db.getRecipes(input)),

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
        if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error generando receta con IA" });
        return JSON.parse(content);
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
  }),

  // ---------------------------------------------------------------------------
  // INVENTORY
  // ---------------------------------------------------------------------------
  inventory: router({
    list: protectedProcedure.query(({ ctx }) => db.getInventoryItems(ctx.user.id)),

    add: protectedProcedure
      .input(
        z.object({
          ingredientId: z.number().optional(),
          customName: z.string().optional(),
          amount: z.number(),
          measureId: z.number().optional(),
          storageLocationId: z.number().optional(),
          expirationDate: z.string().optional(),
          purchaseDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => db.addInventoryItem({ ...input, userId: ctx.user.id } as any)),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          amount: z.number().optional(),
          expirationDate: z.string().optional(),
          storageLocationId: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateInventoryItem(id, data as any);
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteInventoryItem(input.id)),
  }),

  // ---------------------------------------------------------------------------
  // MEAL LOGS
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
          customMealName: z.string().optional(),
          dayPartId: z.number().optional(),
          logDate: z.string(),
          servings: z.number().optional(),
          calories: z.number().optional(),
          proteins: z.number().optional(),
          carbohydrates: z.number().optional(),
          fats: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => db.addMealLog({ ...input, userId: ctx.user.id, logDate: new Date(input.logDate) } as any)),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteMealLog(input.id)),
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
    // Get all top-level categories
    categories: publicProcedure.query(async () => {
      const res = await fetch(
        "https://tienda.mercadona.es/api/v1_1/categories/?wh=mad1&lang=es",
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; BuddyMarket/1.0)" } }
      );
      if (!res.ok) throw new Error("Mercadona API error");
      const data = await res.json() as { results: any[] };
      return data.results as Array<{
        id: number;
        name: string;
        categories: Array<{ id: number; name: string }>;
      }>;
    }),

    // Get products from a subcategory
    productsByCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        const res = await fetch(
          `https://tienda.mercadona.es/api/v1_1/categories/${input.categoryId}/?wh=mad1&lang=es`,
          { headers: { "User-Agent": "Mozilla/5.0 (compatible; BuddyMarket/1.0)" } }
        );
        if (!res.ok) throw new Error("Mercadona API error");
        const data = await res.json() as any;
        // Flatten all products from all subcategories
        const products: any[] = [];
        const subcats = data.categories || [];
        for (const subcat of subcats) {
          for (const p of subcat.products || []) {
            products.push({
              id: p.id,
              name: p.display_name,
              brand: p.brand,
              price: p.price_instructions?.unit_price ?? 0,
              priceStr: p.price_instructions?.unit_price
                ? `${p.price_instructions.unit_price}€`
                : "—",
              unit: p.price_instructions?.reference_format ?? "",
              thumbnail: p.photos?.[0]?.thumbnail ?? "",
              subcategory: subcat.name,
            });
          }
        }
        return products;
      }),

    // Get a single product by ID
    product: publicProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        const res = await fetch(
          `https://tienda.mercadona.es/api/v1_1/products/${input.productId}/?wh=mad1&lang=es`,
          { headers: { "User-Agent": "Mozilla/5.0 (compatible; BuddyMarket/1.0)" } }
        );
        if (!res.ok) throw new Error("Mercadona API error");
        return res.json();
      }),

    // Search products by keyword across all categories (AI-assisted matching)
    searchProducts: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        // Fetch all categories and search through subcategory names
        const catRes = await fetch(
          "https://tienda.mercadona.es/api/v1_1/categories/?wh=mad1&lang=es",
          { headers: { "User-Agent": "Mozilla/5.0 (compatible; BuddyMarket/1.0)" } }
        );
        if (!catRes.ok) throw new Error("Mercadona API error");
        const catData = await catRes.json() as { results: any[] };
        const query = input.query.toLowerCase();

        // Find matching subcategories
        const matchingSubcatIds: number[] = [];
        for (const cat of catData.results) {
          for (const sub of cat.categories || []) {
            if (sub.name.toLowerCase().includes(query) || cat.name.toLowerCase().includes(query)) {
              matchingSubcatIds.push(sub.id);
            }
          }
        }

        // Fetch products from up to 3 matching subcategories
        const results: any[] = [];
        const toFetch = matchingSubcatIds.slice(0, 3);
        await Promise.all(
          toFetch.map(async (id) => {
            const r = await fetch(
              `https://tienda.mercadona.es/api/v1_1/categories/${id}/?wh=mad1&lang=es`,
              { headers: { "User-Agent": "Mozilla/5.0 (compatible; BuddyMarket/1.0)" } }
            );
            if (!r.ok) return;
            const d = await r.json() as any;
            for (const subcat of d.categories || []) {
              for (const p of subcat.products || []) {
                const name = (p.display_name || "").toLowerCase();
                if (name.includes(query) || subcat.name.toLowerCase().includes(query)) {
                  results.push({
                    id: p.id,
                    name: p.display_name,
                    brand: p.brand,
                    price: p.price_instructions?.unit_price ?? 0,
                    priceStr: p.price_instructions?.unit_price
                      ? `${p.price_instructions.unit_price}€`
                      : "—",
                    unit: p.price_instructions?.reference_format ?? "",
                    thumbnail: p.photos?.[0]?.thumbnail ?? "",
                    subcategory: subcat.name,
                  });
                }
              }
            }
          })
        );
        return results.slice(0, 30);
      }),
  }),
});

export type AppRouter = typeof appRouter;
