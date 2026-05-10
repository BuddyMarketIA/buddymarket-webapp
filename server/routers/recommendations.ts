/**
 * tRPC Router for Product Recommendations
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getRecommendationsForUser,
  trackRecommendationEvent,
  getRecommendationAnalytics,
} from "../recommendations-db";
import {
  refreshRecommendationsForUser,
} from "../recommendations-engine";

export const recommendationsRouter = router({
  /**
   * Get full history of recommendations for current user
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
        source: z.enum(["buddyshop", "buddycare", "buddycoach", "all"]).default("all"),
        sortBy: z.enum(["recent", "oldest", "relevance"]).default("recent"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const query = `
          SELECT 
            id, externalProductId, source, title, description, reason,
            productImage, productPrice, productUrl, relevanceScore,
            trigger, expiresAt, createdAt
          FROM productRecommendations
          WHERE userId = ? ${input.source !== "all" ? "AND source = ?" : ""}
          ORDER BY ${input.sortBy === "recent" ? "createdAt DESC" : input.sortBy === "oldest" ? "createdAt ASC" : "relevanceScore DESC"}
          LIMIT ? OFFSET ?
        `;
        
        const params = [ctx.user.id];
        if (input.source !== "all") params.push(input.source);
        params.push(input.limit, input.offset);
        
        const recommendations = await (ctx.db as any).execute(query, params);
        
        // Get total count
        const countQuery = `
          SELECT COUNT(*) as total FROM productRecommendations
          WHERE userId = ? ${input.source !== "all" ? "AND source = ?" : ""}
        `;
        const countParams = [ctx.user.id];
        if (input.source !== "all") countParams.push(input.source);
        const countResult = await (ctx.db as any).execute(countQuery, countParams);
        
        return {
          success: true,
          data: recommendations,
          total: countResult[0]?.total || 0,
          count: recommendations.length,
        };
      } catch (error) {
        console.error("[Recommendations] Error fetching history:", error);
        return {
          success: false,
          data: [],
          total: 0,
          count: 0,
          error: "Failed to fetch recommendation history",
        };
      }
    }),

  /**
   * Get recommendations for current user
   */
  getForUser: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const recommendations = await getRecommendationsForUser(
          ctx.user.id,
          input.limit
        );

        return {
          success: true,
          data: recommendations,
          count: recommendations.length,
        };
      } catch (error) {
        console.error("[Recommendations] Error fetching recommendations:", error);
        return {
          success: false,
          data: [],
          count: 0,
          error: "Failed to fetch recommendations",
        };
      }
    }),

  /**
   * Track recommendation event (impression, click, etc)
   */
  trackEvent: protectedProcedure
    .input(
      z.object({
        recommendationId: z.number().int(),
        eventType: z.enum([
          "impression",
          "click",
          "hover",
          "convert",
          "dismiss",
        ]),
        context: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const event = await trackRecommendationEvent({
          userId: ctx.user.id,
          recommendationId: input.recommendationId,
          eventType: input.eventType,
          source: "buddyshop", // Will be updated based on recommendation source
          context: input.context,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        });

        return {
          success: true,
          data: event,
        };
      } catch (error) {
        console.error("[Recommendations] Error tracking event:", error);
        return {
          success: false,
          error: "Failed to track event",
        };
      }
    }),

  /**
   * Get analytics for user's recommendations
   */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const analytics = await getRecommendationAnalytics(ctx.user.id);

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      console.error("[Recommendations] Error fetching analytics:", error);
      return {
        success: false,
        error: "Failed to fetch analytics",
      };
    }
  }),

  /**
   * Refresh recommendations for user (admin only)
   */
  refresh: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Only allow admins to manually refresh
      if (ctx.user.role !== "admin") {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      const count = await refreshRecommendationsForUser(ctx.user.id);

      return {
        success: true,
        data: {
          count,
          message: `${count} recommendations generated`,
        },
      };
    } catch (error) {
      console.error("[Recommendations] Error refreshing recommendations:", error);
      return {
        success: false,
        error: "Failed to refresh recommendations",
      };
    }
  }),
});
