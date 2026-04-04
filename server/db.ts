import { and, desc, eq, gte, ilike, inArray, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool as mysqlCreatePool } from "mysql2/promise";
import type { Pool as MySQLPool } from "mysql2/promise";
import {
  allergies,
  buddyMakers,
  dayParts,
  dietRestrictions,
  foodCategories,
  ingredientAllergies,
  ingredients,
  InsertIngredient,
  InsertMealLog,
  InsertMenuOrganizer,
  InsertRecipe,
  InsertRecipeIngredient,
  InsertRecipeStep,
  InsertShoppingList,
  InsertShoppingListItem,
  InsertUser,
  InsertUserHealthMetric,
  InsertUserInventoryItem,
  mealLogs,
  measures,
  menuOrganizerDayPartRecipes,
  menuOrganizerDayParts,
  menuOrganizers,
  recipeAllergies,
  recipeDietRestrictions,
  recipeFoodCategories,
  recipeIngredients,
  recipeSteps,
  recipes,
  shoppingListItems,
  shoppingLists,
  storageLocations,
  userAllergies,
  userBannedIngredients,
  userDietRestrictions,
  userFavoriteRecipes,
  userFoodCategories,
  userHealthMetrics,
  userInventoryItems,
  userMedicalProfiles,
  userPreferences,
  userProfiles,
  users,
  userSubscriptions,
  mealReminders,
  userAchievements,
  userPoints,
  roleRequests,
  RoleRequest,
  InsertRoleRequest,
  complements,
  complementLogs,
  recipeLikes,
  menuComplements,
  pantryStock,
  InsertPantryStock,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: MySQLPool | null = null;

function buildPool(): MySQLPool {
  const pool = mysqlCreatePool({
    uri: process.env.DATABASE_URL!,
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });
  // When a connection in the pool dies, reset so next call recreates the pool
  pool.on("connection", (conn) => {
    conn.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ECONNRESET" || err.code === "PROTOCOL_CONNECTION_LOST") {
        console.warn("[Database] Connection lost, will reconnect on next request:", err.code);
        _db = null;
        _pool = null;
      }
    });
  });
  return pool;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      if (!_pool) {
        _pool = buildPool();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _db = drizzle(_pool as any);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

// =============================================================================
// USERS
// =============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const fields = ["name", "email", "loginMethod", "phone", "imageUrl"] as const;
  for (const f of fields) {
    const v = user[f];
    if (v !== undefined) {
      (values as Record<string, unknown>)[f] = v ?? null;
      updateSet[f] = v ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

// =============================================================================
// USER PROFILES
// =============================================================================

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserProfile(userId: number, data: Omit<typeof userProfiles.$inferInsert, "userId" | "id">) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(userProfiles)
    .values({ ...data, userId })
    .onDuplicateKeyUpdate({ set: data });
}

export async function getUserMedicalProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userMedicalProfiles).where(eq(userMedicalProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserMedicalProfile(userId: number, data: Omit<typeof userMedicalProfiles.$inferInsert, "userId" | "id">) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(userMedicalProfiles)
    .values({ ...data, userId })
    .onDuplicateKeyUpdate({ set: data });
}

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserPreferences(userId: number, data: Omit<typeof userPreferences.$inferInsert, "userId" | "id">) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(userPreferences)
    .values({ ...data, userId })
    .onDuplicateKeyUpdate({ set: data });
}

// =============================================================================
// CATALOGS
// =============================================================================

export async function getAllAllergies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(allergies).orderBy(allergies.nameEs);
}

export async function getAllDietRestrictions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dietRestrictions).orderBy(dietRestrictions.nameEs);
}

export async function getAllFoodCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(foodCategories).orderBy(foodCategories.nameEs);
}

export async function getAllMeasures() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(measures).orderBy(measures.nameEs);
}

export async function getAllDayParts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dayParts).orderBy(dayParts.order);
}

export async function getDayPartIdByName(name: string): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  const result = await db.select().from(dayParts)
    .where(or(eq(dayParts.apiParam, name), eq(dayParts.nameEs, name), eq(dayParts.nameEn ?? dayParts.apiParam, name)))
    .limit(1);
  return result[0]?.id ?? 1;
}

export async function createMenuDayPart(menuOrganizerId: number, dayPartId: number, date: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(menuOrganizerDayParts).values({ menuOrganizerId, dayPartId, date: new Date(date) } as any);
  return (result as any).insertId ?? 0;
}

export async function getAllStorageLocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storageLocations).orderBy(storageLocations.nameEs);
}

// User allergies/restrictions
export async function getUserAllergies(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ allergy: allergies })
    .from(userAllergies)
    .innerJoin(allergies, eq(userAllergies.allergyId, allergies.id))
    .where(eq(userAllergies.userId, userId));
}

export async function setUserAllergies(userId: number, allergyIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userAllergies).where(eq(userAllergies.userId, userId));
  if (allergyIds.length > 0) {
    await db.insert(userAllergies).values(allergyIds.map((id) => ({ userId, allergyId: id })));
  }
}

export async function getUserDietRestrictions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ restriction: dietRestrictions })
    .from(userDietRestrictions)
    .innerJoin(dietRestrictions, eq(userDietRestrictions.dietRestrictionId, dietRestrictions.id))
    .where(eq(userDietRestrictions.userId, userId));
}

export async function setUserDietRestrictions(userId: number, restrictionIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userDietRestrictions).where(eq(userDietRestrictions.userId, userId));
  if (restrictionIds.length > 0) {
    await db.insert(userDietRestrictions).values(restrictionIds.map((id) => ({ userId, dietRestrictionId: id })));
  }
}

export async function getUserFoodCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ category: foodCategories })
    .from(userFoodCategories)
    .innerJoin(foodCategories, eq(userFoodCategories.foodCategoryId, foodCategories.id))
    .where(eq(userFoodCategories.userId, userId));
}

export async function setUserFoodCategories(userId: number, categoryIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userFoodCategories).where(eq(userFoodCategories.userId, userId));
  if (categoryIds.length > 0) {
    await db.insert(userFoodCategories).values(categoryIds.map((id) => ({ userId, foodCategoryId: id })));
  }
}

// =============================================================================
// INGREDIENTS
// =============================================================================

export async function searchIngredients(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ingredients)
    .where(like(ingredients.nameEs, `%${query}%`))
    .limit(limit)
    .orderBy(ingredients.nameEs);
}

export async function getIngredientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ingredients).where(eq(ingredients.id, id)).limit(1);
  return result[0];
}

export async function createIngredient(data: InsertIngredient) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(ingredients).values(data);
  return result[0];
}

export async function updateIngredient(id: number, data: Partial<InsertIngredient>) {
  const db = await getDb();
  if (!db) return;
  await db.update(ingredients).set(data).where(eq(ingredients.id, id));
}

export async function deleteIngredient(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(ingredients).where(eq(ingredients.id, id));
}

export async function getAllIngredients(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ingredients).limit(limit).offset(offset).orderBy(ingredients.nameEs);
}

// =============================================================================
// RECIPES
// =============================================================================

