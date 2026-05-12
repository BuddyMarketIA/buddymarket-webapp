import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq, and, desc, gte, lte, count, sum } from "drizzle-orm";
import {
  ecosystemConnections,
  ecosystemActivity,
  userSupplements,
  supplementLogs,
  mealLogs,
  userProfiles,
} from "../../drizzle/schema";
import * as db from "../db";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}
function getTimeOfDayContext(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

export const ecosystemEnhancedRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DYNAMIC ECOSYSTEM SCORE
  // ═══════════════════════════════════════════════════════════════════════════
  getEcosystemScore: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return { score: 0, breakdown: [], label: "Sin datos", tip: "" };

    const userId = ctx.user.id;
    const weekAgo = daysAgo(7);

    // Factor 1: Connected apps (max 25 pts)
    const connections = await drizzleDb
      .select()
      .from(ecosystemConnections)
      .where(and(eq(ecosystemConnections.userId, userId), eq(ecosystemConnections.status, "active")));
    const connectedApps = connections.length;
    const appScore = Math.min(25, Math.round((connectedApps / 3) * 25));

    // Factor 2: Meal logging frequency this week (max 25 pts)
    const mealCountResult = await drizzleDb
      .select({ cnt: count() })
      .from(mealLogs)
      .where(and(eq(mealLogs.userId, userId), gte(mealLogs.logDate, weekAgo.toISOString().slice(0, 10))));
    const mealsThisWeek = mealCountResult[0]?.cnt ?? 0;
    const mealScore = Math.min(25, Math.round((Number(mealsThisWeek) / 21) * 25)); // 3 meals/day * 7 days

    // Factor 3: Supplement adherence this week (max 25 pts)
    const supLogCount = await drizzleDb
      .select({ cnt: count() })
      .from(supplementLogs)
      .where(and(eq(supplementLogs.userId, userId), gte(supplementLogs.takenAt, weekAgo), eq(supplementLogs.skipped, false)));
    const supsTaken = supLogCount[0]?.cnt ?? 0;
    const activeSups = await drizzleDb
      .select({ cnt: count() })
      .from(userSupplements)
      .where(and(eq(userSupplements.userId, userId), eq(userSupplements.isActive, true)));
    const expectedSups = (Number(activeSups[0]?.cnt) || 0) * 7;
    const supScore = expectedSups > 0 ? Math.min(25, Math.round((Number(supsTaken) / expectedSups) * 25)) : 12;

    // Factor 4: Profile completeness (max 25 pts)
    const profile = await drizzleDb
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    const p = profile[0];
    let profileFields = 0;
    if (p) {
      if (p.age || p.birthYear) profileFields++;
      if (p.height) profileFields++;
      if (p.weight) profileFields++;
      if (p.mainGoal) profileFields++;
      if (p.activityLevel) profileFields++;
      if (p.dailyCalorieGoal) profileFields++;
      if (p.gender) profileFields++;
      if (p.cookingLevel) profileFields++;
    }
    const profileScore = Math.min(25, Math.round((profileFields / 8) * 25));

    const totalScore = appScore + mealScore + supScore + profileScore;

    const breakdown = [
      { key: "apps", label: "Apps conectadas", score: appScore, max: 25, icon: "🔗" },
      { key: "nutrition", label: "Nutrición", score: mealScore, max: 25, icon: "🥗" },
      { key: "supplements", label: "Suplementación", score: supScore, max: 25, icon: "💊" },
      { key: "profile", label: "Perfil completo", score: profileScore, max: 25, icon: "👤" },
    ];

    let label = "Empezando";
    let tip = "Conecta más apps y registra tus comidas para mejorar tu score.";
    if (totalScore >= 80) { label = "Excelente"; tip = "¡Sigue así! Tu ecosistema está muy bien integrado."; }
    else if (totalScore >= 60) { label = "Muy bien"; tip = "Pequeños ajustes marcarán la diferencia."; }
    else if (totalScore >= 40) { label = "En progreso"; tip = "Registra más comidas y conecta apps para mejorar."; }
    else if (totalScore >= 20) { label = "Iniciando"; tip = "Completa tu perfil y empieza a registrar comidas."; }

    return { score: totalScore, breakdown, label, tip };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ACTIVITY TIMELINE
  // ═══════════════════════════════════════════════════════════════════════════
  getActivityTimeline: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return [];

      const activities = await drizzleDb
        .select()
        .from(ecosystemActivity)
        .where(eq(ecosystemActivity.userId, ctx.user.id))
        .orderBy(desc(ecosystemActivity.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return activities.map((a) => ({
        id: a.id,
        source: a.source,
        eventType: a.eventType,
        title: a.title,
        description: a.description,
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
        createdAt: a.createdAt,
      }));
    }),

  // Log an ecosystem activity (called internally when user does things)
  logActivity: protectedProcedure
    .input(z.object({
      source: z.enum(["buddyone", "buddycoach", "buddycare", "buddyshop", "healthhub"]),
      eventType: z.string(),
      title: z.string(),
      description: z.string().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) return null;

      const [activity] = await drizzleDb
        .insert(ecosystemActivity)
        .values({
          userId: ctx.user.id,
          source: input.source,
          eventType: input.eventType,
          title: input.title,
          description: input.description,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        })
        .returning();
      return activity;
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CROSS-RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  getCrossRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];

    const userId = ctx.user.id;
    const profile = await drizzleDb
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const p = profile[0];
    const recommendations: Array<{
      id: string;
      source: string;
      icon: string;
      title: string;
      description: string;
      actionLabel: string;
      actionUrl: string;
      priority: number;
    }> = [];

    // Based on goal
    const goal = p?.mainGoal;
    if (goal === "gain_muscle" || goal === "lose_weight") {
      recommendations.push({
        id: "coach-training",
        source: "buddycoach",
        icon: "🏋️",
        title: goal === "gain_muscle" ? "Plan de hipertrofia personalizado" : "Entreno para quemar grasa",
        description: goal === "gain_muscle"
          ? "BuddyCoach puede crear un plan de fuerza adaptado a tu objetivo de ganancia muscular."
          : "BuddyCoach tiene rutinas HIIT y cardio optimizadas para pérdida de peso.",
        actionLabel: "Ver en BuddyCoach",
        actionUrl: "https://buddycoach.app",
        priority: 1,
      });
    }

    // Protein supplement recommendation
    if (p?.dailyProteinGoal && p.dailyProteinGoal > 100) {
      recommendations.push({
        id: "care-protein",
        source: "buddycare",
        icon: "💊",
        title: "Suplemento de proteína recomendado",
        description: `Con un objetivo de ${Math.round(p.dailyProteinGoal)}g de proteína diaria, un suplemento de whey puede ayudarte a llegar.`,
        actionLabel: "Explorar suplementos",
        actionUrl: "/app/buddy-care",
        priority: 2,
      });
    }

    // Shop recommendation based on cooking level
    if (p?.cookingLevel === "beginner") {
      recommendations.push({
        id: "shop-beginner",
        source: "buddyshop",
        icon: "🛍️",
        title: "Kit de cocina para principiantes",
        description: "En BuddyShop encontrarás sets de cocina perfectos para empezar a cocinar sano.",
        actionLabel: "Ver en BuddyShop",
        actionUrl: "https://www.buddyoneshop.com",
        priority: 3,
      });
    }

    // Activity level recommendation
    if (p?.activityLevel === "sedentary" || p?.activityLevel === "light") {
      recommendations.push({
        id: "coach-activity",
        source: "buddycoach",
        icon: "🚶",
        title: "Empieza a moverte con BuddyCoach",
        description: "Rutinas suaves de 15 minutos para empezar a incorporar actividad física.",
        actionLabel: "Empezar ahora",
        actionUrl: "https://buddycoach.app",
        priority: 2,
      });
    }

    // General wellness
    recommendations.push({
      id: "care-wellness",
      source: "buddycare",
      icon: "💚",
      title: "Revisa tu bienestar integral",
      description: "BuddyCare analiza tus métricas de salud para recomendarte suplementos y hábitos.",
      actionLabel: "Ir a BuddyCare",
      actionUrl: "/app/buddy-care",
      priority: 4,
    });

    // Nutrition tracking
    const weekAgo = daysAgo(7);
    const mealCount = await drizzleDb
      .select({ cnt: count() })
      .from(mealLogs)
      .where(and(eq(mealLogs.userId, userId), gte(mealLogs.logDate, weekAgo.toISOString().slice(0, 10))));
    if (Number(mealCount[0]?.cnt ?? 0) < 7) {
      recommendations.push({
        id: "one-meals",
        source: "buddyone",
        icon: "📝",
        title: "Registra más comidas esta semana",
        description: "Solo llevas " + (mealCount[0]?.cnt ?? 0) + " comidas registradas. Intenta registrar al menos 3 al día.",
        actionLabel: "Ir al diario",
        actionUrl: "/app/diary",
        priority: 1,
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. WEEKLY DIGEST
  // ═══════════════════════════════════════════════════════════════════════════
  getWeeklyDigest: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return null;

    const userId = ctx.user.id;
    const thisWeekStart = daysAgo(7);
    const lastWeekStart = daysAgo(14);
    const thisWeekStartStr = thisWeekStart.toISOString().slice(0, 10);
    const lastWeekStartStr = lastWeekStart.toISOString().slice(0, 10);

    // This week meals
    const thisWeekMeals = await drizzleDb
      .select({ cnt: count(), totalCal: sum(mealLogs.calories), totalProt: sum(mealLogs.proteins) })
      .from(mealLogs)
      .where(and(eq(mealLogs.userId, userId), gte(mealLogs.logDate, thisWeekStartStr)));

    // Last week meals
    const lastWeekMeals = await drizzleDb
      .select({ cnt: count(), totalCal: sum(mealLogs.calories), totalProt: sum(mealLogs.proteins) })
      .from(mealLogs)
      .where(and(eq(mealLogs.userId, userId), gte(mealLogs.logDate, lastWeekStartStr), lte(mealLogs.logDate, thisWeekStartStr)));

    // This week supplements
    const thisWeekSups = await drizzleDb
      .select({ cnt: count() })
      .from(supplementLogs)
      .where(and(eq(supplementLogs.userId, userId), gte(supplementLogs.takenAt, thisWeekStart), eq(supplementLogs.skipped, false)));

    const lastWeekSups = await drizzleDb
      .select({ cnt: count() })
      .from(supplementLogs)
      .where(and(eq(supplementLogs.userId, userId), gte(supplementLogs.takenAt, lastWeekStart), lte(supplementLogs.takenAt, thisWeekStart), eq(supplementLogs.skipped, false)));

    // Activity count this week
    const thisWeekActivities = await drizzleDb
      .select({ cnt: count() })
      .from(ecosystemActivity)
      .where(and(eq(ecosystemActivity.userId, userId), gte(ecosystemActivity.createdAt, thisWeekStart)));

    const lastWeekActivities = await drizzleDb
      .select({ cnt: count() })
      .from(ecosystemActivity)
      .where(and(eq(ecosystemActivity.userId, userId), gte(ecosystemActivity.createdAt, lastWeekStart), lte(ecosystemActivity.createdAt, thisWeekStart)));

    const tw = thisWeekMeals[0];
    const lw = lastWeekMeals[0];

    return {
      thisWeek: {
        meals: Number(tw?.cnt ?? 0),
        calories: Number(tw?.totalCal ?? 0),
        protein: Number(tw?.totalProt ?? 0),
        supplements: Number(thisWeekSups[0]?.cnt ?? 0),
        activities: Number(thisWeekActivities[0]?.cnt ?? 0),
      },
      lastWeek: {
        meals: Number(lw?.cnt ?? 0),
        calories: Number(lw?.totalCal ?? 0),
        protein: Number(lw?.totalProt ?? 0),
        supplements: Number(lastWeekSups[0]?.cnt ?? 0),
        activities: Number(lastWeekActivities[0]?.cnt ?? 0),
      },
    };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. GAMIFICATION BADGES
  // ═══════════════════════════════════════════════════════════════════════════
  getEcosystemBadges: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return { earned: [], available: [] };

    const userId = ctx.user.id;

    // Check conditions for ecosystem badges
    const connections = await drizzleDb
      .select()
      .from(ecosystemConnections)
      .where(and(eq(ecosystemConnections.userId, userId), eq(ecosystemConnections.status, "active")));

    const mealCount = await drizzleDb
      .select({ cnt: count() })
      .from(mealLogs)
      .where(eq(mealLogs.userId, userId));

    const supCount = await drizzleDb
      .select({ cnt: count() })
      .from(supplementLogs)
      .where(and(eq(supplementLogs.userId, userId), eq(supplementLogs.skipped, false)));

    const activityCount = await drizzleDb
      .select({ cnt: count() })
      .from(ecosystemActivity)
      .where(eq(ecosystemActivity.userId, userId));

    const allBadges = [
      { id: "eco-explorer", name: "Explorador del Ecosistema", description: "Conecta tu primera app del ecosistema", icon: "🌍", condition: connections.length >= 1, rarity: "common" as const },
      { id: "eco-connector", name: "Conector Total", description: "Conecta las 3 apps del ecosistema", icon: "🔗", condition: connections.length >= 3, rarity: "epic" as const },
      { id: "meal-starter", name: "Primer Registro", description: "Registra tu primera comida", icon: "🍽️", condition: Number(mealCount[0]?.cnt ?? 0) >= 1, rarity: "common" as const },
      { id: "meal-week", name: "Semana Nutritiva", description: "Registra 21 comidas (3 al día durante 7 días)", icon: "📅", condition: Number(mealCount[0]?.cnt ?? 0) >= 21, rarity: "rare" as const },
      { id: "meal-century", name: "Centenario Nutricional", description: "Registra 100 comidas", icon: "💯", condition: Number(mealCount[0]?.cnt ?? 0) >= 100, rarity: "epic" as const },
      { id: "sup-starter", name: "Primera Toma", description: "Registra tu primer suplemento", icon: "💊", condition: Number(supCount[0]?.cnt ?? 0) >= 1, rarity: "common" as const },
      { id: "sup-consistent", name: "Constancia Suplementaria", description: "Toma suplementos 30 días", icon: "🏆", condition: Number(supCount[0]?.cnt ?? 0) >= 30, rarity: "rare" as const },
      { id: "eco-active", name: "Ecosistema Activo", description: "Genera 50 actividades en el ecosistema", icon: "⚡", condition: Number(activityCount[0]?.cnt ?? 0) >= 50, rarity: "legendary" as const },
    ];

    const earned = allBadges.filter((b) => b.condition);
    const available = allBadges.filter((b) => !b.condition);

    return { earned, available };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SUPPLEMENT TRACKER (BuddyCare)
  // ═══════════════════════════════════════════════════════════════════════════
  getSupplements: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];

    return drizzleDb
      .select()
      .from(userSupplements)
      .where(and(eq(userSupplements.userId, ctx.user.id), eq(userSupplements.isActive, true)))
      .orderBy(userSupplements.name);
  }),

  addSupplement: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      dosage: z.string().optional(),
      frequency: z.enum(["daily", "twice_daily", "weekly", "as_needed"]).default("daily"),
      timeOfDay: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");

      const [sup] = await drizzleDb
        .insert(userSupplements)
        .values({ userId: ctx.user.id, ...input })
        .returning();
      return sup;
    }),

  removeSupplement: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");

      await drizzleDb
        .update(userSupplements)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(userSupplements.id, input.id), eq(userSupplements.userId, ctx.user.id)));
      return { success: true };
    }),

  logSupplementTake: protectedProcedure
    .input(z.object({ supplementId: z.number(), skipped: z.boolean().default(false), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("DB not available");

      const [log] = await drizzleDb
        .insert(supplementLogs)
        .values({ userId: ctx.user.id, supplementId: input.supplementId, skipped: input.skipped, notes: input.notes })
        .returning();

      // Also log as ecosystem activity
      if (!input.skipped) {
        const sup = await drizzleDb.select().from(userSupplements).where(eq(userSupplements.id, input.supplementId)).limit(1);
        if (sup[0]) {
          await drizzleDb.insert(ecosystemActivity).values({
            userId: ctx.user.id,
            source: "buddycare",
            eventType: "supplement_taken",
            title: `Tomaste ${sup[0].name}`,
            description: sup[0].dosage ? `Dosis: ${sup[0].dosage}` : undefined,
          });
        }
      }
      return log;
    }),

  getTodaySupplementLogs: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return [];

    const todayStart = startOfDay(new Date());
    return drizzleDb
      .select()
      .from(supplementLogs)
      .where(and(eq(supplementLogs.userId, ctx.user.id), gte(supplementLogs.takenAt, todayStart)));
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. REAL NUTRITION DATA
  // ═══════════════════════════════════════════════════════════════════════════
  getTodayNutrition: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return { calories: 0, protein: 0, carbs: 0, fats: 0, mealCount: 0 };

    const todayStr = new Date().toISOString().slice(0, 10);
    const result = await drizzleDb
      .select({
        totalCal: sum(mealLogs.calories),
        totalProt: sum(mealLogs.proteins),
        totalCarbs: sum(mealLogs.carbohydrates),
        totalFats: sum(mealLogs.fats),
        cnt: count(),
      })
      .from(mealLogs)
      .where(and(eq(mealLogs.userId, ctx.user.id), eq(mealLogs.logDate, todayStr)));

    const r = result[0];
    return {
      calories: Number(r?.totalCal ?? 0),
      protein: Math.round(Number(r?.totalProt ?? 0) * 10) / 10,
      carbs: Math.round(Number(r?.totalCarbs ?? 0) * 10) / 10,
      fats: Math.round(Number(r?.totalFats ?? 0) * 10) / 10,
      mealCount: Number(r?.cnt ?? 0),
    };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. SYNC FLOW VISIBILITY
  // ═══════════════════════════════════════════════════════════════════════════
  getSyncFlows: protectedProcedure.query(async () => {
    const flows = [
      {
        from: "buddyone",
        to: "buddycoach",
        fromLabel: "BuddyOne",
        toLabel: "BuddyCoach",
        dataTypes: ["Datos de nutrición", "Objetivos calóricos", "Peso y medidas"],
        direction: "outgoing" as const,
      },
      {
        from: "buddycoach",
        to: "buddyone",
        fromLabel: "BuddyCoach",
        toLabel: "BuddyOne",
        dataTypes: ["Datos de entrenamiento", "Calorías quemadas", "Volumen semanal"],
        direction: "incoming" as const,
      },
      {
        from: "buddyone",
        to: "buddycare",
        fromLabel: "BuddyOne",
        toLabel: "BuddyCare",
        dataTypes: ["Métricas de salud", "Perfil nutricional", "Alergias"],
        direction: "outgoing" as const,
      },
      {
        from: "buddycare",
        to: "buddyone",
        fromLabel: "BuddyCare",
        toLabel: "BuddyOne",
        dataTypes: ["Suplementos recomendados", "Bienestar general"],
        direction: "incoming" as const,
      },
      {
        from: "buddyone",
        to: "buddyshop",
        fromLabel: "BuddyOne",
        toLabel: "BuddyShop",
        dataTypes: ["Preferencias alimentarias", "Objetivos"],
        direction: "outgoing" as const,
      },
      {
        from: "buddyshop",
        to: "buddyone",
        fromLabel: "BuddyShop",
        toLabel: "BuddyOne",
        dataTypes: ["Productos recomendados", "Historial de compras"],
        direction: "incoming" as const,
      },
    ];
    return flows;
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. CONTEXTUAL QUICK ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  getContextualActions: protectedProcedure.query(async ({ ctx }) => {
    const timeOfDay = getTimeOfDayContext();
    const drizzleDb = await db.getDb();

    // Check today's meals
    let todayMealCount = 0;
    if (drizzleDb) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const result = await drizzleDb
        .select({ cnt: count() })
        .from(mealLogs)
        .where(and(eq(mealLogs.userId, ctx.user.id), eq(mealLogs.logDate, todayStr)));
      todayMealCount = Number(result[0]?.cnt ?? 0);
    }

    type QuickAction = { id: string; icon: string; label: string; sublabel: string; url: string; color: string; priority: number };
    const actions: QuickAction[] = [];

    if (timeOfDay === "morning") {
      if (todayMealCount === 0) {
        actions.push({ id: "log-breakfast", icon: "🥣", label: "Registrar desayuno", sublabel: "BuddyOne", url: "/app/diary", color: "#059669", priority: 1 });
      }
      actions.push({ id: "morning-sups", icon: "💊", label: "Suplementos mañana", sublabel: "BuddyCare", url: "/app/buddy-care", color: "#10B981", priority: 2 });
      actions.push({ id: "morning-workout", icon: "🏋️", label: "Entreno matutino", sublabel: "BuddyCoach", url: "https://buddycoach.app", color: "#7C3AED", priority: 3 });
      actions.push({ id: "check-metrics", icon: "📊", label: "Revisar métricas", sublabel: "Health Hub", url: "/app/health-hub", color: "#4F46E5", priority: 4 });
    } else if (timeOfDay === "afternoon") {
      if (todayMealCount < 2) {
        actions.push({ id: "log-lunch", icon: "🍽️", label: "Registrar comida", sublabel: "BuddyOne", url: "/app/diary", color: "#059669", priority: 1 });
      }
      actions.push({ id: "afternoon-workout", icon: "🏋️", label: "Entreno tarde", sublabel: "BuddyCoach", url: "https://buddycoach.app", color: "#7C3AED", priority: 2 });
      actions.push({ id: "browse-recipes", icon: "📖", label: "Buscar recetas", sublabel: "BuddyOne", url: "/app/recipes", color: "#EA580C", priority: 3 });
      actions.push({ id: "shop-products", icon: "🛍️", label: "Ver productos", sublabel: "BuddyShop", url: "https://www.buddyoneshop.com", color: "#4F46E5", priority: 4 });
    } else if (timeOfDay === "evening") {
      if (todayMealCount < 3) {
        actions.push({ id: "log-dinner", icon: "🥗", label: "Registrar cena", sublabel: "BuddyOne", url: "/app/diary", color: "#059669", priority: 1 });
      }
      actions.push({ id: "evening-sups", icon: "💊", label: "Suplementos noche", sublabel: "BuddyCare", url: "/app/buddy-care", color: "#10B981", priority: 2 });
      actions.push({ id: "plan-tomorrow", icon: "📋", label: "Planificar mañana", sublabel: "BuddyOne", url: "/app/menus", color: "#EA580C", priority: 3 });
      actions.push({ id: "day-summary", icon: "📊", label: "Resumen del día", sublabel: "Health Hub", url: "/app/health-hub", color: "#4F46E5", priority: 4 });
    } else {
      actions.push({ id: "night-review", icon: "🌙", label: "Resumen del día", sublabel: "Health Hub", url: "/app/health-hub", color: "#4F46E5", priority: 1 });
      actions.push({ id: "night-sups", icon: "💊", label: "Suplementos noche", sublabel: "BuddyCare", url: "/app/buddy-care", color: "#10B981", priority: 2 });
      actions.push({ id: "plan-meals", icon: "📋", label: "Planificar comidas", sublabel: "BuddyOne", url: "/app/menus", color: "#EA580C", priority: 3 });
      actions.push({ id: "browse-shop", icon: "🛍️", label: "BuddyShop", sublabel: "Tienda", url: "https://www.buddyoneshop.com", color: "#4F46E5", priority: 4 });
    }

    return { timeOfDay, actions: actions.sort((a, b) => a.priority - b.priority).slice(0, 4) };
  }),
});
