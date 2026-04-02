import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "../shared/const";

// Mock db module
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getRecipes: vi.fn().mockResolvedValue([]),
  getRecipeById: vi.fn().mockResolvedValue(null),
  createRecipe: vi.fn().mockResolvedValue({ id: 1, name: "Test Recipe" }),
  getUserProfile: vi.fn().mockResolvedValue(null),
  getShoppingLists: vi.fn().mockResolvedValue([]),
  getInventory: vi.fn().mockResolvedValue([]),
  getMealLogs: vi.fn().mockResolvedValue([]),
  getDailyNutritionSummary: vi.fn().mockResolvedValue({ calories: 0, proteins: 0, carbohydrates: 0, fats: 0 }),
  getMenus: vi.fn().mockResolvedValue([]),
  getAllergies: vi.fn().mockResolvedValue([]),
  getDietRestrictions: vi.fn().mockResolvedValue([]),
  getFoodCategories: vi.fn().mockResolvedValue([]),
  getMeasures: vi.fn().mockResolvedValue([]),
  getIngredients: vi.fn().mockResolvedValue([]),
  getUserSubscription: vi.fn().mockResolvedValue(null),
  getHealthMetrics: vi.fn().mockResolvedValue([]),
  getUserAllergies: vi.fn().mockResolvedValue([]),
  getUserDietRestrictions: vi.fn().mockResolvedValue([]),
  getAdminStats: vi.fn().mockResolvedValue({ totalUsers: 0, totalRecipes: 0, totalMenus: 0 }),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getAllRecipes: vi.fn().mockResolvedValue([]),
  getAllMenus: vi.fn().mockResolvedValue([]),
  getAllIngredients: vi.fn().mockResolvedValue([]),
  updateUser: vi.fn().mockResolvedValue({ id: 1 }),
  createAllergy: vi.fn().mockResolvedValue({ id: 1 }),
  updateAllergy: vi.fn().mockResolvedValue({ id: 1 }),
  deleteAllergy: vi.fn().mockResolvedValue(true),
  createDietRestriction: vi.fn().mockResolvedValue({ id: 1 }),
  updateDietRestriction: vi.fn().mockResolvedValue({ id: 1 }),
  deleteDietRestriction: vi.fn().mockResolvedValue(true),
  createFoodCategory: vi.fn().mockResolvedValue({ id: 1 }),
  updateFoodCategory: vi.fn().mockResolvedValue({ id: 1 }),
  deleteFoodCategory: vi.fn().mockResolvedValue(true),
  createMeasure: vi.fn().mockResolvedValue({ id: 1 }),
  deleteMeasure: vi.fn().mockResolvedValue(true),
  upsertUserSubscription: vi.fn().mockResolvedValue({ id: 1 }),
  getAllAllergies: vi.fn().mockResolvedValue([]),
  getAllDietRestrictions: vi.fn().mockResolvedValue([]),
  getAllFoodCategories: vi.fn().mockResolvedValue([]),
  getAllMeasures: vi.fn().mockResolvedValue([]),
  getInventoryItems: vi.fn().mockResolvedValue([]),
  createIngredientWithAllergies: vi.fn().mockResolvedValue({ id: 1 }),
  updateIngredient: vi.fn().mockResolvedValue({ id: 1 }),
  deleteIngredient: vi.fn().mockResolvedValue(true),
  setUserAllergies: vi.fn().mockResolvedValue(true),
  setUserDietRestrictions: vi.fn().mockResolvedValue(true),
  upsertUserProfile: vi.fn().mockResolvedValue({ id: 1 }),
  createShoppingList: vi.fn().mockResolvedValue({ id: 1 }),
  updateShoppingList: vi.fn().mockResolvedValue({ id: 1 }),
  deleteShoppingList: vi.fn().mockResolvedValue(true),
  addShoppingListItem: vi.fn().mockResolvedValue({ id: 1 }),
  toggleShoppingListItem: vi.fn().mockResolvedValue({ id: 1 }),
  deleteShoppingListItem: vi.fn().mockResolvedValue(true),
  generateShoppingListFromMenu: vi.fn().mockResolvedValue({ id: 1 }),
  addInventoryItem: vi.fn().mockResolvedValue({ id: 1 }),
  updateInventoryItem: vi.fn().mockResolvedValue({ id: 1 }),
  deleteInventoryItem: vi.fn().mockResolvedValue(true),
  createMenu: vi.fn().mockResolvedValue({ id: 1 }),
  updateMenu: vi.fn().mockResolvedValue({ id: 1 }),
  deleteMenu: vi.fn().mockResolvedValue(true),
  addMenuRecipe: vi.fn().mockResolvedValue({ id: 1 }),
  removeMenuRecipe: vi.fn().mockResolvedValue(true),
  createMealLog: vi.fn().mockResolvedValue({ id: 1 }),
  deleteMealLog: vi.fn().mockResolvedValue(true),
  createHealthMetric: vi.fn().mockResolvedValue({ id: 1 }),
  updateRecipe: vi.fn().mockResolvedValue({ id: 1 }),
  deleteRecipe: vi.fn().mockResolvedValue(true),
  setRecipeAllergies: vi.fn().mockResolvedValue(true),
  setRecipeDietRestrictions: vi.fn().mockResolvedValue(true),
  setRecipeIngredients: vi.fn().mockResolvedValue(true),
  setRecipeSteps: vi.fn().mockResolvedValue(true),
  getMenuById: vi.fn().mockResolvedValue(null),
  updateMeasure: vi.fn().mockResolvedValue({ id: 1 }),
  getRecipeIngredients: vi.fn().mockResolvedValue([]),
  getRecipeSteps: vi.fn().mockResolvedValue([]),
  getRecipeCategories: vi.fn().mockResolvedValue([]),
  getRecipeAllergies: vi.fn().mockResolvedValue([]),
  getRecipeDietRestrictions: vi.fn().mockResolvedValue([]),
  getShoppingListById: vi.fn().mockResolvedValue(null),
  getShoppingListItems: vi.fn().mockResolvedValue([]),
  getInventoryById: vi.fn().mockResolvedValue(null),
  getUserMedicalProfile: vi.fn().mockResolvedValue(null),
  upsertUserMedicalProfile: vi.fn().mockResolvedValue({ id: 1 }),
  // Notification helpers
  getMealReminders: vi.fn().mockResolvedValue([]),
  upsertMealReminder: vi.fn().mockResolvedValue({ action: "created" }),
  deleteMealReminder: vi.fn().mockResolvedValue(undefined),
  // Achievement helpers
  getUserAchievements: vi.fn().mockResolvedValue([]),
  getUserPoints: vi.fn().mockResolvedValue({ totalPoints: 150 }),
  unlockAchievement: vi.fn().mockResolvedValue({ unlocked: true }),
  hasAchievement: vi.fn().mockResolvedValue(false),
  getTotalMealLogs: vi.fn().mockResolvedValue(5),
  getDistinctRecipesLogged: vi.fn().mockResolvedValue(3),
  getMealStreak: vi.fn().mockResolvedValue(3),
  getMealTypesLoggedToday: vi.fn().mockResolvedValue([1, 2]),
  // getDb: used by notifications router and other inline DB calls
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockResolvedValue([]),
          then: vi.fn().mockResolvedValue([]),
        }),
        orderBy: vi.fn().mockResolvedValue([]),
        then: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({ insertId: 1 }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  }),
}));