export async function getRecipes(params: {
  userId?: number;
  search?: string;
  categoryIds?: number[];
  allergyIds?: number[];
  restrictionIds?: number[];
  difficulty?: string;
  maxTime?: number;
  isPublic?: boolean;
  mealTime?: string;
  tag?: string;
  buddyMakerId?: number;
  isSeeded?: boolean;
  excludeUserAllergens?: boolean;
  currentUserId?: number;
  cuisineType?: string;
  cookingMethod?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const { userId, search, isPublic, limit = 20, offset = 0 } = params;

  const conditions = [eq(recipes.active, true)];
  if (userId) conditions.push(eq(recipes.userId, userId));
  if (isPublic !== undefined) conditions.push(eq(recipes.isPublic, isPublic));
  if (search) {
    // Full-text search across name, description, ingredientsJson and tags
    conditions.push(
      or(
        like(recipes.name, `%${search}%`),
        like(recipes.description, `%${search}%`),
        like(recipes.ingredientsJson, `%${search}%`),
        like(recipes.tags, `%${search}%`)
      )!
    );
  }
  if (params.difficulty) conditions.push(eq(recipes.difficulty, params.difficulty as any));
  if (params.maxTime) {
    conditions.push(lte(sql`(${recipes.preparationTime} + ${recipes.cookTime})`, params.maxTime));
  }
  if (params.mealTime && params.mealTime !== 'cualquiera') {
    conditions.push(eq(recipes.mealTime, params.mealTime as any));
  }
  if (params.buddyMakerId) conditions.push(eq(recipes.buddyMakerId, params.buddyMakerId));
  if (params.isSeeded !== undefined) conditions.push(eq(recipes.isSeeded, params.isSeeded));
  if (params.tag) conditions.push(like(recipes.tags, `%${params.tag}%`));
  if (params.cuisineType) conditions.push(eq(recipes.cuisineType, params.cuisineType));
  if (params.cookingMethod) conditions.push(eq(recipes.cookingMethod, params.cookingMethod));

  // Get user's allergies to filter out recipes with matching allergens
  let userAllergenNames: string[] = [];
  if (params.excludeUserAllergens && params.currentUserId) {
    const userAllergyRows = await db
      .select({ allergyName: allergies.nameEs })
      .from(userAllergies)
      .innerJoin(allergies, eq(userAllergies.allergyId, allergies.id))
      .where(eq(userAllergies.userId, params.currentUserId));
    userAllergenNames = userAllergyRows.map(r => (r.allergyName || '').toLowerCase());
  }

  const fetchLimit = userAllergenNames.length > 0 ? limit * 3 : limit;
  const rows = await db
    .select()
    .from(recipes)
    .where(and(...conditions))
    .limit(fetchLimit)
    .offset(offset)
    .orderBy(desc(recipes.createdAt));

  if (userAllergenNames.length > 0) {
    const filtered = rows.filter(r => {
      try {
        const recipeAllergens: string[] = JSON.parse(r.allergens || '[]');
        return !recipeAllergens.some(a => userAllergenNames.includes(a.toLowerCase()));
      } catch {
        return true;
      }
    });
    return filtered.slice(0, limit);
  }

  return rows;
}

export async function searchRecipeSuggestions(query: string, limit = 8) {
  const db = await getDb();
  if (!db || !query.trim()) return [];
  const rows = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      imageUrl: recipes.imageUrl,
      caloriesPerServing: recipes.caloriesPerServing,
      mealTime: recipes.mealTime,
      cuisineType: recipes.cuisineType,
      cookingMethod: recipes.cookingMethod,
    })
    .from(recipes)
    .where(
      and(
        eq(recipes.active, true),
        eq(recipes.isPublic, true),
        or(
          like(recipes.name, `%${query}%`),
          like(recipes.description, `%${query}%`),
          like(recipes.ingredientsJson, `%${query}%`)
        )!
      )
    )
    .limit(limit)
    .orderBy(desc(recipes.createdAt));
  return rows;
}

export async function getRecipeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(recipes).where(and(eq(recipes.id, id), eq(recipes.active, true))).limit(1);
  return result[0];
}

export async function getRecipeIngredients(recipeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: recipeIngredients.id,
      recipeId: recipeIngredients.recipeId,
      ingredientId: recipeIngredients.ingredientId,
      measureId: recipeIngredients.measureId,
      amount: recipeIngredients.amount,
      optional: recipeIngredients.optional,
      notes: recipeIngredients.notes,
      order: recipeIngredients.order,
      ingredient: ingredients,
      measure: measures,
    })
    .from(recipeIngredients)
    .leftJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .leftJoin(measures, eq(recipeIngredients.measureId, measures.id))
    .where(eq(recipeIngredients.recipeId, recipeId))
    .orderBy(recipeIngredients.order);
}

export async function getRecipeSteps(recipeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, recipeId)).orderBy(recipeSteps.stepNumber);
}

export async function getRecipeCategories(recipeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ category: foodCategories })
    .from(recipeFoodCategories)
    .innerJoin(foodCategories, eq(recipeFoodCategories.foodCategoryId, foodCategories.id))
    .where(eq(recipeFoodCategories.recipeId, recipeId));
}

export async function getRecipeAllergies(recipeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ allergy: allergies })
    .from(recipeAllergies)
    .innerJoin(allergies, eq(recipeAllergies.allergyId, allergies.id))
    .where(eq(recipeAllergies.recipeId, recipeId));
}

export async function createRecipe(data: InsertRecipe) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(recipes).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateRecipe(id: number, data: Partial<InsertRecipe>) {
  const db = await getDb();
  if (!db) return;
  await db.update(recipes).set(data).where(eq(recipes.id, id));
}

export async function deleteRecipe(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(recipes).set({ active: false, deletedAt: new Date() }).where(eq(recipes.id, id));
}

export async function addRecipeIngredient(data: InsertRecipeIngredient) {
  const db = await getDb();
  if (!db) return;
  await db.insert(recipeIngredients).values(data).onDuplicateKeyUpdate({ set: data });
}

export async function deleteRecipeIngredient(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(recipeIngredients).where(eq(recipeIngredients.id, id));
}

export async function addRecipeStep(data: InsertRecipeStep) {
  const db = await getDb();
  if (!db) return;
  await db.insert(recipeSteps).values(data).onDuplicateKeyUpdate({ set: data });
}

export async function deleteRecipeStep(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(recipeSteps).where(eq(recipeSteps.id, id));
}

export async function setRecipeCategories(recipeId: number, categoryIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(recipeFoodCategories).where(eq(recipeFoodCategories.recipeId, recipeId));
  if (categoryIds.length > 0) {
    await db.insert(recipeFoodCategories).values(categoryIds.map((id) => ({ recipeId, foodCategoryId: id })));
  }
}

export async function setRecipeAllergies(recipeId: number, allergyIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(recipeAllergies).where(eq(recipeAllergies.recipeId, recipeId));
  if (allergyIds.length > 0) {
    await db.insert(recipeAllergies).values(allergyIds.map((id) => ({ recipeId, allergyId: id })));
  }
}

export async function setRecipeDietRestrictions(recipeId: number, restrictionIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(recipeDietRestrictions).where(eq(recipeDietRestrictions.recipeId, recipeId));
  if (restrictionIds.length > 0) {
    await db.insert(recipeDietRestrictions).values(restrictionIds.map((id) => ({ recipeId, dietRestrictionId: id })));
  }
}

export async function toggleFavoriteRecipe(userId: number, recipeId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select()
    .from(userFavoriteRecipes)
    .where(and(eq(userFavoriteRecipes.userId, userId), eq(userFavoriteRecipes.recipeId, recipeId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(userFavoriteRecipes).where(and(eq(userFavoriteRecipes.userId, userId), eq(userFavoriteRecipes.recipeId, recipeId)));
    return false;
  } else {
    await db.insert(userFavoriteRecipes).values({ userId, recipeId });
    return true;
  }
}

export async function getFavoriteRecipes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ recipe: recipes })
    .from(userFavoriteRecipes)
    .innerJoin(recipes, eq(userFavoriteRecipes.recipeId, recipes.id))
    .where(and(eq(userFavoriteRecipes.userId, userId), eq(recipes.active, true)))
    .orderBy(desc(userFavoriteRecipes.createdAt));
}

export async function isRecipeFavorite(userId: number, recipeId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(userFavoriteRecipes)
    .where(and(eq(userFavoriteRecipes.userId, userId), eq(userFavoriteRecipes.recipeId, recipeId)))
    .limit(1);
  return result.length > 0;
}

// =============================================================================
// MENU ORGANIZERS
// =============================================================================

