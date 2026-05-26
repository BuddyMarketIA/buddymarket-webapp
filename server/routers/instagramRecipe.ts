import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import { recipes } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Instagram Recipe Import Router
 * 
 * This feature allows users to paste an Instagram reel/post URL and get an
 * AI-generated ORIGINAL recipe inspired by the content. It does NOT copy
 * the original recipe — it creates a new, unique version that maintains
 * the spirit/style but with different ingredients, proportions, and instructions.
 */

export const instagramRecipeRouter = router({
  /**
   * Generate an original recipe inspired by an Instagram post.
   * The AI analyzes the description/caption and creates a NEW recipe
   * that is similar in style but original (no IP infringement).
   */
  generateFromUrl: protectedProcedure
    .input(
      z.object({
        url: z.string().url().refine(
          (url) => url.includes("instagram.com"),
          "Must be an Instagram URL"
        ),
        caption: z.string().min(1).max(5000).optional(),
        preferences: z.object({
          lowerCalories: z.boolean().optional(),
          higherProtein: z.boolean().optional(),
          adaptToAllergies: z.boolean().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { url, caption, preferences } = input;

      // Build the prompt for the AI
      const systemPrompt = `Eres un chef nutricionista creativo. Tu trabajo es crear recetas ORIGINALES inspiradas en contenido de redes sociales.

REGLAS IMPORTANTES:
1. NUNCA copies una receta literal. Crea algo ORIGINAL e INSPIRADO en el concepto.
2. Cambia al menos el 40% de los ingredientes por alternativas similares.
3. Modifica las proporciones y técnicas de cocción.
4. Dale un nombre creativo y diferente.
5. Mantén el "espíritu" del plato (si es un bowl proteico, hazlo bowl proteico pero diferente).
6. Incluye valores nutricionales calculados de forma realista.
7. Todas las instrucciones deben ser claras y en español.

El resultado debe ser una receta que alguien podría hacer fácilmente en casa, con ingredientes accesibles en supermercados españoles.`;

      let userPrompt = `Basándote en este contenido de Instagram, crea una receta ORIGINAL e INSPIRADA (no una copia):

URL: ${url}
`;

      if (caption) {
        userPrompt += `\nDescripción/Caption del post:\n${caption}\n`;
      }

      if (preferences?.lowerCalories) {
        userPrompt += "\nPreferencia: Hazla más baja en calorías (máximo 400 kcal por ración).";
      }
      if (preferences?.higherProtein) {
        userPrompt += "\nPreferencia: Aumenta la proteína (mínimo 35g por ración).";
      }
      if (preferences?.adaptToAllergies) {
        userPrompt += `\nPreferencia: Adapta para evitar alérgenos comunes si es posible.`;
      }

      userPrompt += `\n\nGenera la receta en formato JSON con esta estructura exacta.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "instagram_inspired_recipe",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string", description: "Nombre creativo y original de la receta" },
                description: { type: "string", description: "Descripción atractiva de 1-2 frases" },
                preparationTime: { type: "integer", description: "Tiempo de preparación en minutos" },
                cookTime: { type: "integer", description: "Tiempo de cocción en minutos" },
                servings: { type: "integer", description: "Número de raciones" },
                difficulty: { type: "string", description: "easy, medium, o hard" },
                mealTime: { type: "string", description: "desayuno, media_manana, comida, merienda, o cena" },
                cuisineType: { type: "string", description: "Tipo de cocina" },
                cookingMethod: { type: "string", description: "Método principal de cocción" },
                caloriesPerServing: { type: "integer", description: "Calorías por ración" },
                proteinsPerServing: { type: "number", description: "Proteínas en gramos" },
                carbsPerServing: { type: "number", description: "Carbohidratos en gramos" },
                fatsPerServing: { type: "number", description: "Grasas en gramos" },
                fiberPerServing: { type: "number", description: "Fibra en gramos" },
                ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      amount: { type: "string" },
                      unit: { type: "string" },
                      category: { type: "string" },
                    },
                    required: ["name", "amount", "unit", "category"],
                    additionalProperties: false,
                  },
                },
                instructions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      step: { type: "integer" },
                      text: { type: "string" },
                    },
                    required: ["step", "text"],
                    additionalProperties: false,
                  },
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags relevantes como fitness, low-cal, alta-proteina, rapida, etc.",
                },
                inspirationNote: { type: "string", description: "Breve nota sobre qué te inspiró del post original (1 frase)" },
              },
              required: [
                "name", "description", "preparationTime", "cookTime", "servings",
                "difficulty", "mealTime", "cuisineType", "cookingMethod",
                "caloriesPerServing", "proteinsPerServing", "carbsPerServing",
                "fatsPerServing", "fiberPerServing", "ingredients", "instructions",
                "tags", "inspirationNote"
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
      if (!content) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No se pudo generar la receta. Inténtalo de nuevo.",
        });
      }

      const recipe = JSON.parse(content as string);
      return {
        recipe,
        disclaimer: "Esta receta es una creación original de Buddy One inspirada en el contenido. No es una copia del post original.",
      };
    }),

  /**
   * Save a generated Instagram-inspired recipe to the user's collection.
   */
  saveRecipe: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(200),
        description: z.string().max(2000).optional(),
        preparationTime: z.number().int().min(0).optional(),
        cookTime: z.number().int().min(0).optional(),
        servings: z.number().int().min(1).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        mealTime: z.string().optional(),
        cuisineType: z.string().optional(),
        cookingMethod: z.string().optional(),
        caloriesPerServing: z.number().int().optional(),
        proteinsPerServing: z.number().optional(),
        carbsPerServing: z.number().optional(),
        fatsPerServing: z.number().optional(),
        fiberPerServing: z.number().optional(),
        ingredientsJson: z.string().optional(),
        instructionsJson: z.string().optional(),
        tags: z.string().optional(),
        sourceUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await drizzleDb.insert(recipes).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        preparationTime: input.preparationTime,
        cookTime: input.cookTime,
        servings: input.servings,
        difficulty: input.difficulty ?? "medium",
        mealTime: (input.mealTime as any) ?? "cualquiera",
        cuisineType: input.cuisineType,
        cookingMethod: input.cookingMethod,
        caloriesPerServing: input.caloriesPerServing,
        proteinsPerServing: input.proteinsPerServing,
        carbsPerServing: input.carbsPerServing,
        fatsPerServing: input.fatsPerServing,
        fiberPerServing: input.fiberPerServing,
        ingredientsJson: input.ingredientsJson,
        instructionsJson: input.instructionsJson,
        tags: input.tags,
        isPublic: false,
        active: true,
        imageUrl: "imageUrl",
      }).returning({ id: recipes.id });

      return { id: result[0]?.id ?? 0, success: true };
    }),
});
