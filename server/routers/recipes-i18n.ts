/**
 * Router tRPC para recetas con soporte multiidioma
 * Obtiene recetas con contenido traducido al idioma del usuario
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { recipes, recipeIngredients, ingredients } from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import type { LanguageCode } from "../../client/src/lib/i18n";
import {
  getLocalizedRecipe,
  getRecipeName,
  getRecipeDescription,
  getRecipeIngredients,
  getRecipeInstructions,
  getLocalizedCategory,
  getLocalizedDifficulty,
} from "../i18n-helpers";

export const recipesI18nRouter = router({
  /**
   * Obtiene una receta individual con contenido en el idioma especificado
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.number(),
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, input.id),
      });

      if (!recipe) {
        return null;
      }

      return getLocalizedRecipe(recipe, input.language);
    }),

  /**
   * Obtiene todas las recetas activas con contenido en el idioma especificado
   */
  getAll: publicProcedure
    .input(
      z.object({
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
        limit: z.number().default(50).max(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const allRecipes = await db.query.recipes.findMany({
        where: eq(recipes.active, true),
        limit: input.limit,
        offset: input.offset,
        orderBy: desc(recipes.createdAt),
      });

      return allRecipes.map((recipe) => getLocalizedRecipe(recipe, input.language));
    }),

  /**
   * Busca recetas por nombre en el idioma especificado
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
        limit: z.number().default(20).max(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const searchTerm = `%${input.query.toLowerCase()}%`;

      // Buscar en el nombre principal (que es en español por defecto)
      const foundRecipes = await db.query.recipes.findMany({
        where: and(eq(recipes.active, true)),
        limit: input.limit,
      });

      // Filtrar por coincidencia de nombre (búsqueda simple en memoria)
      const filtered = foundRecipes.filter((recipe) => {
        const name = getRecipeName(recipe, input.language).toLowerCase();
        return name.includes(input.query.toLowerCase());
      });

      return filtered.map((recipe) => getLocalizedRecipe(recipe, input.language));
    }),

  /**
   * Obtiene recetas por categoría
   */
  getByCategory: publicProcedure
    .input(
      z.object({
        category: z.string(),
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
        limit: z.number().default(20).max(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const categoryRecipes = await db.query.recipes.findMany({
        where: and(eq(recipes.active, true), eq(recipes.category, input.category)),
        limit: input.limit,
        orderBy: desc(recipes.createdAt),
      });

      return categoryRecipes.map((recipe) => getLocalizedRecipe(recipe, input.language));
    }),

  /**
   * Obtiene recetas por dificultad
   */
  getByDifficulty: publicProcedure
    .input(
      z.object({
        difficulty: z.enum(["easy", "medium", "hard"]),
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
        limit: z.number().default(20).max(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const difficultyRecipes = await db.query.recipes.findMany({
        where: and(eq(recipes.active, true), eq(recipes.difficulty, input.difficulty)),
        limit: input.limit,
        orderBy: desc(recipes.createdAt),
      });

      return difficultyRecipes.map((recipe) => getLocalizedRecipe(recipe, input.language));
    }),

  /**
   * Obtiene recetas por tipo de comida (desayuno, almuerzo, cena, etc.)
   */
  getByMealTime: publicProcedure
    .input(
      z.object({
        mealTime: z.string(),
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
        limit: z.number().default(20).max(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const mealTimeRecipes = await db.query.recipes.findMany({
        where: and(eq(recipes.active, true), eq(recipes.mealTime, input.mealTime as any)),
        limit: input.limit,
        orderBy: desc(recipes.createdAt),
      });

      return mealTimeRecipes.map((recipe) => getLocalizedRecipe(recipe, input.language));
    }),

  /**
   * Obtiene recetas veganas/vegetarianas
   */
  getVeganRecipes: publicProcedure
    .input(
      z.object({
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
        limit: z.number().default(20).max(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      // Buscar recetas con "vegano" en la categoría o tags
      const veganRecipes = await db.query.recipes.findMany({
        where: eq(recipes.active, true),
        limit: input.limit,
        orderBy: desc(recipes.createdAt),
      });

      const filtered = veganRecipes.filter((recipe) => {
        const category = recipe.category?.toLowerCase() || "";
        const tags = recipe.tags ? JSON.parse(recipe.tags) : [];
        return category.includes("vegano") || tags.some((t: string) => t.toLowerCase().includes("vegano"));
      });

      return filtered.map((recipe) => getLocalizedRecipe(recipe, input.language));
    }),

  /**
   * Obtiene recetas rápidas (< 30 minutos)
   */
  getQuickRecipes: publicProcedure
    .input(
      z.object({
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
        limit: z.number().default(20).max(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const quickRecipes = await db.query.recipes.findMany({
        where: eq(recipes.active, true),
        limit: input.limit,
        orderBy: desc(recipes.createdAt),
      });

      const filtered = quickRecipes.filter(
        (recipe) => (recipe.preparationTime || 0) + (recipe.cookTime || 0) <= 30
      );

      return filtered.map((recipe) => getLocalizedRecipe(recipe, input.language));
    }),

  /**
   * Obtiene recetas para niños
   */
  getKidFriendlyRecipes: publicProcedure
    .input(
      z.object({
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
        limit: z.number().default(20).max(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const kidRecipes = await db.query.recipes.findMany({
        where: and(eq(recipes.active, true), eq(recipes.isKidFriendly, true)),
        limit: input.limit,
        orderBy: desc(recipes.createdAt),
      });

      return kidRecipes.map((recipe) => getLocalizedRecipe(recipe, input.language));
    }),

  /**
   * Obtiene recetas para bebés
   */
  getBabyFriendlyRecipes: publicProcedure
    .input(
      z.object({
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
        limit: z.number().default(20).max(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const babyRecipes = await db.query.recipes.findMany({
        where: and(eq(recipes.active, true), eq(recipes.isBabyFriendly, true)),
        limit: input.limit,
        orderBy: desc(recipes.createdAt),
      });

      return babyRecipes.map((recipe) => getLocalizedRecipe(recipe, input.language));
    }),

  /**
   * Obtiene recetas por BuddyMaker
   */
  getByBuddyMaker: publicProcedure
    .input(
      z.object({
        buddyMakerId: z.number(),
        language: z.enum(["es", "en", "fr", "it", "pt"]).default("es"),
        limit: z.number().default(20).max(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const makerRecipes = await db.query.recipes.findMany({
        where: and(eq(recipes.active, true), eq(recipes.buddyMakerId, input.buddyMakerId)),
        limit: input.limit,
        orderBy: desc(recipes.createdAt),
      });

      return makerRecipes.map((recipe) => getLocalizedRecipe(recipe, input.language));
    }),
});
