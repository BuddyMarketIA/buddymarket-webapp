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
 * Generate BuddyShop recommendations (kitchen equipment)
 */
export function generateBuddyShopRecommendations(
  userId: number,
  triggers: RecommendationTrigger[]
): NewProductRecommendation[] {
  const recommendations: NewProductRecommendation[] = [];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14); // Valid for 14 days

  // Frequent Cooking Trigger
  if (triggers.some((t) => t.type === "frequent_cooking")) {
    recommendations.push({
      userId,
      externalProductId: "buddyshop_mandoline",
      source: "buddyshop",
      title: "Mandolina Profesional",
      description: "Corta verduras en segundos con precisión",
      reason: "Acelera tus tiempos de preparación en la cocina",
      trigger: "frequent_cooking",
      productUrl: "https://buddyshop.app/products/mandoline",
      productImage: "https://images.unsplash.com/photo-1578500494198-246f612d03b3",
      productPrice: "34.99",
      productCategory: "utensilios",
      relevanceScore: 90,
      cta: "Comprar Mandolina",
      expiresAt,
    });

    recommendations.push({
      userId,
      externalProductId: "buddyshop_bascula",
      source: "buddyshop",
      title: "Báscula Digital Cocina",
      description: "Mide porciones exactas para tus recetas",
      reason: "Precisión en las cantidades para mejor control nutricional",
      trigger: "frequent_cooking",
      productUrl: "https://buddyshop.app/products/kitchen-scale",
      productImage: "https://images.unsplash.com/photo-1584622281867-8d5c815cb5fc",
      productPrice: "24.99",
      productCategory: "medición",
      relevanceScore: 85,
      cta: "Comprar Báscula",
      expiresAt,
    });
  }

  // Complex Recipes Trigger
  if (triggers.some((t) => t.type === "complex_recipes")) {
    recommendations.push({
      userId,
      externalProductId: "buddyshop_cuchillos",
      source: "buddyshop",
      title: "Set Cuchillos Profesionales",
      description: "Cuchillos de cerámica para cortes precisos",
      reason: "Las recetas complejas requieren herramientas de calidad",
      trigger: "complex_recipes",
      productUrl: "https://buddyshop.app/products/knife-set",
      productImage: "https://images.unsplash.com/photo-1593618998160-e34014e67546",
      productPrice: "59.99",
      productCategory: "cuchillos",
      relevanceScore: 88,
      cta: "Comprar Cuchillos",
      expiresAt,
    });
  }

  return recommendations;
}

/**
 * Generate BuddyCare recommendations (health & wellness)
 */
export function generateBuddyCareRecommendations(
  userId: number,
  triggers: RecommendationTrigger[],
  profile: UserNutritionalProfile
): NewProductRecommendation[] {
  const recommendations: NewProductRecommendation[] = [];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Valid for 30 days

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
    const buddyshopRecs = generateBuddyShopRecommendations(userId, triggers);
    const buddycareRecs = generateBuddyCareRecommendations(
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
