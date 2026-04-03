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
  role: mysqlEnum("role", ["user", "admin", "buddyexpert", "buddymaker", "business"]).default("user").notNull(),
  accountType: mysqlEnum("accountType", ["user", "buddymaker", "buddyexpert", "business"]).default("user").notNull(),
  registrationStep: mysqlEnum("registrationStep", ["account_type", "profile_setup", "application", "pending_approval", "completed"]).default("account_type").notNull(),
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
  // Extended lifestyle fields
  sportsFrequency: mysqlEnum("sportsFrequency", ["never", "1_2_week", "3_4_week", "5_plus_week", "daily"]),
  sportsTypes: text("sportsTypes"), // JSON array of sport types
  workType: mysqlEnum("workType", ["sedentary_desk", "light_standing", "moderate_physical", "heavy_physical"]),
  stressLevel: mysqlEnum("stressLevel", ["low", "moderate", "high", "very_high"]),
  waterIntake: float("waterIntake"), // litres per day
  alcoholConsumption: mysqlEnum("alcoholConsumption", ["none", "occasional", "moderate", "frequent"]),
  smokingStatus: mysqlEnum("smokingStatus", ["non_smoker", "ex_smoker", "smoker"]),
  // Extended nutrition goals
  weightChangeRate: float("weightChangeRate"), // kg per week target
  mealPrepTime: mysqlEnum("mealPrepTime", ["under_15", "15_30", "30_60", "over_60"]), // minutes
  budgetPerWeek: float("budgetPerWeek"), // euros
  // Culinary preferences
  favoriteCuisines: text("favoriteCuisines"), // JSON array
  dislikedIngredients: text("dislikedIngredients"), // JSON array
  cookingEquipment: text("cookingEquipment"), // JSON array: airfryer, oven, etc.
  mealsPerDayDetail: text("mealsPerDayDetail"), // JSON: which meals (breakfast, lunch, etc.)
  snackingHabits: mysqlEnum("snackingHabits", ["never", "rarely", "sometimes", "often"]),
  eatOutFrequency: mysqlEnum("eatOutFrequency", ["never", "1_2_month", "1_2_week", "3_plus_week"]),
  // Body composition goals
  fitnessGoalDetail: text("fitnessGoalDetail"),
  motivationLevel: mysqlEnum("motivationLevel", ["low", "medium", "high", "very_high"]),
  previousDietExperience: text("previousDietExperience"), // JSON array of past diets tried
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
  // Lifestyle & dietary pattern
  dietaryPattern: varchar("dietaryPattern", { length: 64 }), // omnivore, vegetarian, vegan, pescatarian, flexitarian, keto, paleo
  lifestyle: text("lifestyle"), // JSON array: pregnant, breastfeeding, athlete, elderly, child, etc.
  specialNeeds: text("specialNeeds"), // JSON array: cold_recovery, post_surgery, fatigue, stress, etc.
  pregnancyWeek: int("pregnancyWeek"), // if pregnant, week number
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
  // Extended preferences
  preferredMealComplexity: mysqlEnum("preferredMealComplexity", ["simple", "moderate", "complex"]),
  portionSize: mysqlEnum("portionSize", ["small", "medium", "large"]),
  preferSeasonalIngredients: boolean("preferSeasonalIngredients").default(false),
  preferLocalProducts: boolean("preferLocalProducts").default(false),
  avoidProcessedFood: boolean("avoidProcessedFood").default(false),
  interestedInMealPrep: boolean("interestedInMealPrep").default(false),
  wantsShoppingListAutomation: boolean("wantsShoppingListAutomation").default(false),
  wantsCalorieTracking: boolean("wantsCalorieTracking").default(false),
  wantsMacroTracking: boolean("wantsMacroTracking").default(false),
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
  manualPlan: mysqlEnum("manualPlan", ["free", "basic", "premium", "pro_max"]).default("free"),
  manualPlanNote: varchar("manualPlanNote", { length: 255 }),
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
  // Extended nutritional info per 100g
  potassium: float("potassium"),       // mg
  calcium: float("calcium"),           // mg
  iron: float("iron"),                 // mg
  magnesium: float("magnesium"),       // mg
  phosphorus: float("phosphorus"),     // mg
  zinc: float("zinc"),                 // mg
  vitaminC: float("vitaminC"),         // mg
  vitaminA: float("vitaminA"),         // mcg RAE
  vitaminD: float("vitaminD"),         // mcg
  vitaminE: float("vitaminE"),         // mg
  vitaminK: float("vitaminK"),         // mcg
  vitaminB1: float("vitaminB1"),       // mg (tiamina)
  vitaminB2: float("vitaminB2"),       // mg (riboflavina)
  vitaminB3: float("vitaminB3"),       // mg (niacina)
  vitaminB6: float("vitaminB6"),       // mg
  vitaminB12: float("vitaminB12"),     // mcg
  folate: float("folate"),             // mcg
  cholesterol: float("cholesterol"),   // mg
  omega3: float("omega3"),             // g
  omega6: float("omega6"),             // g
  // Classification
  category: varchar("category", { length: 64 }),  // frutas, verduras, carnes, lácteos, cereales, legumbres, etc.
  isVegan: boolean("isVegan").default(false),
  isVegetarian: boolean("isVegetarian").default(false),
  isGlutenFree: boolean("isGlutenFree").default(false),
  isDairyFree: boolean("isDairyFree").default(false),
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
  // Meal time classification
  mealTime: mysqlEnum("mealTime", ["desayuno", "media_manana", "comida", "merienda", "cena", "cualquiera"]).default("cualquiera"),
  // Category
  category: varchar("category", { length: 64 }),
  // Cuisine type (mediterranea, asiatica, italiana, mexicana, española, americana, etc.)
  cuisineType: varchar("cuisineType", { length: 64 }),
  // Cooking method (airfryer, horno, microondas, sin_coccion, plancha, olla, wok, vaporizador)
  cookingMethod: varchar("cookingMethod", { length: 64 }),
  // Allergens (JSON array of strings)
  allergens: text("allergens"), // JSON: ["gluten", "lacteos", ...]
  // Tags (JSON array of strings)
  tags: text("tags"), // JSON: ["rapida", "fitness", ...]
  // Calculated nutritional info per serving
  caloriesPerServing: int("caloriesPerServing"),
  proteinsPerServing: float("proteinsPerServing"),
  carbsPerServing: float("carbsPerServing"),
  fatsPerServing: float("fatsPerServing"),
  fiberPerServing: float("fiberPerServing"),
  // BuddyMaker link
  buddyMakerId: int("buddyMakerId"),
  // Structured data (JSON)
  ingredientsJson: text("ingredientsJson"), // JSON: [{name, amount, unit, category}]
  instructionsJson: text("instructionsJson"), // JSON: [{step, text}]
  // Seed data flag
  isSeeded: boolean("isSeeded").default(false),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("recipe_user_idx").on(t.userId),
  mealTimeIdx: index("recipe_meal_time_idx").on(t.mealTime),
  buddyMakerIdx: index("recipe_buddy_maker_idx").on(t.buddyMakerId),
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
  goal: mysqlEnum("goal", ["perdida_peso", "ganancia_muscular", "tonificacion", "perdida_grasa", "mantenimiento", "bienestar", "vegano"]),
  dailyCalories: int("dailyCalories"),
  persons: int("persons").default(1),
  difficulty: mysqlEnum("difficulty", ["facil", "medio", "dificil"]).default("facil"),
  isSeeded: boolean("isSeeded").default(false),
  dailyMealsCount: int("dailyMealsCount").default(3),
   generatedByAI: boolean("generatedByAI").default(false),
  isActive: boolean("isActive").default(false),
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
  notes: text("notes"),
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
  supermarket: mysqlEnum("supermarket", ["general", "mercadona", "lidl", "carrefour", "alcampo", "dia", "el_corte_ingles"]).default("general"),
  persons: int("persons").default(1),
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
// SHOPPING LIST TEMPLATES
// =============================================================================
export const shoppingListTemplates = mysqlTable("shopping_list_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  supermarket: varchar("supermarket", { length: 64 }).default("general"),
  itemsJson: text("itemsJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ShoppingListTemplate = typeof shoppingListTemplates.$inferSelect;
export type InsertShoppingListTemplate = typeof shoppingListTemplates.$inferInsert;

// =============================================================================
// MERCADONA PRODUCTS CATALOG
// =============================================================================

export const mercadonaProducts = mysqlTable("mercadona_products", {
  id: int("id").primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull(),
  name: varchar("name", { length: 512 }).notNull(),
  packaging: varchar("packaging", { length: 128 }),
  thumbnail: varchar("thumbnail", { length: 512 }),
  shareUrl: varchar("share_url", { length: 512 }),
  categoryId: int("category_id"),
  categoryName: varchar("category_name", { length: 256 }),
  subcategoryId: int("subcategory_id"),
  subcategoryName: varchar("subcategory_name", { length: 256 }),
  bulkPrice: varchar("bulk_price", { length: 32 }),
  unitPrice: varchar("unit_price", { length: 32 }),
  unitSize: float("unit_size"),
  sizeFormat: varchar("size_format", { length: 16 }),
  referencePrice: varchar("reference_price", { length: 32 }),
  referenceFormat: varchar("reference_format", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  slugIdx: index("merc_slug_idx").on(t.slug),
  catIdx: index("merc_cat_idx").on(t.categoryId),
  nameIdx: index("merc_name_idx").on(t.name),
}));
export type MercadonaProduct = typeof mercadonaProducts.$inferSelect;
export type InsertMercadonaProduct = typeof mercadonaProducts.$inferInsert;

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
  photoUrl: varchar("photoUrl", { length: 1024 }),
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

// =============================================================================
// BUDDY EXPERTS — Nutricionistas, deportistas y expertos que crean planes
// =============================================================================

export const buddyExperts = mysqlTable("buddy_experts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  specialty: varchar("specialty", { length: 128 }), // "Nutricionista", "Dietista", "Deportista", etc.
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  coverUrl: text("coverUrl"),
  instagramHandle: varchar("instagramHandle", { length: 64 }),
  websiteUrl: text("websiteUrl"),
  category: mysqlEnum("category", ["perdida_peso", "ganancia_muscular", "definicion", "dieta_equilibrada", "rendimiento", "bienestar", "vegano"]).default("dieta_equilibrada"),
  verified: boolean("verified").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  followersCount: int("followersCount").default(0).notNull(),
  plansCount: int("plansCount").default(0).notNull(),
  rating: float("rating").default(0),
  reviewsCount: int("reviewsCount").default(0).notNull(),
  stripeAccountId: varchar("stripeAccountId", { length: 128 }), // Stripe Connect account
  stripeOnboardingCompleted: boolean("stripeOnboardingCompleted").default(false).notNull(),
  commissionRate: float("commissionRate").default(0.20).notNull(), // 20% por defecto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("buddy_experts_user_idx").on(t.userId),
  categoryIdx: index("buddy_experts_category_idx").on(t.category),
}));
export type BuddyExpert = typeof buddyExperts.$inferSelect;
export type InsertBuddyExpert = typeof buddyExperts.$inferInsert;

