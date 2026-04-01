import {
  boolean,
  decimal,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
  index,
  unique,
} from "drizzle-orm/mysql-core";

// =============================================================================
// USERS & AUTHENTICATION
// =============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  imageUrl: text("imageUrl"),
  description: text("description"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "buddyexpert"]).default("user").notNull(),
  locale: varchar("locale", { length: 8 }).default("es").notNull(),
  active: boolean("active").default(true).notNull(),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// =============================================================================
// USER PROFILES
// =============================================================================

export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  age: int("age"),
  birthYear: int("birthYear"),
  height: float("height"),
  weight: float("weight"),
  targetWeight: float("targetWeight"),
  bodyFatPercentage: float("bodyFatPercentage"),
  muscleMass: float("muscleMass"),
  basalMetabolicRate: float("basalMetabolicRate"),
  dailyCalorieGoal: int("dailyCalorieGoal"),
  dailyProteinGoal: float("dailyProteinGoal"),
  dailyCarbsGoal: float("dailyCarbsGoal"),
  dailyFatGoal: float("dailyFatGoal"),
  sleepHours: int("sleepHours"),
  dailyMeals: int("dailyMeals"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  cookingLevel: mysqlEnum("cookingLevel", ["beginner", "intermediate", "advanced"]),
  activityLevel: mysqlEnum("activityLevel", ["sedentary", "light", "moderate", "active", "very_active"]),
  mainGoal: mysqlEnum("mainGoal", ["lose_weight", "gain_muscle", "maintain", "improve_health", "eat_healthier"]),
  heightUnit: mysqlEnum("heightUnit", ["cm", "ft"]).default("cm"),
  weightUnit: mysqlEnum("weightUnit", ["kg", "lb"]).default("kg"),
  practicesSports: boolean("practicesSports").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export const userMedicalProfiles = mysqlTable("user_medical_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  nutritionalSupplements: text("nutritionalSupplements"),
  useNutritionalSupplements: boolean("useNutritionalSupplements").default(false),
  medicalDiet: text("medicalDiet"),
  hasMedicalDiet: boolean("hasMedicalDiet").default(false),
  surgery: text("surgery"),
  hasSurgery: boolean("hasSurgery").default(false),
  medicalFamilyBackground: text("medicalFamilyBackground"),
  hasMedicalFamilyBackground: boolean("hasMedicalFamilyBackground").default(false),
  metabolismMedication: text("metabolismMedication"),
  useMetabolismMedication: boolean("useMetabolismMedication").default(false),
  medicalConditions: text("medicalConditions"),
  hasMedicalConditions: boolean("hasMedicalConditions").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserMedicalProfile = typeof userMedicalProfiles.$inferSelect;

export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  purchaseFrequency: varchar("purchaseFrequency", { length: 64 }),
  purchaseLocation: varchar("purchaseLocation", { length: 128 }),
  suggestHealthierProducts: boolean("suggestHealthierProducts").default(false),
  suggestCheaperProducts: boolean("suggestCheaperProducts").default(false),
  organicProducts: boolean("organicProducts"),
  interestedInNutritionalAdvices: boolean("interestedInNutritionalAdvices").default(false),
  notifications: boolean("notifications").default(false),
  newsletter: boolean("newsletter").default(false),
  acceptTerms: boolean("acceptTerms").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  status: mysqlEnum("status", ["active", "trial", "cancelled", "expired", "past_due", "pending"]).default("pending").notNull(),
  plan: mysqlEnum("plan", ["free", "basic", "premium", "pro_max"]).default("free").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;

// =============================================================================
// CATALOGS
// =============================================================================

export const allergies = mysqlTable("allergies", {
  id: int("id").autoincrement().primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Allergy = typeof allergies.$inferSelect;

export const dietRestrictions = mysqlTable("diet_restrictions", {
  id: int("id").autoincrement().primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DietRestriction = typeof dietRestrictions.$inferSelect;

export const foodCategories = mysqlTable("food_categories", {
  id: int("id").autoincrement().primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FoodCategory = typeof foodCategories.$inferSelect;

export const measures = mysqlTable("measures", {
  id: int("id").autoincrement().primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }),
  abbreviation: varchar("abbreviation", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Measure = typeof measures.$inferSelect;

export const dayParts = mysqlTable("day_parts", {
  id: int("id").autoincrement().primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DayPart = typeof dayParts.$inferSelect;

export const storageLocations = mysqlTable("storage_locations", {
  id: int("id").autoincrement().primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StorageLocation = typeof storageLocations.$inferSelect;

// =============================================================================
// USER-CATALOG RELATIONS
// =============================================================================

export const userAllergies = mysqlTable("user_allergies", {
  userId: int("userId").notNull(),
  allergyId: int("allergyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.userId, t.allergyId),
}));

export const userDietRestrictions = mysqlTable("user_diet_restrictions", {
  userId: int("userId").notNull(),
  dietRestrictionId: int("dietRestrictionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.userId, t.dietRestrictionId),
}));

export const userFoodCategories = mysqlTable("user_food_categories", {
  userId: int("userId").notNull(),
  foodCategoryId: int("foodCategoryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.userId, t.foodCategoryId),
}));

// =============================================================================
// INGREDIENTS
// =============================================================================

export const ingredients = mysqlTable("ingredients", {
  id: int("id").autoincrement().primaryKey(),
  apiParam: varchar("apiParam", { length: 128 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 256 }).notNull(),
  nameEn: varchar("nameEn", { length: 256 }),
  imageUrl: text("imageUrl"),
  purchaseUnitType: varchar("purchaseUnitType", { length: 64 }),
  purchaseGramsPerUnit: int("purchaseGramsPerUnit"),
  purchaseUnitSingular: varchar("purchaseUnitSingular", { length: 64 }),
  purchaseUnitPlural: varchar("purchaseUnitPlural", { length: 64 }),
  // Nutritional info per 100g
  calories: int("calories"),
  proteins: float("proteins"),
  carbohydrates: float("carbohydrates"),
  fats: float("fats"),
  saturatedFats: float("saturatedFats"),
  fiber: float("fiber"),
  sugars: float("sugars"),
  sodium: float("sodium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = typeof ingredients.$inferInsert;

export const ingredientAllergies = mysqlTable("ingredient_allergies", {
  ingredientId: int("ingredientId").notNull(),
  allergyId: int("allergyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.ingredientId, t.allergyId),
}));

export const userBannedIngredients = mysqlTable("user_banned_ingredients", {
  userId: int("userId").notNull(),
  ingredientId: int("ingredientId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.userId, t.ingredientId),
}));

// =============================================================================
// RECIPES
// =============================================================================

export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  imageUrl: text("imageUrl"),
  description: text("description"),
  preparationTime: int("preparationTime").default(0), // minutes
  cookTime: int("cookTime").default(0), // minutes
  servings: int("servings").default(1),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium"),
  isPublic: boolean("isPublic").default(true),
  active: boolean("active").default(true),
  // Calculated nutritional info per serving
  caloriesPerServing: int("caloriesPerServing"),
  proteinsPerServing: float("proteinsPerServing"),
  carbsPerServing: float("carbsPerServing"),
  fatsPerServing: float("fatsPerServing"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("recipe_user_idx").on(t.userId),
}));

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

export const recipeIngredients = mysqlTable("recipe_ingredients", {
  id: int("id").autoincrement().primaryKey(),
  recipeId: int("recipeId").notNull(),
  ingredientId: int("ingredientId").notNull(),
  measureId: int("measureId"),
  amount: float("amount").notNull(),
  optional: boolean("optional").default(false),
  notes: text("notes"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.recipeId, t.ingredientId),
}));

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = typeof recipeIngredients.$inferInsert;

export const recipeSteps = mysqlTable("recipe_steps", {
  id: int("id").autoincrement().primaryKey(),
  recipeId: int("recipeId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  instruction: text("instruction").notNull(),
  imageUrl: text("imageUrl"),
  timing: int("timing"), // minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.recipeId, t.stepNumber),
}));

export type RecipeStep = typeof recipeSteps.$inferSelect;
export type InsertRecipeStep = typeof recipeSteps.$inferInsert;

export const recipeAllergies = mysqlTable("recipe_allergies", {
  recipeId: int("recipeId").notNull(),
  allergyId: int("allergyId").notNull(),
}, (t) => ({
  pk: unique().on(t.recipeId, t.allergyId),
}));

export const recipeDietRestrictions = mysqlTable("recipe_diet_restrictions", {
  recipeId: int("recipeId").notNull(),
  dietRestrictionId: int("dietRestrictionId").notNull(),
}, (t) => ({
  pk: unique().on(t.recipeId, t.dietRestrictionId),
}));

export const recipeFoodCategories = mysqlTable("recipe_food_categories", {
  recipeId: int("recipeId").notNull(),
  foodCategoryId: int("foodCategoryId").notNull(),
}, (t) => ({
  pk: unique().on(t.recipeId, t.foodCategoryId),
}));

export const userFavoriteRecipes = mysqlTable("user_favorite_recipes", {
  userId: int("userId").notNull(),
  recipeId: int("recipeId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.userId, t.recipeId),
}));

// =============================================================================
// MENU ORGANIZERS
// =============================================================================

export const menuOrganizers = mysqlTable("menu_organizers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  type: mysqlEnum("type", ["weekly", "monthly", "custom"]).default("weekly"),
  isPublic: boolean("isPublic").default(false),
  objective: text("objective"),
  dailyMealsCount: int("dailyMealsCount").default(3),
  generatedByAI: boolean("generatedByAI").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("menu_user_idx").on(t.userId),
}));

export type MenuOrganizer = typeof menuOrganizers.$inferSelect;
export type InsertMenuOrganizer = typeof menuOrganizers.$inferInsert;

export const menuOrganizerDayParts = mysqlTable("menu_organizer_day_parts", {
  id: int("id").autoincrement().primaryKey(),
  menuOrganizerId: int("menuOrganizerId").notNull(),
  dayPartId: int("dayPartId").notNull(),
  date: date("date"),
  dayNumber: int("dayNumber"),
  mealNumber: int("mealNumber"),
  name: varchar("name", { length: 128 }),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuOrganizerDayPart = typeof menuOrganizerDayParts.$inferSelect;

export const menuOrganizerDayPartRecipes = mysqlTable("menu_dp_recipes", {
  id: int("id").autoincrement().primaryKey(),
  menuOrganizerDayPartId: int("menuOrganizerDayPartId").notNull(),
  recipeId: int("recipeId").notNull(),
  servings: float("servings").default(1),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uniq: unique("mdpr_uniq").on(t.menuOrganizerDayPartId, t.recipeId),
}));

// =============================================================================
// SHOPPING LISTS
// =============================================================================

export const shoppingLists = mysqlTable("shopping_lists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  menuOrganizerId: int("menuOrganizerId"),
  generatedByAI: boolean("generatedByAI").default(false),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("shopping_user_idx").on(t.userId),
}));

export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = typeof shoppingLists.$inferInsert;

export const shoppingListItems = mysqlTable("shopping_list_items", {
  id: int("id").autoincrement().primaryKey(),
  shoppingListId: int("shoppingListId").notNull(),
  ingredientId: int("ingredientId"),
  customName: varchar("customName", { length: 256 }),
  amount: float("amount"),
  measureId: int("measureId"),
  category: varchar("category", { length: 128 }),
  checked: boolean("checked").default(false),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertShoppingListItem = typeof shoppingListItems.$inferInsert;

// =============================================================================
// INVENTORY
// =============================================================================

export const userInventoryItems = mysqlTable("user_inventory_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ingredientId: int("ingredientId"),
  customName: varchar("customName", { length: 256 }),
  amount: float("amount").notNull(),
  measureId: int("measureId"),
  storageLocationId: int("storageLocationId"),
  expirationDate: date("expirationDate"),
  purchaseDate: date("purchaseDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("inventory_user_idx").on(t.userId),
}));

export type UserInventoryItem = typeof userInventoryItems.$inferSelect;
export type InsertUserInventoryItem = typeof userInventoryItems.$inferInsert;

// =============================================================================
// MEAL LOGS (Historial de comidas)
// =============================================================================

export const mealLogs = mysqlTable("meal_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  recipeId: int("recipeId"),
  customMealName: varchar("customMealName", { length: 256 }),
  dayPartId: int("dayPartId"),
  logDate: date("logDate").notNull(),
  servings: float("servings").default(1),
  // Nutritional data at time of logging
  calories: int("calories"),
  proteins: float("proteins"),
  carbohydrates: float("carbohydrates"),
  fats: float("fats"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("meal_log_user_idx").on(t.userId),
  dateIdx: index("meal_log_date_idx").on(t.logDate),
}));

export type MealLog = typeof mealLogs.$inferSelect;
export type InsertMealLog = typeof mealLogs.$inferInsert;

// Health metrics history
export const userHealthMetrics = mysqlTable("user_health_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weight: float("weight"),
  bodyFatPercentage: float("bodyFatPercentage"),
  muscleMass: float("muscleMass"),
  recordedAt: date("recordedAt").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("health_metrics_user_idx").on(t.userId),
}));

export type UserHealthMetric = typeof userHealthMetrics.$inferSelect;
export type InsertUserHealthMetric = typeof userHealthMetrics.$inferInsert;
