/**
 * Tests de integración: mealLogs, healthMetrics, subscriptions, admin
 * Cubre ~30 procedimientos tRPC con escenarios happy path, validación y autorización
 */
import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
    getUserProfile: vi.fn().mockResolvedValue({ id: 1 }),
    upsertUserProfile: vi.fn().mockResolvedValue({ id: 1 }),
    getUserMedicalProfile: vi.fn().mockResolvedValue(null),
    upsertUserMedicalProfile: vi.fn().mockResolvedValue({ id: 1 }),
    setUserAllergies: vi.fn().mockResolvedValue(true),
    setUserDietRestrictions: vi.fn().mockResolvedValue(true),
    setUserFoodCategories: vi.fn().mockResolvedValue(true),
    getUserAllergies: vi.fn().mockResolvedValue([]),
    getUserDietRestrictions: vi.fn().mockResolvedValue([]),
    getUserFoodCategories: vi.fn().mockResolvedValue([]),
    getUserPreferences: vi.fn().mockResolvedValue(null),
    upsertUserPreferences: vi.fn().mockResolvedValue({ id: 1 }),
    getIngredients: vi.fn().mockResolvedValue([]),
    getIngredientById: vi.fn().mockResolvedValue({ id: 1, nameEs: "Tomate" }),
    createIngredient: vi.fn().mockResolvedValue({ id: 1 }),
    updateIngredient: vi.fn().mockResolvedValue({ id: 1 }),
    deleteIngredient: vi.fn().mockResolvedValue(true),
    getRecipes: vi.fn().mockResolvedValue([]),
    getRecipeById: vi.fn().mockResolvedValue({ id: 1, name: "Ensalada", userId: 1 }),
    createRecipe: vi.fn().mockResolvedValue({ id: 1 }),
    updateRecipe: vi.fn().mockResolvedValue({ id: 1 }),
    deleteRecipe: vi.fn().mockResolvedValue(true),
    getRecipeIngredients: vi.fn().mockResolvedValue([]),
    getRecipeSteps: vi.fn().mockResolvedValue([]),
    getRecipeAllergies: vi.fn().mockResolvedValue([]),
    getRecipeDietRestrictions: vi.fn().mockResolvedValue([]),
    getRecipeCategories: vi.fn().mockResolvedValue([]),
    setRecipeIngredients: vi.fn().mockResolvedValue(true),
    setRecipeSteps: vi.fn().mockResolvedValue(true),
    setRecipeAllergies: vi.fn().mockResolvedValue(true),
    setRecipeDietRestrictions: vi.fn().mockResolvedValue(true),
    toggleFavorite: vi.fn().mockResolvedValue({ favorited: true }),
    getFavoriteIds: vi.fn().mockResolvedValue([]),
    getFavoriteRecipes: vi.fn().mockResolvedValue([]),
    getAllAllergies: vi.fn().mockResolvedValue([]),
    getAllDietRestrictions: vi.fn().mockResolvedValue([]),
    getAllFoodCategories: vi.fn().mockResolvedValue([]),
    getAllMeasures: vi.fn().mockResolvedValue([]),
    getAllDayParts: vi.fn().mockResolvedValue([]),
    getAllStorageLocations: vi.fn().mockResolvedValue([]),
    getMenuOrganizers: vi.fn().mockResolvedValue([]),
    getUserMenus: vi.fn().mockResolvedValue([]),
    getMenuOrganizerById: vi.fn().mockResolvedValue(null),
    createMenuOrganizer: vi.fn().mockResolvedValue({ id: 1 }),
    updateMenuOrganizer: vi.fn().mockResolvedValue({ id: 1 }),
    deleteMenuOrganizer: vi.fn().mockResolvedValue(true),
    copyMenuForUser: vi.fn().mockResolvedValue({ id: 1 }),
    renameMenu: vi.fn().mockResolvedValue({ id: 1 }),
    setActiveMenu: vi.fn().mockResolvedValue({ id: 1 }),
    updateMenuStartDate: vi.fn().mockResolvedValue({ id: 1 }),
    duplicateMenu: vi.fn().mockResolvedValue({ id: 1 }),
    deleteUserMenu: vi.fn().mockResolvedValue(true),
    addMenuRecipe: vi.fn().mockResolvedValue({ id: 1 }),
    removeMenuRecipe: vi.fn().mockResolvedValue(true),
    getMenuById: vi.fn().mockResolvedValue(null),
    updateMeasure: vi.fn().mockResolvedValue({ id: 1 }),
    getShoppingLists: vi.fn().mockResolvedValue([]),
    getShoppingListById: vi.fn().mockResolvedValue(null),
    createShoppingList: vi.fn().mockResolvedValue({ id: 1 }),
    updateShoppingList: vi.fn().mockResolvedValue({ id: 1 }),
    deleteShoppingList: vi.fn().mockResolvedValue(true),
    addShoppingListItem: vi.fn().mockResolvedValue({ id: 1 }),
    toggleShoppingListItem: vi.fn().mockResolvedValue({ id: 1 }),
    deleteShoppingListItem: vi.fn().mockResolvedValue(true),
    generateShoppingListFromMenu: vi.fn().mockResolvedValue({ id: 1 }),
    getInventoryItems: vi.fn().mockResolvedValue([]),
    getInventoryById: vi.fn().mockResolvedValue(null),
    addInventoryItem: vi.fn().mockResolvedValue({ id: 1 }),
    updateInventoryItem: vi.fn().mockResolvedValue({ id: 1 }),
    deleteInventoryItem: vi.fn().mockResolvedValue(true),
    // MealLogs
    getMealLogs: vi.fn().mockResolvedValue([
      { id: 1, userId: 1, recipeId: 1, logDate: new Date(), loggedAt: new Date() },
    ]),
    addMealLog: vi.fn().mockResolvedValue({ id: 10 }),
    createMealLog: vi.fn().mockResolvedValue({ id: 10 }),
    deleteMealLog: vi.fn().mockResolvedValue(true),
    getDailyNutritionSummary: vi.fn().mockResolvedValue({ calories: 0, proteins: 0, carbohydrates: 0, fats: 0 }),
    getMonthlyCalorieSummary: vi.fn().mockResolvedValue([]),
    // HealthMetrics
    addHealthMetric: vi.fn().mockResolvedValue({ id: 1 }),
    createHealthMetric: vi.fn().mockResolvedValue({ id: 1 }),
    getHealthMetrics: vi.fn().mockResolvedValue([
      { id: 1, userId: 1, weight: 70, recordedAt: new Date() },
    ]),
    // Subscriptions
    getUserSubscription: vi.fn().mockResolvedValue({
      plan: "basic",
      manualPlan: "basic",
      status: "active",
      expiresAt: null,
    }),
    upsertUserSubscription: vi.fn().mockResolvedValue({ id: 1 }),
    getUserById: vi.fn().mockResolvedValue({ id: 1, role: "user", email: "test@test.com" }),
    getUsers: vi.fn().mockResolvedValue([
      { id: 1, name: "User 1", email: "user1@test.com", role: "user" },
    ]),
    updateUserRole: vi.fn().mockResolvedValue(true),
    updateUser: vi.fn().mockResolvedValue({ id: 1 }),
    // Notifications
    getMealReminders: vi.fn().mockResolvedValue([
      { id: 1, userId: 1, mealType: "desayuno", time: "08:00", enabled: true },
    ]),
    upsertMealReminder: vi.fn().mockResolvedValue({ action: "created" }),
    deleteMealReminder: vi.fn().mockResolvedValue(undefined),
    // Achievements
    getUserAchievements: vi.fn().mockResolvedValue([
      { id: 1, achievementId: "first_log", unlockedAt: new Date() },
    ]),
    getUserPoints: vi.fn().mockResolvedValue({ totalPoints: 150 }),
    unlockAchievement: vi.fn().mockResolvedValue({ unlocked: true }),
    hasAchievement: vi.fn().mockResolvedValue(false),
    getTotalMealLogs: vi.fn().mockResolvedValue(5),
    getDistinctRecipesLogged: vi.fn().mockResolvedValue(3),
    getMealStreak: vi.fn().mockResolvedValue(3),
    getMealTypesLoggedToday: vi.fn().mockResolvedValue([1, 2]),
    // Admin stats
    getAllUsers: vi.fn().mockResolvedValue([{ id: 1, name: "User 1", email: "user1@test.com", role: "user" }]),
    getAllRecipes: vi.fn().mockResolvedValue([{ id: 1, name: "Recipe 1" }]),
    getAllMenus: vi.fn().mockResolvedValue([{ id: 1, name: "Menu 1" }]),
    getAllIngredients: vi.fn().mockResolvedValue([{ id: 1, nameEs: "Tomate" }]),
    createAllergy: vi.fn().mockResolvedValue({ id: 1, apiParam: "test", nameEs: "Test" }),
    createDietRestriction: vi.fn().mockResolvedValue({ id: 1 }),
    createMeasure: vi.fn().mockResolvedValue({ id: 1 }),
    getSeededMenus: vi.fn().mockResolvedValue([]),
    // nutritional history
    nutritionalHistory: vi.fn().mockResolvedValue([]),
    getNutritionalHistory: vi.fn().mockResolvedValue([]),
    getDb: vi.fn().mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            // Returns a row so ownership/existence checks pass
            limit: vi.fn().mockResolvedValue([{ id: 1, userId: 1, name: "Test User", email: "test@test.com", role: "user" }]),
            orderBy: vi.fn().mockResolvedValue([{ id: 1, userId: 1 }]),
          }),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
        selectDistinct: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({ insertId: 1 }) }),
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) }),
      delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
    }),
}));

