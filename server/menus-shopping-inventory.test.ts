/**
 * Tests de integración: menus, shoppingLists, inventory
 * Cubre ~35 procedimientos tRPC con escenarios happy path, validación y autorización
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
    getAllDayParts: vi.fn().mockResolvedValue([{ id: 1, name: "Desayuno" }]),
    getAllStorageLocations: vi.fn().mockResolvedValue([]),
    // Menus
    getMenuOrganizers: vi.fn().mockResolvedValue([
      { id: 1, name: "Menú Semana 1", userId: 1, isActive: false },
    ]),
    getUserMenus: vi.fn().mockResolvedValue([]),
    getMenuOrganizerById: vi.fn().mockResolvedValue({
      id: 1, name: "Menú Test", userId: 1, isActive: false,
      startDate: "2026-04-01", endDate: "2026-04-07",
    }),
    createMenuOrganizer: vi.fn().mockResolvedValue({ id: 2, name: "Nuevo Menú" }),
    updateMenuOrganizer: vi.fn().mockResolvedValue({ id: 1, name: "Menú Actualizado" }),
    deleteMenuOrganizer: vi.fn().mockResolvedValue(true),
    copyMenuForUser: vi.fn().mockResolvedValue({ id: 3 }),
    renameMenu: vi.fn().mockResolvedValue({ id: 1, name: "Renombrado" }),
    setActiveMenu: vi.fn().mockResolvedValue({ id: 1, isActive: true }),
    updateMenuStartDate: vi.fn().mockResolvedValue({ id: 1 }),
    duplicateMenu: vi.fn().mockResolvedValue({ id: 4 }),
    deleteUserMenu: vi.fn().mockResolvedValue(true),
    addMenuRecipe: vi.fn().mockResolvedValue({ id: 1 }),
    removeMenuRecipe: vi.fn().mockResolvedValue(true),
    getMenuById: vi.fn().mockResolvedValue({
      id: 1, name: "Menú Biblioteca", isPublic: true,
    }),
    updateMeasure: vi.fn().mockResolvedValue({ id: 1 }),
    // Shopping Lists
    getShoppingLists: vi.fn().mockResolvedValue([
      { id: 1, name: "Lista Semana", userId: 1 },
    ]),
    getShoppingListById: vi.fn().mockResolvedValue({
      id: 1, name: "Lista Test", userId: 1,
    }),
    createShoppingList: vi.fn().mockResolvedValue({ id: 5, name: "Nueva Lista" }),
    updateShoppingList: vi.fn().mockResolvedValue({ id: 1, name: "Lista Actualizada" }),
    deleteShoppingList: vi.fn().mockResolvedValue(true),
    addShoppingListItem: vi.fn().mockResolvedValue({ id: 10 }),
    toggleShoppingListItem: vi.fn().mockResolvedValue({ id: 10, checked: true }),
    deleteShoppingListItem: vi.fn().mockResolvedValue(true),
    generateShoppingListFromMenu: vi.fn().mockResolvedValue({ id: 6 }),
    // Inventory
    getInventoryItems: vi.fn().mockResolvedValue([
      { id: 1, name: "Leche", quantity: 2, userId: 1 },
    ]),
    getInventoryById: vi.fn().mockResolvedValue({
      id: 1, name: "Leche", quantity: 2, userId: 1,
    }),
    addInventoryItem: vi.fn().mockResolvedValue({ id: 7 }),
    updateInventoryItem: vi.fn().mockResolvedValue({ id: 1 }),
    deleteInventoryItem: vi.fn().mockResolvedValue(true),
    // MealLogs
    getMealLogs: vi.fn().mockResolvedValue([]),
    createMealLog: vi.fn().mockResolvedValue({ id: 1 }),
    deleteMealLog: vi.fn().mockResolvedValue(true),
    // HealthMetrics
    createHealthMetric: vi.fn().mockResolvedValue({ id: 1 }),
    getHealthMetrics: vi.fn().mockResolvedValue([]),
    // Subscriptions
    getUserSubscription: vi.fn().mockResolvedValue(null),
    getUserById: vi.fn().mockResolvedValue({ id: 1, role: "user" }),
    getUsers: vi.fn().mockResolvedValue([]),
    updateUserRole: vi.fn().mockResolvedValue(true),
    // Notifications
    getMealReminders: vi.fn().mockResolvedValue([]),
    upsertMealReminder: vi.fn().mockResolvedValue({ action: "created" }),
    deleteMealReminder: vi.fn().mockResolvedValue(undefined),
    // Achievements
    getUserAchievements: vi.fn().mockResolvedValue([]),
    getUserPoints: vi.fn().mockResolvedValue({ totalPoints: 0 }),
    unlockAchievement: vi.fn().mockResolvedValue({ unlocked: false }),
    hasAchievement: vi.fn().mockResolvedValue(false),
    getTotalMealLogs: vi.fn().mockResolvedValue(0),
    getDistinctRecipesLogged: vi.fn().mockResolvedValue(0),
    getMealStreak: vi.fn().mockResolvedValue(0),
    getMealTypesLoggedToday: vi.fn().mockResolvedValue([]),
    getDb: vi.fn().mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            // Return a thenable array so `await select().from().where()` returns []
            const result: any[] = [{ id: 1, userId: 1, checked: false, customName: "Leche" }];
            (result as any).limit = vi.fn().mockResolvedValue([{ id: 1, userId: 1, checked: false, customName: "Leche" }]);
            (result as any).orderBy = vi.fn().mockResolvedValue([]);
            (result as any).then = (resolve: any) => Promise.resolve([]).then(resolve);
            return result;
          }),
          // For queries without where clause (e.g. getAll day parts)
          orderBy: vi.fn().mockResolvedValue([]),
          then: (resolve: any) => Promise.resolve([]).then(resolve),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({ insertId: 1 }) }),
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }) }),
      delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
    }),
  getMenuDayParts: vi.fn().mockResolvedValue([]),
  getSeededMenus: vi.fn().mockResolvedValue([]),
  getShoppingListItems: vi.fn().mockResolvedValue([]),
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

// ─── Menus ────────────────────────────────────────────────────────────────────
describe("menus", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.menus.list()).rejects.toThrow();
  });

  it("list returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.menus.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getById requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.menus.getById({ id: 1 })).rejects.toThrow();
  });

  it("getById returns menu for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.menus.getById({ id: 1 });
    expect(result).toHaveProperty("id", 1);
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.menus.create({
      name: "Mi Menú",
      startDate: "2026-04-01",
      endDate: "2026-04-07",
    })).rejects.toThrow();
  });

  it("create succeeds with valid data", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.menus.create({
      name: "Menú Semana Santa",
      startDate: "2026-04-01",
      endDate: "2026-04-07",
    });
    expect(result).toBeDefined();
  });

  it("create rejects name shorter than 2 chars", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.menus.create({
      name: "A",
      startDate: "2026-04-01",
      endDate: "2026-04-07",
    })).rejects.toThrow();
  });

  it("create rejects name longer than 80 chars", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.menus.create({
      name: "A".repeat(81),
      startDate: "2026-04-01",
      endDate: "2026-04-07",
    })).rejects.toThrow();
  });

  it("create rejects invalid date format", async () => {
    const caller = appRouter.createCaller(authCtx());
    await expect(caller.menus.create({
      name: "Mi Menú",
      startDate: "01/04/2026",
      endDate: "07/04/2026",
    })).rejects.toThrow();
  });

  it("update requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.menus.update({ id: 1, name: "Updated" })).rejects.toThrow();
  });

  it("update succeeds with valid data", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.menus.update({ id: 1, name: "Menú Actualizado" });
    expect(result).toBeDefined();
  });

  it("delete requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.menus.delete({ id: 1 })).rejects.toThrow();
  });

  it("delete succeeds for menu owner", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.menus.delete({ id: 1 });
    expect(result).toBeDefined();
  });

  it("setActive requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.menus.setActive({ menuId: 1 })).rejects.toThrow();
  });

  it("setActive succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.menus.setActive({ menuId: 1 });
    expect(result).toBeDefined();
  });

  it("getActive requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.menus.getActive()).rejects.toThrow();
  });

  it("rename requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.menus.rename({ id: 1, name: "Nuevo Nombre" })).rejects.toThrow();
  });

  it("rename succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.menus.rename({ id: 1, name: "Menú Renombrado" });
    expect(result).toBeDefined();
  });

  it("library is publicly accessible", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const result = await caller.menus.library({});
    expect(result).toBeDefined();
  });

  it("saveFromLibrary requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.menus.saveFromLibrary({ menuId: 1 })).rejects.toThrow();
  });

  it("updateStartDate requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.menus.updateStartDate({
      menuId: 1,
      startDate: "2026-04-01",
    })).rejects.toThrow();
  });

  it("updateStartDate succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.menus.updateStartDate({
      menuId: 1,
      startDate: "2026-04-01",
    });
    expect(result).toBeDefined();
  });
});

// ─── Shopping Lists ───────────────────────────────────────────────────────────
describe("shoppingLists", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.shoppingLists.list()).rejects.toThrow();
  });

  it("list returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.shoppingLists.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getById requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.shoppingLists.getById({ id: 1 })).rejects.toThrow();
  });

  it("getById returns list for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.shoppingLists.getById({ id: 1 });
    expect(result).toHaveProperty("id", 1);
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.shoppingLists.create({ name: "Lista Test" })).rejects.toThrow();
  });

  it("create succeeds with valid name", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.shoppingLists.create({ name: "Lista de la Semana" });
    expect(result).toBeDefined();
  });

  it("delete requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.shoppingLists.delete({ id: 1 })).rejects.toThrow();
  });

  it("delete succeeds for list owner", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.shoppingLists.delete({ id: 1 });
    expect(result).toBeDefined();
  });

  it("addItem requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.shoppingLists.addItem({
      shoppingListId: 1,
      customName: "Tomates",
      amount: 2,
    })).rejects.toThrow();
  });

  it("addItem succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.shoppingLists.addItem({
      shoppingListId: 1,
      customName: "Tomates",
      amount: 2,
    });
    expect(result).toBeDefined();
  });

  it("toggleItem requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.shoppingLists.toggleItem({ id: 1 })).rejects.toThrow();
  });

  it("toggleItem returns updated item", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.shoppingLists.toggleItem({ id: 1 });
    expect(result).toBeDefined();
  });

  it("removeItem requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.shoppingLists.removeItem({ id: 1 })).rejects.toThrow();
  });

  it("generateFromMenu requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.shoppingLists.generateFromMenu({ menuId: 1 })).rejects.toThrow();
  });

  it("generateFromMenu succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.shoppingLists.generateFromMenu({ menuId: 1 });
    expect(result).toBeDefined();
  });
});

// ─── Inventory ────────────────────────────────────────────────────────────────
describe("inventory", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.inventory.list()).rejects.toThrow();
  });

  it("list returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.inventory.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("add requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.inventory.add({
      customName: "Leche",
      amount: 1,
    })).rejects.toThrow();
  });

  it("add succeeds with valid data", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.inventory.add({
      customName: "Leche",
      amount: 1,
    });
    expect(result).toBeDefined();
  });

  it("update requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.inventory.update({ id: 1, amount: 2 })).rejects.toThrow();
  });

  it("update succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.inventory.update({ id: 1, amount: 3 });
    expect(result).toBeDefined();
  });

  it("remove requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.inventory.remove({ id: 1 })).rejects.toThrow();
  });

  it("remove succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.inventory.remove({ id: 1 });
    expect(result).toBeDefined();
  });

  it("getExpiringItems requires authentication", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(caller.inventory.getExpiringItems({ days: 7 })).rejects.toThrow();
  });

  it("getExpiringItems returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(authCtx());
    const result = await caller.inventory.getExpiringItems({ days: 7 });
    expect(Array.isArray(result)).toBe(true);
  });
});
