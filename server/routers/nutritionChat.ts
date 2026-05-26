/**
 * nutritionChat router — AI Conversational Nutrition Assistant
 * Specialized chat that uses user's medical profile, allergies, goals, and history
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

export const nutritionChatRouter = router({
  /**
   * Send a message to the nutrition AI assistant
   */
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(2000),
      conversationHistory: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).max(20).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const drizzleDb = await getDb();
      if (!drizzleDb) throw new Error("DB not available");

      const { users, userProfiles, userPreferences, dailyLogs, healthBloodTests } = await import("../../drizzle/schema");
      const { eq, desc, and, isNull } = await import("drizzle-orm");

      // Gather user context
      const [user] = await drizzleDb.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const [profile] = await drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, ctx.user.id)).limit(1);
      const [prefs] = await drizzleDb.select().from(userPreferences).where(eq(userPreferences.userId, ctx.user.id)).limit(1);

      // Get recent nutrition data
      const recentLogs = await drizzleDb
        .select({
          logDate: dailyLogs.logDate,
          calories: dailyLogs.calories,
          protein: dailyLogs.protein,
          carbs: dailyLogs.carbs,
          fat: dailyLogs.fat,
        })
        .from(dailyLogs)
        .where(and(eq(dailyLogs.userId, ctx.user.id), isNull(dailyLogs.deletedAt)))
        .orderBy(desc(dailyLogs.createdAt))
        .limit(7);

      // Get latest blood test if available
      const [bloodTest] = await drizzleDb
        .select()
        .from(healthBloodTests)
        .where(eq(healthBloodTests.userId, ctx.user.id))
        .orderBy(desc(healthBloodTests.createdAt))
        .limit(1);

      // Build comprehensive context
      const userContext = buildUserContext(user, profile, prefs, recentLogs, bloodTest);

      const { invokeLLM } = await import("../_core/llm");

      const messages: any[] = [
        {
          role: "system",
          content: `Eres un nutricionista experto y empático de Buddy One. Tu nombre es BuddyNutri. Tienes acceso al perfil completo del usuario y sus datos de salud. Responde SIEMPRE en español.

PERFIL DEL USUARIO:
${userContext}

REGLAS:
1. Personaliza TODAS las respuestas según el perfil del usuario (alergias, objetivos, restricciones)
2. Si el usuario pregunta sobre un alimento que le causa alergia/intolerancia, ADVIERTE claramente
3. Basa tus recomendaciones en evidencia científica
4. Si no estás seguro de algo médico, recomienda consultar con un profesional
5. Sé conciso pero informativo. Usa emojis con moderación
6. Si el usuario tiene datos de analítica sanguínea, tenlos en cuenta
7. Ofrece alternativas cuando algo no es adecuado para el usuario
8. Nunca diagnostiques enfermedades, solo orienta sobre nutrición
9. Usa los datos recientes de alimentación para dar contexto a tus respuestas`
        },
      ];

      // Add conversation history
      if (input.conversationHistory) {
        for (const msg of input.conversationHistory.slice(-10)) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      messages.push({ role: "user", content: input.message });

      const response = await invokeLLM({ messages });

      return {
        reply: response.choices[0].message.content || "Lo siento, no pude procesar tu pregunta. ¿Puedes reformularla?",
        timestamp: Date.now(),
      };
    }),

  /**
   * Get suggested questions based on user profile
   */
  getSuggestions: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("../db");
    const drizzleDb = await getDb();
    if (!drizzleDb) return { suggestions: [] };

    const { userProfiles, userPreferences } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [profile] = await drizzleDb.select().from(userProfiles).where(eq(userProfiles.userId, ctx.user.id)).limit(1);
    const [prefs] = await drizzleDb.select().from(userPreferences).where(eq(userPreferences.userId, ctx.user.id)).limit(1);

    const suggestions: string[] = [
      "¿Qué puedo cenar hoy que sea ligero?",
      "¿Estoy comiendo suficiente proteína?",
    ];

    if (profile?.mainGoal === "lose_weight") {
      suggestions.push("¿Cómo puedo reducir calorías sin pasar hambre?");
      suggestions.push("¿Qué snacks saciantes tienen menos de 100 kcal?");
    } else if (profile?.mainGoal === "gain_muscle") {
      suggestions.push("¿Cuánta proteína necesito para ganar músculo?");
      suggestions.push("¿Qué comer antes y después de entrenar?");
    }

    if (prefs?.allergies && (prefs.allergies as string[]).length > 0) {
      suggestions.push("¿Qué alternativas tengo para mis alergias?");
    }

    suggestions.push("¿Qué alimentos son buenos para dormir mejor?");
    suggestions.push("¿Cómo mejorar mi digestión con la alimentación?");

    return { suggestions: suggestions.slice(0, 6) };
  }),
});

function buildUserContext(user: any, profile: any, prefs: any, recentLogs: any[], bloodTest: any): string {
  const lines: string[] = [];

  if (user?.name) lines.push(`Nombre: ${user.name}`);
  if (profile?.age) lines.push(`Edad: ${profile.age} años`);
  if (profile?.gender) lines.push(`Género: ${profile.gender}`);
  if (profile?.weight) lines.push(`Peso: ${profile.weight} kg`);
  if (profile?.height) lines.push(`Altura: ${profile.height} cm`);
  if (profile?.mainGoal) lines.push(`Objetivo principal: ${profile.mainGoal}`);
  if (profile?.activityLevel) lines.push(`Nivel de actividad: ${profile.activityLevel}`);
  if (profile?.dailyCalories) lines.push(`Objetivo calórico diario: ${profile.dailyCalories} kcal`);

  if (prefs?.allergies && (prefs.allergies as string[]).length > 0) {
    lines.push(`⚠️ ALERGIAS/INTOLERANCIAS: ${(prefs.allergies as string[]).join(", ")}`);
  }
  if (prefs?.dietType) lines.push(`Tipo de dieta: ${prefs.dietType}`);
  if (prefs?.restrictions && (prefs.restrictions as string[]).length > 0) {
    lines.push(`Restricciones: ${(prefs.restrictions as string[]).join(", ")}`);
  }

  if (recentLogs.length > 0) {
    const avgCal = Math.round(recentLogs.reduce((s, l) => s + (Number(l.calories) || 0), 0) / recentLogs.length);
    const avgProt = Math.round(recentLogs.reduce((s, l) => s + (Number(l.protein) || 0), 0) / recentLogs.length);
    lines.push(`\nÚltimos 7 días (promedio): ${avgCal} kcal/día, ${avgProt}g proteína/día`);
  }

  if (bloodTest) {
    lines.push(`\nÚltima analítica: ${bloodTest.testDate || "fecha no disponible"}`);
    if (bloodTest.results) {
      try {
        const results = typeof bloodTest.results === "string" ? JSON.parse(bloodTest.results) : bloodTest.results;
        if (results.summary) lines.push(`Resumen: ${results.summary}`);
      } catch {}
    }
  }

  return lines.join("\n") || "Sin datos de perfil disponibles";
}
