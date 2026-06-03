import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { shopProducts, careProducts, userPreferences } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Map recipe tags/keywords to shop product tags
const RECIPE_TO_SHOP_TAGS: Record<string, string[]> = {
  bbq: ["bbq", "parrilla", "brasa"],
  parrilla: ["bbq", "parrilla", "brasa"],
  brasa: ["bbq", "parrilla", "brasa"],
  asado: ["horno", "bandeja", "plancha"],
  horno: ["horno", "molde", "bandeja"],
  tarta: ["horno", "molde", "reposteria"],
  bizcocho: ["horno", "molde", "reposteria"],
  reposteria: ["horno", "molde", "reposteria"],
  wok: ["wok", "asiatico", "salteado"],
  asiatico: ["wok", "asiatico", "salteado"],
  salteado: ["wok", "salteado"],
  vapor: ["vapor", "saludable"],
  smoothie: ["batidora", "smoothie", "detox"],
  batido: ["batidora", "smoothie"],
  zumo: ["licuadora", "zumo", "detox"],
  sopa: ["batidora", "sopa"],
  guiso: ["coccion_lenta", "guiso", "legumbres"],
  legumbres: ["coccion_lenta", "legumbres", "olla_presion"],
  "meal prep": ["tupper", "meal_prep", "almacenaje"],
  meal_prep: ["tupper", "meal_prep", "almacenaje"],
  plancha: ["plancha", "hierro_fundido"],
  freidora: ["air_fryer", "freidora_aire"],
};

// Map health symptoms/goals to care product tags
const HEALTH_TO_CARE_TAGS: Record<string, string[]> = {
  retencion_liquidos: ["drenante", "diuretico", "retencion_liquidos"],
  retencion: ["drenante", "diuretico", "retencion_liquidos"],
  hinchazón: ["probiotico", "digestion", "drenante"],
  hinchazón_abdominal: ["probiotico", "digestion"],
  digestion: ["probiotico", "digestion", "intestino"],
  estreñimiento: ["probiotico", "intestino", "fibra"],
  fatiga: ["vitamina_b", "hierro", "magnesio", "energia"],
  cansancio: ["vitamina_b", "hierro", "magnesio", "energia"],
  anemia: ["hierro", "vitamina_b"],
  estres: ["magnesio", "ashwagandha", "adaptogeno", "estres"],
  ansiedad: ["magnesio", "valeriana", "relajacion", "ansiedad"],
  sueno: ["magnesio", "valeriana", "sueno", "relajacion"],
  insomnio: ["valeriana", "sueno", "relajacion"],
  articulaciones: ["colageno", "omega3", "curcuma", "articulaciones"],
  dolor_articular: ["colageno", "omega3", "curcuma"],
  inflamacion: ["omega3", "curcuma", "antiinflamatorio"],
  perdida_peso: ["proteina", "detox", "drenante"],
  ganancia_muscular: ["proteina", "whey", "musculo"],
  musculo: ["proteina", "whey", "musculo"],
  vegano: ["proteina_vegana", "vegano"],
  sin_lactosa: ["proteina_vegana", "sin_lactosa"],
  inmunidad: ["vitamina_d", "zinc", "probiotico", "inmunidad"],
  defensas: ["vitamina_d", "zinc", "probiotico"],
  piel: ["colageno", "zinc", "omega3", "piel"],
  cabello: ["colageno", "zinc", "cabello"],
  detox: ["infusion", "detox", "antioxidante"],
  antioxidante: ["antioxidante", "matcha", "curcuma"],
  energia: ["vitamina_b", "matcha", "ashwagandha", "energia"],
  tiroides: ["zinc", "selenio", "tiroides"],
  huesos: ["vitamina_d", "colageno", "huesos"],
};

function getTagsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found: Set<string> = new Set();
  for (const [keyword, tags] of Object.entries(RECIPE_TO_SHOP_TAGS)) {
    if (lower.includes(keyword)) tags.forEach(t => found.add(t));
  }
  return Array.from(found);
}