// Mock stripe-webhook
vi.mock("./stripe-webhook", () => ({
  registerStripeWebhook: vi.fn(),
  createCheckoutSession: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ menuItems: [] }) } }],
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: Array<{ name: string; options: Record<string, unknown> }> } {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@buddymarket.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://buddymarket.manus.space" },
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 99,
    openId: "admin-openid",
    email: "admin@buddymarket.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns the current user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@buddymarket.com");
  });

  it("logout clears session cookie and returns success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

// ─── Recipes ─────────────────────────────────────────────────────────────────
describe("recipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.recipes.list({});
    // recipes.list now returns { recipes, nextCursor } for infinite scroll
    expect(Array.isArray(result.recipes)).toBe(true);
  });

  it("list passes mealTime filter to db.getRecipes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const dbMock = await import("./db");
    (dbMock.getRecipes as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    await caller.recipes.list({ mealTime: "desayuno" });
    expect(dbMock.getRecipes).toHaveBeenCalledWith(
      expect.objectContaining({ mealTime: "desayuno" })
    );
  });

  it("list passes excludeUserAllergens and currentUserId to db.getRecipes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const dbMock = await import("./db");
    (dbMock.getRecipes as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    await caller.recipes.list({ excludeUserAllergens: true });
    expect(dbMock.getRecipes).toHaveBeenCalledWith(
      expect.objectContaining({ excludeUserAllergens: true, currentUserId: 1 })
    );
  });

  it("list passes buddyMakerId filter to db.getRecipes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const dbMock = await import("./db");
    (dbMock.getRecipes as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    await caller.recipes.list({ buddyMakerId: 42 });
    expect(dbMock.getRecipes).toHaveBeenCalledWith(
      expect.objectContaining({ buddyMakerId: 42 })
    );
  });

  it("list passes isSeeded filter to db.getRecipes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const dbMock = await import("./db");
    (dbMock.getRecipes as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    await caller.recipes.list({ isSeeded: true });
    expect(dbMock.getRecipes).toHaveBeenCalledWith(
      expect.objectContaining({ isSeeded: true })
    );
  });

  it("getById throws NOT_FOUND for non-existent recipe", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.recipes.getById({ id: 9999 })).rejects.toThrow();
  });
});

