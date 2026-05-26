/**
 * priceCompare router — Shopping List Price Comparison
 * Compares ingredient prices across supermarkets for the user's shopping list
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

// Simulated price database for common Spanish supermarkets
// In production, this would connect to real-time APIs
const SUPERMARKET_PRICES: Record<string, Record<string, { price: number; unit: string; brand?: string }>> = {
  mercadona: {
    pollo: { price: 5.99, unit: "kg", brand: "Hacendado" },
    salmon: { price: 12.99, unit: "kg" },
    arroz: { price: 1.29, unit: "kg", brand: "Hacendado" },
    pasta: { price: 0.89, unit: "500g", brand: "Hacendado" },
    leche: { price: 0.89, unit: "L", brand: "Hacendado" },
    huevos: { price: 1.89, unit: "12 uds", brand: "Hacendado" },
    tomate: { price: 1.99, unit: "kg" },
    cebolla: { price: 1.29, unit: "kg" },
    patata: { price: 1.49, unit: "kg" },
    aceite_oliva: { price: 7.99, unit: "L", brand: "Hacendado" },
    yogur_griego: { price: 1.99, unit: "4 uds", brand: "Hacendado" },
    pan_integral: { price: 1.19, unit: "ud" },
    brocoli: { price: 1.99, unit: "kg" },
    espinacas: { price: 1.59, unit: "300g" },
    queso: { price: 3.49, unit: "200g" },
    atun: { price: 1.29, unit: "3 latas", brand: "Hacendado" },
    garbanzos: { price: 0.99, unit: "500g" },
    lentejas: { price: 0.89, unit: "500g" },
    platano: { price: 1.49, unit: "kg" },
    manzana: { price: 1.99, unit: "kg" },
  },
  carrefour: {
    pollo: { price: 6.49, unit: "kg", brand: "Carrefour" },
    salmon: { price: 13.99, unit: "kg" },
    arroz: { price: 1.49, unit: "kg", brand: "Carrefour" },
    pasta: { price: 0.99, unit: "500g", brand: "Carrefour" },
    leche: { price: 0.95, unit: "L", brand: "Carrefour" },
    huevos: { price: 2.09, unit: "12 uds" },
    tomate: { price: 2.19, unit: "kg" },
    cebolla: { price: 1.19, unit: "kg" },
    patata: { price: 1.39, unit: "kg" },
    aceite_oliva: { price: 8.49, unit: "L", brand: "Carrefour" },
    yogur_griego: { price: 2.29, unit: "4 uds" },
    pan_integral: { price: 1.29, unit: "ud" },
    brocoli: { price: 2.19, unit: "kg" },
    espinacas: { price: 1.79, unit: "300g" },
    queso: { price: 3.29, unit: "200g" },
    atun: { price: 1.49, unit: "3 latas" },
    garbanzos: { price: 1.09, unit: "500g" },
    lentejas: { price: 0.99, unit: "500g" },
    platano: { price: 1.39, unit: "kg" },
    manzana: { price: 2.19, unit: "kg" },
  },
  lidl: {
    pollo: { price: 5.49, unit: "kg", brand: "Lidl" },
    salmon: { price: 11.99, unit: "kg" },
    arroz: { price: 1.19, unit: "kg" },
    pasta: { price: 0.79, unit: "500g" },
    leche: { price: 0.79, unit: "L" },
    huevos: { price: 1.79, unit: "12 uds" },
    tomate: { price: 1.89, unit: "kg" },
    cebolla: { price: 0.99, unit: "kg" },
    patata: { price: 1.29, unit: "kg" },
    aceite_oliva: { price: 7.49, unit: "L" },
    yogur_griego: { price: 1.79, unit: "4 uds" },
    pan_integral: { price: 0.99, unit: "ud" },
    brocoli: { price: 1.79, unit: "kg" },
    espinacas: { price: 1.49, unit: "300g" },
    queso: { price: 2.99, unit: "200g" },
    atun: { price: 1.19, unit: "3 latas" },
    garbanzos: { price: 0.89, unit: "500g" },
    lentejas: { price: 0.79, unit: "500g" },
    platano: { price: 1.29, unit: "kg" },
    manzana: { price: 1.79, unit: "kg" },
  },
  dia: {
    pollo: { price: 5.79, unit: "kg", brand: "DIA" },
    salmon: { price: 12.49, unit: "kg" },
    arroz: { price: 1.09, unit: "kg", brand: "DIA" },
    pasta: { price: 0.69, unit: "500g", brand: "DIA" },
    leche: { price: 0.85, unit: "L", brand: "DIA" },
    huevos: { price: 1.69, unit: "12 uds", brand: "DIA" },
    tomate: { price: 1.79, unit: "kg" },
    cebolla: { price: 0.99, unit: "kg" },
    patata: { price: 1.19, unit: "kg" },
    aceite_oliva: { price: 7.29, unit: "L", brand: "DIA" },
    yogur_griego: { price: 1.69, unit: "4 uds", brand: "DIA" },
    pan_integral: { price: 0.89, unit: "ud" },
    brocoli: { price: 1.89, unit: "kg" },
    espinacas: { price: 1.39, unit: "300g" },
    queso: { price: 2.79, unit: "200g" },
    atun: { price: 1.09, unit: "3 latas", brand: "DIA" },
    garbanzos: { price: 0.79, unit: "500g" },
    lentejas: { price: 0.69, unit: "500g" },
    platano: { price: 1.19, unit: "kg" },
    manzana: { price: 1.69, unit: "kg" },
  },
};

function normalizeIngredient(ingredient: string): string | null {
  const text = ingredient.toLowerCase().trim();
  const mappings: Record<string, string[]> = {
    pollo: ["pollo", "pechuga", "muslo", "contramuslo"],
    salmon: ["salmón", "salmon"],
    arroz: ["arroz"],
    pasta: ["pasta", "espagueti", "macarron", "penne", "fusilli"],
    leche: ["leche"],
    huevos: ["huevo", "huevos"],
    tomate: ["tomate"],
    cebolla: ["cebolla"],
    patata: ["patata", "papa"],
    aceite_oliva: ["aceite de oliva", "aceite oliva", "aove"],
    yogur_griego: ["yogur griego", "yogur"],
    pan_integral: ["pan integral", "pan"],
    brocoli: ["brócoli", "brocoli"],
    espinacas: ["espinaca", "espinacas"],
    queso: ["queso"],
    atun: ["atún", "atun"],
    garbanzos: ["garbanzo", "garbanzos"],
    lentejas: ["lenteja", "lentejas"],
    platano: ["plátano", "platano", "banana"],
    manzana: ["manzana"],
  };

  for (const [key, variants] of Object.entries(mappings)) {
    if (variants.some(v => text.includes(v))) return key;
  }
  return null;
}

export const priceCompareRouter = router({
  /**
   * Compare prices for a list of ingredients across supermarkets
   */
  compare: protectedProcedure
    .input(z.object({
      ingredients: z.array(z.string()).min(1).max(50),
    }))
    .query(async ({ input }) => {
      const supermarkets = ["mercadona", "carrefour", "lidl", "dia"];
      const comparison: Record<string, { ingredient: string; prices: Record<string, { price: number; unit: string; brand?: string } | null> }> = {};

      let totals: Record<string, number> = {};
      supermarkets.forEach(s => { totals[s] = 0; });

      let matchedCount = 0;

      for (const ingredient of input.ingredients) {
        const normalized = normalizeIngredient(ingredient);
        if (!normalized) continue;
        matchedCount++;

        comparison[ingredient] = { ingredient, prices: {} };
        for (const supermarket of supermarkets) {
          const priceData = SUPERMARKET_PRICES[supermarket]?.[normalized] || null;
          comparison[ingredient].prices[supermarket] = priceData;
          if (priceData) {
            totals[supermarket] += priceData.price;
          }
        }
      }

      // Find cheapest supermarket
      const cheapest = Object.entries(totals).sort((a, b) => a[1] - b[1])[0];
      const mostExpensive = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
      const savings = mostExpensive[1] - cheapest[1];

      return {
        comparison,
        totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Math.round(v * 100) / 100])),
        cheapest: { supermarket: cheapest[0], total: Math.round(cheapest[1] * 100) / 100 },
        potentialSavings: Math.round(savings * 100) / 100,
        matchedIngredients: matchedCount,
        totalIngredients: input.ingredients.length,
      };
    }),

  /**
   * Get available supermarkets
   */
  getSupermarkets: protectedProcedure.query(() => {
    return [
      { id: "mercadona", name: "Mercadona", logo: "🟢", color: "#00A651" },
      { id: "carrefour", name: "Carrefour", logo: "🔵", color: "#004E9A" },
      { id: "lidl", name: "Lidl", logo: "🟡", color: "#0050AA" },
      { id: "dia", name: "DIA", logo: "🔴", color: "#E30613" },
    ];
  }),
});
