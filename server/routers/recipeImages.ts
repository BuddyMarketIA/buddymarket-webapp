/**
 * Recipe Image Generation Router
 * 
 * Processes recipe images in batches of 100, generating AI images
 * of the finished/plated dish (not ingredients) and uploading to S3.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { generateImage } from "../_core/imageGeneration";
import * as db from "../db";
import { recipes } from "../../drizzle/schema";
import { eq, sql, and, isNotNull, asc } from "drizzle-orm";

export const recipeImagesRouter = router({
  /**
   * Get stats about recipe image generation progress
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Only admin can access
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores" });
    }

    const drizzleDb = await db.getDb();
    const result = await drizzleDb.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "imageUrl" LIKE '%unsplash%' THEN 1 END) as unsplash_images,
        COUNT(CASE WHEN "imageUrl" LIKE '%storage%' OR "imageUrl" LIKE '%generated%' OR "imageUrl" LIKE '%forge%' THEN 1 END) as ai_generated,
        COUNT(CASE WHEN "imageUrl" IS NULL OR "imageUrl" = '' THEN 1 END) as no_image,
        COUNT(CASE WHEN "isSeeded" = true THEN 1 END) as seeded
      FROM recipes
      WHERE "deletedAt" IS NULL
    `);

    const row = result.rows[0] as any;
    return {
      total: Number(row.total),
      unsplashImages: Number(row.unsplash_images),
      aiGenerated: Number(row.ai_generated),
      noImage: Number(row.no_image),
      seeded: Number(row.seeded),
      pendingBatches: Math.ceil(Number(row.unsplash_images) / 100),
    };
  }),

  /**
   * Generate dish images for a batch of 100 recipes
   * Processes recipes that still have Unsplash URLs (ingredient photos)
   * and replaces them with AI-generated dish photos
   */
  generateBatch: protectedProcedure
    .input(z.object({
      batchSize: z.number().min(1).max(100).default(100),
      offset: z.number().min(0).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admin can trigger
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores" });
      }

      const drizzleDb = await db.getDb();

      // Get recipes that still have Unsplash images (old ingredient photos)
      const recipeBatch = await drizzleDb.execute(sql`
        SELECT id, name, "mealTime", "cuisineType", "cookingMethod"
        FROM recipes
        WHERE "deletedAt" IS NULL
          AND "isSeeded" = true
          AND "imageUrl" LIKE '%unsplash%'
        ORDER BY id ASC
        LIMIT ${input.batchSize}
        OFFSET ${input.offset}
      `);

      if (recipeBatch.rows.length === 0) {
        return { processed: 0, success: 0, failed: 0, message: "No hay más recetas pendientes" };
      }

      let success = 0;
      let failed = 0;
      const errors: Array<{ id: number; name: string; error: string }> = [];

      for (const recipe of recipeBatch.rows as any[]) {
        try {
          // Build a descriptive prompt for the finished dish
          const prompt = buildDishPrompt(recipe.name, recipe.mealTime, recipe.cuisineType, recipe.cookingMethod);

          // Generate the image using AI
          const result = await generateImage({ prompt });

          if (result.url) {
            // Update the recipe with the new AI-generated image
            await drizzleDb.execute(sql`
              UPDATE recipes 
              SET "imageUrl" = ${result.url}, "updatedAt" = NOW()
              WHERE id = ${recipe.id}
            `);
            success++;
          } else {
            failed++;
            errors.push({ id: recipe.id, name: recipe.name, error: "No URL returned" });
          }
        } catch (err: any) {
          failed++;
          errors.push({ id: recipe.id, name: recipe.name, error: err.message?.substring(0, 100) || "Unknown error" });
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return {
        processed: recipeBatch.rows.length,
        success,
        failed,
        errors: errors.slice(0, 10), // Only return first 10 errors
        message: `Lote procesado: ${success} éxitos, ${failed} fallos de ${recipeBatch.rows.length} recetas`,
      };
    }),

  /**
   * Generate a single recipe dish image (for testing or manual fixes)
   */
  generateSingle: protectedProcedure
    .input(z.object({ recipeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores" });
      }

      const drizzleDb = await db.getDb();
      const result = await drizzleDb.execute(sql`
        SELECT id, name, "mealTime", "cuisineType", "cookingMethod"
        FROM recipes WHERE id = ${input.recipeId}
      `);

      if (result.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Receta no encontrada" });
      }

      const recipe = result.rows[0] as any;
      const prompt = buildDishPrompt(recipe.name, recipe.mealTime, recipe.cuisineType, recipe.cookingMethod);

      const imageResult = await generateImage({ prompt });

      if (imageResult.url) {
        await drizzleDb.execute(sql`
          UPDATE recipes 
          SET "imageUrl" = ${imageResult.url}, "updatedAt" = NOW()
          WHERE id = ${input.recipeId}
        `);
      }

      return {
        recipeId: input.recipeId,
        recipeName: recipe.name,
        prompt,
        imageUrl: imageResult.url || null,
      };
    }),
});

/**
 * Build a professional food photography prompt for the finished dish
 */
function buildDishPrompt(
  name: string,
  mealTime?: string | null,
  cuisineType?: string | null,
  cookingMethod?: string | null
): string {
  // Clean the recipe name (remove emojis, special chars)
  const cleanName = name.replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜàèìòùâêîôûäëïöü:,\-()]/g, "").trim();

  let prompt = `Professional food photography of "${cleanName}" as a finished plated dish. `;
  prompt += `The image shows the complete prepared meal served on a plate, ready to eat. `;
  prompt += `Top-down or 45-degree angle, restaurant quality presentation. `;
  prompt += `Natural lighting, shallow depth of field, clean background. `;

  if (cuisineType) {
    prompt += `${cuisineType} cuisine style plating. `;
  }

  if (mealTime) {
    const mealContext: Record<string, string> = {
      desayuno: "Breakfast presentation with morning light.",
      media_manana: "Light mid-morning snack presentation.",
      comida: "Lunch/dinner main course presentation.",
      merienda: "Afternoon snack or light bite presentation.",
      cena: "Elegant dinner presentation with warm lighting.",
      cualquiera: "",
    };
    prompt += mealContext[mealTime] || "";
  }

  prompt += `High resolution, appetizing, food magazine quality.`;

  return prompt;
}