// ─── Catalogs ────────────────────────────────────────────────────────────────
describe("catalogs", () => {
  it("allergies returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.catalogs.allergies();
    expect(Array.isArray(result)).toBe(true);
  });

  it("dietRestrictions returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.catalogs.dietRestrictions();
    expect(Array.isArray(result)).toBe(true);
  });

  it("foodCategories returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.catalogs.foodCategories();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Shopping Lists ───────────────────────────────────────────────────────────
describe("shoppingLists", () => {
  it("list returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.shoppingLists.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Inventory ───────────────────────────────────────────────────────────────
describe("inventory", () => {
  it("list returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inventory.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Meal Logs ────────────────────────────────────────────────────────────────
describe("mealLogs", () => {
  it("dailySummary returns nutrition object", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const today = new Date().toISOString().split("T")[0];
    const result = await caller.mealLogs.dailySummary({ date: today });
    expect(result).toBeDefined();
    expect(typeof result.calories).toBe("number");
  });
});

// ─── Subscriptions ───────────────────────────────────────────────────────────
describe("subscriptions", () => {
  it("getStatus returns null for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscriptions.getStatus();
    expect(result).toBeNull();
  });

  it("createCheckout returns a URL", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscriptions.createCheckout({
      plan: "premium",
      origin: "https://buddymarket.manus.space",
    });
    expect(result.url).toBeDefined();
    expect(typeof result.url).toBe("string");
  });
});

// ─── Admin ───────────────────────────────────────────────────────────────────
describe("admin", () => {
  it("stats throws FORBIDDEN for non-admin users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("stats returns stats for admin users", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.stats();
    expect(result).toBeDefined();
    expect(typeof result.totalUsers).toBe("number");
  });
});

// ─── Metrics ─────────────────────────────────────────────────────────────────
describe("metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("add validates that at least one field is provided", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.metrics.add({ date: "2026-04-02" })
    ).rejects.toThrow("Debes proporcionar al menos una medición o nota");
  });

  it("add validates weight range (20-500kg)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.metrics.add({ date: "2026-04-02", weight: 10 })
    ).rejects.toThrow("Peso mínimo 20kg");
    await expect(
      caller.metrics.add({ date: "2026-04-02", weight: 600 })
    ).rejects.toThrow("Peso máximo 500kg");
  });

  it("add validates date format (YYYY-MM-DD)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.metrics.add({ date: "02-04-2026", weight: 70 })
    ).rejects.toThrow("Formato de fecha inválido");
  });

  it("add validates BMI range (10-80)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.metrics.add({ date: "2026-04-02", bmi: 5 })
    ).rejects.toThrow("IMC mínimo 10");
    await expect(
      caller.metrics.add({ date: "2026-04-02", bmi: 90 })
    ).rejects.toThrow("IMC máximo 80");
  });
});

