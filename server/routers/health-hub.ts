import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq, and, desc, gte } from "drizzle-orm";
import { wearableConnections, ouraRingData, whoopData, wearableInsights } from "../../drizzle/schema";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";

export const healthHubRouter = router({
  // Get all wearable connections for user
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];
    const connections = await drizzleDb
      .select()
      .from(wearableConnections)
      .where(eq(wearableConnections.userId, ctx.user.id));
    return connections;
  }),

  // Get Oura Ring data
  getOuraData: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const since = new Date(Date.now() - input.days * 86400000).toISOString().split("T")[0];
      const data = await drizzleDb
        .select()
        .from(ouraRingData)
        .where(and(eq(ouraRingData.userId, ctx.user.id), eq(ouraRingData.date, since)))
        .orderBy(desc(ouraRingData.date))
        .limit(input.days);
      return data;
    }),

  // Get Whoop data
  getWhoopData: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(7) }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const since = new Date(Date.now() - input.days * 86400000).toISOString().split("T")[0];
      const data = await drizzleDb
        .select()
        .from(whoopData)
        .where(and(eq(whoopData.userId, ctx.user.id), eq(whoopData.date, since)))
        .orderBy(desc(whoopData.date))
        .limit(input.days);
      return data;
    }),

  // Get insights
  getInsights: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];
      const insights = await drizzleDb
        .select()
        .from(wearableInsights)
        .where(eq(wearableInsights.userId, ctx.user.id))
        .orderBy(desc(wearableInsights.createdAt))
        .limit(input.limit);
      return insights;
    }),

  // Generate AI health insights from wearable data
  generateInsights: protectedProcedure.mutation(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) throw new Error("DB not available");

    // Fetch last 7 days of data from both sources
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    const [ouraRows, whoopRows, connections] = await Promise.all([
      drizzleDb.select().from(ouraRingData)
        .where(and(eq(ouraRingData.userId, ctx.user.id), gte(ouraRingData.date, sevenDaysAgo)))
        .orderBy(desc(ouraRingData.date)).limit(7),
      drizzleDb.select().from(whoopData)
        .where(and(eq(whoopData.userId, ctx.user.id), gte(whoopData.date, sevenDaysAgo)))
        .orderBy(desc(whoopData.date)).limit(7),
      drizzleDb.select().from(wearableConnections)
        .where(and(eq(wearableConnections.userId, ctx.user.id), eq(wearableConnections.isActive, true))),
    ]);

    const hasOura = connections.some(c => c.wearableType === "oura");
    const hasWhoop = connections.some(c => c.wearableType === "whoop");

    // Build metrics summary for the LLM
    let metricsSummary = "";
    if (hasOura && ouraRows.length > 0) {
      const avgSleep = Math.round(ouraRows.reduce((s, r) => s + (r.sleepScore || 0), 0) / ouraRows.length);
      const avgHRV = Math.round(ouraRows.reduce((s, r) => s + (r.hrv || 0), 0) / ouraRows.length);
      const avgRHR = Math.round(ouraRows.reduce((s, r) => s + (r.restingHeartRate || 0), 0) / ouraRows.length);
      const avgSleepH = Math.round((ouraRows.reduce((s, r) => s + (r.sleepDuration || 0), 0) / ouraRows.length) * 10) / 10;
      metricsSummary += `Oura Ring (${ouraRows.length} d\u00edas): Sleep Score promedio=${avgSleep}/100, HRV promedio=${avgHRV}ms, FC reposo promedio=${avgRHR}bpm, Horas sue\u00f1o promedio=${avgSleepH}h. `;
    }
    if (hasWhoop && whoopRows.length > 0) {
      const avgStrain = Math.round((whoopRows.reduce((s, r) => s + (parseFloat(String(r.strain)) || 0), 0) / whoopRows.length) * 10) / 10;
      const avgRecovery = Math.round(whoopRows.reduce((s, r) => s + (parseFloat(String(r.recovery)) || 0), 0) / whoopRows.length);
      const avgCalories = Math.round(whoopRows.reduce((s, r) => s + (r.calories || 0), 0) / whoopRows.length);
      metricsSummary += `Whoop (${whoopRows.length} d\u00edas): Strain promedio=${avgStrain}, Recovery promedio=${avgRecovery}%, Calor\u00edas promedio=${avgCalories}kcal. `;
    }

    // If no real data, use demo metrics
    if (!metricsSummary) {
      metricsSummary = "Datos de demostraci\u00f3n (\u00faltimos 7 d\u00edas): Sleep Score=86/100, HRV=45ms, FC reposo=58bpm, Horas sue\u00f1o=7.5h, Strain=12.5, Recovery=78%, Calor\u00edas=2145kcal, Temperatura corporal=36.4\u00b0C.";
    }

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Eres un experto en salud y bienestar. Analiza las m\u00e9tricas de wearables del usuario y genera exactamente 4 insights personalizados en formato JSON. Cada insight debe tener: "icon" (un emoji relevante), "title" (t\u00edtulo corto en espa\u00f1ol), "description" (recomendaci\u00f3n concreta de 1-2 frases en espa\u00f1ol), "category" (uno de: "sleep", "recovery", "activity", "nutrition"), "priority" ("high", "medium", "low"). Responde SOLO con un JSON array, sin texto adicional.`,
        },
        {
          role: "user",
          content: `Analiza estas m\u00e9tricas y genera 4 recomendaciones de salud personalizadas:\n\n${metricsSummary}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "health_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    icon: { type: "string", description: "Emoji icon" },
                    title: { type: "string", description: "Short title in Spanish" },
                    description: { type: "string", description: "1-2 sentence recommendation in Spanish" },
                    category: { type: "string", enum: ["sleep", "recovery", "activity", "nutrition"] },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                  },
                  required: ["icon", "title", "description", "category", "priority"],
                  additionalProperties: false,
                },
              },
            },
            required: ["insights"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content || "";
    let insights: Array<{ icon: string; title: string; description: string; category: string; priority: string }> = [];
    try {
      const parsed = JSON.parse(content);
      insights = parsed.insights || parsed;
    } catch {
      insights = [
        { icon: "\ud83d\ude34", title: "Mejora tu sue\u00f1o", description: "Intenta mantener un horario de sue\u00f1o consistente para mejorar tu puntuaci\u00f3n.", category: "sleep", priority: "medium" },
        { icon: "\ud83d\udcaa", title: "Recuperaci\u00f3n activa", description: "Tu recuperaci\u00f3n es buena. Mant\u00e9n la actividad moderada para seguir mejorando.", category: "recovery", priority: "low" },
        { icon: "\ud83c\udfcb\ufe0f", title: "Optimiza tu entrenamiento", description: "Alterna d\u00edas de alta intensidad con d\u00edas de recuperaci\u00f3n para mejores resultados.", category: "activity", priority: "medium" },
        { icon: "\ud83e\udd57", title: "Hidrataci\u00f3n y nutrici\u00f3n", description: "Aseg\u00farate de hidratarte bien y consumir suficientes prote\u00ednas para apoyar tu recuperaci\u00f3n.", category: "nutrition", priority: "high" },
      ];
    }

    return { insights, generatedAt: Date.now(), hasRealData: !!metricsSummary.includes("Oura") || !!metricsSummary.includes("Whoop") };
  }),

  // Disconnect wearable
  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");
      await drizzleDb
        .update(wearableConnections)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(wearableConnections.id, input.connectionId),
            eq(wearableConnections.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
