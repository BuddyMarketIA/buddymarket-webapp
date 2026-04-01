import { describe, expect, it, vi, beforeEach } from "vitest";
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
    expect(Array.isArray(result)).toBe(true);
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
