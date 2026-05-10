import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const makerAnalyticsRouter = router({
  // ─── Registrar vista de receta (llamado al abrir una receta) ─────────────
  trackView: publicProcedure
    .input(z.object({
      recipeId: z.number(),
      makerId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db.js");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { success: false };
      const { recipeAnalytics } = await import("../../drizzle/schema.js");
      const { eq, and, sql } = await import("drizzle-orm");

      const today = new Date().toISOString().split("T")[0];
      const isUnique = !ctx.user; // Si no hay usuario autenticado, contar como único

      // Upsert del registro diario
      const [existing] = await drizzleDb.select().from(recipeAnalytics)
        .where(and(
          eq(recipeAnalytics.recipeId, input.recipeId),
          eq(recipeAnalytics.date, today)
        )).limit(1);

      if (existing) {
        await drizzleDb.update(recipeAnalytics)
          .set({
            views: sql`${recipeAnalytics.views} + 1`,
            uniqueViews: isUnique ? sql`${recipeAnalytics.uniqueViews} + 1` : recipeAnalytics.uniqueViews,
            updatedAt: new Date(),
          })
          .where(eq(recipeAnalytics.id, existing.id));
      } else {
        await drizzleDb.insert(recipeAnalytics).values({
          recipeId: input.recipeId,
          makerId: input.makerId,
          date: today,
          views: 1,
          uniqueViews: 1,
        });
      }

      return { success: true };
    }),

  // ─── Registrar interacción (like, save, share) ───────────────────────────
  trackInteraction: protectedProcedure
    .input(z.object({
      recipeId: z.number(),
      makerId: z.number(),
      type: z.enum(["like", "save", "share", "comment"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db.js");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { success: false };
      const { recipeAnalytics } = await import("../../drizzle/schema.js");
      const { eq, and, sql } = await import("drizzle-orm");

      const today = new Date().toISOString().split("T")[0];

      const [existing] = await drizzleDb.select().from(recipeAnalytics)
        .where(and(
          eq(recipeAnalytics.recipeId, input.recipeId),
          eq(recipeAnalytics.date, today)
        )).limit(1);

      const updateField = {
        like: { likes: sql`${recipeAnalytics.likes} + 1` },
        save: { saves: sql`${recipeAnalytics.saves} + 1` },
        share: { shares: sql`${recipeAnalytics.shares} + 1` },
        comment: { comments: sql`${recipeAnalytics.comments} + 1` },
      }[input.type];

      if (existing) {
        await drizzleDb.update(recipeAnalytics)
          .set({ ...updateField, updatedAt: new Date() })
          .where(eq(recipeAnalytics.id, existing.id));
      } else {
        await drizzleDb.insert(recipeAnalytics).values({
          recipeId: input.recipeId,
          makerId: input.makerId,
          date: today,
          likes: input.type === "like" ? 1 : 0,
          saves: input.type === "save" ? 1 : 0,
          shares: input.type === "share" ? 1 : 0,
          comments: input.type === "comment" ? 1 : 0,
        });
      }

      return { success: true };
    }),

  // ─── Obtener analíticas del BuddyMaker ───────────────────────────────────
  getMakerAnalytics: protectedProcedure
    .input(z.object({
      period: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "buddymaker" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Solo BuddyMakers pueden acceder a estas analíticas" });
      }
      const { getDb } = await import("../db.js");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { recipeAnalytics, recipes } = await import("../../drizzle/schema.js");
      const { eq, and, gte, sum, sql } = await import("drizzle-orm");

      // Calcular fecha de inicio según el período
      const now = new Date();
      let startDate: Date | null = null;
      if (input.period === "7d") startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (input.period === "30d") startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else if (input.period === "90d") startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const conditions = [eq(recipeAnalytics.makerId, ctx.user.id)];
      if (startDate) {
        const startStr = startDate.toISOString().split("T")[0];
        conditions.push(gte(recipeAnalytics.date, startStr));
      }

      // Totales globales
      const [totals] = await drizzleDb.select({
        totalViews: sql<number>`sum(${recipeAnalytics.views})`,
        totalUniqueViews: sql<number>`sum(${recipeAnalytics.uniqueViews})`,
        totalLikes: sql<number>`sum(${recipeAnalytics.likes})`,
        totalSaves: sql<number>`sum(${recipeAnalytics.saves})`,
        totalShares: sql<number>`sum(${recipeAnalytics.shares})`,
        totalComments: sql<number>`sum(${recipeAnalytics.comments})`,
      }).from(recipeAnalytics).where(and(...conditions));

      // Por receta (top 10)
      const byRecipe = await drizzleDb.select({
        recipeId: recipeAnalytics.recipeId,
        totalViews: sql<number>`sum(${recipeAnalytics.views})`,
        totalLikes: sql<number>`sum(${recipeAnalytics.likes})`,
        totalSaves: sql<number>`sum(${recipeAnalytics.saves})`,
        totalShares: sql<number>`sum(${recipeAnalytics.shares})`,
      })
        .from(recipeAnalytics)
        .where(and(...conditions))
        .groupBy(recipeAnalytics.recipeId)
        .orderBy(sql`sum(${recipeAnalytics.views}) desc`)
        .limit(10);

      // Enriquecer con datos de receta
      const recipeIds = byRecipe.map(r => r.recipeId);
      let recipeDetails: Record<number, { title: string; imageUrl: string | null }> = {};
      if (recipeIds.length > 0) {
        const { inArray } = await import("drizzle-orm");
        const recipeData = await drizzleDb.select({
          id: recipes.id,
          name: recipes.name,
          imageUrl: recipes.imageUrl,
        }).from(recipes).where(inArray(recipes.id, recipeIds));
        recipeDetails = Object.fromEntries(recipeData.map(r => [r.id, { title: r.name, imageUrl: r.imageUrl }]));
      }

      // Evolución temporal (por día)
      const dailyData = await drizzleDb.select({
        date: recipeAnalytics.date,
        views: sql<number>`sum(${recipeAnalytics.views})`,
        likes: sql<number>`sum(${recipeAnalytics.likes})`,
        saves: sql<number>`sum(${recipeAnalytics.saves})`,
      })
        .from(recipeAnalytics)
        .where(and(...conditions))
        .groupBy(recipeAnalytics.date)
        .orderBy(recipeAnalytics.date);

      // Tasa de conversión (vistas → guardadas)
      const conversionRate = totals.totalViews > 0
        ? ((totals.totalSaves / totals.totalViews) * 100).toFixed(1)
        : "0";

      return {
        totals: {
          views: Number(totals.totalViews ?? 0),
          uniqueViews: Number(totals.totalUniqueViews ?? 0),
          likes: Number(totals.totalLikes ?? 0),
          saves: Number(totals.totalSaves ?? 0),
          shares: Number(totals.totalShares ?? 0),
          comments: Number(totals.totalComments ?? 0),
          conversionRate: parseFloat(conversionRate),
        },
        topRecipes: byRecipe.map(r => ({
          ...r,
          totalViews: Number(r.totalViews ?? 0),
          totalLikes: Number(r.totalLikes ?? 0),
          totalSaves: Number(r.totalSaves ?? 0),
          totalShares: Number(r.totalShares ?? 0),
          recipe: recipeDetails[r.recipeId] ?? { title: "Receta", imageUrl: null },
        })),
        dailyData: dailyData.map(d => ({
          date: d.date,
          views: Number(d.views ?? 0),
          likes: Number(d.likes ?? 0),
          saves: Number(d.saves ?? 0),
        })),
      };
    }),

  // ─── Analíticas de una receta específica ─────────────────────────────────
  getRecipeAnalytics: protectedProcedure
    .input(z.object({
      recipeId: z.number(),
      period: z.enum(["7d", "30d", "90d"]).default("30d"),
    }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db.js");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { recipeAnalytics } = await import("../../drizzle/schema.js");
      const { eq, and, gte, sql } = await import("drizzle-orm");

      const now = new Date();
      const days = input.period === "7d" ? 7 : input.period === "30d" ? 30 : 90;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const startStr = startDate.toISOString().split("T")[0];

      const data = await drizzleDb.select()
        .from(recipeAnalytics)
        .where(and(
          eq(recipeAnalytics.recipeId, input.recipeId),
          gte(recipeAnalytics.date, startStr)
        ))
        .orderBy(recipeAnalytics.date);

      return data;
    }),
});
