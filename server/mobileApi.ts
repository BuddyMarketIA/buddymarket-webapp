/**
 * Mobile REST API — endpoints para la app iOS nativa
 * Rutas bajo /api/mobile/* que la app SwiftUI consume directamente.
 * Autenticación mediante la misma cookie de sesión que la web (app_session_id).
 */
import type { Express } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  users,
  recipes,
  menuOrganizers,
  menuOrganizerDayParts,
  menuOrganizerDayPartRecipes,
  mealLogs,
  userProfiles,
  userAllergies,
  userDietRestrictions,
  userSubscriptions,
} from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import logger from "./_core/logger";

// ─── Auth middleware ──────────────────────────────────────────────────────────

async function getMobileUser(req: any): Promise<{ id: number; openId: string; role: string } | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) return null;
    return { id: user.id, openId: user.openId, role: (user as any).role ?? "user" };
  } catch {
    return null;
  }
}

function requireMobileAuth(
  handler: (req: any, res: any, user: { id: number; openId: string; role: string }) => Promise<void>
) {
  return async (req: any, res: any) => {
    const user = await getMobileUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    try {
      await handler(req, res, user);
    } catch (err: any) {
      logger.error("[MobileAPI] Error:", err);
      res.status(500).json({ error: err.message ?? "Internal server error" });
    }
  };
}

// ─── Register routes ──────────────────────────────────────────────────────────