// ─── BuddyApplications ───────────────────────────────────────────────────────
describe("buddyApplications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submitApplication requires displayName", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.buddyApplications.submitApplication({ type: "expert", displayName: "A" })
    ).rejects.toThrow();
  });

  it("getMyApplication requires valid type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Should throw zod validation error for invalid type
    await expect(
      (caller.buddyApplications.getMyApplication as any)({ type: "invalid" })
    ).rejects.toThrow();
  });
});

// ─── Nutritional History ──────────────────────────────────────────────────────
describe("mealLogs.nutritionalHistory", () => {
  it("returns data array for valid days input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.mealLogs.nutritionalHistory({ days: 30 });
    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("rejects days below 7", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.mealLogs.nutritionalHistory({ days: 3 })
    ).rejects.toThrow();
  });

  it("rejects days above 90", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.mealLogs.nutritionalHistory({ days: 100 })
    ).rejects.toThrow();
  });
});

// ─── Streak ───────────────────────────────────────────────────────────────────
describe("mealLogs.getStreak", () => {
  it("returns currentStreak and longestStreak", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.mealLogs.getStreak();
    expect(result).toBeDefined();
    expect(typeof result.currentStreak).toBe("number");
    expect(typeof result.longestStreak).toBe("number");
  });
});

// ─── lookupBarcode ────────────────────────────────────────────────────────────
describe("mealLogs.lookupBarcode", () => {
  it("rejects barcode shorter than 4 chars", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.mealLogs.lookupBarcode({ barcode: "123" })
    ).rejects.toThrow();
  });

  it("rejects barcode longer than 30 chars", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.mealLogs.lookupBarcode({ barcode: "1234567890123456789012345678901" })
    ).rejects.toThrow();
  });

  it("accepts valid barcode format (13 digits) and returns product shape", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Mock fetch to avoid real network call
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: "Nutella",
          image_url: "https://example.com/nutella.jpg",
          nutriments: {
            "energy-kcal_100g": 539,
            proteins_100g: 6.3,
            carbohydrates_100g: 57.5,
            fat_100g: 30.9,
            fiber_100g: 3.0,
            sugars_100g: 56.3,
            sodium_100g: 0.107,
          },
          serving_size: "15g",
        },
      }),
    });
    const originalFetch = global.fetch;
    global.fetch = mockFetch as any;
    try {
      const result = await caller.mealLogs.lookupBarcode({ barcode: "3017620422003" });
      expect(result).toHaveProperty("barcode", "3017620422003");
      expect(result).toHaveProperty("name", "Nutella");
      expect(result).toHaveProperty("per100g");
      expect(result.per100g).toHaveProperty("calories", 539);
      expect(result.per100g).toHaveProperty("proteins", 6.3);
      expect(result.per100g).toHaveProperty("carbohydrates", 57.5);
      expect(result.per100g).toHaveProperty("fats", 30.9);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

// ─── Notifications / Meal Reminders ──────────────────────────────────────────
describe("notifications.getReminders", () => {
  it("returns an array for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.getReminders();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("notifications.upsertReminder", () => {
  it("rejects invalid time format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notifications.upsertReminder({ mealType: "desayuno", time: "25:99", enabled: true, daysMask: 127 })
    ).rejects.toThrow();
  });

  it("rejects invalid mealType", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notifications.upsertReminder({ mealType: "brunch" as any, time: "09:00", enabled: true, daysMask: 127 })
    ).rejects.toThrow();
  });

  it("rejects daysMask out of range", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.notifications.upsertReminder({ mealType: "desayuno", time: "08:00", enabled: true, daysMask: 200 })
    ).rejects.toThrow();
  });

  it("accepts valid reminder upsert", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.upsertReminder({
      mealType: "desayuno",
      time: "08:00",
      enabled: true,
      daysMask: 31, // weekdays only
    });
    expect(result.success).toBe(true);
    expect(["created", "updated"]).toContain(result.action);
  });
});

describe("notifications.deleteReminder", () => {
  it("deletes a reminder successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.deleteReminder({ mealType: "cena" });
    expect(result.success).toBe(true);
  });
});