// Planes de menú creados por BuddyExperts
export const expertPlans = mysqlTable("expert_plans", {
  id: int("id").autoincrement().primaryKey(),
  expertId: int("expertId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  coverUrl: text("coverUrl"),
  category: mysqlEnum("category", ["perdida_peso", "ganancia_muscular", "definicion", "dieta_equilibrada", "rendimiento", "bienestar", "vegano"]).default("dieta_equilibrada"),
  durationWeeks: int("durationWeeks").default(4).notNull(),
  dailyCalories: int("dailyCalories"),
  dailyMeals: int("dailyMeals").default(3),
  level: mysqlEnum("level", ["principiante", "intermedio", "avanzado"]).default("principiante"),
  tags: text("tags"), // JSON array de tags
  isPublic: boolean("isPublic").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  copiesCount: int("copiesCount").default(0).notNull(),
  likesCount: int("likesCount").default(0).notNull(),
  price: float("price").default(0), // 0 = gratis, >0 = de pago
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  expertIdx: index("expert_plans_expert_idx").on(t.expertId),
  categoryIdx: index("expert_plans_category_idx").on(t.category),
}));
export type ExpertPlan = typeof expertPlans.$inferSelect;
export type InsertExpertPlan = typeof expertPlans.$inferInsert;

// Usuarios que han copiado/seguido un plan de experto
export const userExpertPlanCopies = mysqlTable("user_expert_plan_copies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  expertId: int("expertId").notNull(),
  copiedAt: timestamp("copiedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("plan_copies_user_idx").on(t.userId),
  planIdx: index("plan_copies_plan_idx").on(t.planId),
}));

