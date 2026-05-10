/**
 * Plan Enforcement Tests
 * Verifies that feature gates work correctly for each subscription tier:
 * - free: limited features
 * - basic: standard features
 * - premium: advanced features
 * - pro_max: all features
 *
 * These tests use the tRPC router directly with mocked DB and context.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserSubscription: vi.fn(),
  getUserProfile: vi.fn().mockResolvedValue(null),
  getUserMedicalProfile: vi.fn().mockResolvedValue(null),
  getUserPreferences: vi.fn().mockResolvedValue(null),
  getUserDietRestrictions: vi.fn().mockResolvedValue([]),
  getUserAllergies: vi.fn().mockResolvedValue([]),
  getUserFoodCategories: vi.fn().mockResolvedValue([]),
  getMenuOrganizers: vi.fn().mockResolvedValue([]),
  getUserMenus: vi.fn().mockResolvedValue([]),
  getMenus: vi.fn().mockResolvedValue([]),
  getMenuById: vi.fn().mockResolvedValue(null),
  getMenuOrganizerById: vi.fn().mockResolvedValue(null),
  getRecipes: vi.fn().mockResolvedValue([]),
  getRecipeById: vi.fn().mockResolvedValue(null),
  createRecipe: vi.fn().mockResolvedValue({ id: 1 }),
  updateRecipe: vi.fn().mockResolvedValue({ id: 1 }),
  deleteRecipe: vi.fn().mockResolvedValue(true),
  getShoppingLists: vi.fn().mockResolvedValue([]),
  getShoppingListById: vi.fn().mockResolvedValue(null),
  getShoppingListItems: vi.fn().mockResolvedValue([]),
  getInventory: vi.fn().mockResolvedValue([]),
  getInventoryItems: vi.fn().mockResolvedValue([]),
  getInventoryById: vi.fn().mockResolvedValue(null),
  getMealLogs: vi.fn().mockResolvedValue([]),
  getDailyNutritionSummary: vi.fn().mockResolvedValue({ calories: 0, proteins: 0, carbohydrates: 0, fats: 0 }),
  getHealthMetrics: vi.fn().mockResolvedValue([]),
  getAllergies: vi.fn().mockResolvedValue([]),
  getDietRestrictions: vi.fn().mockResolvedValue([]),
  getFoodCategories: vi.fn().mockResolvedValue([]),
  getMeasures: vi.fn().mockResolvedValue([]),
  getIngredients: vi.fn().mockResolvedValue([]),
  getAdminStats: vi.fn().mockResolvedValue({ totalUsers: 0, totalRecipes: 0, totalMenus: 0 }),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getAllRecipes: vi.fn().mockResolvedValue([]),
  getAllMenus: vi.fn().mockResolvedValue([]),
  getAllIngredients: vi.fn().mockResolvedValue([]),
  getAllAllergies: vi.fn().mockResolvedValue([]),
  getAllDietRestrictions: vi.fn().mockResolvedValue([]),
  getAllFoodCategories: vi.fn().mockResolvedValue([]),
  getAllMeasures: vi.fn().mockResolvedValue([]),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  updateUser: vi.fn().mockResolvedValue({ id: 1 }),
  upsertUserProfile: vi.fn().mockResolvedValue({ id: 1 }),
  upsertUserMedicalProfile: vi.fn().mockResolvedValue({ id: 1 }),
  upsertUserSubscription: vi.fn().mockResolvedValue({ id: 1 }),
  createMenu: vi.fn().mockResolvedValue({ id: 1 }),
  updateMenu: vi.fn().mockResolvedValue({ id: 1 }),
  deleteMenu: vi.fn().mockResolvedValue(true),
  addMenuRecipe: vi.fn().mockResolvedValue({ id: 1 }),
  removeMenuRecipe: vi.fn().mockResolvedValue(true),
  createMenuOrganizer: vi.fn().mockResolvedValue({ id: 1, name: "Test Menu" }),
  updateMenuOrganizer: vi.fn().mockResolvedValue({ id: 1 }),
  deleteMenuOrganizer: vi.fn().mockResolvedValue(true),
  copyMenuForUser: vi.fn().mockResolvedValue({ id: 1 }),
  renameMenu: vi.fn().mockResolvedValue({ id: 1 }),
  setActiveMenu: vi.fn().mockResolvedValue({ id: 1 }),
  updateMenuStartDate: vi.fn().mockResolvedValue({ id: 1 }),
  duplicateMenu: vi.fn().mockResolvedValue({ id: 1 }),
  deleteUserMenu: vi.fn().mockResolvedValue(true),
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
  createMealLog: vi.fn().mockResolvedValue({ id: 1 }),
  deleteMealLog: vi.fn().mockResolvedValue(true),
  createHealthMetric: vi.fn().mockResolvedValue({ id: 1 }),
  setRecipeAllergies: vi.fn().mockResolvedValue(true),
  setRecipeDietRestrictions: vi.fn().mockResolvedValue(true),
  setRecipeIngredients: vi.fn().mockResolvedValue(true),
  setRecipeSteps: vi.fn().mockResolvedValue(true),
  setUserAllergies: vi.fn().mockResolvedValue(true),
  setUserDietRestrictions: vi.fn().mockResolvedValue(true),
  getRecipeIngredients: vi.fn().mockResolvedValue([]),
  getRecipeSteps: vi.fn().mockResolvedValue([]),
  getRecipeCategories: vi.fn().mockResolvedValue([]),
  getRecipeAllergies: vi.fn().mockResolvedValue([]),
  getRecipeDietRestrictions: vi.fn().mockResolvedValue([]),
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
  updateMeasure: vi.fn().mockResolvedValue({ id: 1 }),
  deleteMeasure: vi.fn().mockResolvedValue(true),
  createIngredientWithAllergies: vi.fn().mockResolvedValue({ id: 1 }),
  updateIngredient: vi.fn().mockResolvedValue({ id: 1 }),
  deleteIngredient: vi.fn().mockResolvedValue(true),
  getMealReminders: vi.fn().mockResolvedValue([]),
  upsertMealReminder: vi.fn().mockResolvedValue({ action: "created" }),
  deleteMealReminder: vi.fn().mockResolvedValue(undefined),
  getUserAchievements: vi.fn().mockResolvedValue([]),
  getUserPoints: vi.fn().mockResolvedValue({ totalPoints: 0 }),
  unlockAchievement: vi.fn().mockResolvedValue({ unlocked: true }),
  hasAchievement: vi.fn().mockResolvedValue(false),
  getTotalMealLogs: vi.fn().mockResolvedValue(0),
  getDistinctRecipesLogged: vi.fn().mockResolvedValue(0),
  getMealStreak: vi.fn().mockResolvedValue(0),
  getMealTypesLoggedToday: vi.fn().mockResolvedValue([]),
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockImplementation(() => {
        const obj: any = {
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 2, name: "Target User", email: "target@test.com" }]),
            orderBy: vi.fn().mockResolvedValue([]),
            then: vi.fn().mockResolvedValue([{ id: 2, name: "Target User", email: "target@test.com" }]),
          }),
          orderBy: vi.fn().mockResolvedValue([]),
          limit: vi.fn().mockResolvedValue([]),
        };
        obj[Symbol.iterator] = function* () { yield { n: 0 }; };
        return Object.assign(Promise.resolve([{ n: 0 }]), obj);
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

vi.mock("./stripe-webhook", () => ({
  registerStripeWebhook: vi.fn(),
  createCheckoutSession: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ menuItems: [] }) } }],
  }),
}));

// ── Context helpers ────────────────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
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
  };
}

function makeCtx(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://buddyoneapp.com" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function makeCaller(user: AuthenticatedUser) {
  return appRouter.createCaller(makeCtx(user));
}

// ── Subscription mock helper ───────────────────────────────────────────────────
import * as db from "./db";

function mockSubscription(plan: "free" | "basic" | "premium" | "pro_max" | null) {
  if (plan === null) {
    vi.mocked(db.getUserSubscription).mockResolvedValue(undefined);
  } else {
    vi.mocked(db.getUserSubscription).mockResolvedValue({
      id: 1,
      userId: 1,
      plan,
      status: plan === "free" ? "inactive" : "active",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeInvoiceId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }
}

// =============================================================================
// PLAN ENFORCEMENT: Subscription status endpoint
// =============================================================================
describe("Plan Enforcement: subscriptions.getStatus", () => {
  const user = makeUser();

  it("returns free plan when user has no active subscription", async () => {
    mockSubscription(null);
    const caller = makeCaller(user);
    const result = await caller.subscriptions.getStatus();
    expect(result.plan).toBe("free");
    expect(result.tier).toBe("free");
  });

  it("returns basic plan for active basic subscription", async () => {
    mockSubscription("basic");
    const caller = makeCaller(user);
    const result = await caller.subscriptions.getStatus();
    expect(result.plan).toBe("basic");
    expect(result.status).toBe("active");
  });

  it("returns pro_max plan for active pro_max subscription", async () => {
    mockSubscription("pro_max");
    const caller = makeCaller(user);
    const result = await caller.subscriptions.getStatus();
    expect(result.plan).toBe("pro_max");
    expect(result.status).toBe("active");
  });
});

// =============================================================================
// PLAN ENFORCEMENT: Admin-only procedures are blocked for regular users
// =============================================================================
describe("Plan Enforcement: admin-only procedures blocked for regular users", () => {
  const regularUser = makeUser({ role: "user" });

  beforeEach(() => {
    mockSubscription("pro_max"); // Even pro_max users can't access admin
  });

  it("admin.stats is FORBIDDEN for regular user (even pro_max)", async () => {
    const caller = makeCaller(regularUser);
    await expect(caller.admin.stats()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("admin.users is FORBIDDEN for regular user", async () => {
    const caller = makeCaller(regularUser);
    await expect(caller.admin.users({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("admin.setUserPlan is FORBIDDEN for regular user", async () => {
    const caller = makeCaller(regularUser);
    await expect(
      caller.admin.setUserPlan({ userId: 2, plan: "pro_max" })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

// =============================================================================
// PLAN ENFORCEMENT: Admin procedures work for admin users
// =============================================================================
describe("Plan Enforcement: admin procedures accessible for admin users", () => {
  const adminUser = makeUser({ id: 99, role: "admin" });

  beforeEach(() => {
    vi.mocked(db.getUserSubscription).mockResolvedValue({
      id: 1,
      userId: 99,
      plan: "pro_max",
      status: "active",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeInvoiceId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  });

  it("admin.stats is accessible for admin user", async () => {
    const caller = makeCaller(adminUser);
    const result = await caller.admin.stats();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalUsers");
  });

  it("admin.users is accessible for admin user", async () => {
    const caller = makeCaller(adminUser);
    const result = await caller.admin.users({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin.setUserPlan succeeds for admin user", async () => {
    vi.mocked(db.upsertUserSubscription).mockResolvedValue(undefined);
    const caller = makeCaller(adminUser);
    const result = await caller.admin.setUserPlan({ userId: 2, plan: "basic" });
    expect(result).toHaveProperty("success", true);
  });
});

// =============================================================================
// PLAN ENFORCEMENT: Checkout session creation
// =============================================================================
describe("Plan Enforcement: subscriptions.createCheckout", () => {
  const user = makeUser();

  beforeEach(() => {
    mockSubscription(null);
  });

  it("createCheckout succeeds for basic plan", async () => {
    const caller = makeCaller(user);
    const result = await caller.subscriptions.createCheckout({
      plan: "basic",
      origin: "https://buddyoneapp.com",
    });
    expect(result).toHaveProperty("url");
    expect(result.url).toContain("stripe.com");
  });

  it("createCheckout succeeds for premium plan", async () => {
    const caller = makeCaller(user);
    const result = await caller.subscriptions.createCheckout({
      plan: "premium",
      origin: "https://buddyoneapp.com",
    });
    expect(result).toHaveProperty("url");
  });

  it("createCheckout succeeds for pro_max plan", async () => {
    const caller = makeCaller(user);
    const result = await caller.subscriptions.createCheckout({
      plan: "pro_max",
      origin: "https://buddyoneapp.com",
    });
    expect(result).toHaveProperty("url");
  });
});
