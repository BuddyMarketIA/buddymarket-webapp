/**
 * Helpers para obtener contenido multiidioma de la BD
 * Estos helpers aseguran que el contenido se devuelva en el idioma correcto
 */

import type { Recipe, Ingredient } from "@/drizzle/schema";
import type { LanguageCode } from "@/client/src/lib/i18n";

/**
 * Obtiene el nombre de una receta en el idioma especificado
 */
export function getRecipeName(recipe: Recipe, language: LanguageCode): string {
  const nameField = `name${language.toUpperCase()}` as keyof Recipe;
  const translatedName = recipe[nameField] as string | undefined;
  return translatedName || recipe.name || "Sin nombre";
}

/**
 * Obtiene la descripción de una receta en el idioma especificado
 */
export function getRecipeDescription(recipe: Recipe, language: LanguageCode): string | null {
  const descField = `description${language.toUpperCase()}` as keyof Recipe;
  const translatedDesc = recipe[descField] as string | undefined;
  return translatedDesc || recipe.description || null;
}

/**
 * Obtiene los ingredientes de una receta en el idioma especificado
 */
export function getRecipeIngredients(recipe: Recipe, language: LanguageCode): any[] {
  const ingredientsField = `ingredientsJson${language.toUpperCase()}` as keyof Recipe;
  const translatedIngredients = recipe[ingredientsField] as string | undefined;
  
  if (translatedIngredients) {
    try {
      return JSON.parse(translatedIngredients);
    } catch {
      // Fallback a ingredientes en español
      try {
        return recipe.ingredientsJsonEs ? JSON.parse(recipe.ingredientsJsonEs) : [];
      } catch {
        return [];
      }
    }
  }
  
  // Fallback a ingredientes genéricos
  try {
    return recipe.ingredientsJson ? JSON.parse(recipe.ingredientsJson) : [];
  } catch {
    return [];
  }
}

/**
 * Obtiene las instrucciones de una receta en el idioma especificado
 */
export function getRecipeInstructions(recipe: Recipe, language: LanguageCode): any[] {
  const instructionsField = `instructionsJson${language.toUpperCase()}` as keyof Recipe;
  const translatedInstructions = recipe[instructionsField] as string | undefined;
  
  if (translatedInstructions) {
    try {
      return JSON.parse(translatedInstructions);
    } catch {
      // Fallback a instrucciones en español
      try {
        return recipe.instructionsJsonEs ? JSON.parse(recipe.instructionsJsonEs) : [];
      } catch {
        return [];
      }
    }
  }
  
  // Fallback a instrucciones genéricas
  try {
    return recipe.instructionsJson ? JSON.parse(recipe.instructionsJson) : [];
  } catch {
    return [];
  }
}

/**
 * Obtiene una receta completa con todo el contenido en el idioma especificado
 */
export function getLocalizedRecipe(recipe: Recipe, language: LanguageCode) {
  return {
    ...recipe,
    name: getRecipeName(recipe, language),
    description: getRecipeDescription(recipe, language),
    ingredients: getRecipeIngredients(recipe, language),
    instructions: getRecipeInstructions(recipe, language),
  };
}

/**
 * Obtiene el nombre de un ingrediente en el idioma especificado
 */
export function getIngredientName(ingredient: Ingredient, language: LanguageCode): string {
  const nameField = `name${language.toUpperCase()}` as keyof Ingredient;
  const translatedName = ingredient[nameField] as string | undefined;
  return translatedName || ingredient.nameEs || ingredient.nameEn || "Sin nombre";
}

/**
 * Obtiene un ingrediente con el nombre en el idioma especificado
 */
export function getLocalizedIngredient(ingredient: Ingredient, language: LanguageCode) {
  return {
    ...ingredient,
    name: getIngredientName(ingredient, language),
  };
}

/**
 * Traduce una categoría de receta
 */
export const RECIPE_CATEGORIES: Record<string, Record<LanguageCode, string>> = {
  "perdida_peso": {
    es: "Pérdida de peso",
    en: "Weight loss",
    fr: "Perte de poids",
    it: "Perdita di peso",
    pt: "Perda de peso",
  },
  "ganancia_muscular": {
    es: "Ganancia muscular",
    en: "Muscle gain",
    fr: "Gain musculaire",
    it: "Aumento muscolare",
    pt: "Ganho muscular",
  },
  "definicion": {
    es: "Definición",
    en: "Definition",
    fr: "Définition",
    it: "Definizione",
    pt: "Definição",
  },
  "dieta_equilibrada": {
    es: "Dieta equilibrada",
    en: "Balanced diet",
    fr: "Régime équilibré",
    it: "Dieta equilibrata",
    pt: "Dieta equilibrada",
  },
  "rendimiento": {
    es: "Rendimiento",
    en: "Performance",
    fr: "Performance",
    it: "Prestazioni",
    pt: "Desempenho",
  },
  "bienestar": {
    es: "Bienestar",
    en: "Wellness",
    fr: "Bien-être",
    it: "Benessere",
    pt: "Bem-estar",
  },
  "vegano": {
    es: "Vegano",
    en: "Vegan",
    fr: "Végan",
    it: "Vegano",
    pt: "Vegano",
  },
};

export function getLocalizedCategory(category: string, language: LanguageCode): string {
  return RECIPE_CATEGORIES[category]?.[language] || category;
}

/**
 * Traduce dificultad de receta
 */
export const DIFFICULTY_LEVELS: Record<string, Record<LanguageCode, string>> = {
  "easy": {
    es: "Fácil",
    en: "Easy",
    fr: "Facile",
    it: "Facile",
    pt: "Fácil",
  },
  "medium": {
    es: "Medio",
    en: "Medium",
    fr: "Moyen",
    it: "Medio",
    pt: "Médio",
  },
  "hard": {
    es: "Difícil",
    en: "Hard",
    fr: "Difficile",
    it: "Difficile",
    pt: "Difícil",
  },
};

export function getLocalizedDifficulty(difficulty: string, language: LanguageCode): string {
  return DIFFICULTY_LEVELS[difficulty]?.[language] || difficulty;
}