// Seguidores de BuddyExperts
export const expertFollowers = mysqlTable("expert_followers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  expertId: int("expertId").notNull(),
  followedAt: timestamp("followedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("expert_followers_user_idx").on(t.userId),
  expertIdx: index("expert_followers_expert_idx").on(t.expertId),
}));

// =============================================================================
// BUDDY MAKERS — Creadores de contenido / recetas (tipo Instagram)
// =============================================================================

export const buddyMakers = mysqlTable("buddy_makers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  coverUrl: text("coverUrl"),
  instagramHandle: varchar("instagramHandle", { length: 64 }),
  youtubeHandle: varchar("youtubeHandle", { length: 64 }),
  tiktokHandle: varchar("tiktokHandle", { length: 64 }),
  specialty: varchar("specialty", { length: 128 }), // "Cocina mediterránea", "Repostería", etc.
  verified: boolean("verified").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  followersCount: int("followersCount").default(0).notNull(),
  recipesCount: int("recipesCount").default(0).notNull(),
  rating: float("rating").default(0),
  stripeAccountId: varchar("stripeAccountId", { length: 128 }),
  stripeOnboardingCompleted: boolean("stripeOnboardingCompleted").default(false).notNull(),
  commissionRate: float("commissionRate").default(0.20).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("buddy_makers_user_idx").on(t.userId),
}));
export type BuddyMaker = typeof buddyMakers.$inferSelect;
export type InsertBuddyMaker = typeof buddyMakers.$inferInsert;

