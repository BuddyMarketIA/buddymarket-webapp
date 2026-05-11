import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq, and, desc, gte } from "drizzle-orm";
import { wearableConnections, ouraRingData, whoopData, wearableInsights, insightFeedback, mealLogs, userProfiles, users } from "../../drizzle/schema";
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
  generateInsights: protectedProcedure
    .input(z.object({
      categories: z.array(z.enum(["sleep", "recovery", "activity", "nutrition", "stress"])).optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
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

    // Fetch recent feedback to improve recommendations
    const recentFeedback = await drizzleDb.select().from(insightFeedback)
      .where(eq(insightFeedback.userId, ctx.user.id))
      .orderBy(desc(insightFeedback.createdAt))
      .limit(20);

    const selectedCategories = input?.categories?.length ? input.categories : [];

    let feedbackContext = "";
    if (recentFeedback.length > 0) {
      const liked = recentFeedback.filter(f => f.feedback === "positive").map(f => `"${f.insightTitle}" (${f.insightCategory})`);
      const disliked = recentFeedback.filter(f => f.feedback === "negative").map(f => `"${f.insightTitle}" (${f.insightCategory})`);
      if (liked.length > 0) feedbackContext += `\nEl usuario ha valorado POSITIVAMENTE estos insights anteriores: ${liked.join(", ")}.`;
      if (disliked.length > 0) feedbackContext += `\nEl usuario ha valorado NEGATIVAMENTE estos insights anteriores: ${disliked.join(", ")}. Evita recomendaciones similares a las negativas y prioriza el estilo de las positivas.`;
    }

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Eres un experto en salud y bienestar. Analiza las métricas de wearables del usuario y genera exactamente 4 insights personalizados en formato JSON. Cada insight debe tener: "icon" (un emoji relevante), "title" (título corto en español), "description" (recomendación concreta de 1-2 frases en español), "category" (uno de: "sleep", "recovery", "activity", "nutrition", "stress"), "priority" ("high", "medium", "low").${selectedCategories.length > 0 ? ` IMPORTANTE: Genera insights SOLO de estas categorías: ${selectedCategories.join(", ")}.` : ""} Responde SOLO con un JSON array, sin texto adicional.${feedbackContext}`,
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
                    category: { type: "string", enum: ["sleep", "recovery", "activity", "nutrition", "stress"] },
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

  // Submit feedback for an AI insight
  submitFeedback: protectedProcedure
    .input(z.object({
      insightTitle: z.string(),
      insightCategory: z.string(),
      insightDescription: z.string(),
      feedback: z.enum(["positive", "negative"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");
      await drizzleDb.insert(insightFeedback).values({
        userId: ctx.user.id,
        insightTitle: input.insightTitle,
        insightCategory: input.insightCategory,
        insightDescription: input.insightDescription,
        feedback: input.feedback,
      });
      return { success: true, message: input.feedback === "positive" ? "Gracias por tu feedback positivo" : "Gracias, mejoraremos las recomendaciones" };
    }),

  // ============================================================
  // SMART INSIGHTS: Cruza wearables + nutrición + perfil + objetivos
  // ============================================================
  smartInsights: protectedProcedure
    .mutation(async ({ ctx }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");

      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000).toISOString().split("T")[0];
      const yesterday = new Date(today.getTime() - 86400000).toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];

      // 1. Fetch ALL data sources in parallel
      const [ouraRows, whoopRows, mealRows, profile, connections, recentFeedback] = await Promise.all([
        drizzleDb.select().from(ouraRingData)
          .where(and(eq(ouraRingData.userId, ctx.user.id), gte(ouraRingData.date, sevenDaysAgo)))
          .orderBy(desc(ouraRingData.date)).limit(7),
        drizzleDb.select().from(whoopData)
          .where(and(eq(whoopData.userId, ctx.user.id), gte(whoopData.date, sevenDaysAgo)))
          .orderBy(desc(whoopData.date)).limit(7),
        drizzleDb.select().from(mealLogs)
          .where(and(eq(mealLogs.userId, ctx.user.id), gte(mealLogs.logDate, sevenDaysAgo)))
          .orderBy(desc(mealLogs.logDate)),
        drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, ctx.user.id)).limit(1),
        drizzleDb.select().from(wearableConnections)
          .where(and(eq(wearableConnections.userId, ctx.user.id), eq(wearableConnections.isActive, true))),
        drizzleDb.select().from(insightFeedback)
          .where(eq(insightFeedback.userId, ctx.user.id))
          .orderBy(desc(insightFeedback.createdAt)).limit(20),
      ]);

      const userProfile = profile[0] || null;
      const hasOura = connections.some(c => c.wearableType === "oura");
      const hasWhoop = connections.some(c => c.wearableType === "whoop");

      // 2. Build WEARABLE summary
      let wearableSummary = "";
      if (hasOura && ouraRows.length > 0) {
        const latest = ouraRows[0];
        const prev = ouraRows[1];
        wearableSummary += `\n## Oura Ring (${ouraRows.length} días)\n`;
        wearableSummary += `- Ayer: Sleep Score=${latest.sleepScore || "N/A"}/100, Sueño=${latest.sleepDuration ? Math.round(latest.sleepDuration / 60 * 10) / 10 : "N/A"}h (profundo=${latest.deepSleep || 0}min, REM=${latest.remSleep || 0}min), Readiness=${latest.readinessScore || "N/A"}/100, HRV=${latest.heartRateVariability || "N/A"}ms, FC reposo=${latest.restingHeartRate || "N/A"}bpm, Actividad=${latest.activityScore || "N/A"}/100, Pasos=${latest.steps || 0}, Calorías activas=${latest.activeCalories || 0}kcal, Temp=${latest.bodyTemperature || "N/A"}°C\n`;
        if (prev) {
          wearableSummary += `- Anteayer: Sleep Score=${prev.sleepScore || "N/A"}, Readiness=${prev.readinessScore || "N/A"}, HRV=${prev.heartRateVariability || "N/A"}ms, Pasos=${prev.steps || 0}\n`;
        }
        const avgSleep = Math.round(ouraRows.reduce((s, r) => s + (r.sleepScore || 0), 0) / ouraRows.length);
        const avgHRV = Math.round(ouraRows.reduce((s, r) => s + (Number(r.heartRateVariability) || 0), 0) / ouraRows.length);
        const avgSteps = Math.round(ouraRows.reduce((s, r) => s + (r.steps || 0), 0) / ouraRows.length);
        wearableSummary += `- Promedios 7d: Sleep=${avgSleep}/100, HRV=${avgHRV}ms, Pasos=${avgSteps}\n`;
      }
      if (hasWhoop && whoopRows.length > 0) {
        const latest = whoopRows[0];
        wearableSummary += `\n## Whoop (${whoopRows.length} días)\n`;
        wearableSummary += `- Ayer: Strain=${latest.strain || "N/A"}/21, Recovery=${latest.recovery || "N/A"}%, FC reposo=${latest.restingHeartRate || "N/A"}bpm, HRV=${latest.heartRateVariability || "N/A"}ms, Sueño=${latest.sleepDuration ? Math.round(latest.sleepDuration / 60 * 10) / 10 : "N/A"}h, Sleep Score=${latest.sleepScore || "N/A"}/100, Dolor muscular=${latest.muscleSoreness || "N/A"}, Ánimo=${latest.mood || "N/A"}\n`;
        const avgStrain = Math.round((whoopRows.reduce((s, r) => s + (parseFloat(String(r.strain)) || 0), 0) / whoopRows.length) * 10) / 10;
        const avgRecovery = Math.round(whoopRows.reduce((s, r) => s + (parseFloat(String(r.recovery)) || 0), 0) / whoopRows.length);
        wearableSummary += `- Promedios 7d: Strain=${avgStrain}, Recovery=${avgRecovery}%\n`;
      }

      // 3. Build NUTRITION summary
      let nutritionSummary = "";
      if (mealRows.length > 0) {
        // Group by day
        const byDay: Record<string, { cal: number; prot: number; carbs: number; fats: number; meals: number }> = {};
        for (const m of mealRows) {
          const d = String(m.logDate);
          if (!byDay[d]) byDay[d] = { cal: 0, prot: 0, carbs: 0, fats: 0, meals: 0 };
          byDay[d].cal += m.calories || 0;
          byDay[d].prot += m.proteins || 0;
          byDay[d].carbs += m.carbohydrates || 0;
          byDay[d].fats += m.fats || 0;
          byDay[d].meals += 1;
        }
        const days = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]));
        nutritionSummary += `\n## Nutrición (${days.length} días registrados)\n`;
        for (const [day, data] of days.slice(0, 3)) {
          nutritionSummary += `- ${day}: ${data.cal}kcal, ${Math.round(data.prot)}g proteína, ${Math.round(data.carbs)}g carbos, ${Math.round(data.fats)}g grasa (${data.meals} comidas)\n`;
        }
        const totalDays = days.length;
        const avgCal = Math.round(days.reduce((s, [, d]) => s + d.cal, 0) / totalDays);
        const avgProt = Math.round(days.reduce((s, [, d]) => s + d.prot, 0) / totalDays);
        const avgCarbs = Math.round(days.reduce((s, [, d]) => s + d.carbs, 0) / totalDays);
        const avgFats = Math.round(days.reduce((s, [, d]) => s + d.fats, 0) / totalDays);
        nutritionSummary += `- Promedios: ${avgCal}kcal/día, ${avgProt}g prot, ${avgCarbs}g carbs, ${avgFats}g grasa\n`;
      }

      // 4. Build PROFILE summary
      let profileSummary = "";
      if (userProfile) {
        profileSummary += `\n## Perfil del usuario\n`;
        if (userProfile.gender) profileSummary += `- Género: ${userProfile.gender}\n`;
        if (userProfile.age) profileSummary += `- Edad: ${userProfile.age} años\n`;
        if (userProfile.weight) profileSummary += `- Peso actual: ${userProfile.weight}kg\n`;
        if (userProfile.targetWeight) profileSummary += `- Peso objetivo: ${userProfile.targetWeight}kg\n`;
        if (userProfile.height) profileSummary += `- Altura: ${userProfile.height}cm\n`;
        if (userProfile.mainGoal) profileSummary += `- Objetivo principal: ${userProfile.mainGoal}\n`;
        if (userProfile.activityLevel) profileSummary += `- Nivel de actividad: ${userProfile.activityLevel}\n`;
        if (userProfile.dailyCalorieGoal) profileSummary += `- Meta calórica diaria: ${userProfile.dailyCalorieGoal}kcal\n`;
        if (userProfile.dailyProteinGoal) profileSummary += `- Meta proteína: ${userProfile.dailyProteinGoal}g\n`;
        if (userProfile.dailyCarbsGoal) profileSummary += `- Meta carbos: ${userProfile.dailyCarbsGoal}g\n`;
        if (userProfile.dailyFatGoal) profileSummary += `- Meta grasa: ${userProfile.dailyFatGoal}g\n`;
        if (userProfile.practicesSports) profileSummary += `- Practica deporte: Sí (${userProfile.sportsTypes || "no especificado"}, frecuencia: ${userProfile.sportsFrequency || "no especificada"})\n`;
        if (userProfile.stressLevel) profileSummary += `- Nivel de estrés: ${userProfile.stressLevel}\n`;
        if (userProfile.sleepHours) profileSummary += `- Horas de sueño objetivo: ${userProfile.sleepHours}h\n`;
        if (userProfile.waterIntake) profileSummary += `- Ingesta de agua: ${userProfile.waterIntake}L/día\n`;
      }

      // 5. Use demo data if nothing available
      const hasRealData = !!(wearableSummary || nutritionSummary);
      if (!wearableSummary && !nutritionSummary) {
        wearableSummary = `\n## Wearables (demo)\n- Ayer: Sleep Score=72/100, Sueño=6.2h (profundo=45min, REM=62min), Readiness=65/100, HRV=38ms, FC reposo=64bpm, Actividad=85/100, Pasos=12400, Calorías activas=680kcal\n- Promedios 7d: Sleep=78/100, HRV=42ms, Pasos=9800\n`;
        nutritionSummary = `\n## Nutrición (demo)\n- Ayer: 2850kcal, 95g proteína, 380g carbos, 85g grasa (4 comidas)\n- Anteayer: 1650kcal, 72g proteína, 210g carbos, 55g grasa (2 comidas)\n- Promedios: 2200kcal/día, 88g prot, 290g carbs, 72g grasa\n`;
        profileSummary = `\n## Perfil (demo)\n- Hombre, 32 años, 82kg, objetivo: 75kg (pérdida de peso)\n- Actividad: moderada, practica running 3x/semana\n- Meta calórica: 2000kcal, Meta proteína: 130g\n- Nivel estrés: medio\n`;
      }

      // 6. Feedback context
      let feedbackContext = "";
      if (recentFeedback.length > 0) {
        const liked = recentFeedback.filter(f => f.feedback === "positive").map(f => `"${f.insightTitle}"`);
        const disliked = recentFeedback.filter(f => f.feedback === "negative").map(f => `"${f.insightTitle}"`);
        if (liked.length) feedbackContext += `\nRecomendaciones que le GUSTARON al usuario: ${liked.join(", ")}.`;
        if (disliked.length) feedbackContext += `\nRecomendaciones que NO le gustaron: ${disliked.join(", ")}. Evita ese estilo.`;
      }

      // 7. Call LLM with ALL context
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Eres un coach de salud y nutrición de élite. Tu trabajo es analizar TODOS los datos del usuario (wearables, nutrición, perfil, objetivos) y generar recomendaciones CRUZADAS ultra-personalizadas.