vi.mock("./stripe-webhook", () => ({
  registerStripeWebhook: vi.fn(),
  createCheckoutSession: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: '{"menuItems":[]}' } }],
  }),
}));

vi.mock("./achievements-catalog", () => ({
  ACHIEVEMENTS_CATALOG: [
    {
      id: "first_log",
      category: "racha",
      title: "¡Primer Paso!",
      description: "Registra tu primera comida en el diario",
      emoji: "🌱",
      points: 10,
      condition: { type: "first_log" },
    },
  ],
  getLevelForPoints: vi.fn().mockReturnValue({ name: "Principiante", minPoints: 0, maxPoints: 100 }),
  getNextLevel: vi.fn().mockReturnValue({ name: "Intermedio", minPoints: 100, maxPoints: 500 }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
type AuthUser = NonNullable<TrpcContext["user"]>;

function authCtx(overrides: Partial<AuthUser> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-openid",
      email: "test@buddymarket.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: { origin: "https://buddymarket.manus.space" } } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function publicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function adminCtx(): TrpcContext {
  return authCtx({ id: 99, role: "admin", email: "admin@buddymarket.com", openId: "admin-openid" });
}

// ─── MealLogs ─────────────────────────────────────────────────────────────────
describe("mealLogs", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.mealLogs.list({})).rejects.toThrow();
  });

  it("list returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.mealLogs.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("add requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.mealLogs.add({
      recipeId: 1,
      logDate: "2026-04-01",
      servings: 1,
    })).rejects.toThrow();
  });

  it("add succeeds with valid data", async () => {
    // Use admin to bypass plan check (free plan doesn't have canAccessDiary)
    const caller = appRouter.createCaller(authCtx({ role: "admin" }));
    const result = await caller.mealLogs.add({
      recipeId: 1,
      logDate: "2026-04-01",
      servings: 1,
    });
    expect(result).toBeDefined();
  });

  it("add rejects missing logDate", async () => {
    const caller = appRouter.createCaller(authCtx({ role: "admin" }));
    await expect(caller.mealLogs.add({
      recipeId: 1,
    } as any)).rejects.toThrow();
  });

  it("add rejects invalid logDate format", async () => {
    const caller = appRouter.createCaller(authCtx({ role: "admin" }));
    await expect(caller.mealLogs.add({
      recipeId: 1,
      logDate: "not-a-date",
    })).rejects.toThrow();
  });

  it("remove requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.mealLogs.remove({ id: 1 })).rejects.toThrow();
  });

  it("remove succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    // getDb mock returns a row with userId=1 so ownership check passes
    const result = await caller.mealLogs.remove({ id: 1 });
    expect(result).toBeDefined();
  });

  it("dailySummary requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.mealLogs.dailySummary({ date: "2026-04-01" })).rejects.toThrow();
  });

  it("getStreak requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.mealLogs.getStreak()).rejects.toThrow();
  });

  it("getStreak returns streak data for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.mealLogs.getStreak();
    expect(result).toBeDefined();
  });

  it("nutritionalHistory requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.mealLogs.nutritionalHistory({ days: 7 })).rejects.toThrow();
  });

  it("nutritionalHistory returns data for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.mealLogs.nutritionalHistory({ days: 7 });
    expect(result).toBeDefined();
  });
});