// Seguidores de BuddyMakers
export const makerFollowers = mysqlTable("maker_followers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  makerId: int("makerId").notNull(),
  followedAt: timestamp("followedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("maker_followers_user_idx").on(t.userId),
  makerIdx: index("maker_followers_maker_idx").on(t.makerId),
}));

// =============================================================================
// STRIPE CONNECT — Comisiones y pagos a creadores
// =============================================================================

export const creatorEarnings = mysqlTable("creator_earnings", {
  id: int("id").autoincrement().primaryKey(),
  creatorUserId: int("creatorUserId").notNull(),
  creatorType: mysqlEnum("creatorType", ["buddyexpert", "buddymaker"]).notNull(),
  subscriberUserId: int("subscriberUserId").notNull(),
  subscriptionId: varchar("subscriptionId", { length: 128 }), // Stripe subscription ID
  amount: float("amount").notNull(), // Importe en euros
  commissionRate: float("commissionRate").default(0.20).notNull(),
  commissionAmount: float("commissionAmount").notNull(), // amount * commissionRate
  stripeTransferId: varchar("stripeTransferId", { length: 128 }),
  status: mysqlEnum("status", ["pending", "paid", "failed"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  creatorIdx: index("creator_earnings_creator_idx").on(t.creatorUserId),
  subscriberIdx: index("creator_earnings_subscriber_idx").on(t.subscriberUserId),
}));
export type CreatorEarning = typeof creatorEarnings.$inferSelect;

// =============================================================================
// EXPERT MENUS — Menús semanales compartidos por BuddyExperts (gratis, para ganar seguidores)
// =============================================================================

export const expertMenus = mysqlTable("expert_menus", {
  id: int("id").autoincrement().primaryKey(),
  expertId: int("expertId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  coverUrl: text("coverUrl"),
  weekNumber: int("weekNumber"), // Semana del año
  year: int("year"),
  category: mysqlEnum("category", ["perdida_peso", "ganancia_muscular", "definicion", "dieta_equilibrada", "rendimiento", "bienestar", "vegano"]).default("dieta_equilibrada"),
  dailyCalories: int("dailyCalories"),
  isFree: boolean("isFree").default(true).notNull(), // Siempre gratis para ganar seguidores
  isPublic: boolean("isPublic").default(true).notNull(),
  copiesCount: int("copiesCount").default(0).notNull(),
  likesCount: int("likesCount").default(0).notNull(),
  menuData: text("menuData"), // JSON con los días y comidas del menú semanal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  expertIdx: index("expert_menus_expert_idx").on(t.expertId),
  categoryIdx: index("expert_menus_category_idx").on(t.category),
}));
export type ExpertMenu = typeof expertMenus.$inferSelect;
export type InsertExpertMenu = typeof expertMenus.$inferInsert;

// =============================================================================
// CARREFOUR PRODUCTS CATALOG
// =============================================================================
export const carrefourProducts = mysqlTable("carrefour_products", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 512 }).notNull(),
  brand: varchar("brand", { length: 256 }),
  price: float("price"),
  pricePerUnit: varchar("price_per_unit", { length: 64 }),
  image: varchar("image", { length: 512 }),
  category: varchar("category", { length: 256 }),
  subcategory: varchar("subcategory", { length: 256 }),
  packaging: varchar("packaging", { length: 128 }),
  productUrl: varchar("product_url", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  nameIdx: index("carr_name_idx").on(t.name),
  categoryIdx: index("carr_category_idx").on(t.category),
}));