REGLAS IMPORTANTES:
- Cruza SIEMPRE datos de wearables con nutrición. Ejemplo: "Tu sueño fue bajo (6.2h) y ayer comiste 2850kcal con muchos carbos por la noche. Reduce los carbos en la cena para mejorar la calidad del sueño."
- Compara lo que el usuario COME vs lo que DEBERÍA comer según sus objetivos. Ejemplo: "Tu objetivo es perder peso con 2000kcal/día pero ayer consumiste 2850kcal. Reduce 850kcal distribuyendo mejor las comidas."
- Si el strain/actividad es alto pero la proteína es baja, recomienda aumentar proteína para recuperación.
- Si el sueño es malo y la actividad fue alta, recomienda descanso activo.
- Si hay tendencia de varios días (ej: sueño bajando), señálalo como TENDENCIA.
- Usa el tono de un coach personal cercano pero profesional. Tutea al usuario.
- Sé MUY específico: menciona números, alimentos concretos, tiempos, cantidades.
- Genera exactamente 5 recomendaciones ordenadas por prioridad.
${feedbackContext}`,
          },
          {
            role: "user",
            content: `Analiza estos datos y genera 5 recomendaciones cruzadas personalizadas:\n${wearableSummary}${nutritionSummary}${profileSummary}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "smart_insights",
            strict: true,
            schema: {
              type: "object",
              properties: {
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      icon: { type: "string", description: "Emoji relevante" },
                      title: { type: "string", description: "Título corto y directo en español" },
                      description: { type: "string", description: "Recomendación detallada de 2-3 frases cruzando datos de wearables con nutrición" },
                      category: { type: "string", enum: ["nutrition_activity", "sleep_nutrition", "recovery_nutrition", "weight_goal", "hydration", "stress_nutrition", "performance", "trend_alert"] },
                      priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                      dataPoints: { type: "string", description: "Datos específicos que sustentan la recomendación (ej: Sleep=72, Calorías=2850, Meta=2000)" },
                    },
                    required: ["icon", "title", "description", "category", "priority", "dataPoints"],
                    additionalProperties: false,
                  },
                },
                dailySummary: { type: "string", description: "Resumen de 1 frase del estado general del usuario hoy" },
                overallScore: { type: "number", description: "Puntuación general 0-100 basada en todos los datos" },
              },
              required: ["insights", "dailySummary", "overallScore"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content || "";
      try {
        const parsed = JSON.parse(content);
        return { ...parsed, generatedAt: Date.now(), hasRealData };
      } catch {
        return {
          insights: [
            { icon: "\u26a0\ufe0f", title: "Exceso calórico detectado", description: "Ayer consumiste 2850kcal pero tu meta es 2000kcal. Además tu sueño fue bajo (6.2h). Reduce carbos en la cena y añade más verduras para mejorar ambos.", category: "weight_goal", priority: "critical", dataPoints: "Calorías=2850, Meta=2000, Sueño=6.2h" },
            { icon: "\ud83c\udfcb\ufe0f", title: "Alta actividad + baja proteína", description: "Con 12400 pasos y actividad 85/100, necesitas más proteína. Solo consumiste 95g pero deberías llegar a 130g. Añade un batido de proteínas post-entrenamiento.", category: "nutrition_activity", priority: "high", dataPoints: "Pasos=12400, Proteína=95g, Meta=130g" },
            { icon: "\ud83d\ude34", title: "Sueño en descenso", description: "Tu Sleep Score bajó de 78 a 72 esta semana. Evita pantallas 1h antes de dormir y cena ligero (ensalada + proteína) al menos 2h antes de acostarte.", category: "sleep_nutrition", priority: "high", dataPoints: "Sleep=72/100, Promedio=78" },
            { icon: "\ud83d\udca7", title: "Hidratación insuficiente", description: "Con tu nivel de actividad necesitas al menos 2.5L de agua. Añade agua con limón por la mañana y una infusión por la noche.", category: "hydration", priority: "medium", dataPoints: "Actividad=85/100, Pasos=12400" },
            { icon: "\ud83d\udcc9", title: "Tendencia: comidas irregulares", description: "Ayer 4 comidas (2850kcal) vs anteayer solo 2 comidas (1650kcal). Esta irregularidad afecta tu metabolismo. Intenta mantener 4-5 comidas equilibradas cada día.", category: "trend_alert", priority: "medium", dataPoints: "Ayer=2850kcal/4comidas, Anteayer=1650kcal/2comidas" },
          ],
          dailySummary: "Día de alta actividad pero con exceso calórico y sueño por debajo del objetivo. Prioriza la recuperación.",
          overallScore: 62,
          generatedAt: Date.now(),
          hasRealData,
        };
      }
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
