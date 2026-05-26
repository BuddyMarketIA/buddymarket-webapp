/**
 * corporateDashboard router — B2B Corporate Wellness Dashboard
 * Provides HR panels with team wellness metrics, engagement stats, and reports
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

export const corporateDashboardRouter = router({
  /**
   * Get company overview metrics
   */
  getOverview: protectedProcedure
    .input(z.object({ companyId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { b2bCompanies, b2bEmployees, dailyLogs, users } = await import("../../drizzle/schema");
      const { eq, and, count, sql, gte, desc } = await import("drizzle-orm");

      // Find company for this user (admin or HR)
      let companyId = input?.companyId;
      if (!companyId) {
        const [company] = await drizzleDb
          .select({ id: b2bCompanies.id })
          .from(b2bCompanies)
          .where(eq(b2bCompanies.adminUserId, ctx.user.id))
          .limit(1);
        if (!company) throw new TRPCError({ code: "FORBIDDEN", message: "No company found for this user" });
        companyId = company.id;
      }

      // Get employee count
      const [employeeCount] = await drizzleDb
        .select({ total: count() })
        .from(b2bEmployees)
        .where(eq(b2bEmployees.companyId, companyId));

      // Get active employees (logged food in last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const [activeCount] = await drizzleDb
        .select({ total: sql<number>`COUNT(DISTINCT ${b2bEmployees.userId})` })
        .from(b2bEmployees)
        .innerJoin(dailyLogs, eq(b2bEmployees.userId, dailyLogs.userId))
        .where(and(
          eq(b2bEmployees.companyId, companyId),
          gte(dailyLogs.logDate, sevenDaysAgo)
        ));

      // Average engagement rate
      const totalEmployees = employeeCount?.total ?? 0;
      const activeEmployees = Number(activeCount?.total ?? 0);
      const engagementRate = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

      // Get average calories and macros for the company (last 7 days)
      const [avgNutrition] = await drizzleDb
        .select({
          avgCalories: sql<number>`ROUND(AVG(${dailyLogs.calories}))`,
          avgProtein: sql<number>`ROUND(AVG(${dailyLogs.protein}))`,
          avgCarbs: sql<number>`ROUND(AVG(${dailyLogs.carbs}))`,
          avgFat: sql<number>`ROUND(AVG(${dailyLogs.fat}))`,
          totalLogs: count(),
        })
        .from(dailyLogs)
        .innerJoin(b2bEmployees, eq(dailyLogs.userId, b2bEmployees.userId))
        .where(and(
          eq(b2bEmployees.companyId, companyId),
          gte(dailyLogs.logDate, sevenDaysAgo)
        ));

      return {
        companyId,
        totalEmployees,
        activeEmployees,
        engagementRate,
        avgNutrition: {
          calories: avgNutrition?.avgCalories ?? 0,
          protein: avgNutrition?.avgProtein ?? 0,
          carbs: avgNutrition?.avgCarbs ?? 0,
          fat: avgNutrition?.avgFat ?? 0,
          totalLogs: avgNutrition?.totalLogs ?? 0,
        },
        period: "last_7_days",
      };
    }),

  /**
   * Get weekly engagement trend
   */
  getEngagementTrend: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      weeks: z.number().min(1).max(12).default(4),
    }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { trend: [] };

      const { b2bEmployees, dailyLogs } = await import("../../drizzle/schema");
      const { eq, and, gte, lte, sql, count } = await import("drizzle-orm");

      const trend: { week: string; activeUsers: number; totalLogs: number }[] = [];

      for (let i = input.weeks - 1; i >= 0; i--) {
        const weekStart = new Date(Date.now() - (i + 1) * 7 * 86400000).toISOString().split("T")[0];
        const weekEnd = new Date(Date.now() - i * 7 * 86400000).toISOString().split("T")[0];

        const [weekData] = await drizzleDb
          .select({
            activeUsers: sql<number>`COUNT(DISTINCT ${b2bEmployees.userId})`,
            totalLogs: count(),
          })
          .from(dailyLogs)
          .innerJoin(b2bEmployees, eq(dailyLogs.userId, b2bEmployees.userId))
          .where(and(
            eq(b2bEmployees.companyId, input.companyId),
            gte(dailyLogs.logDate, weekStart),
            lte(dailyLogs.logDate, weekEnd)
          ));

        trend.push({
          week: weekStart,
          activeUsers: Number(weekData?.activeUsers ?? 0),
          totalLogs: Number(weekData?.totalLogs ?? 0),
        });
      }

      return { trend };
    }),

  /**
   * Get department breakdown
   */
  getDepartmentStats: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) return { departments: [] };

      const { b2bEmployees, dailyLogs } = await import("../../drizzle/schema");
      const { eq, and, gte, sql, count } = await import("drizzle-orm");

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

      const departments = await drizzleDb
        .select({
          department: b2bEmployees.department,
          totalEmployees: count(),
          activeEmployees: sql<number>`COUNT(DISTINCT CASE WHEN ${dailyLogs.logDate} >= ${sevenDaysAgo} THEN ${b2bEmployees.userId} END)`,
        })
        .from(b2bEmployees)
        .leftJoin(dailyLogs, eq(b2bEmployees.userId, dailyLogs.userId))
        .where(eq(b2bEmployees.companyId, input.companyId))
        .groupBy(b2bEmployees.department);

      return { departments };
    }),

  /**
   * Generate monthly wellness report
   */
  generateReport: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      month: z.number().min(1).max(12),
      year: z.number().min(2024).max(2030),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { invokeLLM } = await import("../_core/llm");

      // Generate AI summary
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Eres un analista de bienestar corporativo. Genera un resumen ejecutivo mensual para RRHH basado en los datos de uso de la plataforma nutricional. El informe debe ser profesional, con métricas clave y recomendaciones accionables."
          },
          {
            role: "user",
            content: `Genera un informe de bienestar corporativo para el mes ${input.month}/${input.year}. Empresa ID: ${input.companyId}. Incluye: 1) Resumen ejecutivo, 2) Métricas de engagement, 3) Tendencias nutricionales, 4) Recomendaciones para mejorar la participación, 5) ROI estimado del programa de bienestar.`
          }
        ],
      });

      return {
        report: response.choices[0].message.content,
        month: input.month,
        year: input.year,
        generatedAt: new Date().toISOString(),
      };
    }),
});
