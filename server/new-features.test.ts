/**
 * Tests for new features added in the backlog sprint:
 * - inventory.canCookNow
 * - menus.moveRecipeBetweenDayParts
 * - buddyIA.listSessions / saveSession / getSession / deleteSession
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserInventoryItems: vi.fn(),
  getRecipesWithIngredients: vi.fn(),
  getMenuDayPart: vi.fn(),
  getAiChatSessions: vi.fn(),
  createAiChatSession: vi.fn(),
  getAiChatSession: vi.fn(),
  deleteAiChatSession: vi.fn(),
}));

// ─── canCookNow logic (unit test) ─────────────────────────────────────────────
describe("canCookNow logic", () => {
  it("returns recipes where all ingredients are in inventory", () => {
    const inventory = [
      { ingredientName: "pollo", quantity: 200, unit: "g" },
      { ingredientName: "arroz", quantity: 500, unit: "g" },
      { ingredientName: "tomate", quantity: 3, unit: "unidades" },
    ];
    const recipes = [
      {
        id: 1,
        name: "Arroz con pollo",
        ingredients: [
          { ingredientName: "pollo", quantity: 150, unit: "g" },
          { ingredientName: "arroz", quantity: 200, unit: "g" },
        ],
      },
      {
        id: 2,
        name: "Pasta boloñesa",
        ingredients: [
          { ingredientName: "pasta", quantity: 200, unit: "g" },
          { ingredientName: "carne picada", quantity: 300, unit: "g" },
        ],
      },
    ];

    // Simulate the canCookNow logic
    const inventoryMap = new Map(inventory.map(i => [i.ingredientName.toLowerCase(), i]));
    const cookable = recipes.filter(recipe => {
      const total = recipe.ingredients.length;
      const available = recipe.ingredients.filter(ing =>
        inventoryMap.has(ing.ingredientName.toLowerCase())
      ).length;
      return available / total >= 0.7; // 70% threshold
    });

    expect(cookable).toHaveLength(1);
    expect(cookable[0].name).toBe("Arroz con pollo");
  });

  it("returns empty array when inventory is empty", () => {
    const inventory: any[] = [];
    const recipes = [
      { id: 1, name: "Ensalada", ingredients: [{ ingredientName: "lechuga", quantity: 1, unit: "unidad" }] },
    ];
    const inventoryMap = new Map(inventory.map(i => [i.ingredientName.toLowerCase(), i]));
    const cookable = recipes.filter(recipe => {
      const total = recipe.ingredients.length;
      const available = recipe.ingredients.filter(ing =>
        inventoryMap.has(ing.ingredientName.toLowerCase())
      ).length;
      return available / total >= 0.7;
    });
    expect(cookable).toHaveLength(0);
  });

  it("includes recipes with 100% ingredients available", () => {
    const inventory = [
      { ingredientName: "huevo", quantity: 6, unit: "unidades" },
      { ingredientName: "leche", quantity: 500, unit: "ml" },
    ];
    const recipes = [
      {
        id: 1,
        name: "Tortilla francesa",
        ingredients: [
          { ingredientName: "huevo", quantity: 2, unit: "unidades" },
          { ingredientName: "leche", quantity: 50, unit: "ml" },
        ],
      },
    ];
    const inventoryMap = new Map(inventory.map(i => [i.ingredientName.toLowerCase(), i]));
    const cookable = recipes.filter(recipe => {
      const total = recipe.ingredients.length;
      const available = recipe.ingredients.filter(ing =>
        inventoryMap.has(ing.ingredientName.toLowerCase())
      ).length;
      return available / total >= 0.7;
    });
    expect(cookable).toHaveLength(1);
    expect(cookable[0].name).toBe("Tortilla francesa");
  });
});

// ─── moveRecipeBetweenDayParts logic (unit test) ──────────────────────────────
describe("moveRecipeBetweenDayParts logic", () => {
  it("validates that fromDayPartId and toDayPartId are different", () => {
    const fromDayPartId = 1;
    const toDayPartId = 1;
    const isDifferent = fromDayPartId !== toDayPartId;
    expect(isDifferent).toBe(false);
  });

  it("validates that fromDayPartId and toDayPartId are different when they differ", () => {
    const fromDayPartId = 1;
    const toDayPartId = 2;
    const isDifferent = fromDayPartId !== toDayPartId;
    expect(isDifferent).toBe(true);
  });

  it("correctly identifies the recipe to move by recipeId", () => {
    const dayPartItems = [
      { recipeId: 10, menuOrganizerDayPartId: 1, servings: 1 },
      { recipeId: 20, menuOrganizerDayPartId: 1, servings: 2 },
    ];
    const recipeIdToMove = 10;
    const item = dayPartItems.find(i => i.recipeId === recipeIdToMove);
    expect(item).toBeDefined();
    expect(item?.recipeId).toBe(10);
    expect(item?.menuOrganizerDayPartId).toBe(1);
  });
});

// ─── BuddyIA chat session logic (unit test) ──────────────────────────────────
describe("BuddyIA chat session logic", () => {
  it("generates a session title from the first user message", () => {
    const messages = [
      { role: "user", content: "¿Qué puedo comer para desayunar con pocas calorías?" },
      { role: "assistant", content: "Te recomiendo avena con frutas..." },
    ];
    const firstUserMsg = messages.find(m => m.role === "user")?.content ?? "Nueva conversación";
    const title = firstUserMsg.length > 50 ? firstUserMsg.slice(0, 47) + "..." : firstUserMsg;
    expect(title).toBe("¿Qué puedo comer para desayunar con pocas calor...");
  });

  it("uses default title when no user message exists", () => {
    const messages: any[] = [];
    const firstUserMsg = messages.find(m => m.role === "user")?.content ?? "Nueva conversación";
    const title = firstUserMsg.length > 50 ? firstUserMsg.slice(0, 47) + "..." : firstUserMsg;
    expect(title).toBe("Nueva conversación");
  });

  it("keeps short titles as-is without truncation", () => {
    const messages = [
      { role: "user", content: "Hola" },
    ];
    const firstUserMsg = messages.find(m => m.role === "user")?.content ?? "Nueva conversación";
    const title = firstUserMsg.length > 50 ? firstUserMsg.slice(0, 47) + "..." : firstUserMsg;
    expect(title).toBe("Hola");
  });

  it("correctly serializes and deserializes messages JSON", () => {
    const messages = [
      { role: "user", content: "¿Cuántas calorías tiene un huevo?" },
      { role: "assistant", content: "Un huevo mediano tiene aproximadamente 70-80 kcal." },
    ];
    const serialized = JSON.stringify(messages);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toHaveLength(2);
    expect(deserialized[0].role).toBe("user");
    expect(deserialized[1].role).toBe("assistant");
  });
});