function getCareTagsFromSymptoms(symptoms: string[]): string[] {
  const found: Set<string> = new Set();
  for (const symptom of symptoms) {
    const lower = symptom.toLowerCase().replace(/\s+/g, '_');
    for (const [key, tags] of Object.entries(HEALTH_TO_CARE_TAGS)) {
      if (lower.includes(key) || key.includes(lower)) {
        tags.forEach(t => found.add(t));
      }
    }
  }
  return Array.from(found);
}

export const contextualRecommendationsRouter = router({
  // Get BuddyShop + BuddyCare recommendations for a recipe context
  getForRecipe: publicProcedure
    .input(z.object({
      recipeName: z.string(),
      recipeTags: z.array(z.string()).optional(),
      recipeCategory: z.string().optional(),
      limit: z.number().default(2),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const searchText = [
        input.recipeName,
        ...(input.recipeTags || []),
        input.recipeCategory || "",
      ].join(" ");

      const shopTags = getTagsFromText(searchText);

      // Get relevant shop products
      let shopRecs: typeof shopProducts.$inferSelect[] = [];
      if (shopTags.length > 0) {
        const allShop = await db.select().from(shopProducts).where(eq(shopProducts.isActive, true));
        shopRecs = allShop
          .filter(p => {
            const pTags: string[] = JSON.parse(p.tags || "[]");
            return pTags.some(t => shopTags.includes(t));
          })
          .sort(() => Math.random() - 0.5)
          .slice(0, input.limit);
      }

      // Get relevant care products based on recipe health context
      const careKeywords = ["detox", "antioxidante", "proteina", "energia", "vegano"];
      const careTags = getCareTagsFromSymptoms([...careKeywords, searchText]);
      let careRecs: typeof careProducts.$inferSelect[] = [];
      if (careTags.length > 0) {
        const allCare = await db.select().from(careProducts).where(eq(careProducts.isActive, true));
        careRecs = allCare
          .filter(p => {
            const pTags: string[] = JSON.parse(p.tags || "[]");
            return pTags.some(t => careTags.includes(t));
          })
          .sort(() => Math.random() - 0.5)
          .slice(0, 1);
      }

      return { shopProducts: shopRecs, careProducts: careRecs };
    }),

  // Get BuddyCare recommendations based on health symptoms/goals
  getForHealthGoal: publicProcedure
    .input(z.object({
      symptoms: z.array(z.string()),
      goal: z.string().optional(),
      limit: z.number().default(3),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const allSymptoms = [...input.symptoms, input.goal || ""];
      const careTags = getCareTagsFromSymptoms(allSymptoms);

      if (careTags.length === 0) {
        const all = await db.select().from(careProducts).where(eq(careProducts.isActive, true));
        return all.sort(() => Math.random() - 0.5).slice(0, input.limit);
      }

      const allCare = await db.select().from(careProducts).where(eq(careProducts.isActive, true));
      const filtered = allCare
        .filter(p => {
          const pTags: string[] = JSON.parse(p.tags || "[]");
          return pTags.some(t => careTags.includes(t));
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, input.limit);

      return filtered.length > 0 ? filtered : allCare.sort(() => Math.random() - 0.5).slice(0, input.limit);
    }),

  // Get all BuddyShop products (catalog)
  getShopCatalog: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const all = await db.select().from(shopProducts).where(eq(shopProducts.isActive, true));
      if (input.category) {
        return all.filter(p => p.category === input.category).slice(0, input.limit);
      }
      return all.slice(0, input.limit);
    }),

  // Get all BuddyCare products (catalog)
  getCareCatalog: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const all = await db.select().from(careProducts).where(eq(careProducts.isActive, true));
      if (input.category) {
        return all.filter(p => p.category === input.category).slice(0, input.limit);
      }
      return all.slice(0, input.limit);
    }),

  // Save user recommendation preferences (opt-in)
  saveRecommendationPreference: protectedProcedure
    .input(z.object({
      wantsShopRecommendations: z.boolean(),
      wantsCareRecommendations: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(userPreferences)
        .set({
          suggestHealthierProducts: input.wantsCareRecommendations,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, ctx.user.id));
      return { success: true };
    }),
});
