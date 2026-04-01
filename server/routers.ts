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
  }),

  // ===========================================================================
  // BUDDY MAKERS
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

        const response = await invokeLLM({ messages: messagesWithSystem });
        const content = response.choices?.[0]?.message?.content ?? "Lo siento, no pude procesar tu consulta. Inténtalo de nuevo.";
        return { content };
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

        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });
        const rawContent = response.choices?.[0]?.message?.content ?? "{}";
        const content = typeof rawContent === "string" ? rawContent : "{}";
        try {
          return { menu: JSON.parse(content) };
        } catch {
          return { menu: null, error: "Error al generar el menú" };
        }
      }),
  }),
});
export type AppRouter = typeof appRouter;