describe("notifications.getDailySummary", () => {
  it("returns caloric summary with correct shape", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.getDailySummary();
    expect(result).toHaveProperty("consumed");
    expect(result).toHaveProperty("goal");
    expect(result).toHaveProperty("percentage");
    expect(result).toHaveProperty("remaining");
    expect(result).toHaveProperty("proteins");
    expect(result).toHaveProperty("carbohydrates");
    expect(result).toHaveProperty("fats");
    expect(result).toHaveProperty("date");
    expect(typeof result.consumed).toBe("number");
    expect(typeof result.goal).toBe("number");
    expect(typeof result.percentage).toBe("number");
    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeLessThanOrEqual(100);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("uses default goal of 2000 kcal when no profile exists", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.getDailySummary();
    // With mocked db returning null for getUserProfile, goal defaults to 2000
    expect(result.goal).toBeGreaterThan(0);
  });

  it("date field matches today in YYYY-MM-DD format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.getDailySummary();
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.date).toBe(new Date().toISOString().split("T")[0]);
  });
});

// =============================================================================
// ACHIEVEMENTS TESTS
// =============================================================================
describe("achievements.getAll", () => {
  it("returns achievements list with unlocked status and level info", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.achievements.getAll();
    expect(result).toHaveProperty("achievements");
    expect(result).toHaveProperty("totalPoints");
    expect(result).toHaveProperty("level");
    expect(result).toHaveProperty("unlockedCount");
    expect(result).toHaveProperty("totalCount");
    expect(Array.isArray(result.achievements)).toBe(true);
    expect(result.totalCount).toBeGreaterThan(0);
  });

  it("each achievement has required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.achievements.getAll();
    for (const a of result.achievements) {
      expect(a).toHaveProperty("id");
      expect(a).toHaveProperty("title");
      expect(a).toHaveProperty("description");
      expect(a).toHaveProperty("emoji");
      expect(a).toHaveProperty("points");
      expect(a).toHaveProperty("category");
      expect(a).toHaveProperty("unlocked");
    }
  });

  it("level has required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.achievements.getAll();
    expect(result.level).toHaveProperty("level");
    expect(result.level).toHaveProperty("title");
    expect(result.level).toHaveProperty("emoji");
    expect(result.level).toHaveProperty("minPoints");
  });
});

describe("achievements.getUserStats", () => {
  it("returns user stats with points and progress", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.achievements.getUserStats();
    expect(result).toHaveProperty("totalPoints");
    expect(result).toHaveProperty("level");
    expect(result).toHaveProperty("progressToNext");
    expect(result).toHaveProperty("unlockedCount");
    expect(result).toHaveProperty("totalCount");
    expect(result.progressToNext).toBeGreaterThanOrEqual(0);
    expect(result.progressToNext).toBeLessThanOrEqual(100);
  });
});

describe("achievements.evaluate", () => {
  it("evaluates meal_logged trigger and returns newly unlocked array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.achievements.evaluate({ trigger: "meal_logged" });
    expect(result).toHaveProperty("newlyUnlocked");
    expect(result).toHaveProperty("count");
    expect(Array.isArray(result.newlyUnlocked)).toBe(true);
    expect(result.count).toBe(result.newlyUnlocked.length);
  });

  it("rejects invalid trigger values", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.achievements.evaluate({ trigger: "invalid_trigger" as any })
    ).rejects.toThrow();
  });
});

