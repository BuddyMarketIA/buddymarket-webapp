/**
 * Database helpers for product recommendations
 * Handles CRUD operations and analytics for product recommendations
 */

import { getDb } from "./db";
import {
  productRecommendations,
  recommendationEvents,
  productCache,
  userProductInteractions,
  NewProductRecommendation,
  NewRecommendationEvent,
  NewProductCache,
  NewUserProductInteraction,
  ProductRecommendation,
  RecommendationEvent,
  ProductCache,
  UserProductInteraction,
} from "../drizzle/schema";
import { eq, and, gt, lt, desc, asc, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT RECOMMENDATIONS CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get active recommendations for a user
 */
export async function getRecommendationsForUser(
  userId: number,
  limit: number = 5
): Promise<ProductRecommendation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();
  const recommendations = await db
    .select()
    .from(productRecommendations)
    .where(
      and(
        eq(productRecommendations.userId, userId),
        // Only active recommendations (not expired)
        gt(productRecommendations.expiresAt, now)
      )
    )
    .orderBy(desc(productRecommendations.relevanceScore))
    .limit(limit);

  return recommendations;
}

/**
 * Create a new recommendation
 */
export async function createRecommendation(
  data: NewProductRecommendation
): Promise<ProductRecommendation> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .insert(productRecommendations)
    .values(data)
    .returning();

  return result[0];
}

/**
 * Create multiple recommendations at once
 */
export async function createRecommendationsBatch(
  data: NewProductRecommendation[]
): Promise<ProductRecommendation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  if (data.length === 0) return [];

  const result = await db
    .insert(productRecommendations)
    .values(data)
    .returning();

  return result;
}

/**
 * Mark recommendation as clicked
 */
export async function markRecommendationClicked(
  recommendationId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(productRecommendations)
    .set({
      clicked: true,
      clickedAt: new Date(),
    })
    .where(eq(productRecommendations.id, recommendationId));
}

/**
 * Mark recommendation as converted (purchased)
 */
export async function markRecommendationConverted(
  recommendationId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db
    .update(productRecommendations)
    .set({
      converted: true,
      convertedAt: new Date(),
    })
    .where(eq(productRecommendations.id, recommendationId));
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION EVENTS (ANALYTICS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Track a recommendation event (impression, click, etc)
 */
export async function trackRecommendationEvent(
  data: NewRecommendationEvent
): Promise<RecommendationEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .insert(recommendationEvents)
    .values(data)
    .returning();

  return result[0];
}

/**
 * Get recommendation analytics for a user
 */
export async function getRecommendationAnalytics(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Get total recommendations
  const totalRecs = await db
    .select({ count: sql<number>`count(*)` })
    .from(productRecommendations)
    .where(eq(productRecommendations.userId, userId));

  // Get click-through rate
  const clickedRecs = await db
    .select({ count: sql<number>`count(*)` })
    .from(productRecommendations)
    .where(
      and(
        eq(productRecommendations.userId, userId),
        eq(productRecommendations.clicked, true)
      )
    );

  // Get conversion rate
  const convertedRecs = await db
    .select({ count: sql<number>`count(*)` })
    .from(productRecommendations)
    .where(
      and(
        eq(productRecommendations.userId, userId),
        eq(productRecommendations.converted, true)
      )
    );

  // Get events by type
  const eventsByType = await db
    .select({
      eventType: recommendationEvents.eventType,
      count: sql<number>`count(*)`,
    })
    .from(recommendationEvents)
    .where(eq(recommendationEvents.userId, userId))
    .groupBy(recommendationEvents.eventType);

  // Get recommendations by source
  const recsBySource = await db
    .select({
      source: productRecommendations.source,
      count: sql<number>`count(*)`,
    })
    .from(productRecommendations)
    .where(eq(productRecommendations.userId, userId))
    .groupBy(productRecommendations.source);

  const total = totalRecs[0]?.count || 0;
  const clicked = clickedRecs[0]?.count || 0;
  const converted = convertedRecs[0]?.count || 0;

  return {
    total,
    clicked,
    converted,
    ctr: total > 0 ? (clicked / total) * 100 : 0, // Click-through rate
    conversionRate: total > 0 ? (converted / total) * 100 : 0,
    eventsByType,
    recsBySource,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CACHE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get cached product from cache
 */
export async function getCachedProduct(
  source: "buddyshop" | "buddycare" | "buddycoach",
  externalProductId: string
): Promise<ProductCache | null> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();
  const cached = await db
    .select()
    .from(productCache)
    .where(
      and(
        eq(productCache.source, source),
        eq(productCache.externalProductId, externalProductId),
        gt(productCache.expiresAt, now) // Only return if not expired
      )
    )
    .limit(1);

  return cached[0] || null;
}

/**
 * Cache a product from external API
 */
export async function cacheProduct(
  data: NewProductCache
): Promise<ProductCache> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Try to update existing cache first
  const existing = await db
    .select()
    .from(productCache)
    .where(
      and(
        eq(productCache.source, data.source),
        eq(productCache.externalProductId, data.externalProductId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing cache
    await db
      .update(productCache)
      .set({
        data: data.data,
        expiresAt: data.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(productCache.id, existing[0].id));

    return { ...existing[0], ...data };
  }

  // Create new cache entry
  const result = await db
    .insert(productCache)
    .values(data)
    .returning();

  return result[0];
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();
  const result = await db
    .delete(productCache)
    .where(lt(productCache.expiresAt, now));

  return result.rowCount || 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER PRODUCT INTERACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Track user product interaction
 */
export async function trackProductInteraction(
  data: NewUserProductInteraction
): Promise<UserProductInteraction> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .insert(userProductInteractions)
    .values(data)
    .returning();

  return result[0];
}

/**
 * Get user's product interaction history
 */
export async function getUserProductHistory(
  userId: number,
  source?: "buddyshop" | "buddycare" | "buddycoach",
  limit: number = 100
): Promise<UserProductInteraction[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  let query = db
    .select()
    .from(userProductInteractions)
    .where(eq(userProductInteractions.userId, userId));

  if (source) {
    query = query.where(eq(userProductInteractions.source, source));
  }

  const history = await query
    .orderBy(desc(userProductInteractions.createdAt))
    .limit(limit);

  return history;
}

/**
 * Get user's favorite products
 */
export async function getUserFavoriteProducts(
  userId: number,
  limit: number = 50
): Promise<UserProductInteraction[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const favorites = await db
    .select()
    .from(userProductInteractions)
    .where(
      and(
        eq(userProductInteractions.userId, userId),
        eq(userProductInteractions.interactionType, "favorite")
      )
    )
    .orderBy(desc(userProductInteractions.createdAt))
    .limit(limit);

  return favorites;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEANUP & MAINTENANCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clean up expired recommendations
 */
export async function cleanupExpiredRecommendations(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();
  const result = await db
    .delete(productRecommendations)
    .where(lt(productRecommendations.expiresAt, now));

  return result.rowCount || 0;
}

/**
 * Delete old recommendation events (keep last 90 days)
 */
export async function cleanupOldEvents(daysToKeep: number = 90): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await db
    .delete(recommendationEvents)
    .where(lt(recommendationEvents.createdAt, cutoffDate));

  return result.rowCount || 0;
}