export type CarrefourProduct = typeof carrefourProducts.$inferSelect;
export type InsertCarrefourProduct = typeof carrefourProducts.$inferInsert;

// =============================================================================
// USER BODY METRICS — Historial de métricas corporales del usuario
// =============================================================================
export const userMetrics = mysqlTable("user_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(), // Fecha de la medición
  weight: float("weight"), // kg
  bodyFat: float("bodyFat"), // % grasa corporal
  muscleMass: float("muscleMass"), // kg masa muscular
  bmi: float("bmi"), // IMC
  waist: float("waist"), // cm cintura
  hip: float("hip"), // cm cadera
  chest: float("chest"), // cm pecho
  arm: float("arm"), // cm brazo
  thigh: float("thigh"), // cm muslo
  calf: float("calf"), // cm pantorrilla
  neck: float("neck"), // cm cuello
  visceralFat: float("visceralFat"), // grasa visceral (nivel 1-20)
  boneMass: float("boneMass"), // kg masa ósea
  waterPercentage: float("waterPercentage"), // % agua corporal
  metabolicAge: int("metabolicAge"), // edad metabólica
  basalMetabolism: int("basalMetabolism"), // kcal metabolismo basal
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("user_metrics_user_idx").on(t.userId),
  dateIdx: index("user_metrics_date_idx").on(t.date),
  userDateIdx: index("user_metrics_user_date_idx").on(t.userId, t.date),
}));
export type UserMetric = typeof userMetrics.$inferSelect;
export type InsertUserMetric = typeof userMetrics.$inferInsert;

// =============================================================================
// BUDDY APPLICATIONS — Solicitudes para convertirse en BuddyExpert o BuddyMaker
// =============================================================================
export const buddyApplications = mysqlTable("buddy_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["expert", "maker"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  // Datos de la solicitud
  displayName: varchar("displayName", { length: 128 }).notNull(),
  bio: text("bio"),
  specialty: varchar("specialty", { length: 128 }),
  instagramHandle: varchar("instagramHandle", { length: 64 }),
  youtubeHandle: varchar("youtubeHandle", { length: 64 }),
  tiktokHandle: varchar("tiktokHandle", { length: 64 }),
  websiteUrl: varchar("websiteUrl", { length: 256 }),
  motivation: text("motivation"), // Por qué quiere ser Expert/Maker
  experience: text("experience"), // Experiencia previa
  // Campos específicos para Expert
  expertCategory: varchar("expertCategory", { length: 64 }),
  certifications: text("certifications"),
  // Admin
  adminNote: text("adminNote"), // Nota del admin al aprobar/rechazar
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"), // userId del admin que revisó
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("buddy_apps_user_idx").on(t.userId),
  statusIdx: index("buddy_apps_status_idx").on(t.status),
  typeIdx: index("buddy_apps_type_idx").on(t.type),
}));
export type BuddyApplication = typeof buddyApplications.$inferSelect;
export type InsertBuddyApplication = typeof buddyApplications.$inferInsert;