export async function getMenuOrganizers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuOrganizers).where(eq(menuOrganizers.userId, userId)).orderBy(desc(menuOrganizers.createdAt));
}

export async function getMenuOrganizerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(menuOrganizers).where(eq(menuOrganizers.id, id)).limit(1);
  return result[0];
}

export async function createMenuOrganizer(data: InsertMenuOrganizer) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(menuOrganizers).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateMenuOrganizer(id: number, data: Partial<InsertMenuOrganizer>) {
  const db = await getDb();
  if (!db) return;
  await db.update(menuOrganizers).set(data).where(eq(menuOrganizers.id, id));
}

export async function deleteMenuOrganizer(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(menuOrganizers).where(eq(menuOrganizers.id, id));
}

export async function getMenuDayParts(menuOrganizerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      dayPart: menuOrganizerDayParts,
      dayPartInfo: dayParts,
    })
    .from(menuOrganizerDayParts)
    .leftJoin(dayParts, eq(menuOrganizerDayParts.dayPartId, dayParts.id))
    .where(eq(menuOrganizerDayParts.menuOrganizerId, menuOrganizerId))
    .orderBy(menuOrganizerDayParts.date, menuOrganizerDayParts.dayNumber);
}

export async function addRecipeToMenuDayPart(menuOrganizerDayPartId: number, recipeId: number, servings = 1) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(menuOrganizerDayPartRecipes)
    .values({ menuOrganizerDayPartId, recipeId, servings })
    .onDuplicateKeyUpdate({ set: { servings } });
}

export async function removeRecipeFromMenuDayPart(menuOrganizerDayPartId: number, recipeId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(menuOrganizerDayPartRecipes)
    .where(and(eq(menuOrganizerDayPartRecipes.menuOrganizerDayPartId, menuOrganizerDayPartId), eq(menuOrganizerDayPartRecipes.recipeId, recipeId)));
}

export async function getMenuDayPartRecipes(menuOrganizerDayPartId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ menuRecipe: menuOrganizerDayPartRecipes, recipe: recipes })
    .from(menuOrganizerDayPartRecipes)
    .innerJoin(recipes, eq(menuOrganizerDayPartRecipes.recipeId, recipes.id))
    .where(eq(menuOrganizerDayPartRecipes.menuOrganizerDayPartId, menuOrganizerDayPartId));
}

// =============================================================================
// SHOPPING LISTS
// =============================================================================

export async function getShoppingLists(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shoppingLists).where(eq(shoppingLists.userId, userId)).orderBy(desc(shoppingLists.createdAt));
}

export async function getShoppingListById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(shoppingLists).where(eq(shoppingLists.id, id)).limit(1);
  return result[0];
}

export async function createShoppingList(data: InsertShoppingList) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(shoppingLists).values(data);
  return { id: Number(result[0].insertId) };
}

export async function deleteShoppingList(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(shoppingLists).where(eq(shoppingLists.id, id));
}

export async function getShoppingListItems(shoppingListId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      item: shoppingListItems,
      ingredient: ingredients,
      measure: measures,
    })
    .from(shoppingListItems)
    .leftJoin(ingredients, eq(shoppingListItems.ingredientId, ingredients.id))
    .leftJoin(measures, eq(shoppingListItems.measureId, measures.id))
    .where(eq(shoppingListItems.shoppingListId, shoppingListId))
    .orderBy(shoppingListItems.category, shoppingListItems.order);
}

export async function addShoppingListItem(data: InsertShoppingListItem) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(shoppingListItems).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateShoppingListItem(id: number, data: Partial<InsertShoppingListItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(shoppingListItems).set(data).where(eq(shoppingListItems.id, id));
}

export async function deleteShoppingListItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(shoppingListItems).where(eq(shoppingListItems.id, id));
}

export async function toggleShoppingListItem(id: number) {
  const db = await getDb();
  if (!db) return;
  const item = await db.select().from(shoppingListItems).where(eq(shoppingListItems.id, id)).limit(1);
  if (item[0]) {
    await db.update(shoppingListItems).set({ checked: !item[0].checked }).where(eq(shoppingListItems.id, id));
  }
}

// =============================================================================
// INVENTORY
// =============================================================================

export async function getInventoryItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      item: userInventoryItems,
      ingredient: ingredients,
      measure: measures,
      storageLocation: storageLocations,
    })
    .from(userInventoryItems)
    .leftJoin(ingredients, eq(userInventoryItems.ingredientId, ingredients.id))
    .leftJoin(measures, eq(userInventoryItems.measureId, measures.id))
    .leftJoin(storageLocations, eq(userInventoryItems.storageLocationId, storageLocations.id))
    .where(eq(userInventoryItems.userId, userId))
    .orderBy(userInventoryItems.expirationDate);
}

export async function addInventoryItem(data: InsertUserInventoryItem) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userInventoryItems).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateInventoryItem(id: number, data: Partial<InsertUserInventoryItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(userInventoryItems).set(data).where(eq(userInventoryItems.id, id));
}

export async function deleteInventoryItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userInventoryItems).where(eq(userInventoryItems.id, id));
}

// =============================================================================
// MEAL LOGS
// =============================================================================

export async function getMealLogs(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(mealLogs.userId, userId)];
  if (startDate) conditions.push(sql`${mealLogs.logDate} >= ${startDate}`);
  if (endDate) conditions.push(sql`${mealLogs.logDate} <= ${endDate}`);
  return db
    .select({
      log: mealLogs,
      recipe: recipes,
      dayPart: dayParts,
    })
    .from(mealLogs)
    .leftJoin(recipes, eq(mealLogs.recipeId, recipes.id))
    .leftJoin(dayParts, eq(mealLogs.dayPartId, dayParts.id))
    .where(and(...conditions))
    .orderBy(desc(mealLogs.logDate));
}

export async function addMealLog(data: InsertMealLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(mealLogs).values(data);
  return { id: Number(result[0].insertId) };
}

export async function deleteMealLog(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(mealLogs).where(eq(mealLogs.id, id));
}

export async function getDailyNutritionSummary(userId: number, date: string) {
  const db = await getDb();
  if (!db) return null;
  const logs = await db.select().from(mealLogs).where(and(eq(mealLogs.userId, userId), sql`${mealLogs.logDate} = ${date}`));
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      proteins: acc.proteins + (log.proteins || 0),
      carbohydrates: acc.carbohydrates + (log.carbohydrates || 0),
      fats: acc.fats + (log.fats || 0),
    }),
    { calories: 0, proteins: 0, carbohydrates: 0, fats: 0 }
  );
}

export async function getMonthlyCalorieSummary(
  userId: number,
  year: number,
  month: number // 1-12
): Promise<Array<{ date: string; calories: number; hasLogs: boolean }>> {
  const db = await getDb();
  if (!db) return [];
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const rows = await db
    .select({
      logDate: mealLogs.logDate,
      calories: sql<number>`SUM(COALESCE(${mealLogs.calories}, 0))`,
      count: sql<number>`COUNT(*)`,
    })
    .from(mealLogs)
    .where(
      and(
        eq(mealLogs.userId, userId),
        sql`${mealLogs.logDate} >= ${startDate}`,
        sql`${mealLogs.logDate} <= ${endDate}`
      )
    )
    .groupBy(mealLogs.logDate);
  return rows.map((r) => ({
    date: typeof r.logDate === "string" ? r.logDate : new Date(r.logDate as Date).toISOString().split("T")[0],
    calories: Number(r.calories) || 0,
    hasLogs: Number(r.count) > 0,
  }));
}

// =============================================================================
// HEALTH METRICS
// =============================================================================

export async function getHealthMetrics(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userHealthMetrics)
    .where(eq(userHealthMetrics.userId, userId))
    .orderBy(desc(userHealthMetrics.recordedAt))
    .limit(limit);
}

