/**
 * mealPrep router — Meal Prep Planner / Batch Cooking
 * Groups weekly menu recipes by preparation type and generates an optimized cooking plan
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

export const mealPrepRouter = router({
  /**
   * Generate a batch cooking plan from a menu
   */
  generatePlan: protectedProcedure
    .input(z.object({
      menuId: z.number().optional(),
      recipeIds: z.array(z.number()).optional(),
      availableHours: z.number().min(1).max(8).default(3),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB not available");

      const { recipes, menuOrganizers, menuDayParts, menuRecipes } = await import("../../drizzle/schema");
      const { eq, inArray, and, isNull } = await import("drizzle-orm");

      let recipeList: any[] = [];

      if (input.menuId) {
        // Get recipes from menu
        const dayParts = await drizzleDb
          .select({ id: menuDayParts.id })
          .from(menuDayParts)
          .where(eq(menuDayParts.menuOrganizerId, input.menuId));

        if (dayParts.length > 0) {
          const dpIds = dayParts.map(dp => dp.id);
          const menuRecipeRows = await drizzleDb
            .select({ recipeId: menuRecipes.recipeId })
            .from(menuRecipes)
            .where(inArray(menuRecipes.menuDayPartId, dpIds));

          const recipeIds = [...new Set(menuRecipeRows.map(r => r.recipeId).filter(Boolean))];
          if (recipeIds.length > 0) {
            recipeList = await drizzleDb
              .select()
              .from(recipes)
              .where(and(inArray(recipes.id, recipeIds as number[]), isNull(recipes.deletedAt)));
          }
        }
      } else if (input.recipeIds && input.recipeIds.length > 0) {
        recipeList = await drizzleDb
          .select()
          .from(recipes)
          .where(and(inArray(recipes.id, input.recipeIds), isNull(recipes.deletedAt)));
      }

      if (recipeList.length === 0) {
        return { plan: null, error: "No recipes found" };
      }

      // Use LLM to generate optimized batch cooking plan
      const { invokeLLM } = await import("../_core/llm");

      const recipesSummary = recipeList.map(r => ({
        id: r.id,
        name: r.name,
        prepTime: r.prepTime,
        ingredients: r.ingredients,
        instructions: r.instructions,
      }));

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Eres un experto en meal prep y batch cooking. Genera un plan de preparación optimizado para cocinar varias recetas de forma eficiente en una sesión. El plan debe:
1. Agrupar tareas similares (cortar verduras, cocinar proteínas, preparar salsas)
2. Aprovechar tiempos muertos (mientras algo está en el horno, preparar otra cosa)
3. Indicar qué se puede congelar y qué refrigerar
4. Dar tiempos estimados por fase
5. Sugerir orden óptimo de preparación

Responde SIEMPRE en JSON válido con esta estructura:
{
  "totalTime": "2h 30min",
  "phases": [
    {
      "order": 1,
      "title": "Preparación de ingredientes",
      "duration": "30min",
      "tasks": [
        { "task": "Cortar todas las verduras", "recipes": ["Ensalada griega", "Wok de pollo"], "tip": "Usa el mismo cuchillo y tabla" }
      ]
    }
  ],
  "storageGuide": [
    { "recipe": "Wok de pollo", "method": "refrigerar", "duration": "3-4 días", "container": "Tupperware hermético" }
  ],
  "shoppingTips": ["Compra las verduras el mismo día del prep para máxima frescura"],
  "simultaneousTasks": ["Mientras el arroz se cocina (20min), prepara la vinagreta y corta la fruta"]
}`
          },
          {
            role: "user",
            content: `Genera un plan de batch cooking para estas ${recipeList.length} recetas en ${input.availableHours} horas disponibles:\n\n${JSON.stringify(recipesSummary.map(r => ({ name: r.name, prepTime: r.prepTime, ingredients: r.ingredients?.substring(0, 200) })), null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
      });

      let plan;
      try {
        plan = JSON.parse(response.choices[0].message.content || "{}");
      } catch {
        plan = { error: "Could not parse plan", raw: response.choices[0].message.content };
      }

      return { plan, recipeCount: recipeList.length };
    }),
});