// ─── Saved Events ─────────────────────────────────────────────────────────────
export const savedEvents = mysqlTable("saved_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  eventName: varchar("eventName", { length: 128 }).notNull(),
  persons: int("persons").notNull().default(4),
  categories: varchar("categories", { length: 256 }),
  menuData: text("menuData").notNull(), // JSON blob of generated menu
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("saved_events_user_idx").on(t.userId),
}));
export type SavedEvent = typeof savedEvents.$inferSelect;
export type InsertSavedEvent = typeof savedEvents.$inferInsert;

// ─── Recipe Favorites ─────────────────────────────────────────────────────────────────────────────────
export const recipeFavorites = mysqlTable("recipe_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  recipeId: int("recipeId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("recipe_favorites_user_idx").on(t.userId),
  recipeIdx: index("recipe_favorites_recipe_idx").on(t.recipeId),
  uniqueUserRecipe: unique("recipe_favorites_unique").on(t.userId, t.recipeId),
}));
export type RecipeFavorite = typeof recipeFavorites.$inferSelect;
export type InsertRecipeFavorite = typeof recipeFavorites.$inferInsert;

// ─── Meal Reminders ───────────────────────────────────────────────────────────
export const mealReminders = mysqlTable("meal_reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mealType: varchar("mealType", { length: 20 }).notNull(), // desayuno | almuerzo | merienda | cena | snack
  time: varchar("time", { length: 5 }).notNull(), // HH:MM format
  enabled: boolean("enabled").default(true).notNull(),
  // Days bitmask: bit 0 = Monday, bit 1 = Tuesday, ..., bit 6 = Sunday
  // 127 = all days (1111111), 31 = weekdays (0011111), 96 = weekend (1100000)
  daysMask: int("daysMask").default(127).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("meal_reminders_user_idx").on(t.userId),
  uniqueUserMeal: unique("meal_reminders_unique").on(t.userId, t.mealType),
}));
export type MealReminder = typeof mealReminders.$inferSelect;
export type InsertMealReminder = typeof mealReminders.$inferInsert;

// ─── Push Subscriptions ───────────────────────────────────────────────────────
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("push_subs_user_idx").on(t.userId),
}));
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// ─── Achievements ─────────────────────────────────────────────────────────────
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: varchar("achievementId", { length: 64 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  pointsAwarded: int("pointsAwarded").default(0).notNull(),
}, (t) => ({
  userIdx: index("user_achievements_user_idx").on(t.userId),
  uniqueUserAchievement: unique("user_achievements_unique").on(t.userId, t.achievementId),
}));
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// ─── User Points ──────────────────────────────────────────────────────────────
export const userPoints = mysqlTable("user_points", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalPoints: int("totalPoints").default(0).notNull(),
  level: int("level").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;

// =============================================================================
// ROLE REQUESTS (BuddyMaker / BuddyExpert)
// =============================================================================
// Any user can apply to become a BuddyMaker or BuddyExpert.
// BuddyMarket admins review and approve/reject from the admin panel.

export const roleRequests = mysqlTable("role_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  roleType: mysqlEnum("roleType", ["buddymaker", "buddyexpert"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  motivation: text("motivation"), // Why the user wants this role
  socialLinks: text("socialLinks"), // JSON: { instagram, website, youtube }
  specialties: text("specialties"), // JSON array: for buddyexpert (nutrition, sports, etc.)
  reviewNote: text("reviewNote"), // Admin note on approval/rejection
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"), // admin userId
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("role_requests_user_idx").on(t.userId),
  userRoleUnique: unique("role_requests_user_role_unique").on(t.userId, t.roleType),
}));