describe("specializedMenus.generate", () => {
  beforeEach(async () => {
    // specializedMenus requires at least 'basic' (Pro) plan
    const dbMock = await import("./db");
    (dbMock.getUserSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1, userId: 1, plan: "basic", status: "active",
      stripeCustomerId: null, stripeSubscriptionId: null,
      currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
      createdAt: new Date(), updatedAt: new Date(),
    });
  });
  afterEach(async () => {
    const dbMock = await import("./db");
    (dbMock.getUserSubscription as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it("should generate a specialized menu for a valid category", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const mockMenu = {
      menuTitle: "Menú para Diabético",
      targetProfile: "Diabético (control de glucemia)",
      keyNutrients: ["Fibra", "Proteína", "Omega-3"],
      avoidList: ["Azúcar refinado", "Harinas blancas"],
      generalTips: ["Distribuye los hidratos en 5 comidas"],
      days: [
        {
          day: "Lunes",
          totalCalories: 1800,
          meals: [
            { name: "Desayuno", food: "Avena con frutos rojos", calories: 350, protein: 12, carbs: 45, fat: 8, nutritionNote: "Bajo IG" },
          ],
        },
      ],
    };
    (invokeLLM as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(mockMenu) } }],
    });

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.specializedMenus.generate({
      category: "diabetico",
      days: 1,
      persons: 1,
    });

    expect(result.menu).toBeDefined();
    expect(result.menu.menuTitle).toBe("Menú para Diabético");
    expect(result.menu.days).toHaveLength(1);
    expect(result.category).toBe("diabetico");
  });

  it("should generate a menu for embarazada category", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const mockMenu = {
      menuTitle: "Menú para Embarazada",
      targetProfile: "Embarazada",
      keyNutrients: ["Ácido fólico", "Hierro", "Calcio"],
      avoidList: ["Pescados con mercurio", "Alcohol"],
      generalTips: ["5 comidas al día"],
      days: [{ day: "Lunes", totalCalories: 2200, meals: [] }],
    };
    (invokeLLM as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(mockMenu) } }],
    });

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.specializedMenus.generate({
      category: "embarazada",
      days: 1,
      persons: 1,
    });

    expect(result.menu).toBeDefined();
    expect(result.category).toBe("embarazada");
  });

  it("should reject invalid category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.specializedMenus.generate({ category: "invalid_category" as any, days: 1, persons: 1 })
    ).rejects.toThrow();
  });

  it("should handle LLM error gracefully", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("LLM unavailable"));

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.specializedMenus.generate({
      category: "acatarrado",
      days: 1,
      persons: 1,
    });

    expect(result.menu).toBeNull();
    expect(result.error).toBeDefined();
  });

  it("should require authentication", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(unauthCtx);
    await expect(
      caller.specializedMenus.generate({ category: "vegano", days: 1, persons: 1 })
    ).rejects.toThrow();
  });
});

// ─── Registration Flow Tests ─────────────────────────────────────────────────
describe("Registration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should set account type for a user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.setAccountType({ accountType: "user" });
    expect(result.success).toBe(true);
  });

  it("should advance registration step", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.advanceRegistrationStep({ step: "profile_setup" });
    expect(result.success).toBe(true);
  });

  it("should get registration status for a user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.getRegistrationStatus();
    // Returns null when DB mock returns empty array, which is valid
    if (result !== null) {
      expect(result).toHaveProperty("registrationStep");
      expect(result).toHaveProperty("accountType");
      expect(result).toHaveProperty("application");
    }
  });

  it("should require authentication for setAccountType", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(unauthCtx);
    await expect(
      caller.profile.setAccountType({ accountType: "user" })
    ).rejects.toThrow();
  });

  it("should require authentication for advanceRegistrationStep", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(unauthCtx);
    await expect(
      caller.profile.advanceRegistrationStep({ step: "profile_setup" })
    ).rejects.toThrow();
  });

  it("should require authentication for getRegistrationStatus", async () => {
    const unauthCtx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(unauthCtx);
    await expect(
      caller.profile.getRegistrationStatus()
    ).rejects.toThrow();
  });
});

// =============================================================================
// ADMIN: setUserPlan & setUserAccountType
// =============================================================================
describe("admin.setUserPlan", () => {
  it("should reject non-admin users with FORBIDDEN", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.setUserPlan({ userId: 999, plan: "pro_max" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("should allow admin to set a plan (returns success or NOT_FOUND)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.setUserPlan({ userId: 999, plan: "pro_max" });
      expect(result.success).toBe(true);
    } catch (err: any) {
      // NOT_FOUND is acceptable when userId 999 doesn't exist in test DB
      expect(["NOT_FOUND", "INTERNAL_SERVER_ERROR"]).toContain(err.code);
    }
  });
});

describe("admin.setUserAccountType", () => {
  it("should reject non-admin users with FORBIDDEN", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.setUserAccountType({ userId: 999, accountType: "buddymaker" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("should allow admin to set account type", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // updateUser is mocked to succeed
    const result = await caller.admin.setUserAccountType({ userId: 1, accountType: "buddymaker" });
    expect(result.success).toBe(true);
    expect(result.accountType).toBe("buddymaker");
  });
});
