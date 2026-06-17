import { z } from "zod";
import { protectedProcedure } from "../_core/trpc";
import { router } from "../_core/trpc";
import { getDb } from "../db";
import {
  recipes,
  expertRecipeCollections,
  expertRecipeCollectionItems,
  expertRecipeAssignments,
  offlinePatients,
} from "../../drizzle/schema";
import { eq, and, desc, ilike, or, inArray, sql } from "drizzle-orm";
import { Resend } from "resend";

export const expertRecipesRouter = router({
  // ─── MY RECIPES ────────────────────────────────────────────────────────────

  // List all recipes created by this expert (isPublic=false, userId=me)
  listMyRecipes: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      mealTime: z.string().optional(),
      category: z.string().optional(),
      collectionId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const expertId = ctx.user.id;

      // If filtering by collection, get recipe IDs from that collection
      if (input?.collectionId) {
        const items = await db
          .select({ recipeId: expertRecipeCollectionItems.recipeId })
          .from(expertRecipeCollectionItems)
          .where(eq(expertRecipeCollectionItems.collectionId, input.collectionId));
        const recipeIds = items.map(i => i.recipeId);
        if (recipeIds.length === 0) return [];
        const collectionRecipes = await db
          .select()
          .from(recipes)
          .where(and(
            inArray(recipes.id, recipeIds),
            eq(recipes.userId, expertId),
          ))
          .orderBy(desc(recipes.createdAt));
        return collectionRecipes;
      }

      const conditions = [eq(recipes.userId, expertId)];
      if (input?.search) {
        conditions.push(ilike(recipes.name, `%${input.search}%`));
      }
      if (input?.mealTime) {
        conditions.push(eq(recipes.mealTime, input.mealTime as any));
      }
      if (input?.category) {
        conditions.push(eq(recipes.category, input.category));
      }

      return db
        .select()
        .from(recipes)
        .where(and(...conditions))
        .orderBy(desc(recipes.createdAt));
    }),

  // Search public BuddyOne recipes to add to library
  searchPublicRecipes: protectedProcedure
    .input(z.object({
      search: z.string().min(2),
      mealTime: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [
        eq(recipes.isPublic, true),
        eq(recipes.active, true),
      ];
      if (input.search) {
        conditions.push(ilike(recipes.name, `%${input.search}%`));
      }
      if (input.mealTime) {
        conditions.push(eq(recipes.mealTime, input.mealTime as any));
      }
      if (input.category) {
        conditions.push(eq(recipes.category, input.category));
      }
      return db
        .select({
          id: recipes.id,
          name: recipes.name,
          imageUrl: recipes.imageUrl,
          description: recipes.description,
          preparationTime: recipes.preparationTime,
          cookTime: recipes.cookTime,
          servings: recipes.servings,
          difficulty: recipes.difficulty,
          mealTime: recipes.mealTime,
          category: recipes.category,
          caloriesPerServing: recipes.caloriesPerServing,
          proteinsPerServing: recipes.proteinsPerServing,
          carbsPerServing: recipes.carbsPerServing,
          fatsPerServing: recipes.fatsPerServing,
          allergens: recipes.allergens,
          ingredientsJson: recipes.ingredientsJson,
          instructionsJson: recipes.instructionsJson,
        })
        .from(recipes)
        .where(and(...conditions))
        .orderBy(desc(recipes.createdAt))
        .limit(input.limit);
    }),

  // Get a single recipe by ID
  getRecipe: protectedProcedure
    .input(z.object({ recipeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [recipe] = await db
        .select()
        .from(recipes)
        .where(and(
          eq(recipes.id, input.recipeId),
          or(
            eq(recipes.userId, ctx.user.id),
            eq(recipes.isPublic, true),
          )
        ));
      return recipe ?? null;
    }),

  // Create a new private recipe
  createRecipe: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(256),
      description: z.string().optional(),
      preparationTime: z.number().default(0),
      cookTime: z.number().default(0),
      servings: z.number().default(1),
      difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
      mealTime: z.enum(["desayuno", "media_manana", "comida", "merienda", "cena", "cualquiera"]).default("cualquiera"),
      category: z.string().optional(),
      cuisineType: z.string().optional(),
      cookingMethod: z.string().optional(),
      allergens: z.string().optional(), // JSON array
      tags: z.string().optional(),      // JSON array
      caloriesPerServing: z.number().optional(),
      proteinsPerServing: z.number().optional(),
      carbsPerServing: z.number().optional(),
      fatsPerServing: z.number().optional(),
      fiberPerServing: z.number().optional(),
      ingredientsJson: z.string().optional(), // JSON [{name, amount, unit}]
      instructionsJson: z.string().optional(), // JSON [{step, text}]
      imageUrl: z.string().optional(),
      isPublic: z.boolean().default(false),
      collectionId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { collectionId, ...recipeData } = input;

      const [newRecipe] = await db
        .insert(recipes)
        .values({
          ...recipeData,
          userId: ctx.user.id,
          isPublic: input.isPublic ?? false,
          active: true,
        })
        .returning();

      // Add to collection if specified
      if (collectionId && newRecipe) {
        await db.insert(expertRecipeCollectionItems).values({
          collectionId,
          recipeId: newRecipe.id,
        }).onConflictDoNothing();
        // Update count
        await db.execute(sql`UPDATE expert_recipe_collections SET "recipeCount" = "recipeCount" + 1 WHERE id = ${collectionId}`);
      }

      return newRecipe;
    }),

  // Update a recipe
  updateRecipe: protectedProcedure
    .input(z.object({
      recipeId: z.number(),
      name: z.string().min(2).max(256).optional(),
      description: z.string().optional(),
      preparationTime: z.number().optional(),
      cookTime: z.number().optional(),
      servings: z.number().optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      mealTime: z.enum(["desayuno", "media_manana", "comida", "merienda", "cena", "cualquiera"]).optional(),
      category: z.string().optional(),
      cuisineType: z.string().optional(),
      cookingMethod: z.string().optional(),
      allergens: z.string().optional(),
      tags: z.string().optional(),
      caloriesPerServing: z.number().optional(),
      proteinsPerServing: z.number().optional(),
      carbsPerServing: z.number().optional(),
      fatsPerServing: z.number().optional(),
      fiberPerServing: z.number().optional(),
      ingredientsJson: z.string().optional(),
      instructionsJson: z.string().optional(),
      imageUrl: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { recipeId, ...updates } = input;
      const [updated] = await db
        .update(recipes)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(recipes.id, recipeId), eq(recipes.userId, ctx.user.id)))
        .returning();
      return updated;
    }),

  // Delete a recipe
  deleteRecipe: protectedProcedure
    .input(z.object({ recipeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(recipes)
        .set({ deletedAt: new Date(), active: false })
        .where(and(eq(recipes.id, input.recipeId), eq(recipes.userId, ctx.user.id)));
      return { success: true };
    }),

  // ─── COLLECTIONS ───────────────────────────────────────────────────────────

  listCollections: protectedProcedure
    .query(async ({ ctx }) => {
      const db = getDb();
      return db
        .select()
        .from(expertRecipeCollections)
        .where(eq(expertRecipeCollections.expertUserId, ctx.user.id))
        .orderBy(expertRecipeCollections.name);
    }),

  createCollection: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      description: z.string().optional(),
      color: z.string().default("#f97316"),
      icon: z.string().default("book"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [collection] = await db
        .insert(expertRecipeCollections)
        .values({ ...input, expertUserId: ctx.user.id })
        .returning();
      return collection;
    }),

  updateCollection: protectedProcedure
    .input(z.object({
      collectionId: z.number(),
      name: z.string().min(1).max(128).optional(),
      description: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { collectionId, ...updates } = input;
      const [updated] = await db
        .update(expertRecipeCollections)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(
          eq(expertRecipeCollections.id, collectionId),
          eq(expertRecipeCollections.expertUserId, ctx.user.id),
        ))
        .returning();
      return updated;
    }),

  deleteCollection: protectedProcedure
    .input(z.object({ collectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Remove items first
      await db
        .delete(expertRecipeCollectionItems)
        .where(eq(expertRecipeCollectionItems.collectionId, input.collectionId));
      await db
        .delete(expertRecipeCollections)
        .where(and(
          eq(expertRecipeCollections.id, input.collectionId),
          eq(expertRecipeCollections.expertUserId, ctx.user.id),
        ));
      return { success: true };
    }),

  addRecipeToCollection: protectedProcedure
    .input(z.object({ collectionId: z.number(), recipeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Verify collection belongs to expert
      const [col] = await db
        .select()
        .from(expertRecipeCollections)
        .where(and(
          eq(expertRecipeCollections.id, input.collectionId),
          eq(expertRecipeCollections.expertUserId, ctx.user.id),
        ));
      if (!col) throw new Error("Colección no encontrada");

      await db
        .insert(expertRecipeCollectionItems)
        .values({ collectionId: input.collectionId, recipeId: input.recipeId })
        .onConflictDoNothing();
      await db.execute(sql`UPDATE expert_recipe_collections SET "recipeCount" = (SELECT COUNT(*) FROM expert_recipe_collection_items WHERE "collectionId" = ${input.collectionId}) WHERE id = ${input.collectionId}`);
      return { success: true };
    }),

  removeRecipeFromCollection: protectedProcedure
    .input(z.object({ collectionId: z.number(), recipeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(expertRecipeCollectionItems)
        .where(and(
          eq(expertRecipeCollectionItems.collectionId, input.collectionId),
          eq(expertRecipeCollectionItems.recipeId, input.recipeId),
        ));
      await db.execute(sql`UPDATE expert_recipe_collections SET "recipeCount" = (SELECT COUNT(*) FROM expert_recipe_collection_items WHERE "collectionId" = ${input.collectionId}) WHERE id = ${input.collectionId}`);
      return { success: true };
    }),

  // ─── ASSIGNMENTS ───────────────────────────────────────────────────────────

  // Assign a recipe to a patient
  assignRecipeToPatient: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      recipeId: z.number(),
      notes: z.string().optional(),
      servings: z.number().default(1),
      mealTime: z.enum(["desayuno", "media_manana", "comida", "merienda", "cena", "cualquiera"]).default("cualquiera"),
      sendByEmail: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const expertId = ctx.user.id;

      // Verify patient belongs to expert
      const [patient] = await db
        .select()
        .from(offlinePatients)
        .where(and(
          eq(offlinePatients.id, input.patientId),
          eq(offlinePatients.expertUserId, expertId),
        ));
      if (!patient) throw new Error("Paciente no encontrado");

      // Get recipe
      const [recipe] = await db
        .select()
        .from(recipes)
        .where(eq(recipes.id, input.recipeId));
      if (!recipe) throw new Error("Receta no encontrada");

      const [assignment] = await db
        .insert(expertRecipeAssignments)
        .values({
          expertUserId: expertId,
          patientId: input.patientId,
          recipeId: input.recipeId,
          notes: input.notes,
          servings: input.servings,
          mealTime: input.mealTime,
          sentByEmail: false,
        })
        .returning();

      // Send email if requested and patient has email
      if (input.sendByEmail && patient.email) {
        const ingredientsData = recipe.ingredientsJson
          ? JSON.parse(recipe.ingredientsJson) as Array<{ name: string; amount?: string; unit?: string }>
          : [];
        const instructionsData = recipe.instructionsJson
          ? JSON.parse(recipe.instructionsJson) as Array<{ step?: number; text: string }>
          : [];

        const ingredientsList = ingredientsData
          .map((i) => `• ${i.amount ?? ""} ${i.unit ?? ""} ${i.name}`.trim())
          .join("\n");
        const instructionsList = instructionsData
          .map((s, idx) => `${idx + 1}. ${s.text}`)
          .join("\n");

        const mealTimeLabels: Record<string, string> = {
          desayuno: "Desayuno", media_manana: "Media mañana", comida: "Comida",
          merienda: "Merienda", cena: "Cena", cualquiera: "",
        };
        const mealLabel = mealTimeLabels[input.mealTime] ?? "";

        const emailHtml = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#f97316">🍽️ Tu nutricionista te ha enviado una receta</h2>
            <p>Hola <strong>${patient.name}</strong>,</p>
            <p>Tu nutricionista te recomienda la siguiente receta${mealLabel ? ` para el <strong>${mealLabel}</strong>` : ""}:</p>
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:16px 0">
              <h3 style="color:#ea580c;margin:0 0 8px">${recipe.name}</h3>
              ${recipe.description ? `<p style="color:#6b7280;margin:0 0 12px">${recipe.description}</p>` : ""}
              <div style="display:flex;gap:16px;margin-bottom:12px;font-size:13px;color:#6b7280">
                ${recipe.preparationTime ? `<span>⏱ ${recipe.preparationTime} min prep</span>` : ""}
                ${recipe.cookTime ? `<span>🔥 ${recipe.cookTime} min cocción</span>` : ""}
                <span>🍽️ ${input.servings} ración${input.servings !== 1 ? "es" : ""}</span>
                ${recipe.caloriesPerServing ? `<span>🔢 ${recipe.caloriesPerServing} kcal/ración</span>` : ""}
              </div>
              ${ingredientsList ? `<h4 style="color:#374151;margin:12px 0 6px">Ingredientes</h4><pre style="font-family:sans-serif;font-size:14px;color:#374151;white-space:pre-wrap">${ingredientsList}</pre>` : ""}
              ${instructionsList ? `<h4 style="color:#374151;margin:12px 0 6px">Preparación</h4><pre style="font-family:sans-serif;font-size:14px;color:#374151;white-space:pre-wrap">${instructionsList}</pre>` : ""}
              ${input.notes ? `<div style="background:#fef3c7;border-radius:8px;padding:12px;margin-top:12px"><strong>📝 Nota de tu nutricionista:</strong><br>${input.notes}</div>` : ""}
            </div>
            <p style="color:#6b7280;font-size:13px">Enviado a través de BuddyOne</p>
          </div>
        `;

        try {
          const resendKey = process.env.RESEND_API_KEY;
          if (resendKey) {
            const resend = new Resend(resendKey);
            await resend.emails.send({
              from: process.env.EMAIL_FROM ?? "BuddyOne <noreply@buddyone.app>",
              to: patient.email,
              subject: `🍽️ Receta recomendada: ${recipe.name}`,
              html: emailHtml,
            });
          }
          await db
            .update(expertRecipeAssignments)
            .set({ sentByEmail: true, emailSentAt: new Date() })
            .where(eq(expertRecipeAssignments.id, assignment!.id));
        } catch (e) {
          console.error("Error sending recipe email:", e);
        }
      }

      return { success: true, assignmentId: assignment?.id };
    }),

  // List assignments for a patient
  listPatientAssignments: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const assignments = await db
        .select({
          id: expertRecipeAssignments.id,
          notes: expertRecipeAssignments.notes,
          servings: expertRecipeAssignments.servings,
          mealTime: expertRecipeAssignments.mealTime,
          assignedAt: expertRecipeAssignments.assignedAt,
          sentByEmail: expertRecipeAssignments.sentByEmail,
          emailSentAt: expertRecipeAssignments.emailSentAt,
          recipe: {
            id: recipes.id,
            name: recipes.name,
            imageUrl: recipes.imageUrl,
            description: recipes.description,
            preparationTime: recipes.preparationTime,
            cookTime: recipes.cookTime,
            caloriesPerServing: recipes.caloriesPerServing,
            proteinsPerServing: recipes.proteinsPerServing,
            carbsPerServing: recipes.carbsPerServing,
            fatsPerServing: recipes.fatsPerServing,
            mealTime: recipes.mealTime,
            category: recipes.category,
            ingredientsJson: recipes.ingredientsJson,
            instructionsJson: recipes.instructionsJson,
          },
        })
        .from(expertRecipeAssignments)
        .innerJoin(recipes, eq(expertRecipeAssignments.recipeId, recipes.id))
        .where(and(
          eq(expertRecipeAssignments.patientId, input.patientId),
          eq(expertRecipeAssignments.expertUserId, ctx.user.id),
        ))
        .orderBy(desc(expertRecipeAssignments.assignedAt));
      return assignments;
    }),

  // Remove an assignment
  removeAssignment: protectedProcedure
    .input(z.object({ assignmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(expertRecipeAssignments)
        .where(and(
          eq(expertRecipeAssignments.id, input.assignmentId),
          eq(expertRecipeAssignments.expertUserId, ctx.user.id),
        ));
      return { success: true };
    }),

  // Stats: how many times each recipe has been assigned
  getRecipeStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = getDb();
      const stats = await db
        .select({
          recipeId: expertRecipeAssignments.recipeId,
          count: sql<number>`count(*)::int`,
        })
        .from(expertRecipeAssignments)
        .where(eq(expertRecipeAssignments.expertUserId, ctx.user.id))
        .groupBy(expertRecipeAssignments.recipeId)
        .orderBy(desc(sql`count(*)`))
        .limit(10);
      return stats;
    }),
});