export type RoleRequest = typeof roleRequests.$inferSelect;
export type InsertRoleRequest = typeof roleRequests.$inferInsert;

// ─── Recipe Likes ─────────────────────────────────────────────────────────────
export const recipeLikes = mysqlTable("recipe_likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  recipeId: int("recipeId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("recipe_likes_user_idx").on(t.userId),
  recipeIdx: index("recipe_likes_recipe_idx").on(t.recipeId),
  uniqueUserRecipe: unique("recipe_likes_unique").on(t.userId, t.recipeId),
}));
export type RecipeLike = typeof recipeLikes.$inferSelect;
export type InsertRecipeLike = typeof recipeLikes.$inferInsert;

// ─── Complements (small daily foods: coffee, tea, yogurt, protein shake, etc.) ─
export const complements = mysqlTable("complements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  nameEs: varchar("nameEs", { length: 256 }),
  category: mysqlEnum("category", [
    "bebida_caliente",
    "bebida_fria",
    "lacteo",
    "proteina",
    "fruta",
    "snack_saludable",
    "suplemento",
    "otro",
  ]).default("otro").notNull(),
  servingSize: int("servingSize").default(100).notNull(),
  servingUnit: varchar("servingUnit", { length: 20 }).default("g").notNull(),
  servingLabel: varchar("servingLabel", { length: 64 }),
  calories: int("calories"),
  proteins: float("proteins"),
  carbs: float("carbs"),
  fats: float("fats"),
  fiber: float("fiber"),
  sugar: float("sugar"),
  caffeine: float("caffeine"),
  imageUrl: text("imageUrl"),
  emoji: varchar("emoji", { length: 8 }).default("🍽️"),
  isSeeded: boolean("isSeeded").default(false),
  isPublic: boolean("isPublic").default(true),
  userId: int("userId"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  nameIdx: index("complements_name_idx").on(t.name),
  categoryIdx: index("complements_category_idx").on(t.category),
}));
export type Complement = typeof complements.$inferSelect;
export type InsertComplement = typeof complements.$inferInsert;

// ─── Complement Logs (diary entries for complements) ──────────────────────────
export const complementLogs = mysqlTable("complement_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  complementId: int("complementId").notNull(),
  quantity: float("quantity").default(1).notNull(),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  mealType: mysqlEnum("mealType", ["desayuno", "media_manana", "comida", "merienda", "cena", "otro"]).default("otro").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("complement_logs_user_idx").on(t.userId),
  dateIdx: index("complement_logs_date_idx").on(t.loggedAt),
}));
export type ComplementLog = typeof complementLogs.$inferSelect;
export type InsertComplementLog = typeof complementLogs.$inferInsert;

// ─── Email Sequence Queue (scheduled onboarding emails) ───────────────────────
export const emailSequenceQueue = mysqlTable("email_sequence_queue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  sequenceStep: int("sequenceStep").notNull(), // 1=day2, 2=day4, 3=day7
  scheduledAt: timestamp("scheduledAt").notNull(),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("email_seq_user_idx").on(t.userId),
  statusIdx: index("email_seq_status_idx").on(t.status),
  scheduledIdx: index("email_seq_scheduled_idx").on(t.scheduledAt),
}));
export type EmailSequenceQueue = typeof emailSequenceQueue.$inferSelect;
export type InsertEmailSequenceQueue = typeof emailSequenceQueue.$inferInsert;

// ─── In-App Notifications ─────────────────────────────────────────────────────
export const inAppNotifications = mysqlTable("in_app_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),                          // target user id (0 = broadcast to all)
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "update", "promo"]).default("info").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  link: varchar("link", { length: 500 }),                   // optional deep-link inside app
  imageUrl: varchar("imageUrl", { length: 500 }),           // optional icon/image
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
}, (t) => ({
  userIdx: index("notif_user_idx").on(t.userId),
  readIdx: index("notif_read_idx").on(t.isRead),
  createdIdx: index("notif_created_idx").on(t.createdAt),
}));
export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type InsertInAppNotification = typeof inAppNotifications.$inferInsert;
