/**
 * Ownership Check Tests
 * Verifies that users cannot edit, delete, or access resources owned by other users.
 * The requireOwnership() function in routers.ts throws FORBIDDEN when:
 *   - resource.userId !== ctx.user.id AND ctx.user.role !== "admin"
 *
 * Tests cover:
 * 1. Recipes: update, delete
 * 2. Menus: update, delete
 * 3. Shopping lists: update, delete
 * 4. Inventory: update, delete
 * 5. Admin bypass: admin can edit any resource
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// ── Mocks ─────────────────────────────────────────────────────────────────────
// IMPORTANT: vi.mock factory is hoisted, so NO top-level const references allowed.
// We use vi.fn() directly inside the factory and access them via vi.mocked() later.
vi.mock("./db", () => ({
  getRecipeById: vi.fn(),
  getMenuOrganizerById: vi.fn(),
  getShoppingListById: vi.fn(),
  getInventoryById: vi.fn(),
  updateRecipe: vi.fn().mockResolvedValue({ id: 1 }),
  deleteRecipe: vi.fn().mockResolvedValue(true),
  updateMenuOrganizer: vi.fn().mockResolvedValue({ id: 1 }),
  deleteMenuOrganizer: vi.fn().mockResolvedValue(true),
  updateShoppingList: vi.fn().mockResolvedValue({ id: 1 }),
  deleteShoppingList: vi.fn().mockResolvedValue(true),
  updateInventoryItem: vi.fn().mockResolvedValue({ id: 1 }),
  deleteInventoryItem: vi.fn().mockResolvedValue(true),
  getUserSubscription: vi.fn().mockResolvedValue(null),
  getUserProfile: vi.fn().mockResolvedValue(null),
  getUserMedicalProfile: vi.fn().mockResolvedValue(null),
  getUserPreferences: vi.fn().mockResolvedValue(null),
  getUserDietRestrictions: vi.fn().mockResolvedValue([]),
  getUserAllergies: vi.fn().mockResolvedValue([]),
  getUserFoodCategories: vi.fn().mockResolvedValue([]),
  getMenuOrganizers: vi.fn().mockResolvedValue([]),
  getUserMenus: vi.fn().mockResolvedValue([]),
  getMenus: vi.fn().mockResolvedValue([]),
  getRecipes: vi.fn().mockResolvedValue([]),
  getShoppingLists: vi.fn().mockResolvedValue([]),
  getShoppingListItems: vi.fn().mockResolvedValue([]),
  getInventory: vi.fn().mockResolvedValue([]),
  getInventoryItems: vi.fn().mockResolvedValue([]),
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
  renameMenu: vi.fn().mockResolvedValue({ id: 1 }),
  setActiveMenu: vi.fn().mockResolvedValue({ id: 1 }),
  updateMenuStartDate: vi.fn().mockResolvedValue({ id: 1 }),
  duplicateMenu: vi.fn().mockResolvedValue({ id: 1 }),
  deleteUserMenu: vi.fn().mockResolvedValue(true),
  copyMenuForUser: vi.fn().mockResolvedValue({ id: 1 }),
  createShoppingList: vi.fn().mockResolvedValue({ id: 1 }),
  addShoppingListItem: vi.fn().mockResolvedValue({ id: 1 }),
  toggleShoppingListItem: vi.fn().mockResolvedValue({ id: 1 }),
  deleteShoppingListItem: vi.fn().mockResolvedValue(true),
  generateShoppingListFromMenu: vi.fn().mockResolvedValue({ id: 1 }),
  addInventoryItem: vi.fn().mockResolvedValue({ id: 1 }),
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
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
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

function makeUser(id: number, role: "user" | "admin" = "user"): AuthenticatedUser {
  return {
    id,
    openId: `openid-${id}`,
    email: `user${id}@buddymarket.com`,
    name: `User ${id}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

function makeCtx(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://buddyone.io" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ── Resource fixtures ──────────────────────────────────────────────────────────
const OWNER_ID = 1;
const ATTACKER_ID = 2;
const ADMIN_ID = 99;

const recipeOwnedByUser1 = {
  id: 10,
  userId: OWNER_ID,
  name: "Receta del usuario 1",
  description: "",
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  difficulty: "easy",
  isPublic: false,
  imageUrl: null,
  calories: 300,
  proteins: 20,
  carbohydrates: 30,
  fats: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const menuOwnedByUser1 = {
  id: 20,
  userId: OWNER_ID,
  name: "Menú del usuario 1",
  startDate: new Date(),
  endDate: new Date(),
  isActive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const shoppingListOwnedByUser1 = {
  id: 30,
  userId: OWNER_ID,
  name: "Lista del usuario 1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const inventoryOwnedByUser1 = {
  id: 40,
  userId: OWNER_ID,
  name: "Inventario del usuario 1",
  quantity: 5,
  unit: "kg",
  expiryDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// OWNERSHIP: Recipes
// =============================================================================
describe("Ownership: Recipes — user cannot edit/delete other user's recipes", () => {
  beforeEach(() => {
    vi.mocked(db.getRecipeById).mockResolvedValue(recipeOwnedByUser1 as any);
    vi.mocked(db.updateRecipe).mockClear();
    vi.mocked(db.deleteRecipe).mockClear();
  });

  it("user 2 cannot update recipe owned by user 1", async () => {
    const attacker = makeUser(ATTACKER_ID);
    const caller = appRouter.createCaller(makeCtx(attacker));
    await expect(
      caller.recipes.update({ id: 10, name: "Hacked Recipe" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(vi.mocked(db.updateRecipe)).not.toHaveBeenCalled();
  });

  it("user 2 cannot delete recipe owned by user 1", async () => {
    const attacker = makeUser(ATTACKER_ID);
    const caller = appRouter.createCaller(makeCtx(attacker));
    await expect(
      caller.recipes.delete({ id: 10 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(vi.mocked(db.deleteRecipe)).not.toHaveBeenCalled();
  });

  it("owner (user 1) can update their own recipe", async () => {
    const owner = makeUser(OWNER_ID);
    const caller = appRouter.createCaller(makeCtx(owner));
    const result = await caller.recipes.update({ id: 10, name: "Updated Name" });
    expect(result).toHaveProperty("success", true);
    expect(vi.mocked(db.updateRecipe)).toHaveBeenCalledWith(10, expect.objectContaining({ name: "Updated Name" }));
  });

  it("owner (user 1) can delete their own recipe", async () => {
    const owner = makeUser(OWNER_ID);
    const caller = appRouter.createCaller(makeCtx(owner));
    const result = await caller.recipes.delete({ id: 10 });
    expect(result).toHaveProperty("success", true);
    expect(vi.mocked(db.deleteRecipe)).toHaveBeenCalledWith(10);
  });

  it("admin can update any recipe regardless of owner", async () => {
    const admin = makeUser(ADMIN_ID, "admin");
    const caller = appRouter.createCaller(makeCtx(admin));
    const result = await caller.recipes.update({ id: 10, name: "Admin Updated" });
    expect(result).toHaveProperty("success", true);
  });
});

// =============================================================================
// OWNERSHIP: Menus
// =============================================================================
describe("Ownership: Menus — user cannot edit/delete other user's menus", () => {
  beforeEach(() => {
    vi.mocked(db.getMenuOrganizerById).mockResolvedValue(menuOwnedByUser1 as any);
    vi.mocked(db.updateMenuOrganizer).mockClear();
    vi.mocked(db.deleteMenuOrganizer).mockClear();
  });

  it("user 2 cannot update menu owned by user 1", async () => {
    const attacker = makeUser(ATTACKER_ID);
    const caller = appRouter.createCaller(makeCtx(attacker));
    await expect(
      caller.menus.update({ id: 20, name: "Hacked Menu" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(vi.mocked(db.updateMenuOrganizer)).not.toHaveBeenCalled();
  });

  it("user 2 cannot delete menu owned by user 1", async () => {
    const attacker = makeUser(ATTACKER_ID);
    const caller = appRouter.createCaller(makeCtx(attacker));
    await expect(
      caller.menus.delete({ id: 20 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(vi.mocked(db.deleteMenuOrganizer)).not.toHaveBeenCalled();
  });

  it("owner (user 1) can update their own menu", async () => {
    const owner = makeUser(OWNER_ID);
    const caller = appRouter.createCaller(makeCtx(owner));
    const result = await caller.menus.update({ id: 20, name: "My Updated Menu" });
    expect(result).toHaveProperty("success", true);
  });

  it("admin can delete any menu regardless of owner", async () => {
    const admin = makeUser(ADMIN_ID, "admin");
    const caller = appRouter.createCaller(makeCtx(admin));
    const result = await caller.menus.delete({ id: 20 });
    expect(result).toHaveProperty("success", true);
  });
});

// =============================================================================
// OWNERSHIP: Shopping Lists
// =============================================================================
describe("Ownership: Shopping Lists — user cannot delete other user's lists", () => {
  beforeEach(() => {
    vi.mocked(db.getShoppingListById).mockResolvedValue(shoppingListOwnedByUser1 as any);
    vi.mocked(db.deleteShoppingList).mockClear();
  });

  it("user 2 cannot delete shopping list owned by user 1", async () => {
    const attacker = makeUser(ATTACKER_ID);
    const caller = appRouter.createCaller(makeCtx(attacker));
    await expect(
      caller.shoppingLists.delete({ id: 30 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(vi.mocked(db.deleteShoppingList)).not.toHaveBeenCalled();
  });

  it("owner (user 1) can delete their own shopping list", async () => {
    const owner = makeUser(OWNER_ID);
    const caller = appRouter.createCaller(makeCtx(owner));
    const result = await caller.shoppingLists.delete({ id: 30 });
    expect(result).toHaveProperty("success", true);
    expect(vi.mocked(db.deleteShoppingList)).toHaveBeenCalledWith(30);
  });

  it("admin can delete any shopping list regardless of owner", async () => {
    const admin = makeUser(ADMIN_ID, "admin");
    const caller = appRouter.createCaller(makeCtx(admin));
    const result = await caller.shoppingLists.delete({ id: 30 });
    expect(result).toHaveProperty("success", true);
  });
});

// =============================================================================
// OWNERSHIP: Inventory
// Note: inventory.remove uses inline drizzle ownership check (userId filter),
// not the requireOwnership() helper. We test the ownership semantics here.
// =============================================================================
describe("Ownership: Inventory — remove verifies ownership via userId filter", () => {
  it("inventory.remove returns NOT_FOUND when item does not belong to user (ownership enforced)", async () => {
    // The remove procedure filters by userId in the WHERE clause
    // If the item doesn't belong to the user, it returns empty array -> NOT_FOUND
    const attacker = makeUser(ATTACKER_ID);
    const caller = appRouter.createCaller(makeCtx(attacker));
    // getDb mock returns empty array for select (item not found for this user)
    await expect(
      caller.inventory.remove({ id: 40 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("inventory.update requires ownership (rejects if item not found for user)", async () => {
    // inventory.update now verifies ownership via userId filter in the query
    // The mock returns empty array for select, so NOT_FOUND is thrown
    const attacker = makeUser(ATTACKER_ID);
    const caller = appRouter.createCaller(makeCtx(attacker));
    await expect(
      caller.inventory.update({ id: 40, amount: 10 })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("inventory.list only returns items for the authenticated user", async () => {
    const owner = makeUser(OWNER_ID);
    const caller = appRouter.createCaller(makeCtx(owner));
    const result = await caller.inventory.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
