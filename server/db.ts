import { and, desc, eq, gte, ilike, inArray, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  allergies,
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
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
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
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const { userId, search, isPublic, limit = 20, offset = 0 } = params;

  const conditions = [eq(recipes.active, true)];
  if (userId) conditions.push(eq(recipes.userId, userId));
  if (isPublic !== undefined) conditions.push(eq(recipes.isPublic, isPublic));
  if (search) conditions.push(like(recipes.name, `%${search}%`));
  if (params.difficulty) conditions.push(eq(recipes.difficulty, params.difficulty as any));
  if (params.maxTime) {
    conditions.push(lte(sql`(${recipes.preparationTime} + ${recipes.cookTime})`, params.maxTime));
  }

  return db
    .select()
    .from(recipes)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(recipes.createdAt));
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

  // Seed allergies
  const allergyData = [
    { apiParam: "gluten", nameEs: "Gluten", nameEn: "Gluten" },
    { apiParam: "lactose", nameEs: "Lactosa", nameEn: "Lactose" },
    { apiParam: "nuts", nameEs: "Frutos secos", nameEn: "Nuts" },
    { apiParam: "eggs", nameEs: "Huevos", nameEn: "Eggs" },
    { apiParam: "fish", nameEs: "Pescado", nameEn: "Fish" },
    { apiParam: "shellfish", nameEs: "Mariscos", nameEn: "Shellfish" },
    { apiParam: "soy", nameEs: "Soja", nameEn: "Soy" },
    { apiParam: "peanuts", nameEs: "Cacahuetes", nameEn: "Peanuts" },
    { apiParam: "sesame", nameEs: "Sésamo", nameEn: "Sesame" },
    { apiParam: "mustard", nameEs: "Mostaza", nameEn: "Mustard" },
    { apiParam: "celery", nameEs: "Apio", nameEn: "Celery" },
    { apiParam: "sulfites", nameEs: "Sulfitos", nameEn: "Sulfites" },
    { apiParam: "lupin", nameEs: "Altramuces", nameEn: "Lupin" },
    { apiParam: "molluscs", nameEs: "Moluscos", nameEn: "Molluscs" },
  ];
  for (const a of allergyData) {
    await db.insert(allergies).values(a).onDuplicateKeyUpdate({ set: { nameEs: a.nameEs } });
  }

  // Seed diet restrictions
  const restrictionData = [
    { apiParam: "vegan", nameEs: "Vegano", nameEn: "Vegan" },
    { apiParam: "vegetarian", nameEs: "Vegetariano", nameEn: "Vegetarian" },
    { apiParam: "keto", nameEs: "Keto", nameEn: "Keto" },
    { apiParam: "paleo", nameEs: "Paleo", nameEn: "Paleo" },
    { apiParam: "gluten_free", nameEs: "Sin gluten", nameEn: "Gluten free" },
    { apiParam: "dairy_free", nameEs: "Sin lácteos", nameEn: "Dairy free" },
    { apiParam: "low_carb", nameEs: "Bajo en carbohidratos", nameEn: "Low carb" },
    { apiParam: "low_fat", nameEs: "Bajo en grasas", nameEn: "Low fat" },
    { apiParam: "mediterranean", nameEs: "Mediterránea", nameEn: "Mediterranean" },
    { apiParam: "halal", nameEs: "Halal", nameEn: "Halal" },
    { apiParam: "kosher", nameEs: "Kosher", nameEn: "Kosher" },
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