export async function addHealthMetric(data: InsertUserHealthMetric) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userHealthMetrics).values(data);
  return { id: Number(result[0].insertId) };
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .orderBy(desc(userSubscriptions.createdAt))
    .limit(1);
  return result[0];
}

export async function upsertUserSubscription(userId: number, data: Partial<typeof userSubscriptions.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserSubscription(userId);
  if (existing) {
    await db.update(userSubscriptions).set(data).where(eq(userSubscriptions.id, existing.id));
  } else {
    await db.insert(userSubscriptions).values({ userId, ...data } as any);
  }
}

// =============================================================================
// ADMIN CATALOG MANAGEMENT
// =============================================================================

export async function createAllergy(data: typeof allergies.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(allergies).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateAllergy(id: number, data: Partial<typeof allergies.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(allergies).set(data).where(eq(allergies.id, id));
}

export async function deleteAllergy(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(allergies).where(eq(allergies.id, id));
}

export async function createDietRestriction(data: typeof dietRestrictions.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(dietRestrictions).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateDietRestriction(id: number, data: Partial<typeof dietRestrictions.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(dietRestrictions).set(data).where(eq(dietRestrictions.id, id));
}

export async function createFoodCategory(data: typeof foodCategories.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(foodCategories).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateFoodCategory(id: number, data: Partial<typeof foodCategories.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(foodCategories).set(data).where(eq(foodCategories.id, id));
}

export async function createMeasure(data: typeof measures.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(measures).values(data);
  return { id: Number(result[0].insertId) };
}

export async function createIngredientWithAllergies(data: InsertIngredient, allergyIds: number[]) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(ingredients).values(data);
  const ingredientId = Number(result[0].insertId);
  if (allergyIds.length > 0) {
    await db.insert(ingredientAllergies).values(allergyIds.map((allergyId) => ({ ingredientId, allergyId })));
  }
  return { id: ingredientId };
}

export async function seedCatalogs() {
  const db = await getDb();
  if (!db) return;

  // Seed allergies (30+ options covering EU 14 allergens + common intolerances)
  const allergyData = [
    // EU 14 allergens obligatorios
    { apiParam: "gluten", nameEs: "Gluten (trigo, cebada, centeno)", nameEn: "Gluten" },
    { apiParam: "lactose", nameEs: "Lactosa / Lácteos", nameEn: "Lactose / Dairy" },
    { apiParam: "nuts", nameEs: "Frutos secos (almendras, nueces, avellanas...)", nameEn: "Tree Nuts" },
    { apiParam: "eggs", nameEs: "Huevos", nameEn: "Eggs" },
    { apiParam: "fish", nameEs: "Pescado", nameEn: "Fish" },
    { apiParam: "shellfish", nameEs: "Crustáceos (gambas, cangrejos, langosta)", nameEn: "Crustaceans" },
    { apiParam: "soy", nameEs: "Soja", nameEn: "Soy" },
    { apiParam: "peanuts", nameEs: "Cacahuetes", nameEn: "Peanuts" },
    { apiParam: "sesame", nameEs: "Sésamo", nameEn: "Sesame" },
    { apiParam: "mustard", nameEs: "Mostaza", nameEn: "Mustard" },
    { apiParam: "celery", nameEs: "Apio", nameEn: "Celery" },
    { apiParam: "sulfites", nameEs: "Sulfitos / Dióxido de azufre", nameEn: "Sulfites" },
    { apiParam: "lupin", nameEs: "Altramuces", nameEn: "Lupin" },
    { apiParam: "molluscs", nameEs: "Moluscos (mejillones, almejas, pulpo)", nameEn: "Molluscs" },
    // Intolerancias comunes adicionales
    { apiParam: "wheat", nameEs: "Trigo (intolerancia específica)", nameEn: "Wheat" },
    { apiParam: "corn", nameEs: "Maíz", nameEn: "Corn" },
    { apiParam: "fructose", nameEs: "Fructosa", nameEn: "Fructose" },
    { apiParam: "histamine", nameEs: "Histamina", nameEn: "Histamine" },
    { apiParam: "fodmap", nameEs: "FODMAP (fermentables)", nameEn: "FODMAPs" },
    { apiParam: "nightshades", nameEs: "Solanáceas (tomate, pimiento, berenjena)", nameEn: "Nightshades" },
    { apiParam: "citrus", nameEs: "Cítricos (naranja, limón, pomelo)", nameEn: "Citrus" },
    { apiParam: "strawberries", nameEs: "Fresas / Frutos rojos", nameEn: "Strawberries / Berries" },
    { apiParam: "kiwi", nameEs: "Kiwi", nameEn: "Kiwi" },
    { apiParam: "peach", nameEs: "Melocotón / Frutas con hueso", nameEn: "Peach / Stone fruits" },
    { apiParam: "banana", nameEs: "Plátano", nameEn: "Banana" },
    { apiParam: "avocado", nameEs: "Aguacate", nameEn: "Avocado" },
    { apiParam: "garlic_onion", nameEs: "Ajo y cebolla", nameEn: "Garlic & Onion" },
    { apiParam: "alcohol", nameEs: "Alcohol", nameEn: "Alcohol" },
    { apiParam: "caffeine", nameEs: "Cafeína", nameEn: "Caffeine" },
    { apiParam: "chocolate", nameEs: "Chocolate / Cacao", nameEn: "Chocolate / Cacao" },
    { apiParam: "artificial_colors", nameEs: "Colorantes artificiales", nameEn: "Artificial colors" },
    { apiParam: "artificial_sweeteners", nameEs: "Edulcorantes artificiales", nameEn: "Artificial sweeteners" },
    { apiParam: "msg", nameEs: "Glutamato monosódico (MSG)", nameEn: "MSG" },
    { apiParam: "latex_fruit", nameEs: "Síndrome látex-fruta (aguacate, kiwi, plátano)", nameEn: "Latex-fruit syndrome" },
  ];
  for (const a of allergyData) {
    await db.insert(allergies).values(a).onDuplicateKeyUpdate({ set: { nameEs: a.nameEs } });
  }

  // Seed diet restrictions (expanded)
  const restrictionData = [
    { apiParam: "vegan", nameEs: "Vegano", nameEn: "Vegan" },
    { apiParam: "vegetarian", nameEs: "Vegetariano", nameEn: "Vegetarian" },
    { apiParam: "pescatarian", nameEs: "Pescetariano", nameEn: "Pescatarian" },
    { apiParam: "flexitarian", nameEs: "Flexitariano", nameEn: "Flexitarian" },
    { apiParam: "keto", nameEs: "Keto / Cetogénico", nameEn: "Keto" },
    { apiParam: "paleo", nameEs: "Paleo", nameEn: "Paleo" },
    { apiParam: "gluten_free", nameEs: "Sin gluten (celiacía)", nameEn: "Gluten free" },
    { apiParam: "dairy_free", nameEs: "Sin lácteos", nameEn: "Dairy free" },
    { apiParam: "low_carb", nameEs: "Bajo en carbohidratos", nameEn: "Low carb" },
    { apiParam: "low_fat", nameEs: "Bajo en grasas", nameEn: "Low fat" },
    { apiParam: "low_sodium", nameEs: "Bajo en sodio (hipertensión)", nameEn: "Low sodium" },
    { apiParam: "low_sugar", nameEs: "Bajo en azúcar (diabetes)", nameEn: "Low sugar" },
    { apiParam: "high_protein", nameEs: "Alto en proteína", nameEn: "High protein" },
    { apiParam: "high_fiber", nameEs: "Alto en fibra", nameEn: "High fiber" },
    { apiParam: "mediterranean", nameEs: "Mediterránea", nameEn: "Mediterranean" },
    { apiParam: "dash", nameEs: "Dieta DASH (hipertensión)", nameEn: "DASH diet" },
    { apiParam: "diabetic", nameEs: "Dieta para diabéticos", nameEn: "Diabetic diet" },
    { apiParam: "renal", nameEs: "Dieta renal (enfermedad renal)", nameEn: "Renal diet" },
    { apiParam: "fodmap_free", nameEs: "Sin FODMAP (colon irritable)", nameEn: "Low FODMAP" },
    { apiParam: "anti_inflammatory", nameEs: "Antiinflamatoria", nameEn: "Anti-inflammatory" },
    { apiParam: "halal", nameEs: "Halal", nameEn: "Halal" },
    { apiParam: "kosher", nameEs: "Kosher", nameEn: "Kosher" },
    { apiParam: "raw_food", nameEs: "Crudivegana / Raw food", nameEn: "Raw food" },
    { apiParam: "intermittent_fasting", nameEs: "Ayuno intermitente", nameEn: "Intermittent fasting" },
  ];
  for (const r of restrictionData) {
    await db.insert(dietRestrictions).values(r).onDuplicateKeyUpdate({ set: { nameEs: r.nameEs } });
  }

  // Seed food categories
  const categoryData = [
    { apiParam: "mediterranean", nameEs: "Mediterránea", nameEn: "Mediterranean" },
    { apiParam: "italian", nameEs: "Italiana", nameEn: "Italian" },
    { apiParam: "mexican", nameEs: "Mexicana", nameEn: "Mexican" },
    { apiParam: "asian", nameEs: "Asiática", nameEn: "Asian" },
    { apiParam: "american", nameEs: "Americana", nameEn: "American" },
    { apiParam: "spanish", nameEs: "Española", nameEn: "Spanish" },
    { apiParam: "french", nameEs: "Francesa", nameEn: "French" },
    { apiParam: "indian", nameEs: "India", nameEn: "Indian" },
    { apiParam: "japanese", nameEs: "Japonesa", nameEn: "Japanese" },
    { apiParam: "healthy", nameEs: "Saludable", nameEn: "Healthy" },
    { apiParam: "fast_food", nameEs: "Comida rápida", nameEn: "Fast food" },
    { apiParam: "desserts", nameEs: "Postres", nameEn: "Desserts" },
    { apiParam: "breakfast", nameEs: "Desayunos", nameEn: "Breakfast" },
    { apiParam: "salads", nameEs: "Ensaladas", nameEn: "Salads" },
    { apiParam: "soups", nameEs: "Sopas", nameEn: "Soups" },
    { apiParam: "grilled", nameEs: "A la parrilla", nameEn: "Grilled" },
    { apiParam: "baked", nameEs: "Al horno", nameEn: "Baked" },
    { apiParam: "smoothies", nameEs: "Batidos", nameEn: "Smoothies" },
  ];
  for (const c of categoryData) {
    await db.insert(foodCategories).values(c).onDuplicateKeyUpdate({ set: { nameEs: c.nameEs } });
  }

  // Seed measures
  const measureData = [
    { apiParam: "grams", nameEs: "Gramos", nameEn: "Grams", abbreviation: "g" },
    { apiParam: "kilograms", nameEs: "Kilogramos", nameEn: "Kilograms", abbreviation: "kg" },
    { apiParam: "milliliters", nameEs: "Mililitros", nameEn: "Milliliters", abbreviation: "ml" },
    { apiParam: "liters", nameEs: "Litros", nameEn: "Liters", abbreviation: "l" },
    { apiParam: "cups", nameEs: "Tazas", nameEn: "Cups", abbreviation: "taza" },
    { apiParam: "tablespoons", nameEs: "Cucharadas", nameEn: "Tablespoons", abbreviation: "cda" },
    { apiParam: "teaspoons", nameEs: "Cucharaditas", nameEn: "Teaspoons", abbreviation: "cdta" },
    { apiParam: "units", nameEs: "Unidades", nameEn: "Units", abbreviation: "ud" },
    { apiParam: "slices", nameEs: "Rebanadas", nameEn: "Slices", abbreviation: "reb" },
    { apiParam: "pinch", nameEs: "Pizca", nameEn: "Pinch", abbreviation: "pizca" },
    { apiParam: "bunch", nameEs: "Manojo", nameEn: "Bunch", abbreviation: "man" },
    { apiParam: "cloves", nameEs: "Dientes", nameEn: "Cloves", abbreviation: "dientes" },
  ];
  for (const m of measureData) {
    await db.insert(measures).values(m).onDuplicateKeyUpdate({ set: { nameEs: m.nameEs } });
  }

  // Seed day parts
  const dayPartData = [
    { apiParam: "breakfast", nameEs: "Desayuno", nameEn: "Breakfast", order: 1 },
    { apiParam: "mid_morning", nameEs: "Media mañana", nameEn: "Mid morning", order: 2 },
    { apiParam: "lunch", nameEs: "Comida", nameEn: "Lunch", order: 3 },
    { apiParam: "afternoon_snack", nameEs: "Merienda", nameEn: "Afternoon snack", order: 4 },
    { apiParam: "dinner", nameEs: "Cena", nameEn: "Dinner", order: 5 },
  ];
  for (const d of dayPartData) {
    await db.insert(dayParts).values(d).onDuplicateKeyUpdate({ set: { nameEs: d.nameEs } });
  }

  // Seed storage locations
  const storageData = [
    { apiParam: "fridge", nameEs: "Nevera", nameEn: "Fridge" },
    { apiParam: "freezer", nameEs: "Congelador", nameEn: "Freezer" },
    { apiParam: "pantry", nameEs: "Despensa", nameEn: "Pantry" },
    { apiParam: "counter", nameEs: "Encimera", nameEn: "Counter" },
    { apiParam: "cellar", nameEs: "Bodega", nameEn: "Cellar" },
  ];
  for (const s of storageData) {
    await db.insert(storageLocations).values(s).onDuplicateKeyUpdate({ set: { nameEs: s.nameEs } });
  }
}

export async function deleteDietRestriction(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(dietRestrictions).where(eq(dietRestrictions.id, id));
}

export async function deleteFoodCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(foodCategories).where(eq(foodCategories.id, id));
}

export async function deleteMeasure(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(measures).where(eq(measures.id, id));
}

export async function getAllRecipes(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recipes).where(eq(recipes.active, true)).limit(limit);
}

