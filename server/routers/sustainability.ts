/**
 * sustainability router — Sustainability Score & Seasonal Adaptation
 * Calculates carbon footprint per recipe/menu and suggests seasonal alternatives
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";

// Approximate CO2 emissions per kg of common food categories (kg CO2e/kg food)
const CARBON_FOOTPRINT_DB: Record<string, number> = {
  // Proteins
  ternera: 27.0, vaca: 27.0, buey: 27.0, cordero: 24.0, cerdo: 6.1,
  pollo: 3.5, pavo: 3.5, pato: 4.0, conejo: 3.8,
  salmon: 5.0, atun: 5.5, merluza: 3.5, bacalao: 3.5, pescado: 3.5,
  gambas: 12.0, langostinos: 12.0, marisco: 10.0, camarones: 12.0,
  huevo: 3.0, huevos: 3.0, tofu: 1.0, tempeh: 0.8, seitan: 1.2,
  // Dairy
  leche: 1.9, queso: 8.5, yogur: 1.4, mantequilla: 9.0, nata: 4.0, crema: 4.0,
  // Grains
  arroz: 2.7, pasta: 1.2, pan: 1.0, trigo: 0.8, avena: 0.5, quinoa: 1.0,
  // Legumes
  lentejas: 0.7, garbanzos: 0.6, alubias: 0.5, judias: 0.5, frijoles: 0.5, soja: 0.4,
  // Vegetables
  tomate: 0.7, patata: 0.3, boniato: 0.3, zanahoria: 0.2, cebolla: 0.2,
  pimiento: 0.5, calabacin: 0.3, berenjena: 0.4, brocoli: 0.4, espinacas: 0.3,
  lechuga: 0.3, pepino: 0.3, aguacate: 1.3, champiñon: 0.5, setas: 0.5,
  // Fruits
  manzana: 0.3, platano: 0.7, naranja: 0.3, fresa: 0.5, arandanos: 0.8,
  mango: 1.0, piña: 0.6, melocoton: 0.4, uva: 0.5,
  // Oils & nuts
  aceite: 3.0, aceite_oliva: 3.5, almendras: 2.3, nueces: 1.5, cacahuetes: 1.2,
  // Others
  chocolate: 4.5, cafe: 5.0, azucar: 0.6, miel: 0.8,
};

// Seasonal availability in Spain (months 1-12)
const SEASONAL_CALENDAR: Record<string, number[]> = {
  tomate: [6, 7, 8, 9, 10],
  pimiento: [6, 7, 8, 9],
  calabacin: [5, 6, 7, 8, 9],
  berenjena: [6, 7, 8, 9],
  pepino: [5, 6, 7, 8, 9],
  lechuga: [1, 2, 3, 4, 5, 10, 11, 12],
  espinacas: [1, 2, 3, 10, 11, 12],
  brocoli: [10, 11, 12, 1, 2, 3],
  coliflor: [10, 11, 12, 1, 2, 3],
  alcachofa: [11, 12, 1, 2, 3, 4],
  guisantes: [3, 4, 5, 6],
  habas: [3, 4, 5],
  fresa: [3, 4, 5, 6],
  cereza: [5, 6, 7],
  melocoton: [6, 7, 8, 9],
  sandia: [6, 7, 8],
  melon: [6, 7, 8, 9],
  naranja: [11, 12, 1, 2, 3, 4],
  mandarina: [10, 11, 12, 1, 2],
  manzana: [9, 10, 11, 12, 1, 2],
  pera: [8, 9, 10, 11, 12],
  uva: [8, 9, 10],
  granada: [10, 11, 12],
  caqui: [10, 11, 12],
  kiwi: [11, 12, 1, 2, 3],
  calabaza: [9, 10, 11, 12],
  patata: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // year-round
  zanahoria: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  cebolla: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  ajo: [6, 7, 8, 9, 10],
  puerro: [10, 11, 12, 1, 2, 3],
  nabo: [10, 11, 12, 1, 2],
  remolacha: [9, 10, 11, 12, 1],
  esparrago: [3, 4, 5, 6],
};

function estimateCarbonFootprint(ingredientsText: string): { totalCO2: number; breakdown: { ingredient: string; co2: number }[]; rating: string } {
  if (!ingredientsText) return { totalCO2: 0, breakdown: [], rating: "A" };

  const text = ingredientsText.toLowerCase();
  const breakdown: { ingredient: string; co2: number }[] = [];
  let totalCO2 = 0;

  for (const [ingredient, co2PerKg] of Object.entries(CARBON_FOOTPRINT_DB)) {
    if (text.includes(ingredient)) {
      // Estimate ~200g per ingredient mention as average portion
      const co2 = co2PerKg * 0.2;
      breakdown.push({ ingredient, co2: Math.round(co2 * 100) / 100 });
      totalCO2 += co2;
    }
  }

  totalCO2 = Math.round(totalCO2 * 100) / 100;

  // Rating: A (<1kg), B (1-2kg), C (2-3kg), D (3-5kg), E (>5kg)
  let rating = "A";
  if (totalCO2 >= 5) rating = "E";
  else if (totalCO2 >= 3) rating = "D";
  else if (totalCO2 >= 2) rating = "C";
  else if (totalCO2 >= 1) rating = "B";

  return { totalCO2, breakdown: breakdown.sort((a, b) => b.co2 - a.co2).slice(0, 5), rating };
}

function getSeasonalScore(ingredientsText: string): { score: number; seasonal: string[]; outOfSeason: string[]; month: number } {
  if (!ingredientsText) return { score: 100, seasonal: [], outOfSeason: [], month: new Date().getMonth() + 1 };

  const text = ingredientsText.toLowerCase();
  const currentMonth = new Date().getMonth() + 1;
  const seasonal: string[] = [];
  const outOfSeason: string[] = [];

  for (const [ingredient, months] of Object.entries(SEASONAL_CALENDAR)) {
    if (text.includes(ingredient)) {
      if (months.includes(currentMonth)) {
        seasonal.push(ingredient);
      } else {
        outOfSeason.push(ingredient);
      }
    }
  }

  const total = seasonal.length + outOfSeason.length;
  const score = total > 0 ? Math.round((seasonal.length / total) * 100) : 100;

  return { score, seasonal, outOfSeason, month: currentMonth };
}

export const sustainabilityRouter = router({
  /**
   * Get sustainability score for a recipe
   */
  getRecipeScore: publicProcedure
    .input(z.object({ recipeId: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB not available");

      const { recipes } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const [recipe] = await drizzleDb.select().from(recipes).where(eq(recipes.id, input.recipeId)).limit(1);
      if (!recipe) return null;

      const carbon = estimateCarbonFootprint(recipe.ingredients || "");
      const seasonal = getSeasonalScore(recipe.ingredients || "");

      // Combined sustainability score (0-100)
      const carbonScore = Math.max(0, 100 - (carbon.totalCO2 * 20)); // 5kg = 0 score
      const combinedScore = Math.round((carbonScore * 0.6) + (seasonal.score * 0.4));

      return {
        recipeId: input.recipeId,
        recipeName: recipe.name,
        carbon,
        seasonal,
        combinedScore,
        tips: generateTips(carbon, seasonal),
      };
    }),

  /**
   * Get seasonal ingredients for current month
   */
  getSeasonalIngredients: publicProcedure
    .query(async () => {
      const currentMonth = new Date().getMonth() + 1;
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      const inSeason: string[] = [];
      for (const [ingredient, months] of Object.entries(SEASONAL_CALENDAR)) {
        if (months.includes(currentMonth)) {
          inSeason.push(ingredient);
        }
      }

      return {
        month: currentMonth,
        monthName: monthNames[currentMonth - 1],
        ingredients: inSeason.sort(),
      };
    }),

  /**
   * Get sustainability score for a menu (multiple recipes)
   */
  getMenuScore: protectedProcedure
    .input(z.object({ recipeIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB not available");

      const { recipes } = await import("../../drizzle/schema");
      const { inArray, isNull, and } = await import("drizzle-orm");

      const recipeList = await drizzleDb
        .select({ id: recipes.id, name: recipes.name, ingredients: recipes.ingredients })
        .from(recipes)
        .where(and(inArray(recipes.id, input.recipeIds), isNull(recipes.deletedAt)));

      let totalCO2 = 0;
      let totalSeasonalScore = 0;
      const perRecipe: any[] = [];

      for (const recipe of recipeList) {
        const carbon = estimateCarbonFootprint(recipe.ingredients || "");
        const seasonal = getSeasonalScore(recipe.ingredients || "");
        totalCO2 += carbon.totalCO2;
        totalSeasonalScore += seasonal.score;
        perRecipe.push({ id: recipe.id, name: recipe.name, co2: carbon.totalCO2, carbonRating: carbon.rating, seasonalScore: seasonal.score });
      }

      const avgSeasonalScore = recipeList.length > 0 ? Math.round(totalSeasonalScore / recipeList.length) : 100;
      const carbonScore = Math.max(0, 100 - (totalCO2 * 4)); // scaled for full menu
      const combinedScore = Math.round((carbonScore * 0.6) + (avgSeasonalScore * 0.4));

      return {
        totalCO2: Math.round(totalCO2 * 100) / 100,
        avgSeasonalScore,
        combinedScore,
        recipeCount: recipeList.length,
        perRecipe: perRecipe.sort((a, b) => b.co2 - a.co2),
      };
    }),
});

function generateTips(carbon: ReturnType<typeof estimateCarbonFootprint>, seasonal: ReturnType<typeof getSeasonalScore>): string[] {
  const tips: string[] = [];

  if (carbon.breakdown.some(b => ["ternera", "vaca", "buey", "cordero"].includes(b.ingredient))) {
    tips.push("Sustituir la carne roja por pollo o legumbres reduce hasta un 80% la huella de carbono");
  }
  if (carbon.breakdown.some(b => ["gambas", "langostinos", "marisco"].includes(b.ingredient))) {
    tips.push("El marisco tiene alta huella hídrica. Considera pescado local de temporada");
  }
  if (seasonal.outOfSeason.length > 0) {
    tips.push(`Ingredientes fuera de temporada: ${seasonal.outOfSeason.join(", ")}. Busca alternativas locales`);
  }
  if (carbon.rating === "A" || carbon.rating === "B") {
    tips.push("¡Excelente! Esta receta tiene una huella de carbono baja");
  }
  if (seasonal.score >= 80) {
    tips.push("Buen uso de ingredientes de temporada. Más frescos y más baratos");
  }

  return tips;
}