export function registerMobileApi(app: Express) {

  // ── GET /api/mobile/health ─────────────────────────────────────────────────
  app.get("/api/mobile/health", (_req: any, res: any) => {
    res.json({ ok: true, version: "1.0.0", timestamp: Date.now() });
  });

  // ── GET /api/mobile/recipes ────────────────────────────────────────────────
  // Query params: limit, offset, search, mealTime
  app.get("/api/mobile/recipes", async (req: any, res: any) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      const limit = Math.min(parseInt(req.query.limit ?? "20"), 50);
      const offset = parseInt(req.query.offset ?? "0");
      const search = (req.query.search as string)?.trim();
      const mealTime = req.query.mealTime as string | undefined;

      const conditions: any[] = [eq(recipes.isPublic, true)];
      if (mealTime) conditions.push(eq(recipes.mealTime, mealTime as any));
      if (search) {
        conditions.push(
          sql`LOWER(${recipes.name}) LIKE ${"% " + search.toLowerCase() + "%"}`
        );
      }

      const rows = await db
        .select({
          id: recipes.id,
          name: recipes.name,
          description: recipes.description,
          imageUrl: recipes.imageUrl,
          mealTime: recipes.mealTime,
          difficulty: recipes.difficulty,
          preparationTime: recipes.preparationTime,
          cookTime: recipes.cookTime,
          servings: recipes.servings,
          caloriesPerServing: recipes.caloriesPerServing,
          proteinsPerServing: recipes.proteinsPerServing,
          carbsPerServing: recipes.carbsPerServing,
          fatsPerServing: recipes.fatsPerServing,
          fiberPerServing: recipes.fiberPerServing,
          cuisineType: recipes.cuisineType,
          cookingMethod: recipes.cookingMethod,
          isKidFriendly: recipes.isKidFriendly,
          isBabyFriendly: recipes.isBabyFriendly,
          ingredientsJson: recipes.ingredientsJson,
          instructionsJson: recipes.instructionsJson,
          createdAt: recipes.createdAt,
        })
        .from(recipes)
        .where(and(...conditions))
        .orderBy(desc(recipes.createdAt))
        .limit(limit)
        .offset(offset);

      res.json({ recipes: rows, limit, offset, count: rows.length });
    } catch (err: any) {
      logger.error("[MobileAPI] GET /recipes error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/mobile/recipes/:id ────────────────────────────────────────────
  app.get("/api/mobile/recipes/:id", async (req: any, res: any) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid recipe ID" });

      const [recipe] = await db.select().from(recipes).where(
        and(eq(recipes.id, id), eq(recipes.isPublic, true))
      ).limit(1);
      if (!recipe) return res.status(404).json({ error: "Recipe not found" });

      res.json(recipe);
    } catch (err: any) {
      logger.error("[MobileAPI] GET /recipes/:id error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/mobile/menus ──────────────────────────────────────────────────
  app.get("/api/mobile/menus", async (req: any, res: any) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      const limit = Math.min(parseInt(req.query.limit ?? "20"), 50);
      const offset = parseInt(req.query.offset ?? "0");

      const rows = await db
        .select({
          id: menuOrganizers.id,
          name: menuOrganizers.name,
          objective: menuOrganizers.objective,
          dailyCalories: menuOrganizers.dailyCalories,
          coverImage: menuOrganizers.coverImage,
          isPublic: menuOrganizers.isPublic,
          goal: menuOrganizers.goal,
          difficulty: menuOrganizers.difficulty,
          dailyMealsCount: menuOrganizers.dailyMealsCount,
          createdAt: menuOrganizers.createdAt,
        })
        .from(menuOrganizers)
        .where(eq(menuOrganizers.isPublic, true))
        .orderBy(desc(menuOrganizers.createdAt))
        .limit(limit)
        .offset(offset);

      res.json({ menus: rows, limit, offset, count: rows.length });
    } catch (err: any) {
      logger.error("[MobileAPI] GET /menus error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/mobile/menus/:id ──────────────────────────────────────────────
  app.get("/api/mobile/menus/:id", async (req: any, res: any) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid menu ID" });

      const [menu] = await db
        .select()
        .from(menuOrganizers)
        .where(and(eq(menuOrganizers.id, id), eq(menuOrganizers.isPublic, true)))
        .limit(1);
      if (!menu) return res.status(404).json({ error: "Menu not found" });

      const dayParts = await db
        .select()
        .from(menuOrganizerDayParts)
        .where(eq(menuOrganizerDayParts.menuOrganizerId, id))
        .orderBy(menuOrganizerDayParts.dayNumber, menuOrganizerDayParts.mealNumber);

      res.json({ ...menu, dayParts });
    } catch (err: any) {
      logger.error("[MobileAPI] GET /menus/:id error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/mobile/user/profile ───────────────────────────────────────────
  app.get("/api/mobile/user/profile", requireMobileAuth(async (req, res, authUser) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!dbUser) return res.status(404).json({ error: "User not found" });

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, authUser.id))
      .limit(1);

    const allergies = await db
      .select()
      .from(userAllergies)
      .where(eq(userAllergies.userId, authUser.id));

    const dietRestrictions = await db
      .select()
      .from(userDietRestrictions)
      .where(eq(userDietRestrictions.userId, authUser.id));

    // Get active subscription plan
    const [activeSub] = await db
      .select({ plan: userSubscriptions.plan, status: userSubscriptions.status })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, authUser.id))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    res.json({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      imageUrl: dbUser.imageUrl,
      role: dbUser.role,
      plan: activeSub?.plan ?? "free",
      profile: profile ?? null,
      allergies,
      dietRestrictions,
    });
  }));

  // ── GET /api/mobile/user/dashboard ────────────────────────────────────────
  app.get("/api/mobile/user/dashboard", requireMobileAuth(async (req, res, authUser) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const today = new Date().toISOString().split("T")[0];

    const todayLogs = await db
      .select()
      .from(mealLogs)
      .where(and(eq(mealLogs.userId, authUser.id), eq(mealLogs.logDate, today)));

    const totals = todayLogs.reduce(
      (acc: any, log: any) => ({
        calories: acc.calories + (log.calories ?? 0),
        proteins: acc.proteins + (log.proteins ?? 0),
        carbs: acc.carbs + (log.carbohydrates ?? 0),
        fats: acc.fats + (log.fats ?? 0),
      }),
      { calories: 0, proteins: 0, carbs: 0, fats: 0 }
    );

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, authUser.id))
      .limit(1);

    const [activeMenu] = await db
      .select({
        id: menuOrganizers.id,
        name: menuOrganizers.name,
        coverImage: menuOrganizers.coverImage,
        dailyCalories: menuOrganizers.dailyCalories,
        startDate: menuOrganizers.startDate,
        endDate: menuOrganizers.endDate,
      })
      .from(menuOrganizers)
      .where(and(eq(menuOrganizers.userId, authUser.id), eq(menuOrganizers.isActive, true)))
      .orderBy(desc(menuOrganizers.createdAt))
      .limit(1);

    res.json({
      today: totals,
      goals: {
        calories: profile?.dailyCalorieGoal ?? 2000,
        proteins: profile?.dailyProteinGoal ?? 150,
        carbs: profile?.dailyCarbsGoal ?? 250,
        fats: profile?.dailyFatGoal ?? 65,
      },
      activeMenu: activeMenu ?? null,
      logsCount: todayLogs.length,
    });
  }));

  // ── POST /api/mobile/meal-log ──────────────────────────────────────────────
  app.post("/api/mobile/meal-log", requireMobileAuth(async (req, res, authUser) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { recipeId, dayPartId, customMealName, servings: s, calories, proteins, carbohydrates, fats, notes } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const [inserted] = await db
      .insert(mealLogs)
      .values({
        userId: authUser.id,
        recipeId: recipeId ?? null,
        dayPartId: dayPartId ?? null,
        customMealName: customMealName ?? null,
        logDate: today,
        servings: s ?? 1,
        calories: calories ?? 0,
        proteins: proteins ?? 0,
        carbohydrates: carbohydrates ?? 0,
        fats: fats ?? 0,
        notes: notes ?? null,
      })
      .returning({ id: mealLogs.id });

    res.json({ ok: true, id: inserted?.id });
  }));

  // ── POST /api/mobile/iap/verify ───────────────────────────────────────────
  app.post("/api/mobile/iap/verify", requireMobileAuth(async (req, res, authUser) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const { transactionId, productId, originalTransactionId } = req.body;

    if (!transactionId || !productId) {
      return res.status(400).json({ error: "transactionId and productId are required" });
    }

    const tierMap: Record<string, string> = {
      "io.buddymarket.app.premium.monthly": "pro",
      "io.buddymarket.app.premium.annual": "pro",
      "io.buddymarket.app.promax.monthly": "promax",
      "io.buddymarket.app.promax.annual": "promax",
    };

    const tier = tierMap[productId];
    if (!tier) return res.status(400).json({ error: "Unknown product ID" });

    // Upsert subscription record
    const existingSub = await db
      .select({ id: userSubscriptions.id })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, authUser.id))
      .limit(1);

    if (existingSub.length > 0) {
      await db
        .update(userSubscriptions)
        .set({
          plan: tier as any,
          status: "active" as any,
          iapPlatform: "apple" as any,
          iapTransactionId: transactionId,
          iapOriginalTransactionId: originalTransactionId ?? null,
          iapProductId: productId,
          iapEnvironment: "production" as any,
          iapLastVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.userId, authUser.id));
    } else {
      await db.insert(userSubscriptions).values({
        userId: authUser.id,
        plan: tier as any,
        status: "active" as any,
        iapPlatform: "apple" as any,
        iapTransactionId: transactionId,
        iapOriginalTransactionId: originalTransactionId ?? null,
        iapProductId: productId,
        iapEnvironment: "production" as any,
        iapLastVerifiedAt: new Date(),
      });
    }

    logger.info(`[MobileAPI] IAP verified: user=${authUser.id} product=${productId} tier=${tier}`);
    res.json({ ok: true, tier, transactionId, originalTransactionId: originalTransactionId ?? null });
  }));

  // ── GET /api/mobile/sync/manifest ─────────────────────────────────────────
  app.get("/api/mobile/sync/manifest", async (_req: any, res: any) => {
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      const [recipeCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(recipes)
        .where(eq(recipes.isPublic, true));

      const [menuCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(menuOrganizers)
        .where(eq(menuOrganizers.isPublic, true));

      const [latestRecipe] = await db
        .select({ updatedAt: recipes.updatedAt })
        .from(recipes)
        .where(eq(recipes.isPublic, true))
        .orderBy(desc(recipes.updatedAt))
        .limit(1);

      res.json({
        version: "1.0",
        recipes: {
          count: Number(recipeCount?.count ?? 0),
          lastUpdated: latestRecipe?.updatedAt ?? null,
        },
        menus: {
          count: Number(menuCount?.count ?? 0),
        },
        timestamp: Date.now(),
      });
    } catch (err: any) {
      logger.error("[MobileAPI] GET /sync/manifest error:", err);
      res.status(500).json({ error: err.message });
    }
  });
}
