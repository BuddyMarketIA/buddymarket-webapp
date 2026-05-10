/**
 * Tests de integración: profile, ingredients, recipes
 * Cubre ~30 procedimientos tRPC con escenarios happy path, validación y autorización
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
    getUserProfile: vi.fn().mockResolvedValue({ id: 1, name: "Test User", email: "test@test.com" }),
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
    getIngredientById: vi.fn().mockResolvedValue({ id: 1, nameEs: "Tomate", calories: 18 }),
    createIngredient: vi.fn().mockResolvedValue({ id: 5, nameEs: "Nuevo Ingrediente" }),
    updateIngredient: vi.fn().mockResolvedValue({ id: 1, nameEs: "Tomate Actualizado" }),
    deleteIngredient: vi.fn().mockResolvedValue(true),
    getRecipes: vi.fn().mockResolvedValue([]),
    getRecipeById: vi.fn().mockResolvedValue({
      id: 1, name: "Ensalada", userId: 1, isPublic: true,
      calories: 200, protein: 5, carbs: 10, fat: 8,
    }),
    createRecipe: vi.fn().mockResolvedValue({ id: 10, name: "Nueva Receta" }),
    updateRecipe: vi.fn().mockResolvedValue({ id: 1, name: "Receta Actualizada" }),
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
    getFavoriteIds: vi.fn().mockResolvedValue([1, 2, 3]),
    getFavoriteRecipes: vi.fn().mockResolvedValue([]),
    getAllAllergies: vi.fn().mockResolvedValue([]),
    getAllDietRestrictions: vi.fn().mockResolvedValue([]),
    getAllFoodCategories: vi.fn().mockResolvedValue([]),
    logAllergyChange: vi.fn().mockResolvedValue(true),
    getRecentAllergyViolations: vi.fn().mockResolvedValue([]),
    logAllergyViolation: vi.fn().mockResolvedValue(true),
    getAllergyHistory: vi.fn().mockResolvedValue([]),
    getAllMeasures: vi.fn().mockResolvedValue([]),
    getAllDayParts: vi.fn().mockResolvedValue([]),
    getAllStorageLocations: vi.fn().mockResolvedValue([]),
    getMenuOrganizers: vi.fn().mockResolvedValue([]),
    getUserMenus: vi.fn().mockResolvedValue([]),
    getMenuOrganizerById: vi.fn().mockResolvedValue(null),
    createMenuOrganizer: vi.fn().mockResolvedValue({ id: 1 }),
    updateMenuOrganizer: vi.fn().mockResolvedValue({ id: 1 }),
    deleteMenuOrganizer: vi.fn().mockResolvedValue(true),
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
    getMealLogs: vi.fn().mockResolvedValue([]),
    createMealLog: vi.fn().mockResolvedValue({ id: 1 }),
    deleteMealLog: vi.fn().mockResolvedValue(true),
    createHealthMetric: vi.fn().mockResolvedValue({ id: 1 }),
    getHealthMetrics: vi.fn().mockResolvedValue([]),
    getUserSubscription: vi.fn().mockResolvedValue({ plan: "basic", status: "active", manualPlan: null }),
    createIngredientWithAllergies: vi.fn().mockResolvedValue({ id: 5, nameEs: "Nuevo Ingrediente" }),
    getUserById: vi.fn().mockResolvedValue({ id: 1, role: "user" }),
    getUsers: vi.fn().mockResolvedValue([]),
    updateUserRole: vi.fn().mockResolvedValue(true),
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
          where: vi.fn().mockImplementation(() => {
            const mockUser = { id: 1, accountType: "user", registrationStep: "completed", onboardingCompleted: true };
            const chainable: any = {
              limit: vi.fn().mockResolvedValue([mockUser]),
              orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
              then: (resolve: any, reject?: any) => Promise.resolve([mockUser]).then(resolve, reject),
            };
            return chainable;
          }),
          orderBy: vi.fn().mockResolvedValue([]),
          then: (resolve: any, reject?: any) => Promise.resolve([]).then(resolve, reject),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({ insertId: 1 }) }),
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) }),
      delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
    }),
  updateUser: vi.fn().mockResolvedValue({ id: 1 }),
  searchIngredients: vi.fn().mockResolvedValue([]),
  getAllIngredients: vi.fn().mockResolvedValue([]),
  searchRecipeSuggestions: vi.fn().mockResolvedValue([]),
  toggleFavoriteRecipe: vi.fn().mockResolvedValue({ favorited: true }),
  getSeededMenus: vi.fn().mockResolvedValue([]),
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
type AuthUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
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

function authCtx(overrides: Partial<AuthUser> = {}): TrpcContext {
  return {
    user: makeUser(overrides),
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

// ─── Profile ─────────────────────────────────────────────────────────────────
describe("profile", () => {
  it("get returns user profile for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.profile.get();
    expect(result).toHaveProperty("user");
  });

  it("get throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.profile.get()).rejects.toThrow();
  });

  it("updateBasic updates name and phone", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.profile.updateBasic({ name: "Nuevo Nombre", phone: "+34600000000" });
    expect(result).toBeDefined();
  });

  it("updateBasic rejects name shorter than 1 char", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.profile.updateBasic({ name: "" })).rejects.toThrow();
  });

  it("updateBasic rejects name longer than 100 chars", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.profile.updateBasic({ name: "A".repeat(101) })).rejects.toThrow();
  });

  it("updateProfile accepts valid age range", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.profile.updateProfile({ age: 30, height: 175, weight: 70 });
    expect(result).toBeDefined();
  });

  it("updateProfile rejects age below 1", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.profile.updateProfile({ age: 0 })).rejects.toThrow();
  });

  it("updateProfile rejects age above 120", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.profile.updateProfile({ age: 121 })).rejects.toThrow();
  });

  it("updateProfile rejects weight below 20kg", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.profile.updateProfile({ weight: 19 })).rejects.toThrow();
  });

  it("updateProfile rejects weight above 500kg", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.profile.updateProfile({ weight: 501 })).rejects.toThrow();
  });

  it("updateProfile rejects height below 50cm", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.profile.updateProfile({ height: 49 })).rejects.toThrow();
  });

  it("updateProfile rejects height above 300cm", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.profile.updateProfile({ height: 301 })).rejects.toThrow();
  });

  it("updatePreferences accepts valid preferences", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.profile.updatePreferences({
      cookingStyle: "mediterranea",
      mealFrequency: 3,
    });
    expect(result).toBeDefined();
  });

  it("setAllergies accepts empty array", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.profile.setAllergies({ allergyIds: [] });
    expect(result).toBeDefined();
  });

  it("setAllergies accepts array of valid IDs", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.profile.setAllergies({ allergyIds: [1, 2, 3] });
    expect(result).toBeDefined();
  });

  it("setDietRestrictions accepts valid restriction IDs", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.profile.setDietRestrictions({ restrictionIds: [1] });
    expect(result).toBeDefined();
  });

  it("setFoodCategories accepts valid category IDs", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.profile.setFoodCategories({ categoryIds: [1, 2] });
    expect(result).toBeDefined();
  });

  it("getRegistrationStatus returns status for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.profile.getRegistrationStatus();
    expect(result).toHaveProperty("accountType");
  });
});

// ─── Ingredients ─────────────────────────────────────────────────────────────
describe("ingredients", () => {
  it("search returns empty array when no results", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.ingredients.search({ query: "xyz123" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("search rejects query longer than 200 chars", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.ingredients.search({ query: "A".repeat(201) })).rejects.toThrow();
  });

  it("getAll returns list of ingredients", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.ingredients.getAll({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("getAll rejects limit above 500", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.ingredients.getAll({ limit: 501 })).rejects.toThrow();
  });

  it("getById returns ingredient by id", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.ingredients.getById({ id: 1 });
    expect(result).toHaveProperty("id", 1);
  });

  it("getById rejects non-positive id", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.ingredients.getById({ id: 0 })).rejects.toThrow();
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.ingredients.create({
      apiParam: "tomate",
      nameEs: "Tomate",
    })).rejects.toThrow();
  });

  it("create succeeds for admin user with valid data", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const result = await caller.ingredients.create({
      apiParam: "tomate-cherry",
      nameEs: "Tomate Cherry",
      calories: 18,
    });
    expect(result).toBeDefined();
  });

  it("create rejects nameEs shorter than 1 char", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await expect(caller.ingredients.create({
      apiParam: "test",
      nameEs: "",
    })).rejects.toThrow();
  });

  it("create rejects calories above 9000", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await expect(caller.ingredients.create({
      apiParam: "test",
      nameEs: "Ingrediente",
      calories: 9001,
    })).rejects.toThrow();
  });

  it("update requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.ingredients.update({ id: 1, data: { nameEs: "Tomate" } })).rejects.toThrow();
  });

  it("update succeeds for admin user", async () => {
    const caller = appRouter.createCaller(adminCtx());
    const result = await caller.ingredients.update({ id: 1, data: { nameEs: "Tomate Actualizado" } });
    expect(result).toBeDefined();
  });

  it("delete requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.ingredients.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── Recipes ─────────────────────────────────────────────────────────────────
describe("recipes", () => {
  it("list returns empty array when no recipes", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.recipes.list({});
    expect(result).toHaveProperty("recipes");
    expect(Array.isArray(result.recipes)).toBe(true);
  });

  it("list rejects search longer than 200 chars", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.list({ search: "A".repeat(201) })).rejects.toThrow();
  });

  it("list rejects limit above 100", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.list({ limit: 101 })).rejects.toThrow();
  });

  it("list accepts valid difficulty enum", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.recipes.list({ difficulty: "facil" });
    expect(result).toHaveProperty("recipes");
  });

  it("list rejects invalid difficulty value", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.list({ difficulty: "imposible" as any })).rejects.toThrow();
  });

  it("getById returns recipe by id", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.recipes.getById({ id: 1 });
    expect(result).toHaveProperty("id", 1);
  });

  it("getById rejects non-positive id", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.getById({ id: -1 })).rejects.toThrow();
  });

  it("searchSuggestions returns array", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.recipes.searchSuggestions({ query: "pollo" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("myRecipes requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.myRecipes({})).rejects.toThrow();
  });

  it("myRecipes returns recipes for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.recipes.myRecipes({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("favorites requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.favorites()).rejects.toThrow();
  });

  it("favorites returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.recipes.favorites();
    expect(Array.isArray(result)).toBe(true);
  });

  it("toggleFavorite requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.toggleFavorite({ recipeId: 1 })).rejects.toThrow();
  });

  it("toggleFavorite returns favorited status", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.recipes.toggleFavorite({ recipeId: 1 });
    expect(result).toHaveProperty("favorited");
  });

  it("getFavoriteIds returns array of IDs", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.recipes.getFavoriteIds();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.create({
      name: "Test Recipe",
      isPublic: true,
    })).rejects.toThrow();
  });

  it("create succeeds with valid data", async () => {
    // recipes.create requires at least 'basic' plan - use adminCtx which has pro_max
    const caller = appRouter.createCaller(adminCtx());
    const result = await caller.recipes.create({
      name: "Ensalada César",
      isPublic: true,
    });
    expect(result).toBeDefined();
  });

  it("create rejects name shorter than 2 chars", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.recipes.create({ name: "A" })).rejects.toThrow();
  });

  it("create rejects name longer than 100 chars", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.recipes.create({ name: "A".repeat(101) })).rejects.toThrow();
  });

  it("create rejects preparationTime above 1440 min", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.recipes.create({ name: "Test", preparationTime: 1441 })).rejects.toThrow();
  });

  it("create rejects servings above 100", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.recipes.create({ name: "Test", servings: 101 })).rejects.toThrow();
  });

  it("update requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.update({ id: 1, name: "Updated" })).rejects.toThrow();
  });

  it("update succeeds for recipe owner", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.recipes.update({ id: 1, name: "Ensalada Actualizada" });
    expect(result).toBeDefined();
  });

  it("delete requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.delete({ id: 1 })).rejects.toThrow();
  });

  it("addStep requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.recipes.addStep({
      recipeId: 1,
      stepNumber: 1,
      instruction: "Mezclar ingredientes",
    })).rejects.toThrow();
  });

  it("addStep rejects instruction shorter than 5 chars", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.recipes.addStep({
      recipeId: 1,
      stepNumber: 1,
      instruction: "Mix",
    })).rejects.toThrow();
  });

  it("addStep rejects stepNumber above 50", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.recipes.addStep({
      recipeId: 1,
      stepNumber: 51,
      instruction: "Mezclar todos los ingredientes bien",
    })).rejects.toThrow();
  });
});

// ─── Catalogs ────────────────────────────────────────────────────────────────
describe("catalogs", () => {
  it("allergies returns array", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.catalogs.allergies();
    expect(Array.isArray(result)).toBe(true);
  });

  it("dietRestrictions returns array", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.catalogs.dietRestrictions();
    expect(Array.isArray(result)).toBe(true);
  });

  it("foodCategories returns array", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.catalogs.foodCategories();
    expect(Array.isArray(result)).toBe(true);
  });

  it("measures returns array", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.catalogs.measures();
    expect(Array.isArray(result)).toBe(true);
  });

  it("dayParts returns array", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.catalogs.dayParts();
    expect(Array.isArray(result)).toBe(true);
  });
});