// ─── HealthMetrics ────────────────────────────────────────────────────────────
describe("healthMetrics", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.healthMetrics.list({})).rejects.toThrow();
  });

  it("list returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.healthMetrics.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("add requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.healthMetrics.add({ weight: 70, recordedAt: "2026-04-01" })).rejects.toThrow();
  });

  it("add succeeds with valid weight", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.healthMetrics.add({ weight: 70, recordedAt: "2026-04-01" });
    expect(result).toBeDefined();
  });

  it("add rejects missing recordedAt", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.healthMetrics.add({ weight: 70 } as any)).rejects.toThrow();
  });

  it("add rejects weight below 20kg", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.healthMetrics.add({ weight: 19, recordedAt: "2026-04-01" })).rejects.toThrow();
  });

  it("add rejects weight above 500kg", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.healthMetrics.add({ weight: 501, recordedAt: "2026-04-01" })).rejects.toThrow();
  });

  it("add rejects bodyFatPercentage above 70%", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.healthMetrics.add({ bodyFatPercentage: 71, recordedAt: "2026-04-01" })).rejects.toThrow();
  });

  it("add rejects bodyFatPercentage below 1%", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.healthMetrics.add({ bodyFatPercentage: 0, recordedAt: "2026-04-01" })).rejects.toThrow();
  });
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
describe("subscriptions", () => {
  it("getStatus requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.subscriptions.getStatus()).rejects.toThrow();
  });

  it("getStatus returns subscription info for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.subscriptions.getStatus();
    expect(result).toBeDefined();
  });

  it("createCheckout requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.subscriptions.createCheckout({
      plan: "basic",
      origin: "https://buddymarket.manus.space",
    })).rejects.toThrow();
  });

  it("createCheckout returns checkout URL for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.subscriptions.createCheckout({
      plan: "basic",
      origin: "https://buddymarket.manus.space",
    });
    expect(result).toHaveProperty("url");
  });

  it("createCheckout rejects invalid plan", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.subscriptions.createCheckout({
      plan: "invalid_plan" as any,
      origin: "https://buddymarket.manus.space",
    })).rejects.toThrow();
  });
});

