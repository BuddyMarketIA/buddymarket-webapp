/**
 * BuddyMarket — Retention Router
 * Handles: streak shields, weekly challenges, 30-day challenges, taste insights, level-up events
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0]!;
}

const WEEKLY_CHALLENGES_SEED = [
  { slug: "log_7_days", titleEs: "Semana Perfecta", descriptionEs: "Registra tus comidas los 7 días de esta semana", icon: "📅", targetValue: 7, metricType: "log_days", pointsReward: 150 },
  { slug: "try_3_recipes", titleEs: "Explorador Culinario", descriptionEs: "Cocina 3 recetas diferentes esta semana", icon: "👨‍🍳", targetValue: 3, metricType: "distinct_recipes", pointsReward: 120 },
  { slug: "drink_water_5days", titleEs: "Hidratación Total", descriptionEs: "Registra tu consumo de agua 5 días seguidos", icon: "💧", targetValue: 5, metricType: "water_days", pointsReward: 100 },
  { slug: "hit_calorie_goal_5days", titleEs: "Objetivo Calórico", descriptionEs: "Cumple tu objetivo calórico 5 días esta semana", icon: "🎯", targetValue: 5, metricType: "calorie_goal_days", pointsReward: 130 },
  { slug: "eat_5_colors", titleEs: "Arcoíris Nutricional", descriptionEs: "Come alimentos de 5 colores diferentes esta semana", icon: "🌈", targetValue: 5, metricType: "food_colors", pointsReward: 110 },
  { slug: "log_breakfast_5days", titleEs: "Desayuno Campeón", descriptionEs: "Registra el desayuno 5 días esta semana", icon: "🌅", targetValue: 5, metricType: "breakfast_days", pointsReward: 90 },
  { slug: "scan_3_products", titleEs: "Detective Nutricional", descriptionEs: "Escanea 3 productos con BuddyScan esta semana", icon: "🔍", targetValue: 3, metricType: "scans", pointsReward: 80 },
  { slug: "complete_menu_week", titleEs: "Menú Completo", descriptionEs: "Sigue tu menú semanal al 80% o más", icon: "📋", targetValue: 80, metricType: "menu_adherence_pct", pointsReward: 200 },
  { slug: "log_all_macros_3days", titleEs: "Macro Maestro", descriptionEs: "Registra todos tus macros 3 días esta semana", icon: "⚗️", targetValue: 3, metricType: "full_macro_days", pointsReward: 100 },
  { slug: "add_recipe_to_favorites", titleEs: "Coleccionista", descriptionEs: "Añade 2 recetas a favoritos esta semana", icon: "❤️", targetValue: 2, metricType: "recipe_favorites", pointsReward: 70 },
];

const THIRTY_DAY_PLANS: Record<string, { dayTasks: { day: number; task: string; habit: string; waterGoal: number }[] }> = {
  weight_loss: {
    dayTasks: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      task: i < 7 ? "Registra todas tus comidas del día" : i < 14 ? "Cocina una receta nueva y saludable" : i < 21 ? "Cumple tu objetivo calórico" : "Mantén tu racha de registro",
      habit: i < 10 ? "Bebe un vaso de agua antes de cada comida" : i < 20 ? "Camina 20 minutos después de comer" : "Prepara tu comida del día siguiente la noche anterior",
      waterGoal: 2000 + Math.floor(i / 10) * 250,
    })),
  },
  muscle_gain: {
    dayTasks: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      task: i < 7 ? "Registra tu ingesta de proteínas" : i < 14 ? "Añade una fuente de proteína a cada comida" : i < 21 ? "Cumple tu objetivo de proteínas" : "Mantén tu ingesta calórica en superávit",
      habit: i < 10 ? "Come dentro de 30 min tras entrenar" : i < 20 ? "Añade un snack proteico a media mañana" : "Prepara batch cooking de proteínas el domingo",
      waterGoal: 2500 + Math.floor(i / 10) * 250,
    })),
  },
  wellness: {
    dayTasks: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      task: i < 7 ? "Registra cómo te sientes después de cada comida" : i < 14 ? "Incorpora una verdura nueva a tu dieta" : i < 21 ? "Prueba una receta antiinflamatoria" : "Mantén un diario de bienestar nutricional",
      habit: i < 10 ? "Come sin pantallas al menos una vez al día" : i < 20 ? "Mastica despacio y conscientemente" : "Prepara una infusión digestiva por la noche",
      waterGoal: 2000 + Math.floor(i / 10) * 200,
    })),
  },
};

// ─── Router ───────────────────────────────────────────────────────────────────

export const retentionRouter = router({

  // ── Streak Shield ──────────────────────────────────────────────────────────

  getStreakShield: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const { streakShields } = await import("../../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");
    const [shield] = await drizzleDb.select().from(streakShields).where(eq(streakShields.userId, ctx.user.id)).limit(1);
    if (!shield) {
      // Grant first shield on first query
      const [created] = await drizzleDb.insert(streakShields).values({ userId: ctx.user.id, shieldsAvailable: 1, lastShieldGrantedAt: new Date() }).returning();
      return { shieldsAvailable: created?.shieldsAvailable ?? 1, shieldsUsedTotal: 0 };
    }
    // Grant weekly shield if last grant was >7 days ago
    const now = new Date();
    const lastGrant = shield.lastShieldGrantedAt ? new Date(shield.lastShieldGrantedAt) : null;
    const daysSinceGrant = lastGrant ? Math.floor((now.getTime() - lastGrant.getTime()) / 86400000) : 999;
    if (daysSinceGrant >= 7 && shield.shieldsAvailable < 2) {
      const [updated] = await drizzleDb.update(streakShields)
        .set({ shieldsAvailable: Math.min(shield.shieldsAvailable + 1, 2), lastShieldGrantedAt: now, updatedAt: now })
        .where(eq(streakShields.userId, ctx.user.id))
        .returning();
      return { shieldsAvailable: updated?.shieldsAvailable ?? shield.shieldsAvailable, shieldsUsedTotal: shield.shieldsUsedTotal };
    }
    return { shieldsAvailable: shield.shieldsAvailable, shieldsUsedTotal: shield.shieldsUsedTotal };
  }),

  useStreakShield: protectedProcedure.mutation(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const { streakShields } = await import("../../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");
    const [shield] = await drizzleDb.select().from(streakShields).where(eq(streakShields.userId, ctx.user.id)).limit(1);
    if (!shield || shield.shieldsAvailable < 1) {
      throw new Error("No tienes escudos disponibles");
    }
    // Add a fake log for yesterday to protect the streak
    const { mealLogs } = await import("../../drizzle/schema.js");
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]!;
    // Check if there's already a log for yesterday
    const { and } = await import("drizzle-orm");
    const existingLogs = await drizzleDb.select({ id: mealLogs.id }).from(mealLogs)
      .where(and(eq(mealLogs.userId, ctx.user.id), eq(mealLogs.logDate, yesterday))).limit(1);
    if (existingLogs.length === 0) {
      await drizzleDb.insert(mealLogs).values({
        userId: ctx.user.id,
        logDate: yesterday,
        mealType: "otro",
        notes: "🛡️ Escudo de racha activado",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
    }
    await drizzleDb.update(streakShields)
      .set({ shieldsAvailable: shield.shieldsAvailable - 1, shieldsUsedTotal: shield.shieldsUsedTotal + 1, updatedAt: new Date() })
      .where(eq(streakShields.userId, ctx.user.id));
    return { ok: true, shieldsRemaining: shield.shieldsAvailable - 1 };
  }),

  // ── Weekly Challenges ──────────────────────────────────────────────────────

  getWeeklyChallenges: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const { weeklyChallenges, userWeeklyChallenges } = await import("../../drizzle/schema.js");
    const { eq, and } = await import("drizzle-orm");

    // Seed challenges if empty
    const existing = await drizzleDb.select({ id: weeklyChallenges.id }).from(weeklyChallenges).limit(1);
    if (existing.length === 0) {
      await drizzleDb.insert(weeklyChallenges).values(WEEKLY_CHALLENGES_SEED);
    }

    const weekStart = getMondayOfWeek(new Date());
    const allChallenges = await drizzleDb.select().from(weeklyChallenges).where(eq(weeklyChallenges.isActive, true));
    const userProgress = await drizzleDb.select().from(userWeeklyChallenges)
      .where(and(eq(userWeeklyChallenges.userId, ctx.user.id), eq(userWeeklyChallenges.weekStart, weekStart)));

    // Pick 3 challenges for this week (deterministic based on week)
    const weekNum = Math.floor(new Date(weekStart).getTime() / (7 * 86400000));
    const selected = allChallenges.slice(weekNum % Math.max(allChallenges.length - 2, 1), (weekNum % Math.max(allChallenges.length - 2, 1)) + 3);

    return selected.map(c => {
      const progress = userProgress.find(p => p.challengeId === c.id);
      return {
        ...c,
        weekStart,
        currentValue: progress?.currentValue ?? 0,
        completed: progress?.completed ?? false,
        completedAt: progress?.completedAt ?? null,
        progressPct: Math.min(100, Math.round(((progress?.currentValue ?? 0) / c.targetValue) * 100)),
      };
    });
  }),

  updateChallengeProgress: protectedProcedure
    .input(z.object({ challengeId: z.number().int(), value: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      const { weeklyChallenges, userWeeklyChallenges, userPoints } = await import("../../drizzle/schema.js");
      const { eq, and, sql } = await import("drizzle-orm");
      const weekStart = getMondayOfWeek(new Date());
      const [challenge] = await drizzleDb.select().from(weeklyChallenges).where(eq(weeklyChallenges.id, input.challengeId)).limit(1);
      if (!challenge) return { ok: false };
      const [existing] = await drizzleDb.select().from(userWeeklyChallenges)
        .where(and(eq(userWeeklyChallenges.userId, ctx.user.id), eq(userWeeklyChallenges.challengeId, input.challengeId), eq(userWeeklyChallenges.weekStart, weekStart))).limit(1);
      const newValue = Math.max(existing?.currentValue ?? 0, input.value);
      const completed = newValue >= challenge.targetValue;
      const wasCompleted = existing?.completed ?? false;
      if (existing) {
        await drizzleDb.update(userWeeklyChallenges)
          .set({ currentValue: newValue, completed, completedAt: completed && !wasCompleted ? new Date() : existing.completedAt, pointsAwarded: completed ? challenge.pointsReward : 0 })
          .where(eq(userWeeklyChallenges.id, existing.id));
      } else {
        await drizzleDb.insert(userWeeklyChallenges).values({ userId: ctx.user.id, challengeId: input.challengeId, weekStart, currentValue: newValue, completed, completedAt: completed ? new Date() : null, pointsAwarded: completed ? challenge.pointsReward : 0 });
      }
      // Award points if newly completed
      if (completed && !wasCompleted) {
        await drizzleDb.insert(userPoints).values({ userId: ctx.user.id, totalPoints: challenge.pointsReward, level: 1 })
          .onConflictDoUpdate({ target: userPoints.userId, set: { totalPoints: sql`${userPoints.totalPoints} + ${challenge.pointsReward}`, updatedAt: new Date() } });
      }
      return { ok: true, completed, newlyCompleted: completed && !wasCompleted };
    }),

  // ── 30-Day Challenge ───────────────────────────────────────────────────────

  getActiveThirtyDayChallenge: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const { thirtyDayChallenges } = await import("../../drizzle/schema.js");
    const { eq, and } = await import("drizzle-orm");
    const [active] = await drizzleDb.select().from(thirtyDayChallenges)
      .where(and(eq(thirtyDayChallenges.userId, ctx.user.id), eq(thirtyDayChallenges.completed, false)))
      .limit(1);
    if (!active) return null;
    const today = new Date().toISOString().split("T")[0]!;
    const startDate = new Date(active.startDate);
    const currentDay = Math.min(30, Math.floor((new Date(today).getTime() - startDate.getTime()) / 86400000) + 1);
    const completedDays: number[] = JSON.parse(active.completedDays || "[]");
    const plan = THIRTY_DAY_PLANS[active.challengeType];
    const todayTask = plan?.dayTasks[currentDay - 1];
    return { ...active, currentDay, completedDays, todayTask, progressPct: Math.round((completedDays.length / 30) * 100) };
  }),

  startThirtyDayChallenge: protectedProcedure
    .input(z.object({ challengeType: z.enum(["weight_loss", "muscle_gain", "wellness"]) }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      const { thirtyDayChallenges } = await import("../../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");
      // Cancel any active challenge
      await drizzleDb.update(thirtyDayChallenges).set({ completed: true, completedAt: new Date() })
        .where(and(eq(thirtyDayChallenges.userId, ctx.user.id), eq(thirtyDayChallenges.completed, false)));
      const startDate = new Date().toISOString().split("T")[0]!;
      const endDate = new Date(Date.now() + 29 * 86400000).toISOString().split("T")[0]!;
      const [created] = await drizzleDb.insert(thirtyDayChallenges).values({ userId: ctx.user.id, challengeType: input.challengeType, startDate, endDate, completedDays: "[]" }).returning();
      return created;
    }),

  checkInThirtyDay: protectedProcedure.mutation(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const { thirtyDayChallenges, userPoints } = await import("../../drizzle/schema.js");
    const { eq, and, sql } = await import("drizzle-orm");
    const [active] = await drizzleDb.select().from(thirtyDayChallenges)
      .where(and(eq(thirtyDayChallenges.userId, ctx.user.id), eq(thirtyDayChallenges.completed, false))).limit(1);
    if (!active) return { ok: false, message: "No tienes un reto activo" };
    const today = new Date().toISOString().split("T")[0]!;
    const currentDay = Math.min(30, Math.floor((new Date(today).getTime() - new Date(active.startDate).getTime()) / 86400000) + 1);
    const completedDays: number[] = JSON.parse(active.completedDays || "[]");
    if (completedDays.includes(currentDay)) return { ok: true, alreadyCheckedIn: true, completedDays };
    completedDays.push(currentDay);
    const isComplete = completedDays.length >= 30;
    await drizzleDb.update(thirtyDayChallenges).set({ completedDays: JSON.stringify(completedDays), currentDay, completed: isComplete, completedAt: isComplete ? new Date() : null })
      .where(eq(thirtyDayChallenges.id, active.id));
    // Award 20 points per day checked in
    await drizzleDb.insert(userPoints).values({ userId: ctx.user.id, totalPoints: 20, level: 1 })
      .onConflictDoUpdate({ target: userPoints.userId, set: { totalPoints: sql`${userPoints.totalPoints} + 20`, updatedAt: new Date() } });
    return { ok: true, alreadyCheckedIn: false, completedDays, currentDay, isComplete };
  }),

  // ── Taste Insights ─────────────────────────────────────────────────────────

  getTasteInsights: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const { tasteInsights, userTasteProfile } = await import("../../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");
    const [insight] = await drizzleDb.select().from(tasteInsights).where(eq(tasteInsights.userId, ctx.user.id)).limit(1);
    // Also get the taste profile for buddy score
    const [profile] = await drizzleDb.select().from(userTasteProfile).where(eq(userTasteProfile.userId, ctx.user.id)).limit(1);
    const buddyScore = profile ? Math.min(100, Math.round(((profile.totalInteractions ?? 0) / 50) * 100)) : 0;
    return {
      topCuisines: insight ? JSON.parse(insight.topCuisines) : [],
      topIngredients: insight ? JSON.parse(insight.topIngredients) : [],
      insightSummaryEs: insight?.insightSummaryEs ?? null,
      lastUpdatedAt: insight?.lastUpdatedAt ?? null,
      buddyScore,
      totalInteractions: profile?.totalInteractions ?? 0,
    };
  }),

  updateTasteInsights: protectedProcedure.mutation(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const { tasteInsights, userTasteProfile, recipeFavorites, recipes } = await import("../../drizzle/schema.js");
    const { eq, desc } = await import("drizzle-orm");
    // Gather data from favorites and interactions
    const favorites = await drizzleDb.select({ recipeId: recipeFavorites.recipeId }).from(recipeFavorites).where(eq(recipeFavorites.userId, ctx.user.id)).limit(20);
    const recipeIds = favorites.map(f => f.recipeId);
    let topCuisines: string[] = [];
    let topIngredients: string[] = [];
    let insightSummaryEs = "Seguimos aprendiendo tus preferencias. ¡Sigue usando BuddyMarket!";
    if (recipeIds.length > 0) {
      const { inArray } = await import("drizzle-orm");
      const favRecipes = await drizzleDb.select({ tags: recipes.tags, name: recipes.name }).from(recipes).where(inArray(recipes.id, recipeIds)).limit(20);
      const tagCounts: Record<string, number> = {};
      for (const r of favRecipes) {
        if (r.tags) {
          try {
            const tags: string[] = JSON.parse(r.tags);
            tags.forEach(t => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; });
          } catch {}
        }
      }
      topCuisines = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
      if (topCuisines.length > 0) {
        insightSummaryEs = `Te encantan las recetas ${topCuisines.slice(0, 2).join(" y ")}. Tus próximas sugerencias serán más precisas.`;
      }
    }
    await drizzleDb.insert(tasteInsights).values({ userId: ctx.user.id, topCuisines: JSON.stringify(topCuisines), topIngredients: JSON.stringify(topIngredients), insightSummaryEs, lastUpdatedAt: new Date() })
      .onConflictDoUpdate({ target: tasteInsights.userId, set: { topCuisines: JSON.stringify(topCuisines), topIngredients: JSON.stringify(topIngredients), insightSummaryEs, lastUpdatedAt: new Date() } });
    return { ok: true, insightSummaryEs, topCuisines };
  }),

  // ── Level Info ─────────────────────────────────────────────────────────────

  getLevelInfo: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const { userPoints } = await import("../../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");
    const { getLevelForPoints, getNextLevel, LEVELS } = await import("../achievements-catalog.js");
    const [pts] = await drizzleDb.select().from(userPoints).where(eq(userPoints.userId, ctx.user.id)).limit(1);
    const totalPoints = pts?.totalPoints ?? 0;
    const currentLevel = getLevelForPoints(totalPoints);
    const nextLevel = getNextLevel(totalPoints);
    const progressPct = nextLevel
      ? Math.round(((totalPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100)
      : 100;
    return { totalPoints, currentLevel, nextLevel, progressPct, allLevels: LEVELS };
  }),

  // ── Monthly Reports ────────────────────────────────────────────────────────

  getMonthlyReports: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const { monthlyReports } = await import("../../drizzle/schema.js");
    const { eq, desc } = await import("drizzle-orm");
    return drizzleDb.select().from(monthlyReports).where(eq(monthlyReports.userId, ctx.user.id)).orderBy(desc(monthlyReports.year), desc(monthlyReports.month)).limit(12);
  }),

  // ── Daily Contextual Recipe ───────────────────────────────────────────────
  getDailyContextualRecipe: protectedProcedure.query(async ({ ctx }) => {
    const drizzleDb = await db.getDb();
    const { recipes } = await import("../../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");
    const now = new Date();
    const month = now.getMonth() + 1;
    const isWarm = month >= 5 && month <= 9;
    const season = month >= 3 && month <= 5 ? 'primavera' : month >= 6 && month <= 8 ? 'verano' : month >= 9 && month <= 11 ? 'otoño' : 'invierno';
    const dateSeed = parseInt(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`);
    const allRecipes = await drizzleDb.select({ id: recipes.id, name: recipes.name, imageUrl: recipes.imageUrl, caloriesPerServing: recipes.caloriesPerServing, prepTime: recipes.prepTime })
      .from(recipes).where(eq(recipes.isPublic, true)).limit(200);
    if (allRecipes.length === 0) return null;
    const idx = dateSeed % allRecipes.length;
    const recipe = allRecipes[idx];
    const contextMsg = isWarm ? '☀️ Perfecta para el calor de hoy' : '🍂 Ideal para esta época del año';
    return { recipe, contextMsg, season };
  }),

  generateMonthlyReport: protectedProcedure
    .input(z.object({ year: z.number().int().min(2024).max(2030), month: z.number().int().min(1).max(12) }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      const { monthlyReports, mealLogs, userHealthMetrics } = await import("../../drizzle/schema.js");
      const { eq, and, gte, lte, sql } = await import("drizzle-orm");
      const startDate = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const endDate = `${input.year}-${String(input.month).padStart(2, "0")}-31`;
      // Gather stats
      const logs = await drizzleDb.select({ calories: mealLogs.calories, protein: mealLogs.protein, carbs: mealLogs.carbs, fat: mealLogs.fat, logDate: mealLogs.logDate })
        .from(mealLogs).where(and(eq(mealLogs.userId, ctx.user.id), gte(mealLogs.logDate, startDate), lte(mealLogs.logDate, endDate)));
      const totalDays = new Set(logs.map(l => l.logDate)).size;
      const avgCalories = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.calories ?? 0), 0) / Math.max(totalDays, 1)) : 0;
      const avgProtein = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.protein ?? 0), 0) / Math.max(totalDays, 1)) : 0;
      const summaryJson = JSON.stringify({ totalDays, avgCalories, avgProtein, logsCount: logs.length });
      const [report] = await drizzleDb.insert(monthlyReports).values({ userId: ctx.user.id, year: input.year, month: input.month, summaryJson, generatedAt: new Date() })
        .onConflictDoUpdate({ target: [monthlyReports.userId, monthlyReports.year, monthlyReports.month], set: { summaryJson, generatedAt: new Date() } })
        .returning();
      return { ok: true, report, stats: { totalDays, avgCalories, avgProtein } };
    }),

  // ── Generate Monthly Report PDF ─────────────────────────────────────────────
  generateMonthlyReportPDF: protectedProcedure
    .input(z.object({ year: z.number().int().min(2024).max(2030), month: z.number().int().min(1).max(12) }))
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await db.getDb();
      const { monthlyReports, mealLogs, users } = await import('../../drizzle/schema.js');
      const { eq, and, gte, lte } = await import('drizzle-orm');
      const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const monthName = MONTHS[input.month - 1]!;
      const startDate = `${input.year}-${String(input.month).padStart(2,'0')}-01`;
      const endDate = `${input.year}-${String(input.month).padStart(2,'0')}-31`;
      const logs = await drizzleDb.select()
        .from(mealLogs).where(and(eq(mealLogs.userId, ctx.user.id), gte(mealLogs.logDate, startDate), lte(mealLogs.logDate, endDate)));
      const [userRow] = await drizzleDb.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const totalDays = new Set(logs.map(l => l.logDate)).size;
      const avgCalories = logs.length > 0 ? Math.round(logs.reduce((s,l) => s + (l.calories ?? 0), 0) / Math.max(totalDays, 1)) : 0;
      const avgProtein = logs.length > 0 ? Math.round(logs.reduce((s,l) => s + (l.protein ?? 0), 0) / Math.max(totalDays, 1)) : 0;
      const avgCarbs = logs.length > 0 ? Math.round(logs.reduce((s,l) => s + (l.carbs ?? 0), 0) / Math.max(totalDays, 1)) : 0;
      const avgFat = logs.length > 0 ? Math.round(logs.reduce((s,l) => s + (l.fat ?? 0), 0) / Math.max(totalDays, 1)) : 0;
      try {
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];
        const pdfReady = new Promise<Buffer>((resolve, reject) => {
          doc.on('data', (c: Buffer) => chunks.push(c));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', reject);
        });
        // Header
        doc.rect(0, 0, 595, 120).fill('#F97316');
        doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('BuddyMarket', 50, 35);
        doc.fontSize(16).font('Helvetica').text(`Informe Nutricional — ${monthName} ${input.year}`, 50, 72);
        doc.fillColor('#333').fontSize(12).font('Helvetica').text(`Usuario: ${userRow?.name || ctx.user.email}`, 50, 140);
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 50, 158);
        // Stats
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#F97316').text('Resumen del mes', 50, 195);
        doc.moveTo(50, 215).lineTo(545, 215).strokeColor('#F97316').lineWidth(2).stroke();
        const stats = [
          { label: 'Días con registro', value: `${totalDays} días` },
          { label: 'Registros totales', value: `${logs.length} comidas` },
          { label: 'Calorías promedio/día', value: `${avgCalories} kcal` },
          { label: 'Proteína promedio/día', value: `${avgProtein} g` },
          { label: 'Carbohidratos promedio/día', value: `${avgCarbs} g` },
          { label: 'Grasas promedio/día', value: `${avgFat} g` },
        ];
        let y = 230;
        stats.forEach((s, i) => {
          const bg = i % 2 === 0 ? '#FFF7ED' : '#FFFFFF';
          doc.rect(50, y, 495, 28).fill(bg);
          doc.fillColor('#333').fontSize(12).font('Helvetica').text(s.label, 60, y + 8);
          doc.font('Helvetica-Bold').text(s.value, 400, y + 8);
          y += 28;
        });
        // Footer
        doc.fontSize(10).fillColor('#999').font('Helvetica').text('BuddyMarket — Tu nutrición, inteligente y personalizada', 50, 760, { align: 'center', width: 495 });
        doc.end();
        const pdfBuffer = await pdfReady;
        const { storagePut } = await import('../storage.js');
        const fileKey = `monthly-reports/${ctx.user.id}-${input.year}-${input.month}-${Date.now()}.pdf`;
        const { url } = await storagePut(fileKey, pdfBuffer, 'application/pdf');
        // Update report with PDF URL
        await drizzleDb.update(monthlyReports)
          .set({ pdfUrl: url })
          .where(and(eq(monthlyReports.userId, ctx.user.id), eq(monthlyReports.year, input.year), eq(monthlyReports.month, input.month)));
        return { ok: true, url };
      } catch (err: any) {
        console.error('[retention.generateMonthlyReportPDF]', err?.message || err);
        return { ok: false, url: null, error: 'No se pudo generar el PDF' };
      }
    }),
});