export async function getAllMenus(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuOrganizers).limit(limit);
}

// =============================================================================
// MENU LIBRARY (predefined seeded menus)
// =============================================================================

export async function getSeededMenus() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: menuOrganizers.id,
      name: menuOrganizers.name,
      objective: menuOrganizers.objective,
      goal: menuOrganizers.goal,
      dailyCalories: menuOrganizers.dailyCalories,
      difficulty: menuOrganizers.difficulty,
      dailyMealsCount: menuOrganizers.dailyMealsCount,
      persons: menuOrganizers.persons,
    })
    .from(menuOrganizers)
    .where(eq(menuOrganizers.isSeeded, true))
    .limit(100);
}

export async function getSeededMenuDetail(menuId: number) {
  const db = await getDb();
  if (!db) return null;
  const [menu] = await db
    .select()
    .from(menuOrganizers)
    .where(and(eq(menuOrganizers.id, menuId), eq(menuOrganizers.isSeeded, true)))
    .limit(1);
  if (!menu) return null;

  // Get day parts
  const dayPartsData = await db
    .select()
    .from(menuOrganizerDayParts)
    .where(eq(menuOrganizerDayParts.menuOrganizerId, menuId));

  // Get recipes for each day part
  const dayPartsWithRecipes = await Promise.all(
    dayPartsData.map(async (dp) => {
      const recipesData = await db
        .select({
          id: recipes.id,
          name: recipes.name,
          imageUrl: recipes.imageUrl,
          caloriesPerServing: recipes.caloriesPerServing,
          preparationTime: recipes.preparationTime,
          mealTime: recipes.mealTime,
          ingredientsJson: recipes.ingredientsJson,
        })
        .from(menuOrganizerDayPartRecipes)
        .innerJoin(recipes, eq(menuOrganizerDayPartRecipes.recipeId, recipes.id))
        .where(eq(menuOrganizerDayPartRecipes.menuOrganizerDayPartId, dp.id));
      return { ...dp, recipes: recipesData };
    })
  );

  return { ...menu, dayParts: dayPartsWithRecipes };
}