// ─── Admin ────────────────────────────────────────────────────────────────────
describe("admin", () => {
  it("users is FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.admin.users({ limit: 10, offset: 0 })).rejects.toThrow();
  });

  it("users returns list for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const result = await caller.admin.users({ limit: 10, offset: 0 });
    expect(result).toBeDefined();
  });

  it("updateUserRole is FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.admin.updateUserRole({ userId: 2, role: "admin" })).rejects.toThrow();
  });

  it("updateUserRole succeeds for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const result = await caller.admin.updateUserRole({ userId: 2, role: "user" });
    expect(result).toBeDefined();
  });

  it("grantProAccess is FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.admin.grantProAccess({ userId: 2, plan: "pro_max" })).rejects.toThrow();
  });

  it("setUserPlan is FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.admin.setUserPlan({ userId: 2, plan: "pro_max" })).rejects.toThrow();
  });

  it("setUserPlan succeeds for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const result = await caller.admin.setUserPlan({ userId: 2, plan: "basic" });
    expect(result).toBeDefined();
  });

  it("stats is FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("stats returns stats for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const result = await caller.admin.stats();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalRecipes");
  });

  it("createAllergy is FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.admin.createAllergy({ apiParam: "nueva_alergia", nameEs: "Nueva Alergia" })).rejects.toThrow();
  });

  it("createAllergy succeeds for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const result = await caller.admin.createAllergy({ apiParam: "alergia_test", nameEs: "Alergia Test" });
    expect(result).toBeDefined();
  });

  it("deleteAllergy is FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.admin.deleteAllergy({ id: 1 })).rejects.toThrow();
  });

  it("createDietRestriction is FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.admin.createDietRestriction({ apiParam: "nueva_restriccion", nameEs: "Nueva Restricción" })).rejects.toThrow();
  });

  it("createMeasure is FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.admin.createMeasure({ name: "Nueva Medida", abbreviation: "nm" })).rejects.toThrow();
  });
});

