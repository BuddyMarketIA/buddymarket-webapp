/**
 * BuddyMarket Learning Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Motor de aprendizaje adaptativo que analiza el comportamiento del usuario
 * y construye un perfil de gustos para mejorar las recomendaciones con el tiempo.
 *
 * Señales que se recogen:
 *   - Recetas guardadas en favoritos (peso: +0.8)
 *   - Recetas cocinadas / registradas como comida (peso: +1.0)
 *   - Likes explícitos (peso: +0.7)
 *   - Dislikes explícitos (peso: -0.8)
 *   - Recetas añadidas a menú (peso: +0.9)
 *   - Vistas largas >30s (peso: +0.3)
 *   - Recetas saltadas en recomendaciones (peso: -0.2)
 *   - Meal logs del diario nutricional (peso: +1.0)
 */

import { db } from "./db";
import {
  recipeInteractions,
  userTasteProfile,
  recipeFavorites,
  recipeLikes,
  mealLogs,
  recipes,
  recipeIngredients,
  ingredients,
} from "../drizzle/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";

// ─── Pesos de cada tipo de interacción ───────────────────────────────────────
const SIGNAL_WEIGHTS: Record<string, number> = {
  log_meal:    1.0,
  cooked:      1.0,
  add_to_menu: 0.9,
  save:        0.8,
  like:        0.7,
  share:       0.5,
  long_view:   0.3,
  view:        0.1,
  skip:       -0.2,
  dislike:    -0.8,
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface TasteScores {
  cuisineScores: Record<string, number>;
  ingredientScores: Record<string, number>;
  cookingMethodScores: Record<string, number>;
  mealTimeScores: Record<string, number>;
  complexityPreference: number;
  avgPrepTimePreference: number;
  avgCaloriesPreference: number;
}

// ─── Función principal: registrar una interacción y actualizar el perfil ──────
export async function trackRecipeInteraction(
  userId: number,
  recipeId: number,
  type: string,
  context?: Record<string, unknown>
): Promise<void> {
  const weight = SIGNAL_WEIGHTS[type] ?? 0;
  if (weight === 0) return;

  // 1. Registrar la interacción
  await db.insert(recipeInteractions).values({
    userId,
    recipeId,
    type: type as any,
    signalWeight: weight,
    context: context ? JSON.stringify(context) : null,
  }).onConflictDoNothing();

  // 2. Actualizar el perfil de gustos de forma asíncrona (no bloquea la respuesta)
  updateTasteProfile(userId).catch(console.error);
}

// ─── Calcular y guardar el perfil de gustos del usuario ──────────────────────
export async function updateTasteProfile(userId: number): Promise<void> {
  try {
    // Obtener las últimas 200 interacciones del usuario
    const interactions = await db
      .select({
        recipeId: recipeInteractions.recipeId,
        type: recipeInteractions.type,
        signalWeight: recipeInteractions.signalWeight,
        createdAt: recipeInteractions.createdAt,
      })
      .from(recipeInteractions)
      .where(eq(recipeInteractions.userId, userId))
      .orderBy(desc(recipeInteractions.createdAt))
      .limit(200);

    if (interactions.length === 0) return;

    // Obtener datos de las recetas involucradas
    const recipeIds = [...new Set(interactions.map(i => i.recipeId))];
    const recipeData = await db
      .select({
    id: recipes.id,
    cuisine: recipes.cuisineType,
    difficulty: recipes.difficulty,
    prepTime: recipes.preparationTime,
    calories: recipes.caloriesPerServing,
    mealTime: recipes.mealTime,
    cookingMethod: recipes.cookingMethod,
      })
      .from(recipes)
      .where(sql`${recipes.id} = ANY(${recipeIds})`);

    const recipeMap = new Map(recipeData.map(r => [r.id, r as { id: number; cuisine: string | null; difficulty: string | null; prepTime: number | null; calories: number | null; mealTime: string | null; cookingMethod: string | null }]));

    // Calcular scores con decaimiento temporal (interacciones recientes pesan más)
    const now = Date.now();
    const scores: TasteScores = {
      cuisineScores: {},
      ingredientScores: {},
      cookingMethodScores: {},
      mealTimeScores: {},
      complexityPreference: 0,
      avgPrepTimePreference: 0,
      avgCaloriesPreference: 0,
    };

    let totalWeight = 0;
    let prepTimeSum = 0;
    let caloriesSum = 0;
    let prepTimeCount = 0;
    let caloriesCount = 0;

    for (const interaction of interactions) {
      const recipe = recipeMap.get(interaction.recipeId);
      if (!recipe) continue;

      // Decaimiento temporal: interacciones de hace 30 días pesan la mitad
      const ageMs = now - new Date(interaction.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const decayFactor = Math.exp(-0.023 * ageDays); // e^(-0.023*30) ≈ 0.5
      const effectiveWeight = interaction.signalWeight * decayFactor;

      totalWeight += Math.abs(effectiveWeight);

      // Cocina / cuisine
      if (recipe.cuisine) {
        scores.cuisineScores[recipe.cuisine] = (scores.cuisineScores[recipe.cuisine] || 0) + effectiveWeight;
      }

      // Método de cocción
      if (recipe.cookingMethod) {
        scores.cookingMethodScores[recipe.cookingMethod] = (scores.cookingMethodScores[recipe.cookingMethod] || 0) + effectiveWeight;
      }

      // Momento del día
      if (recipe.mealTime) {
        scores.mealTimeScores[recipe.mealTime] = (scores.mealTimeScores[recipe.mealTime] || 0) + effectiveWeight;
      }

      // Complejidad (easy=-1, medium=0, hard=1)
      const complexityMap: Record<string, number> = { easy: -1, medium: 0, hard: 1 };
      if (recipe.difficulty && complexityMap[recipe.difficulty] !== undefined) {
        scores.complexityPreference += complexityMap[recipe.difficulty] * effectiveWeight;
      }

      // Tiempo de preparación y calorías (solo para interacciones positivas)
      if (effectiveWeight > 0) {
        if (recipe.prepTime) {
          prepTimeSum += recipe.prepTime * effectiveWeight;
          prepTimeCount += effectiveWeight;
        }
        if (recipe.calories) {
          caloriesSum += recipe.calories * effectiveWeight;
          caloriesCount += effectiveWeight;
        }
      }
    }

    // Normalizar complejidad
    if (totalWeight > 0) {
      scores.complexityPreference = scores.complexityPreference / totalWeight;
    }
    scores.avgPrepTimePreference = prepTimeCount > 0 ? prepTimeSum / prepTimeCount : 30;
    scores.avgCaloriesPreference = caloriesCount > 0 ? caloriesSum / caloriesCount : 500;

    // Calcular nivel de confianza (0-100) basado en número de interacciones
    const confidenceScore = Math.min(100, Math.floor(interactions.length * 2));

    // Guardar o actualizar el perfil
    await db
      .insert(userTasteProfile)
      .values({
        userId,
        cuisineScores: JSON.stringify(scores.cuisineScores),
        ingredientScores: JSON.stringify(scores.ingredientScores),
        cookingMethodScores: JSON.stringify(scores.cookingMethodScores),
        mealTimeScores: JSON.stringify(scores.mealTimeScores),
        complexityPreference: scores.complexityPreference,
        avgPrepTimePreference: scores.avgPrepTimePreference,
        avgCaloriesPreference: scores.avgCaloriesPreference,
        totalInteractions: interactions.length,
        confidenceScore,
        lastCalculatedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userTasteProfile.userId,
        set: {
          cuisineScores: JSON.stringify(scores.cuisineScores),
          ingredientScores: JSON.stringify(scores.ingredientScores),
          cookingMethodScores: JSON.stringify(scores.cookingMethodScores),
          mealTimeScores: JSON.stringify(scores.mealTimeScores),
          complexityPreference: scores.complexityPreference,
          avgPrepTimePreference: scores.avgPrepTimePreference,
          avgCaloriesPreference: scores.avgCaloriesPreference,
          totalInteractions: interactions.length,
          confidenceScore,
          lastCalculatedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("[LearningEngine] Error updating taste profile:", err);
  }
}

// ─── Obtener el perfil de gustos del usuario ──────────────────────────────────
export async function getUserTasteProfile(userId: number) {
  const profile = await db
    .select()
    .from(userTasteProfile)
    .where(eq(userTasteProfile.userId, userId))
    .limit(1);

  if (profile.length === 0) return null;

  const p = profile[0];
  return {
    ...p,
    cuisineScores: JSON.parse(p.cuisineScores || "{}"),
    ingredientScores: JSON.parse(p.ingredientScores || "{}"),
    cookingMethodScores: JSON.parse(p.cookingMethodScores || "{}"),
    mealTimeScores: JSON.parse(p.mealTimeScores || "{}"),
  };
}

// ─── Calcular el BuddyScore (nivel de aprendizaje visible al usuario) ─────────
export function calculateBuddyScore(totalInteractions: number, confidenceScore: number): {
  level: number;        // 1-5
  levelName: string;
  levelEmoji: string;
  progress: number;     // 0-100 dentro del nivel actual
  nextMilestone: number; // interacciones para el siguiente nivel
  description: string;
} {
  const milestones = [0, 10, 30, 60, 100, 200];
  const levelNames = ["Recién llegado", "Conocido", "Amigo", "Compañero", "Experto"];
  const levelEmojis = ["🌱", "🌿", "🌳", "⭐", "🧠"];
  const descriptions = [
    "BuddyMarket está aprendiendo tus primeras preferencias.",
    "Ya conozco algunos de tus gustos. Las recomendaciones mejoran.",
    "Tengo un buen perfil tuyo. Las recetas que te sugiero son cada vez más tuyas.",
    "Conozco muy bien tus preferencias. Los menús IA ya son casi perfectos para ti.",
    "Soy tu nutricionista personal. Cada recomendación está hecha a tu medida.",
  ];

  let level = 0;
  for (let i = 0; i < milestones.length - 1; i++) {
    if (totalInteractions >= milestones[i]) level = i;
  }
  level = Math.min(level, 4);

  const currentMilestone = milestones[level];
  const nextMilestone = milestones[level + 1] || milestones[milestones.length - 1];
  const progress = level === 4
    ? 100
    : Math.min(100, Math.floor(((totalInteractions - currentMilestone) / (nextMilestone - currentMilestone)) * 100));

  return {
    level: level + 1,
    levelName: levelNames[level],
    levelEmoji: levelEmojis[level],
    progress,
    nextMilestone,
    description: descriptions[level],
  };
}

// ─── Sincronizar interacciones desde datos existentes (favoritos, likes, meal logs) ──
export async function syncExistingInteractions(userId: number): Promise<void> {
  try {
    // Favoritos → "save"
    const favorites = await db
      .select({ recipeId: recipeFavorites.recipeId, createdAt: recipeFavorites.createdAt })
      .from(recipeFavorites)
      .where(eq(recipeFavorites.userId, userId));

    for (const fav of favorites) {
      await db.insert(recipeInteractions).values({
        userId,
        recipeId: fav.recipeId,
        type: "save" as any,
        signalWeight: SIGNAL_WEIGHTS.save,
        createdAt: fav.createdAt,
      }).onConflictDoNothing();
    }

    // Likes → "like"
    const likes = await db
      .select({ recipeId: recipeLikes.recipeId, createdAt: recipeLikes.createdAt })
      .from(recipeLikes)
      .where(eq(recipeLikes.userId, userId));

    for (const like of likes) {
      await db.insert(recipeInteractions).values({
        userId,
        recipeId: like.recipeId,
        type: "like" as any,
        signalWeight: SIGNAL_WEIGHTS.like,
        createdAt: like.createdAt,
      }).onConflictDoNothing();
    }

    // Meal logs → "log_meal"
    const logs = await db
      .select({ recipeId: mealLogs.recipeId, createdAt: mealLogs.createdAt })
      .from(mealLogs)
      .where(and(eq(mealLogs.userId, userId), sql`${mealLogs.recipeId} IS NOT NULL`));

    for (const log of logs) {
      if (!log.recipeId) continue;
      await db.insert(recipeInteractions).values({
        userId,
        recipeId: log.recipeId,
        type: "log_meal" as any,
        signalWeight: SIGNAL_WEIGHTS.log_meal,
        createdAt: log.createdAt,
      }).onConflictDoNothing();
    }

    // Recalcular perfil
    await updateTasteProfile(userId);
  } catch (err) {
    console.error("[LearningEngine] Error syncing existing interactions:", err);
  }
}

// ─── Puntuar recetas para recomendaciones personalizadas ──────────────────────
export async function scoreRecipesForUser(
  userId: number,
  recipeList: Array<{ id: number; cuisineType?: string | null; difficulty?: string | null; preparationTime?: number | null; caloriesPerServing?: number | null; mealTime?: string | null; cookingMethod?: string | null }>
): Promise<Array<{ id: number; score: number }>> {
  const profile = await getUserTasteProfile(userId);
  if (!profile || profile.confidenceScore < 5) {
    // Sin suficientes datos, devolver orden original
    return recipeList.map(r => ({ id: r.id, score: 0.5 }));
  }

  return recipeList.map(recipe => {
    let score = 0.5; // base neutral

    // Bonus por cocina preferida
    if (recipe.cuisineType && profile.cuisineScores[recipe.cuisineType]) {
      score += profile.cuisineScores[recipe.cuisineType] * 0.2;
    }

    // Bonus por método de cocción preferido
    if (recipe.cookingMethod && profile.cookingMethodScores[recipe.cookingMethod]) {
      score += profile.cookingMethodScores[recipe.cookingMethod] * 0.15;
    }

    // Bonus por momento del día
    if (recipe.mealTime && profile.mealTimeScores[recipe.mealTime]) {
      score += profile.mealTimeScores[recipe.mealTime] * 0.1;
    }

    // Penalización por complejidad no deseada
    const complexityMap: Record<string, number> = { easy: -1, medium: 0, hard: 1 };
    if (recipe.difficulty) {
      const recipeComplexity = complexityMap[recipe.difficulty] ?? 0;
      const diff = Math.abs(recipeComplexity - profile.complexityPreference);
      score -= diff * 0.1;
    }

    // Bonus por tiempo de preparación cercano al preferido
    if (recipe.preparationTime && profile.avgPrepTimePreference > 0) {
      const timeDiff = Math.abs(recipe.preparationTime - profile.avgPrepTimePreference);
      score += Math.max(0, 0.1 - timeDiff * 0.002);
    }

    return { id: recipe.id, score: Math.max(0, Math.min(1, score)) };
  });
}
