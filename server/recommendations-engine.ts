/**
 * Recommendations Engine
 * Intelligent product recommendation generation based on user profile
 */

import { getDb } from "./db";
import { users, userProfiles, userMetrics, userMedicalProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  createRecommendationsBatch,
  cacheProduct,
  getCachedProduct,
} from "./recommendations-db";
import { NewProductRecommendation } from "../drizzle/schema";
import { ENV } from "./_core/env";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface UserNutritionalProfile {
  userId: number;
  mainGoal?: string;
  activityLevel?: string;
  proteinGoal?: number;
  currentProtein?: number;
  calorieGoal?: number;
  currentCalories?: number;
  allergies: string[];
  restrictions: string[];
  medicalConditions: string[];
  activeTrainings?: boolean;
  cookingFrequency?: string;
  preferredMealComplexity?: string;
}

export interface RecommendationTrigger {
  type:
    | "muscle_gain"
    | "weight_loss"
    | "frequent_cooking"
    | "complex_recipes"
    | "vitamin_deficiency"
    | "health_goal"
    | "active_training"
    | "macro_deficit";
  score: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILE ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get user's nutritional profile for recommendation generation
 */
export async function getUserNutritionalProfile(
  userId: number
): Promise<UserNutritionalProfile | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get user profile
    const userProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!userProfile.length) return null;

    const profile = userProfile[0];

    // Get latest metrics
    const metrics = await db
      .select()
      .from(userMetrics)
      .where(eq(userMetrics.userId, userId))
      .limit(1);

    const metric = metrics[0];

    // Get medical profile
    const medicalProfiles = await db
      .select()
      .from(userMedicalProfiles)
      .where(eq(userMedicalProfiles.userId, userId))
      .limit(1);

    const medical = medicalProfiles[0];

    return {
      userId,
      mainGoal: profile.mainGoal,
      activityLevel: profile.activityLevel,
      proteinGoal: metric?.proteinGoal,
      currentProtein: metric?.proteinConsumed,
      calorieGoal: metric?.calorieGoal,
      currentCalories: metric?.caloriesConsumed,
      allergies: profile.allergies || [],
      restrictions: profile.dietaryRestrictions || [],
      medicalConditions: medical?.conditions || [],
      activeTrainings: profile.exerciseFrequency !== "never",
      cookingFrequency: profile.mealPrepTime,
      preferredMealComplexity: profile.preferredMealComplexity,
    };
  } catch (error) {
    console.error("[Recommendations] Error getting user profile:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect recommendation triggers based on user profile
 */
export function detectRecommendationTriggers(
  profile: UserNutritionalProfile
): RecommendationTrigger[] {
  const triggers: RecommendationTrigger[] = [];

  // Trigger 1: Muscle Gain
  if (profile.mainGoal === "ganancia_muscular" && profile.activeTrainings) {
    triggers.push({
      type: "muscle_gain",
      score: 95,
    });
  }

  // Trigger 2: Weight Loss
  if (profile.mainGoal === "perdida_peso") {
    triggers.push({
      type: "weight_loss",
      score: 90,
    });
  }

  // Trigger 3: Frequent Cooking
  if (
    profile.cookingFrequency === "under_15" ||
    profile.cookingFrequency === "15_30"
  ) {
    triggers.push({
      type: "frequent_cooking",
      score: 85,
    });
  }

  // Trigger 4: Complex Recipes
  if (profile.preferredMealComplexity === "complex") {
    triggers.push({
      type: "complex_recipes",
      score: 80,
    });
  }

  // Trigger 5: Active Training
  if (profile.activeTrainings) {
    triggers.push({
      type: "active_training",
      score: 88,
    });
  }

  // Trigger 6: Macro Deficit (Protein)
  if (
    profile.proteinGoal &&
    profile.currentProtein &&
    profile.currentProtein < profile.proteinGoal * 0.8
  ) {
    triggers.push({
      type: "macro_deficit",
      score: 92,
    });
  }

  // Trigger 7: Health Goal
  if (profile.mainGoal === "bienestar" || profile.medicalConditions.length > 0) {
    triggers.push({
      type: "health_goal",
      score: 85,
    });
  }

  // Trigger 8: Vitamin Deficiency (inferred from medical conditions)
  if (
    profile.medicalConditions.some((c) =>
      ["diabetes", "hypertension", "anemia", "osteoporosis"].includes(c)
    )
  ) {
    triggers.push({
      type: "vitamin_deficiency",
      score: 90,
    });
  }

  return triggers;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT RECOMMENDATION GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate BuddyCoach recommendations (sports supplements)
 */
export function generateBuddyCoachRecommendations(
  userId: number,
  triggers: RecommendationTrigger[]
): NewProductRecommendation[] {
  const recommendations: NewProductRecommendation[] = [];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

  // Muscle Gain Trigger
  if (triggers.some((t) => t.type === "muscle_gain")) {
    recommendations.push({
      userId,
      externalProductId: "buddycoach_protein_whey",
      source: "buddycoach",
      title: "Proteína Whey Premium",
      description: "Proteína de suero de alta calidad para ganancia muscular",
      reason: "Tu objetivo es ganar músculo y necesitas alcanzar 150g de proteína diaria",
      trigger: "muscle_gain",
      productUrl: "https://buddycoach.app/products/protein-whey",
      productImage: "https://images.unsplash.com/photo-1526506118085-da8d440337c7",
      productPrice: "29.99",
      productCategory: "suplementos",
      relevanceScore: 95,
      cta: "Comprar Proteína",
      expiresAt,
    });

    recommendations.push({
      userId,
      externalProductId: "buddycoach_creatina",
      source: "buddycoach",
      title: "Creatina Monohidrato",
      description: "Mejora la fuerza y el rendimiento en entrenamientos",
      reason: "La creatina es esencial para maximizar tus ganancias musculares",
      trigger: "muscle_gain",
      productUrl: "https://buddycoach.app/products/creatine",
      productImage: "https://images.unsplash.com/photo-1517836357463-d25ddfcbf042",
      productPrice: "19.99",
      productCategory: "suplementos",
      relevanceScore: 88,
      cta: "Comprar Creatina",
      expiresAt,
    });
  }

  // Active Training Trigger
  if (triggers.some((t) => t.type === "active_training")) {
    recommendations.push({
      userId,
      externalProductId: "buddycoach_bcaa",
      source: "buddycoach",
      title: "BCAA + Glutamina",
      description: "Aminoácidos esenciales para recuperación muscular",
      reason: "Tus entrenamientos frecuentes requieren recuperación óptima",
      trigger: "active_training",
      productUrl: "https://buddycoach.app/products/bcaa",
      productImage: "https://images.unsplash.com/photo-1577720643272-265f434883f3",
      productPrice: "24.99",
      productCategory: "suplementos",
      relevanceScore: 85,
      cta: "Comprar BCAA",
      expiresAt,
    });
  }

  // Macro Deficit Trigger
  if (triggers.some((t) => t.type === "macro_deficit")) {
    recommendations.push({
      userId,
      externalProductId: "buddycoach_protein_bar",
      source: "buddycoach",
      title: "Barras Proteicas",
      description: "Snack alto en proteína para entre comidas",
      reason: "Te ayudará a alcanzar tu meta de proteína diaria de forma fácil",
      trigger: "macro_deficit",
      productUrl: "https://buddycoach.app/products/protein-bars",
      productImage: "https://images.unsplash.com/photo-1599599810694-b5ac4dd64b73",
      productPrice: "2.99",
      productCategory: "snacks",
      relevanceScore: 82,
      cta: "Comprar Barras",
      expiresAt,
    });
  }

  return recommendations;
}

/**
 * Fetch products from BuddyShop real API
 */
async function fetchBuddyShopProducts(options: {
  category?: string;
  query?: string;
  featured?: boolean;
}): Promise<any[]> {
  const BUDDYSHOP_URL = process.env.BUDDYSHOP_API_URL || "https://www.buddyoneshop.com/api/buddyone";
  const BUDDYSHOP_KEY = process.env.BUDDYSHOP_API_KEY || "";
  // The API base is the tRPC endpoint
  const baseUrl = BUDDYSHOP_URL.replace("/api/buddyone", "/api/trpc");

  try {
    let endpoint: string;
    let input: any;

    if (options.featured) {
      endpoint = "shop.getFeaturedProducts";
      input = {};
    } else if (options.category) {
      endpoint = "shop.getProductsByCategory";
      input = { categorySlug: options.category };
    } else if (options.query) {
      endpoint = "shop.searchProducts";
      input = { query: options.query };
    } else {
      endpoint = "shop.getAllProducts";
      input = {};
    }

    const url = `${baseUrl}/${endpoint}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
    const res = await fetch(url, {
      headers: {
        "x-api-key": BUDDYSHOP_KEY,
        "x-source-app": "buddyone",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`[BuddyShop API] ${endpoint} returned ${res.status}`);
      return [];
    }

    const data = await res.json() as any;
    return data?.result?.data?.json || [];
  } catch (error) {
    console.error("[BuddyShop API] Error fetching products:", error);
    return [];
  }
}

/**
 * Map trigger types to BuddyShop categories
 */
function getTriggerCategories(triggers: RecommendationTrigger[]): string[] {
  const categories: string[] = [];
  if (triggers.some((t) => t.type === "frequent_cooking")) {
    categories.push("utensilios", "electrodomesticos", "menaje");
  }
  if (triggers.some((t) => t.type === "complex_recipes")) {
    categories.push("cuchillos", "utensilios");
  }
  if (triggers.some((t) => t.type === "health_goal" || t.type === "weight_loss")) {
    categories.push("electrodomesticos", "menaje");
  }
  if (triggers.some((t) => t.type === "muscle_gain" || t.type === "active_training")) {
    categories.push("electrodomesticos", "organizacion");
  }
  return [...new Set(categories)];
}

/**
 * Map trigger type to a reason string
 */
function getReasonForTrigger(trigger: string, productName: string): string {
  const reasons: Record<string, string> = {
    frequent_cooking: `"${productName}" te ayudará a cocinar más rápido y eficiente`,
    complex_recipes: `Ideal para preparar recetas complejas con precisión profesional`,
    health_goal: `Complemento perfecto para tu objetivo de bienestar`,
    weight_loss: `Te ayudará a preparar comidas saludables con control de porciones`,
    muscle_gain: `Facilita la preparación de comidas ricas en proteína`,
    active_training: `Optimiza tu preparación de comidas para entrenamientos`,
  };
  return reasons[trigger] || `Recomendado para tu perfil nutricional`;
}

/**
 * Generate BuddyShop recommendations (kitchen equipment) - REAL API
 */
export async function generateBuddyShopRecommendations(
  userId: number,
  triggers: RecommendationTrigger[]
): Promise<NewProductRecommendation[]> {
  const recommendations: NewProductRecommendation[] = [];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14); // Valid for 14 days

  const BUDDYSHOP_BASE = "https://www.buddyoneshop.com";
  const categories = getTriggerCategories(triggers);

  if (categories.length === 0) return recommendations;

  try {
    // Fetch products from relevant categories
    const allProducts: any[] = [];
    for (const cat of categories.slice(0, 3)) {
      const products = await fetchBuddyShopProducts({ category: cat });
      allProducts.push(...products);
    }

    // If no category results, try featured
    if (allProducts.length === 0) {
      const featured = await fetchBuddyShopProducts({ featured: true });
      allProducts.push(...featured);
    }

    // Deduplicate by id
    const seen = new Set<number>();
    const uniqueProducts = allProducts.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Pick top products (featured first, then by rating)
    const sorted = uniqueProducts
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, 4);

    // Determine the primary trigger
    const primaryTrigger = triggers.sort((a, b) => b.score - a.score)[0]?.type || "frequent_cooking";

    for (const product of sorted) {
      // Cache product in local DB
      try {
        await cacheProduct({
          externalId: `buddyshop_${product.id}`,
          source: "buddyshop",
          title: product.name,
          description: product.shortDescription || product.description?.slice(0, 200),
          price: product.price,
          imageUrl: product.imageUrl,
          productUrl: `${BUDDYSHOP_BASE}/producto/${product.slug}`,
          category: product.categorySlug,
          metadata: JSON.stringify({
            rating: product.rating,
            reviewCount: product.reviewCount,
            badge: product.badge,
            material: product.material,
          }),
        });
      } catch (e) {
        // Cache failure is non-critical
      }

      recommendations.push({
        userId,
        externalProductId: `buddyshop_${product.id}`,
        source: "buddyshop",
        title: product.name,
        description: product.shortDescription || product.description?.slice(0, 150),
        reason: getReasonForTrigger(primaryTrigger, product.name),
        trigger: primaryTrigger,
        productUrl: `${BUDDYSHOP_BASE}/producto/${product.slug}`,
        productImage: product.imageUrl,
        productPrice: product.price,
        productCategory: product.categorySlug,
        relevanceScore: Math.round(85 + (product.rating || 4) * 2),
        cta: "Ver en BuddyShop",
        expiresAt,
      });
    }

    console.log(`[BuddyShop] Generated ${recommendations.length} real product recommendations`);
  } catch (error) {
    console.error("[BuddyShop] Error generating recommendations:", error);
  }

  return recommendations;
}

/**
 * Fetch wellness data from BuddyCare real API
 */
async function fetchBuddyCareData(userId: number, profile: UserNutritionalProfile): Promise<any | null> {
  const BUDDYCARE_URL = process.env.BUDDYCARE_API_URL || "https://api.buddycare.com";
  const BUDDYCARE_KEY = process.env.BUDDYCARE_API_KEY || "";
  const ECOSYSTEM_SECRET = process.env.ECOSYSTEM_SECRET || "";

  try {
    const res = await fetch(
      `${BUDDYCARE_URL}/api/ecosystem/recommendations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": BUDDYCARE_KEY,
          "x-ecosystem-secret": ECOSYSTEM_SECRET,
          "x-source-app": "buddyone",
        },
        body: JSON.stringify({
          userId,
          conditions: profile.medicalConditions,
          goal: profile.mainGoal,
          allergies: profile.allergies,
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      console.warn(`[BuddyCare API] returned ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.warn("[BuddyCare API] Not reachable, using local recommendations");
    return null;
  }
}

/**
 * Generate BuddyCare recommendations (health & wellness) - with API fallback
 */
export async function generateBuddyCareRecommendations(
  userId: number,
  triggers: RecommendationTrigger[],
  profile: UserNutritionalProfile
): Promise<NewProductRecommendation[]> {
  const recommendations: NewProductRecommendation[] = [];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Valid for 30 days

  // Try to get personalized recommendations from BuddyCare API
  const apiData = await fetchBuddyCareData(userId, profile);
  if (apiData?.recommendations?.length) {
    console.log(`[BuddyCare API] Got ${apiData.recommendations.length} personalized recommendations`);
    for (const rec of apiData.recommendations.slice(0, 4)) {
      recommendations.push({
        userId,
        externalProductId: rec.id || `buddycare_${Date.now()}`,
        source: "buddycare",
        title: rec.title || rec.name,
        description: rec.description,
        reason: rec.reason || "Recomendado por BuddyCare para tu bienestar",
        trigger: triggers[0]?.type || "health_goal",
        productUrl: rec.url || "https://buddycare.app",
        productImage: rec.image || "https://images.unsplash.com/photo-1584308666744-24d5f400f6f0",
        productPrice: rec.price?.toString() || "0",
        productCategory: rec.category || "suplementos",
        relevanceScore: rec.score || 85,
        cta: rec.cta || "Ver en BuddyCare",
        expiresAt,
      });
    }
    return recommendations;
  }

  // Fallback: local rule-based recommendations when API is unavailable
  console.log("[BuddyCare] API unavailable, using local fallback recommendations");

  // Health Goal Trigger
  if (triggers.some((t) => t.type === "health_goal")) {
    recommendations.push({
      userId,
      externalProductId: "buddycare_vitamin_d",
      source: "buddycare",
      title: "Vitamina D3 5000 IU",
      description: "Mejora absorción de calcio y salud ósea",
      reason: "Esencial para tu bienestar general y salud ósea",
      trigger: "health_goal",
      productUrl: "https://buddycare.app/products/vitamin-d3",
      productImage: "https://images.unsplash.com/photo-1584308666744-24d5f400f6f0",
      productPrice: "14.99",
      productCategory: "vitaminas",
      relevanceScore: 85,
      cta: "Comprar Vitamina D",
      expiresAt,
    });
  }

  // Vitamin Deficiency Trigger
  if (triggers.some((t) => t.type === "vitamin_deficiency")) {
    // Check for specific conditions
    if (profile.medicalConditions.includes("diabetes")) {
      recommendations.push({
        userId,
        externalProductId: "buddycare_chromium",
        source: "buddycare",
        title: "Cromo + Canela",
        description: "Ayuda a regular niveles de glucosa",
        reason: "Apoyo natural para control glucémico",
        trigger: "vitamin_deficiency",
        productUrl: "https://buddycare.app/products/chromium",
        productImage: "https://images.unsplash.com/photo-1584308666744-24d5f400f6f0",
        productPrice: "19.99",
        productCategory: "suplementos",
        relevanceScore: 92,
        cta: "Comprar Cromo",
        expiresAt,
      });
    }

    if (profile.medicalConditions.includes("hypertension")) {
      recommendations.push({
        userId,
        externalProductId: "buddycare_magnesium",
        source: "buddycare",
        title: "Magnesio Quelado",
        description: "Apoyo cardiovascular y relajación muscular",
        reason: "Esencial para salud cardiovascular",
        trigger: "vitamin_deficiency",
        productUrl: "https://buddycare.app/products/magnesium",
        productImage: "https://images.unsplash.com/photo-1584308666744-24d5f400f6f0",
        productPrice: "16.99",
        productCategory: "minerales",
        relevanceScore: 90,
        cta: "Comprar Magnesio",
        expiresAt,
      });
    }

    // General recommendations
    recommendations.push({
      userId,
      externalProductId: "buddycare_omega3",
      source: "buddycare",
      title: "Omega-3 Premium",
      description: "Ácidos grasos esenciales para salud cardiovascular",
      reason: "Apoyo fundamental para tu salud general",
      trigger: "vitamin_deficiency",
      productUrl: "https://buddycare.app/products/omega3",
      productImage: "https://images.unsplash.com/photo-1584308666744-24d5f400f6f0",
      productPrice: "21.99",
      productCategory: "suplementos",
      relevanceScore: 88,
      cta: "Comprar Omega-3",
      expiresAt,
    });
  }

  // Weight Loss Trigger
  if (triggers.some((t) => t.type === "weight_loss")) {
    recommendations.push({
      userId,
      externalProductId: "buddycare_green_tea",
      source: "buddycare",
      title: "Extracto Té Verde",
      description: "Acelera metabolismo de forma natural",
      reason: "Complemento natural para tu objetivo de pérdida de peso",
      trigger: "weight_loss",
      productUrl: "https://buddycare.app/products/green-tea",
      productImage: "https://images.unsplash.com/photo-1584308666744-24d5f400f6f0",
      productPrice: "12.99",
      productCategory: "suplementos",
      relevanceScore: 80,
      cta: "Comprar Té Verde",
      expiresAt,
    });
  }

  return recommendations;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RECOMMENDATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate all recommendations for a user
 */
export async function generateRecommendationsForUser(
  userId: number
): Promise<NewProductRecommendation[]> {
  try {
    // Get user profile
    const profile = await getUserNutritionalProfile(userId);
    if (!profile) {
      console.warn(`[Recommendations] No profile found for user ${userId}`);
      return [];
    }

    // Detect triggers
    const triggers = detectRecommendationTriggers(profile);
    if (triggers.length === 0) {
      console.log(`[Recommendations] No triggers detected for user ${userId}`);
      return [];
    }

    // Generate recommendations from each source
    const buddycoachRecs = generateBuddyCoachRecommendations(userId, triggers);
    const buddyshopRecs = await generateBuddyShopRecommendations(userId, triggers);
    const buddycareRecs = await generateBuddyCareRecommendations(
      userId,
      triggers,
      profile
    );

    // Combine and sort by relevance
    const allRecs = [
      ...buddycoachRecs,
      ...buddyshopRecs,
      ...buddycareRecs,
    ].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Limit to top 10 recommendations
    const topRecs = allRecs.slice(0, 10);

    console.log(
      `[Recommendations] Generated ${topRecs.length} recommendations for user ${userId}`
    );

    return topRecs;
  } catch (error) {
    console.error(
      `[Recommendations] Error generating recommendations for user ${userId}:`,
      error
    );
    return [];
  }
}

/**
 * Refresh recommendations for a user (delete old, create new)
 */
export async function refreshRecommendationsForUser(
  userId: number
): Promise<number> {
  try {
    const newRecs = await generateRecommendationsForUser(userId);

    if (newRecs.length === 0) {
      console.log(`[Recommendations] No new recommendations to create for user ${userId}`);
      return 0;
    }

    // Create new recommendations
    const created = await createRecommendationsBatch(newRecs);

    console.log(
      `[Recommendations] Refreshed ${created.length} recommendations for user ${userId}`
    );

    return created.length;
  } catch (error) {
    console.error(
      `[Recommendations] Error refreshing recommendations for user ${userId}:`,
      error
    );
    return 0;
  }
}