// ─── Achievements ─────────────────────────────────────────────────────────────
describe("achievements", () => {
  it("getAll requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.achievements.getAll()).rejects.toThrow();
  });

  it("getAll returns achievements object for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.achievements.getAll();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("achievements");
    expect(Array.isArray(result.achievements)).toBe(true);
  });

  it("getAll includes totalPoints and level", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.achievements.getAll();
    expect(result).toHaveProperty("totalPoints");
    expect(result).toHaveProperty("level");
  });

  it("getUserStats requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.achievements.getUserStats()).rejects.toThrow();
  });

  it("getUserStats returns stats for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.achievements.getUserStats();
    expect(result).toBeDefined();
  });

  it("evaluate requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.achievements.evaluate({ trigger: "meal_logged" })).rejects.toThrow();
  });

  it("evaluate succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.achievements.evaluate({ trigger: "meal_logged" });
    expect(result).toBeDefined();
  });

  it("evaluate rejects invalid trigger", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.achievements.evaluate({ trigger: "invalid_trigger" as any })).rejects.toThrow();
  });
});

// ─── Notifications ────────────────────────────────────────────────────────────
describe("notifications (reminders)", () => {
  it("getReminders requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.notifications.getReminders()).rejects.toThrow();
  });

  it("getReminders returns reminders for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.notifications.getReminders();
    expect(Array.isArray(result)).toBe(true);
  });

  it("upsertReminder requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.notifications.upsertReminder({
      mealType: "desayuno",
      time: "08:00",
      enabled: true,
    })).rejects.toThrow();
  });

  it("upsertReminder succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.notifications.upsertReminder({
      mealType: "desayuno",
      time: "08:00",
      enabled: true,
    });
    expect(result).toBeDefined();
  });

  it("upsertReminder rejects invalid mealType", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.notifications.upsertReminder({
      mealType: "invalid_meal" as any,
      time: "08:00",
      enabled: true,
    })).rejects.toThrow();
  });

  it("upsertReminder rejects invalid time format", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.notifications.upsertReminder({
      mealType: "desayuno",
      time: "25:00",
      enabled: true,
    })).rejects.toThrow();
  });

  it("deleteReminder requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.notifications.deleteReminder({ mealType: "desayuno" })).rejects.toThrow();
  });

  it("deleteReminder succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.notifications.deleteReminder({ mealType: "desayuno" });
    expect(result).toBeDefined();
  });
});