export async function copyMenuForUser(
  sourceMenuId: number,
  userId: number,
  persons: number,
  startDateStr?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const [sourceMenu] = await db
    .select()
    .from(menuOrganizers)
    .where(eq(menuOrganizers.id, sourceMenuId))
    .limit(1);
  if (!sourceMenu) throw new Error("Menu not found");

  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const newMenuInsert: InsertMenuOrganizer = {
    userId,
    name: sourceMenu.name,
    objective: sourceMenu.objective ?? undefined,
    goal: sourceMenu.goal ?? undefined,
    dailyCalories: sourceMenu.dailyCalories ?? undefined,
    difficulty: sourceMenu.difficulty ?? undefined,
    persons,
    isSeeded: false,
    isPublic: false,
    type: "weekly",
    dailyMealsCount: sourceMenu.dailyMealsCount ?? 5,
    startDate: startDate,
    endDate: endDate,
  };
  const [newMenuResult] = await db.insert(menuOrganizers).values(newMenuInsert);
  const newMenuId = (newMenuResult as any).insertId as number;

  // Copy day parts and their recipes
  const sourceDayParts = await db
    .select()
    .from(menuOrganizerDayParts)
    .where(eq(menuOrganizerDayParts.menuOrganizerId, sourceMenuId));

  for (const dp of sourceDayParts) {
    const [newDpResult] = await db.insert(menuOrganizerDayParts).values({
      menuOrganizerId: newMenuId,
      dayPartId: dp.dayPartId,
      date: dp.date ?? undefined,
      dayNumber: dp.dayNumber ?? undefined,
      mealNumber: dp.mealNumber ?? undefined,
      name: dp.name ?? undefined,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const newDpId = (newDpResult as any).insertId as number;

    const sourceRecipes = await db
      .select()
      .from(menuOrganizerDayPartRecipes)
      .where(eq(menuOrganizerDayPartRecipes.menuOrganizerDayPartId, dp.id));

    for (const r of sourceRecipes) {
      await db.insert(menuOrganizerDayPartRecipes).values({
        menuOrganizerDayPartId: newDpId,
        recipeId: r.recipeId,
        servings: r.servings ?? 1,
        createdAt: new Date(),
      }).onDuplicateKeyUpdate({ set: { servings: r.servings ?? 1 } });
    }
  }

  // Copy default complements (isDefault = true) from source menu
  const sourceComplements = await db
    .select()
    .from(menuComplements)
    .where(
      and(
        eq(menuComplements.menuOrganizerId, sourceMenuId),
        eq(menuComplements.isDefault, true)
      )
    );

  for (const c of sourceComplements) {
    await db.insert(menuComplements).values({
      menuOrganizerId: newMenuId,
      userId,
      complementId: c.complementId ?? undefined,
      customName: c.customName ?? undefined,
      emoji: c.emoji ?? "\u2615",
      mealTime: c.mealTime,
      quantity: c.quantity,
      unit: c.unit ?? "ud",
      calories: c.calories ?? undefined,
      notes: c.notes ?? undefined,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return { success: true, menuId: newMenuId };
}

// =============================================================================
// SHOPPING LIST FROM MENU
// =============================================================================

export async function generateShoppingListFromMenu(
  userId: number,
  menuId: number,
  persons: number,
  supermarket: string,
  listName?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Get all recipes in the menu
  const menuData = await db
    .select()
    .from(menuOrganizers)
    .where(eq(menuOrganizers.id, menuId))
    .limit(1);
  if (!menuData.length) throw new Error("Menu not found");

  const menu = menuData[0];

  // Get all day parts
  const dayPartsData = await db
    .select()
    .from(menuOrganizerDayParts)
    .where(eq(menuOrganizerDayParts.menuOrganizerId, menuId));

  // Collect all recipe IDs
  const allRecipeIds: number[] = [];
  for (const dp of dayPartsData) {
    const dpRecipes = await db
      .select({ recipeId: menuOrganizerDayPartRecipes.recipeId, servings: menuOrganizerDayPartRecipes.servings })
      .from(menuOrganizerDayPartRecipes)
      .where(eq(menuOrganizerDayPartRecipes.menuOrganizerDayPartId, dp.id));
    allRecipeIds.push(...dpRecipes.map((r) => r.recipeId));
  }

  // Get ingredients from all recipes (stored as JSON in recipes.ingredientsJson)
  const recipeData = await db
    .select({ id: recipes.id, name: recipes.name, ingredientsJson: recipes.ingredientsJson })
    .from(recipes)
    .where(inArray(recipes.id, allRecipeIds.length > 0 ? allRecipeIds : [-1]));

  // Aggregate ingredients across all recipes
  const ingredientMap = new Map<string, { name: string; amount: number; unit: string; category: string }>();

  for (const recipe of recipeData) {
    let ingredientsList: Array<{ name: string; amount?: any; unit?: string; category?: string }> = [];
    try {
      if (typeof recipe.ingredientsJson === "string") {
        ingredientsList = JSON.parse(recipe.ingredientsJson);
      } else if (Array.isArray(recipe.ingredientsJson)) {
        ingredientsList = recipe.ingredientsJson as any;
      }
    } catch {
      continue;
    }

    for (const ing of ingredientsList) {
      if (!ing.name) continue;
      const key = ing.name.toLowerCase().trim();
      const existing = ingredientMap.get(key);
      // Robustly parse amount: handle strings like "1 cucharadita", numbers, or missing values
      let rawAmount = ing.amount;
      let parsedAmount: number;
      if (typeof rawAmount === "number" && !isNaN(rawAmount) && rawAmount > 0) {
        parsedAmount = rawAmount;
      } else if (typeof rawAmount === "string") {
        // Extract the first number from strings like "1 cucharadita", "2-3", "1/2"
        const match = rawAmount.match(/([\d]+\.?[\d]*)/);
        parsedAmount = match ? parseFloat(match[1]) : 1;
        if (isNaN(parsedAmount) || parsedAmount <= 0) parsedAmount = 1;
      } else {
        parsedAmount = 1;
      }
      const scaledAmount = parsedAmount * persons;
      if (existing) {
        existing.amount += scaledAmount;
      } else {
        ingredientMap.set(key, {
          name: ing.name,
          amount: scaledAmount,
          unit: ing.unit || "unidad",
          category: ing.category || "Otros",
        });
      }
    }
  }

  // Create the shopping list
  const supermarketLabel = {
    general: "General",
    mercadona: "Mercadona",
    lidl: "Lidl",
    carrefour: "Carrefour",
    alcampo: "Alcampo",
    dia: "Día",
    el_corte_ingles: "El Corte Inglés",
  }[supermarket] || "General";

  const name = listName || `Lista de la compra - ${menu.name} (${supermarketLabel}, ${persons} ${persons === 1 ? "persona" : "personas"})`;

  const [newListResult] = await db.insert(shoppingLists).values({
    userId,
    name,
    menuOrganizerId: menuId,
    supermarket: supermarket as any,
    persons,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const newListId = (newListResult as any).insertId as number;

  // Insert items with commercial unit normalization
  const { normalizeToCommercialUnit } = await import("../shared/supermarketUnits");
  const items = Array.from(ingredientMap.values());
  for (const item of items) {
    const normalized = normalizeToCommercialUnit(item.name, Math.round(item.amount * 10) / 10, item.unit);
    // Build the display name with three cases:
    // 1. Exact match:   "Jamón serrano — 1 sobre (100 g)"
    // 2. Alias match:   "Jamón (jamon serrano) — 1 sobre (100 g)"
    // 3. Category fallback: "Polvo de unicornio — 1 unidad (~200 g) ≈similar"
    let displayName: string;
    if (normalized.hasCommercialUnit) {
      const nameDisplay = normalized.normalizedName
        ? `${item.name} (${normalized.normalizedName})`
        : item.name;
      displayName = `${nameDisplay} — ${normalized.label}`;
    } else if (normalized.isFallback) {
      displayName = `${item.name} — ${normalized.label} ≈similar`;
    } else {
      displayName = `${item.name} (${normalized.originalQty} ${normalized.originalUnit})`;
    }
    await db.insert(shoppingListItems).values({
      shoppingListId: newListId,
      customName: displayName,
      amount: normalized.quantity,
      category: item.category,
      checked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return { success: true, shoppingListId: newListId, itemCount: items.length, name };
}

// ---------------------------------------------------------------------------
// DELETE USER ACCOUNT
// ---------------------------------------------------------------------------
export async function deleteUserAccount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Delete junction/relation tables first
  await Promise.all([
    db.delete(userAllergies).where(eq(userAllergies.userId, userId)),
    db.delete(userDietRestrictions).where(eq(userDietRestrictions.userId, userId)),
    db.delete(userFoodCategories).where(eq(userFoodCategories.userId, userId)),
    db.delete(userFavoriteRecipes).where(eq(userFavoriteRecipes.userId, userId)),
    db.delete(userInventoryItems).where(eq(userInventoryItems.userId, userId)),
    db.delete(mealLogs).where(eq(mealLogs.userId, userId)),
    db.delete(userHealthMetrics).where(eq(userHealthMetrics.userId, userId)),
    db.delete(userPreferences).where(eq(userPreferences.userId, userId)),
    db.delete(userProfiles).where(eq(userProfiles.userId, userId)),
    db.delete(userMedicalProfiles).where(eq(userMedicalProfiles.userId, userId)),
    db.delete(userSubscriptions).where(eq(userSubscriptions.userId, userId)),
    db.delete(userBannedIngredients).where(eq(userBannedIngredients.userId, userId)),
  ]);

  // Delete user-owned content
  await Promise.all([
    db.delete(recipes).where(eq(recipes.userId, userId)),
    db.delete(menuOrganizers).where(eq(menuOrganizers.userId, userId)),
    db.delete(shoppingLists).where(eq(shoppingLists.userId, userId)),
  ]);

  // Finally delete the user record
  await db.delete(users).where(eq(users.id, userId));
}

// ─── Meal Reminders ───────────────────────────────────────────────────────────

export async function getMealReminders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mealReminders).where(eq(mealReminders.userId, userId));
}

export async function upsertMealReminder(
  userId: number,
  mealType: string,
  time: string,
  enabled: boolean,
  daysMask: number,
): Promise<{ action: "created" | "updated" }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select({ id: mealReminders.id })
    .from(mealReminders)
    .where(and(eq(mealReminders.userId, userId), eq(mealReminders.mealType, mealType)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(mealReminders)
      .set({ time, enabled, daysMask, updatedAt: new Date() })
      .where(and(eq(mealReminders.userId, userId), eq(mealReminders.mealType, mealType)));
    return { action: "updated" };
  } else {
    await db.insert(mealReminders).values({ userId, mealType, time, enabled, daysMask });
    return { action: "created" };
  }
}

export async function deleteMealReminder(userId: number, mealType: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(mealReminders)
    .where(and(eq(mealReminders.userId, userId), eq(mealReminders.mealType, mealType)));
}

// =============================================================================
// ACHIEVEMENTS
// =============================================================================

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.unlockedAt));
}

export async function hasAchievement(userId: number, achievementId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(userAchievements)
    .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
    .limit(1);
  return rows.length > 0;
}

export async function unlockAchievement(userId: number, achievementId: string, points: number) {
  const db = await getDb();
  if (!db) return null;
  // Insert achievement (ignore if already exists due to unique constraint)
  try {
    await db.insert(userAchievements).values({ userId, achievementId, pointsAwarded: points });
    // Update user points
    await addUserPoints(userId, points);
    return { unlocked: true };
  } catch {
    return { unlocked: false }; // Already unlocked
  }
}

export async function getUserPoints(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function addUserPoints(userId: number, points: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserPoints(userId);
  if (existing) {
    const newTotal = existing.totalPoints + points;
    // Compute level from points (simple threshold system)
    const level = computeLevel(newTotal);
    await db
      .update(userPoints)
      .set({ totalPoints: newTotal, level })
      .where(eq(userPoints.userId, userId));
  } else {
    const level = computeLevel(points);
    await db.insert(userPoints).values({ userId, totalPoints: points, level });
  }
}

function computeLevel(points: number): number {
  const thresholds = [0, 50, 150, 350, 700, 1200, 2000, 3500, 5000];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (points >= thresholds[i]!) level = i + 1;
    else break;
  }
  return level;
}

export async function getTotalMealLogs(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(mealLogs)
    .where(eq(mealLogs.userId, userId));
  return Number(rows[0]?.count ?? 0);
}

export async function getDistinctRecipesLogged(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${mealLogs.recipeId})` })
    .from(mealLogs)
    .where(and(eq(mealLogs.userId, userId), sql`${mealLogs.recipeId} IS NOT NULL`));
  return Number(rows[0]?.count ?? 0);
}

export async function getMealTypesLoggedToday(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().split("T")[0];
  const rows = await db
    .select({ dayPartId: mealLogs.dayPartId })
    .from(mealLogs)
    .where(and(eq(mealLogs.userId, userId), sql`DATE(${mealLogs.logDate}) = ${today}`));
  const ids = rows.map((r) => r.dayPartId).filter((id): id is number => id !== null && id !== undefined);
  return Array.from(new Set(ids));
}

export async function getMealStreak(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const rows = await db
      .selectDistinct({ logDate: mealLogs.logDate })
      .from(mealLogs)
      .where(eq(mealLogs.userId, userId))
      .orderBy(desc(mealLogs.logDate));
    if (rows.length === 0) return 0;
    const dates = rows
      .map((r) => new Date(r.logDate).toISOString().split("T")[0])
      .sort()
      .reverse();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]!);
      const curr = new Date(dates[i]!);
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diffDays === 1) streak++;
      else break;
    }
    return streak;
  } catch {
    return 0;
  }
}

// =============================================================================
// ROLE REQUESTS (BuddyMaker / BuddyExpert)
// =============================================================================

export async function createRoleRequest(data: InsertRoleRequest): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(roleRequests).values(data);
  return (result as any).insertId as number;
}

export async function getRoleRequestByUserAndType(userId: number, roleType: "buddymaker" | "buddyexpert"): Promise<RoleRequest | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(roleRequests)
    .where(and(eq(roleRequests.userId, userId), eq(roleRequests.roleType, roleType)))
    .limit(1);
  return result[0];
}

export async function getRoleRequestsByUser(userId: number): Promise<RoleRequest[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roleRequests).where(eq(roleRequests.userId, userId));
}

export async function getAllRoleRequests(status?: "pending" | "approved" | "rejected"): Promise<RoleRequest[]> {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(roleRequests).where(eq(roleRequests.status, status)).orderBy(desc(roleRequests.createdAt));
  }
  return db.select().from(roleRequests).orderBy(desc(roleRequests.createdAt));
}

export async function updateRoleRequest(id: number, data: Partial<InsertRoleRequest>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(roleRequests).set(data).where(eq(roleRequests.id, id));
}

// =============================================================================
// RECIPE LIKES
// =============================================================================

export async function toggleRecipeLike(userId: number, recipeId: number): Promise<{ liked: boolean; likesCount: number }> {
  const db = await getDb();
  if (!db) return { liked: false, likesCount: 0 };
  const existing = await db.select().from(recipeLikes)
    .where(and(eq(recipeLikes.userId, userId), eq(recipeLikes.recipeId, recipeId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(recipeLikes).where(and(eq(recipeLikes.userId, userId), eq(recipeLikes.recipeId, recipeId)));
    const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(recipeLikes).where(eq(recipeLikes.recipeId, recipeId));
    return { liked: false, likesCount: Number(count) };
  } else {
    await db.insert(recipeLikes).values({ userId, recipeId });
    const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(recipeLikes).where(eq(recipeLikes.recipeId, recipeId));
    return { liked: true, likesCount: Number(count) };
  }
}

export async function getRecipeLikesCount(recipeId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(recipeLikes).where(eq(recipeLikes.recipeId, recipeId));
  return Number(count);
}

export async function getUserRecipeLike(userId: number, recipeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(recipeLikes)
    .where(and(eq(recipeLikes.userId, userId), eq(recipeLikes.recipeId, recipeId)))
    .limit(1);
  return result.length > 0;
}

export async function getRecipeLikesCounts(recipeIds: number[]): Promise<Record<number, number>> {
  const db = await getDb();
  if (!db || recipeIds.length === 0) return {};
  const rows = await db.select({ recipeId: recipeLikes.recipeId, count: sql<number>`COUNT(*)` })
    .from(recipeLikes)
    .where(inArray(recipeLikes.recipeId, recipeIds))
    .groupBy(recipeLikes.recipeId);
  return Object.fromEntries(rows.map(r => [r.recipeId, Number(r.count)]));
}

export async function getUserRecipeLikes(userId: number, recipeIds: number[]): Promise<Set<number>> {
  const db = await getDb();
  if (!db || recipeIds.length === 0) return new Set();
  const rows = await db.select({ recipeId: recipeLikes.recipeId })
    .from(recipeLikes)
    .where(and(eq(recipeLikes.userId, userId), inArray(recipeLikes.recipeId, recipeIds)));
  return new Set(rows.map(r => r.recipeId));
}

// =============================================================================
// COMPLEMENTS
// =============================================================================

export async function listComplements(opts: { search?: string; category?: string; limit?: number; offset?: number; userId?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const { search, category, limit = 100, offset = 0, userId } = opts;
  // Show public complements OR user's own private complements
  const visibilityCondition = userId
    ? or(eq(complements.isPublic, true), eq(complements.userId, userId))
    : eq(complements.isPublic, true);
  const conditions: any[] = [visibilityCondition];
  if (search) conditions.push(or(like(complements.name, `%${search}%`), like(complements.nameEs, `%${search}%`)));
  if (category) conditions.push(eq(complements.category, category as any));
  return db.select().from(complements).where(and(...conditions)).orderBy(complements.category, complements.name).limit(limit).offset(offset);
}
export async function deleteUserComplement(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(complements).where(and(eq(complements.id, id), eq(complements.userId, userId)));
}

export async function getComplementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(complements).where(eq(complements.id, id)).limit(1);
  return result[0];
}

export async function createComplement(data: typeof complements.$inferInsert) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(complements).values(data);
  return (result as any).insertId as number;
}

export async function logComplement(data: typeof complementLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(complementLogs).values(data);
  return (result as any).insertId as number;
}

export async function getComplementLogsByDate(userId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  const start = new Date(date + "T00:00:00.000Z");
  const end = new Date(date + "T23:59:59.999Z");
  return db
    .select({ log: complementLogs, complement: complements })
    .from(complementLogs)
    .innerJoin(complements, eq(complementLogs.complementId, complements.id))
    .where(and(eq(complementLogs.userId, userId), gte(complementLogs.loggedAt, start), lte(complementLogs.loggedAt, end)))
    .orderBy(complementLogs.loggedAt);
}

export async function deleteComplementLog(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(complementLogs).where(and(eq(complementLogs.id, id), eq(complementLogs.userId, userId)));
}

// =============================================================================
// PANTRY STOCK — Despensa Inteligente
// =============================================================================

/** Normalize ingredient name for cross-list matching (lowercase, no accents) */
function normalizeIngredientKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Estimated shelf life in days by category */
const SHELF_LIFE_DAYS: Record<string, number> = {
  "Frutas y verduras": 7,
  "Carnes y pescados": 5,
  "Lácteos y huevos": 14,
  "Pan y cereales": 30,
  "Bebidas": 365,
  "Congelados": 90,
  "Conservas": 365,
  "Limpieza": 730,
  "Higiene": 730,
  "Otros": 30,
};

function estimateExpiry(category: string | null): Date {
  const days = SHELF_LIFE_DAYS[category ?? "Otros"] ?? 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Called when a shopping list item is marked as purchased (checked=true).
 * Upserts the item into pantry_stock for the user.
 */
export async function upsertPantryStock(
  userId: number,
  ingredientName: string,
  commercialLabel: string | null,
  quantityPurchased: number,
  unitSizeGrams: number | null,
  category: string | null
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const key = normalizeIngredientKey(ingredientName);
  const expiresAt = estimateExpiry(category);

  // Check if there's already stock for this ingredient
  const [existing] = await db
    .select()
    .from(pantryStock)
    .where(and(eq(pantryStock.userId, userId), eq(pantryStock.ingredientKey, key)))
    .limit(1);

  if (existing) {
    // Add to existing stock
    await db
      .update(pantryStock)
      .set({
        quantityAvailable: existing.quantityAvailable + quantityPurchased,
        quantityPurchased: existing.quantityPurchased + quantityPurchased,
        estimatedExpiresAt: expiresAt,
        purchasedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pantryStock.id, existing.id));
  } else {
    await db.insert(pantryStock).values({
      userId,
      ingredientKey: key,
      ingredientName,
      commercialLabel,
      quantityPurchased,
      quantityAvailable: quantityPurchased,
      unitSizeGrams,
      estimatedExpiresAt: expiresAt,
      purchasedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/**
 * Returns all pantry stock for a user (non-expired and with quantity > 0).
 */
export async function getPantryStock(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db
    .select()
    .from(pantryStock)
    .where(
      and(
        eq(pantryStock.userId, userId),
        sql`${pantryStock.quantityAvailable} > 0`,
        or(
          sql`${pantryStock.estimatedExpiresAt} IS NULL`,
          sql`${pantryStock.estimatedExpiresAt} > ${now}`
        )
      )
    )
    .orderBy(pantryStock.ingredientName);
}

/**
 * Given a list of ingredient names, returns which ones are already in the pantry.
 * Returns a Set of normalized ingredient keys that are available.
 */
export async function checkPantryAvailability(
  userId: number,
  ingredientNames: string[]
): Promise<Set<string>> {
  const db = await getDb();
  if (!db) return new Set();

  const keys = ingredientNames.map(normalizeIngredientKey);
  const now = new Date();

  const rows = await db
    .select({ ingredientKey: pantryStock.ingredientKey })
    .from(pantryStock)
    .where(
      and(
        eq(pantryStock.userId, userId),
        sql`${pantryStock.quantityAvailable} > 0`,
        or(
          sql`${pantryStock.estimatedExpiresAt} IS NULL`,
          sql`${pantryStock.estimatedExpiresAt} > ${now}`
        )
      )
    );

  const available = new Set(rows.map((r) => r.ingredientKey));
  return new Set(keys.filter((k) => available.has(k)));
}

/**
 * Removes expired or depleted pantry stock entries for a user.
 */
export async function clearExpiredPantryStock(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  await db
    .delete(pantryStock)
    .where(
      and(
        eq(pantryStock.userId, userId),
        or(
          sql`${pantryStock.quantityAvailable} <= 0`,
          sql`${pantryStock.estimatedExpiresAt} < ${now}`
        )
      )
    );
}

/**
 * Manually remove a pantry stock entry.
 */
export async function removePantryStockItem(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(pantryStock).where(and(eq(pantryStock.id, id), eq(pantryStock.userId, userId)));
}
