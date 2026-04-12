import {
  boolean,
  numeric,
  real,
  integer,
  serial,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  date,
  index,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── PostgreSQL Enums ──────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin", "buddyexpert", "buddymaker", "business"]);
export const accountTypeEnum = pgEnum("accountType", ["user", "buddymaker", "buddyexpert", "business"]);
export const registrationStepEnum = pgEnum("registrationStep", ["account_type", "profile_setup", "application", "pending_approval", "completed"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const cookingLevelEnum = pgEnum("cookingLevel", ["beginner", "intermediate", "advanced"]);
export const activityLevelEnum = pgEnum("activityLevel", ["sedentary", "light", "moderate", "active", "very_active"]);
export const mainGoalEnum = pgEnum("mainGoal", ["lose_weight", "gain_muscle", "maintain", "improve_health", "eat_healthier"]);
export const heightUnitEnum = pgEnum("heightUnit", ["cm", "ft"]);
export const weightUnitEnum = pgEnum("weightUnit", ["kg", "lb"]);
export const sportsFrequencyEnum = pgEnum("sportsFrequency", ["never", "1_2_week", "3_4_week", "5_plus_week", "daily"]);
export const workTypeEnum = pgEnum("workType", ["sedentary_desk", "light_standing", "moderate_physical", "heavy_physical"]);
export const stressLevelEnum = pgEnum("stressLevel", ["low", "moderate", "high", "very_high"]);
export const alcoholConsumptionEnum = pgEnum("alcoholConsumption", ["none", "occasional", "moderate", "frequent"]);
export const smokingStatusEnum = pgEnum("smokingStatus", ["non_smoker", "ex_smoker", "smoker"]);
export const mealPrepTimeEnum = pgEnum("mealPrepTime", ["under_15", "15_30", "30_60", "over_60"]);
export const snackingHabitsEnum = pgEnum("snackingHabits", ["never", "rarely", "sometimes", "often"]);
export const eatOutFrequencyEnum = pgEnum("eatOutFrequency", ["never", "1_2_month", "1_2_week", "3_plus_week"]);
export const motivationLevelEnum = pgEnum("motivationLevel", ["low", "medium", "high", "very_high"]);
export const preferredMealComplexityEnum = pgEnum("preferredMealComplexity", ["simple", "moderate", "complex"]);
export const portionSizeEnum = pgEnum("portionSize", ["small", "medium", "large"]);
export const statusEnum = pgEnum("status", ["active", "trial", "cancelled", "expired", "past_due", "pending", "approved", "rejected", "transferred", "failed"]);
export const planEnum = pgEnum("plan", ["free", "basic", "premium", "pro_max"]);
export const manualPlanEnum = pgEnum("manualPlan", ["free", "basic", "premium", "pro_max"]);
export const iapPlatformEnum = pgEnum("iapPlatform", ["apple", "google"]);
export const iapEnvironmentEnum = pgEnum("iapEnvironment", ["sandbox", "production"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const mealTimeEnum = pgEnum("mealTime", ["desayuno", "media_manana", "comida", "merienda", "cena", "cualquiera"]);
export const typeEnum = pgEnum("type", ["weekly", "monthly", "custom", "expert", "maker"]);
export const goalEnum = pgEnum("goal", ["perdida_peso", "ganancia_muscular", "tonificacion", "perdida_grasa", "mantenimiento", "bienestar", "vegano"]);
export const supermarketEnum = pgEnum("supermarket", ["general", "mercadona", "lidl", "carrefour", "alcampo", "dia", "el_corte_ingles"]);
export const categoryEnum = pgEnum("category", ["perdida_peso", "ganancia_muscular", "definicion", "dieta_equilibrada", "rendimiento", "bienestar", "vegano", "bebida_caliente", "bebida_fria", "lacteo", "proteina", "fruta", "snack_saludable", "suplemento", "otro", "cereal", "legumbre", "fruto_seco", "semilla", "aceite", "verdura"]);
export const levelEnum = pgEnum("level", ["principiante", "intermedio", "avanzado"]);
export const creatorTypeEnum = pgEnum("creatorType", ["buddyexpert", "buddymaker"]);
export const roleTypeEnum = pgEnum("roleType", ["buddymaker", "buddyexpert"]);
export const mealTypeEnum = pgEnum("mealType", ["desayuno", "media_manana", "comida", "merienda", "cena", "otro"]);
export const ownerTypeEnum = pgEnum("ownerType", ["buddyexpert", "buddymaker"]);
export const notificationTypeEnum = pgEnum("notificationType", ["info", "success", "warning", "error", "promo", "system"]);


// =============================================================================
// USERS & AUTHENTICATION
// =============================================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  imageUrl: text("imageUrl"),
  description: text("description"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  accountType: accountTypeEnum("accountType").default("user").notNull(),
  registrationStep: registrationStepEnum("registrationStep").default("account_type").notNull(),
  locale: varchar("locale", { length: 8 }).default("es").notNull(),
  active: boolean("active").default(true).notNull(),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  passwordHash: text("passwordHash"),
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetExpiresAt: timestamp("passwordResetExpiresAt"),
  emailVerificationToken: varchar("emailVerificationToken", { length: 128 }),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Terms & Conditions acceptance
  termsAcceptedAt: timestamp("termsAcceptedAt"),
  termsVersion: varchar("termsVersion", { length: 16 }),
  privacyAcceptedAt: timestamp("privacyAcceptedAt"),
  marketingConsent: boolean("marketingConsent").default(false),
  marketingConsentAt: timestamp("marketingConsentAt"),
}, (t) => ({
  emailIdx: index("users_email_idx").on(t.email),
  roleIdx: index("users_role_idx").on(t.role),
  activeIdx: index("users_active_idx").on(t.active),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// =============================================================================
// USER PROFILES
// =============================================================================

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  age: integer("age"),
  birthYear: integer("birthYear"),
  height: real("height"),
  weight: real("weight"),
  targetWeight: real("targetWeight"),
  bodyFatPercentage: real("bodyFatPercentage"),
  muscleMass: real("muscleMass"),
  basalMetabolicRate: real("basalMetabolicRate"),
  dailyCalorieGoal: integer("dailyCalorieGoal"),
  dailyProteinGoal: real("dailyProteinGoal"),
  dailyCarbsGoal: real("dailyCarbsGoal"),
  dailyFatGoal: real("dailyFatGoal"),
  sleepHours: integer("sleepHours"),
  dailyMeals: integer("dailyMeals"),
  gender: genderEnum("gender"),
  cookingLevel: cookingLevelEnum("cookingLevel"),
  activityLevel: activityLevelEnum("activityLevel"),
  mainGoal: mainGoalEnum("mainGoal"),
  heightUnit: heightUnitEnum("heightUnit").default("cm"),
  weightUnit: weightUnitEnum("weightUnit").default("kg"),
  practicesSports: boolean("practicesSports").default(false),
  // Extended lifestyle fields
  sportsFrequency: sportsFrequencyEnum("sportsFrequency"),
  sportsTypes: text("sportsTypes"), // JSON array of sport types
  workType: workTypeEnum("workType"),
  stressLevel: stressLevelEnum("stressLevel"),
  waterIntake: real("waterIntake"), // litres per day
  alcoholConsumption: alcoholConsumptionEnum("alcoholConsumption"),
  smokingStatus: smokingStatusEnum("smokingStatus"),
  // Extended nutrition goals
  weightChangeRate: real("weightChangeRate"), // kg per week target
  mealPrepTime: mealPrepTimeEnum("mealPrepTime"), // minutes
  budgetPerWeek: real("budgetPerWeek"), // euros
  // Culinary preferences
  favoriteCuisines: text("favoriteCuisines"), // JSON array
  dislikedIngredients: text("dislikedIngredients"), // JSON array
  cookingEquipment: text("cookingEquipment"), // JSON array: airfryer, oven, etc.
  mealsPerDayDetail: text("mealsPerDayDetail"), // JSON: which meals (breakfast, lunch, etc.)
  snackingHabits: snackingHabitsEnum("snackingHabits"),
  eatOutFrequency: eatOutFrequencyEnum("eatOutFrequency"),
  // Body composition goals
  fitnessGoalDetail: text("fitnessGoalDetail"),
  motivationLevel: motivationLevelEnum("motivationLevel"),
  previousDietExperience: text("previousDietExperience"), // JSON array of past diets tried
  // Menu questionnaire saved preferences
  menuDietType: varchar("menuDietType", { length: 32 }), // omnivore, mediterranean, vegan, keto, paleo, dash, vegetarian, pescatarian, flexitarian
  menuAllergies: text("menuAllergies"), // JSON array of specific allergens
  menuRestrictions: text("menuRestrictions"), // JSON array of dietary restrictions
  menuDislikedFoods: text("menuDislikedFoods"), // comma-separated list
  menuProteinSource: varchar("menuProteinSource", { length: 32 }), // meat, fish, legumes, eggs, mixed, plant
  menuCookingTime: varchar("menuCookingTime", { length: 32 }), // under_15, 15_30, 30_60, over_60
  menuCookingSkill: varchar("menuCookingSkill", { length: 32 }), // beginner, intermediate, advanced
  menuKitchenEquipment: text("menuKitchenEquipment"), // JSON array
  menuSupplements: text("menuSupplements"), // free text
  menuSpecialNotes: text("menuSpecialNotes"), // free text
  menuPersons: integer("menuPersons"), // default number of persons
  menuMealsPerDay: integer("menuMealsPerDay"), // default meals per day
  menuPreferencesUpdatedAt: timestamp("menuPreferencesUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export const userMedicalProfiles = pgTable("user_medical_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
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
  pregnancyWeek: integer("pregnancyWeek"), // if pregnant, week number
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserMedicalProfile = typeof userMedicalProfiles.$inferSelect;

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
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
  preferredMealComplexity: preferredMealComplexityEnum("preferredMealComplexity"),
  portionSize: portionSizeEnum("portionSize"),
  preferSeasonalIngredients: boolean("preferSeasonalIngredients").default(false),
  preferLocalProducts: boolean("preferLocalProducts").default(false),
  avoidProcessedFood: boolean("avoidProcessedFood").default(false),
  interestedInMealPrep: boolean("interestedInMealPrep").default(false),
  wantsShoppingListAutomation: boolean("wantsShoppingListAutomation").default(false),
  wantsCalorieTracking: boolean("wantsCalorieTracking").default(false),
  wantsMacroTracking: boolean("wantsMacroTracking").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  status: statusEnum("status").default("pending").notNull(),
  plan: planEnum("plan").default("free").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  manualPlan: manualPlanEnum("manualPlan").default("free"),
  manualPlanNote: varchar("manualPlanNote", { length: 255 }),
  // ── IAP fields (Apple StoreKit 2 / Google Play Billing) ──────────────────
  iapPlatform: iapPlatformEnum("iapPlatform"),
  iapOriginalTransactionId: varchar("iapOriginalTransactionId", { length: 256 }),
  iapTransactionId: varchar("iapTransactionId", { length: 256 }),
  iapProductId: varchar("iapProductId", { length: 128 }),
  iapEnvironment: iapEnvironmentEnum("iapEnvironment"),
  iapExpiresAt: timestamp("iapExpiresAt"),
  iapLastVerifiedAt: timestamp("iapLastVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;

// =============================================================================
// CATALOGS
// =============================================================================

export const allergies = pgTable("allergies", {
  id: serial("id").primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Allergy = typeof allergies.$inferSelect;

export const dietRestrictions = pgTable("diet_restrictions", {
  id: serial("id").primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DietRestriction = typeof dietRestrictions.$inferSelect;

export const foodCategories = pgTable("food_categories", {
  id: serial("id").primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FoodCategory = typeof foodCategories.$inferSelect;

export const measures = pgTable("measures", {
  id: serial("id").primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }),
  abbreviation: varchar("abbreviation", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Measure = typeof measures.$inferSelect;

export const dayParts = pgTable("day_parts", {
  id: serial("id").primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }),
  order: integer("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DayPart = typeof dayParts.$inferSelect;

export const storageLocations = pgTable("storage_locations", {
  id: serial("id").primaryKey(),
  apiParam: varchar("apiParam", { length: 64 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StorageLocation = typeof storageLocations.$inferSelect;

// =============================================================================
// USER-CATALOG RELATIONS
// =============================================================================

export const userAllergies = pgTable("user_allergies", {
  userId: integer("userId").notNull(),
  allergyId: integer("allergyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.userId, t.allergyId),
}));

export const userDietRestrictions = pgTable("user_diet_restrictions", {
  userId: integer("userId").notNull(),
  dietRestrictionId: integer("dietRestrictionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.userId, t.dietRestrictionId),
}));

export const userFoodCategories = pgTable("user_food_categories", {
  userId: integer("userId").notNull(),
  foodCategoryId: integer("foodCategoryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.userId, t.foodCategoryId),
}));

// =============================================================================
// INGREDIENTS
// =============================================================================

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  apiParam: varchar("apiParam", { length: 128 }).notNull().unique(),
  nameEs: varchar("nameEs", { length: 256 }).notNull(),
  nameEn: varchar("nameEn", { length: 256 }),
  imageUrl: text("imageUrl"),
  purchaseUnitType: varchar("purchaseUnitType", { length: 64 }),
  purchaseGramsPerUnit: integer("purchaseGramsPerUnit"),
  purchaseUnitSingular: varchar("purchaseUnitSingular", { length: 64 }),
  purchaseUnitPlural: varchar("purchaseUnitPlural", { length: 64 }),
  // Nutritional info per 100g
  calories: integer("calories"),
  proteins: real("proteins"),
  carbohydrates: real("carbohydrates"),
  fats: real("fats"),
  saturatedFats: real("saturatedFats"),
  fiber: real("fiber"),
  sugars: real("sugars"),
  sodium: real("sodium"),
  // Extended nutritional info per 100g
  potassium: real("potassium"),       // mg
  calcium: real("calcium"),           // mg
  iron: real("iron"),                 // mg
  magnesium: real("magnesium"),       // mg
  phosphorus: real("phosphorus"),     // mg
  zinc: real("zinc"),                 // mg
  vitaminC: real("vitaminC"),         // mg
  vitaminA: real("vitaminA"),         // mcg RAE
  vitaminD: real("vitaminD"),         // mcg
  vitaminE: real("vitaminE"),         // mg
  vitaminK: real("vitaminK"),         // mcg
  vitaminB1: real("vitaminB1"),       // mg (tiamina)
  vitaminB2: real("vitaminB2"),       // mg (riboflavina)
  vitaminB3: real("vitaminB3"),       // mg (niacina)
  vitaminB6: real("vitaminB6"),       // mg
  vitaminB12: real("vitaminB12"),     // mcg
  folate: real("folate"),             // mcg
  cholesterol: real("cholesterol"),   // mg
  omega3: real("omega3"),             // g
  omega6: real("omega6"),             // g
  // Classification
  category: varchar("category", { length: 64 }),  // frutas, verduras, carnes, lácteos, cereales, legumbres, etc.
  isVegan: boolean("isVegan").default(false),
  isVegetarian: boolean("isVegetarian").default(false),
  isGlutenFree: boolean("isGlutenFree").default(false),
  isDairyFree: boolean("isDairyFree").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = typeof ingredients.$inferInsert;

export const ingredientAllergies = pgTable("ingredient_allergies", {
  ingredientId: integer("ingredientId").notNull(),
  allergyId: integer("allergyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.ingredientId, t.allergyId),
}));

export const userBannedIngredients = pgTable("user_banned_ingredients", {
  userId: integer("userId").notNull(),
  ingredientId: integer("ingredientId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.userId, t.ingredientId),
}));

// =============================================================================
// RECIPES
// =============================================================================

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  imageUrl: text("imageUrl"),
  description: text("description"),
  preparationTime: integer("preparationTime").default(0), // minutes
  cookTime: integer("cookTime").default(0), // minutes
  servings: integer("servings").default(1),
  difficulty: difficultyEnum("difficulty").default("medium"),
  isPublic: boolean("isPublic").default(true),
  active: boolean("active").default(true),
  // Meal time classification
  mealTime: mealTimeEnum("mealTime").default("cualquiera"),
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
  caloriesPerServing: integer("caloriesPerServing"),
  proteinsPerServing: real("proteinsPerServing"),
  carbsPerServing: real("carbsPerServing"),
  fatsPerServing: real("fatsPerServing"),
  fiberPerServing: real("fiberPerServing"),
  // BuddyMaker link
  buddyMakerId: integer("buddyMakerId"),
  // Structured data (JSON)
  ingredientsJson: text("ingredientsJson"), // JSON: [{name, amount, unit, category}]
  instructionsJson: text("instructionsJson"), // JSON: [{step, text}]
  // Seed data flag
  isSeeded: boolean("isSeeded").default(false),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("recipe_user_idx").on(t.userId),
  userCreatedAtIdx: index("recipe_user_created_idx").on(t.userId, t.createdAt),
  mealTimeIdx: index("recipe_meal_time_idx").on(t.mealTime),
  buddyMakerIdx: index("recipe_buddy_maker_idx").on(t.buddyMakerId),
  nameIdx: index("recipe_name_idx").on(t.name),
  cuisineIdx: index("recipe_cuisine_idx").on(t.cuisineType),
  cookingMethodIdx: index("recipe_cooking_method_idx").on(t.cookingMethod),
}));

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipeId").notNull(),
  ingredientId: integer("ingredientId").notNull(),
  measureId: integer("measureId"),
  amount: real("amount").notNull(),
  optional: boolean("optional").default(false),
  notes: text("notes"),
  order: integer("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.recipeId, t.ingredientId),
}));

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = typeof recipeIngredients.$inferInsert;

export const recipeSteps = pgTable("recipe_steps", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipeId").notNull(),
  stepNumber: integer("stepNumber").notNull(),
  instruction: text("instruction").notNull(),
  imageUrl: text("imageUrl"),
  timing: integer("timing"), // minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uniq: unique().on(t.recipeId, t.stepNumber),
}));

export type RecipeStep = typeof recipeSteps.$inferSelect;
export type InsertRecipeStep = typeof recipeSteps.$inferInsert;

export const recipeAllergies = pgTable("recipe_allergies", {
  recipeId: integer("recipeId").notNull(),
  allergyId: integer("allergyId").notNull(),
}, (t) => ({
  pk: unique().on(t.recipeId, t.allergyId),
}));

export const recipeDietRestrictions = pgTable("recipe_diet_restrictions", {
  recipeId: integer("recipeId").notNull(),
  dietRestrictionId: integer("dietRestrictionId").notNull(),
}, (t) => ({
  pk: unique().on(t.recipeId, t.dietRestrictionId),
}));

export const recipeFoodCategories = pgTable("recipe_food_categories", {
  recipeId: integer("recipeId").notNull(),
  foodCategoryId: integer("foodCategoryId").notNull(),
}, (t) => ({
  pk: unique().on(t.recipeId, t.foodCategoryId),
}));

export const userFavoriteRecipes = pgTable("user_favorite_recipes", {
  userId: integer("userId").notNull(),
  recipeId: integer("recipeId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pk: unique().on(t.userId, t.recipeId),
}));

// =============================================================================
// MENU ORGANIZERS
// =============================================================================

export const menuOrganizers = pgTable("menu_organizers", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  type: typeEnum("type").default("weekly"),
  isPublic: boolean("isPublic").default(false),
  objective: text("objective"),
  goal: goalEnum("goal"),
  dailyCalories: integer("dailyCalories"),
  persons: integer("persons").default(1),
  difficulty: difficultyEnum("difficulty").default("easy"),
  isSeeded: boolean("isSeeded").default(false),
  coverImage: text("coverImage"),
  dailyMealsCount: integer("dailyMealsCount").default(3),
   generatedByAI: boolean("generatedByAI").default(false),
  isActive: boolean("isActive").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("menu_user_idx").on(t.userId),
  userCreatedAtIdx: index("menu_user_created_idx").on(t.userId, t.createdAt),
  userActiveIdx: index("menu_user_active_idx").on(t.userId, t.isActive),
}));
export type MenuOrganizer = typeof menuOrganizers.$inferSelect;
export type InsertMenuOrganizer = typeof menuOrganizers.$inferInsert;

export const menuOrganizerDayParts = pgTable("menu_organizer_day_parts", {
  id: serial("id").primaryKey(),
  menuOrganizerId: integer("menuOrganizerId").notNull(),
  dayPartId: integer("dayPartId").notNull(),
  date: date("date"),
  dayNumber: integer("dayNumber"),
  mealNumber: integer("mealNumber"),
  name: varchar("name", { length: 128 }),
  notes: text("notes"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  menuIdIdx: index("menu_dp_menu_idx").on(t.menuOrganizerId),
  menuIdDateIdx: index("menu_dp_menu_date_idx").on(t.menuOrganizerId, t.date),
}));

export type MenuOrganizerDayPart = typeof menuOrganizerDayParts.$inferSelect;

export const menuOrganizerDayPartRecipes = pgTable("menu_dp_recipes", {
  id: serial("id").primaryKey(),
  menuOrganizerDayPartId: integer("menuOrganizerDayPartId").notNull(),
  recipeId: integer("recipeId").notNull(),
  servings: real("servings").default(1),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uniq: unique("mdpr_uniq").on(t.menuOrganizerDayPartId, t.recipeId),
}));

// =============================================================================
// SHOPPING LISTS
// =============================================================================

export const shoppingLists = pgTable("shopping_lists", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  menuOrganizerId: integer("menuOrganizerId"),
  supermarket: supermarketEnum("supermarket").default("general"),
  persons: integer("persons").default(1),
  generatedByAI: boolean("generatedByAI").default(false),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("shopping_user_idx").on(t.userId),
}));

export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = typeof shoppingLists.$inferInsert;

export const shoppingListItems = pgTable("shopping_list_items", {
  id: serial("id").primaryKey(),
  shoppingListId: integer("shoppingListId").notNull(),
  ingredientId: integer("ingredientId"),
  customName: varchar("customName", { length: 256 }),
  amount: real("amount"),
  measureId: integer("measureId"),
  category: varchar("category", { length: 128 }),
  checked: boolean("checked").default(false),
  inPantry: boolean("inPantry").default(false),
  order: integer("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertShoppingListItem = typeof shoppingListItems.$inferInsert;

// =============================================================================
// SHOPPING LIST TEMPLATES
// =============================================================================
export const shoppingListTemplates = pgTable("shopping_list_templates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  supermarket: varchar("supermarket", { length: 64 }).default("general"),
  itemsJson: text("itemsJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ShoppingListTemplate = typeof shoppingListTemplates.$inferSelect;
export type InsertShoppingListTemplate = typeof shoppingListTemplates.$inferInsert;

// =============================================================================
// MERCADONA PRODUCTS CATALOG
// =============================================================================

export const mercadonaProducts = pgTable("mercadona_products", {
  id: integer("id").primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull(),
  name: varchar("name", { length: 512 }).notNull(),
  packaging: varchar("packaging", { length: 128 }),
  thumbnail: varchar("thumbnail", { length: 512 }),
  shareUrl: varchar("share_url", { length: 512 }),
  categoryId: integer("category_id"),
  categoryName: varchar("category_name", { length: 256 }),
  subcategoryId: integer("subcategory_id"),
  subcategoryName: varchar("subcategory_name", { length: 256 }),
  bulkPrice: varchar("bulk_price", { length: 32 }),
  unitPrice: varchar("unit_price", { length: 32 }),
  unitSize: real("unit_size"),
  sizeFormat: varchar("size_format", { length: 16 }),
  referencePrice: varchar("reference_price", { length: 32 }),
  referenceFormat: varchar("reference_format", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  slugIdx: index("merc_slug_idx").on(t.slug),
  catIdx: index("merc_cat_idx").on(t.categoryId),
  nameIdx: index("merc_name_idx").on(t.name),
}));
export type MercadonaProduct = typeof mercadonaProducts.$inferSelect;
export type InsertMercadonaProduct = typeof mercadonaProducts.$inferInsert;

// =============================================================================
// LIDL PRODUCTS
// =============================================================================

export const lidlProducts = pgTable("lidl_products", {
  id: varchar("id", { length: 64 }).primaryKey(), // erpNumber
  name: varchar("name", { length: 512 }).notNull(),
  fullTitle: varchar("full_title", { length: 512 }),
  brand: varchar("brand", { length: 256 }),
  image: varchar("image", { length: 512 }),
  price: real("price"),
  packaging: varchar("packaging", { length: 128 }),
  category: varchar("category", { length: 256 }),
  canonicalPath: varchar("canonical_path", { length: 512 }),
  onlineAvailable: boolean("online_available").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("lidl_name_idx").on(t.name),
  catIdx: index("lidl_cat_idx").on(t.category),
}));
export type LidlProduct = typeof lidlProducts.$inferSelect;
export type InsertLidlProduct = typeof lidlProducts.$inferInsert;

// =============================================================================
// INVENTORY
// =============================================================================

export const userInventoryItems = pgTable("user_inventory_items", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  ingredientId: integer("ingredientId"),
  customName: varchar("customName", { length: 256 }),
  amount: real("amount").notNull(),
  measureId: integer("measureId"),
  storageLocationId: integer("storageLocationId"),
  expirationDate: date("expirationDate"),
  purchaseDate: date("purchaseDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("inventory_user_idx").on(t.userId),
}));

export type UserInventoryItem = typeof userInventoryItems.$inferSelect;
export type InsertUserInventoryItem = typeof userInventoryItems.$inferInsert;

// =============================================================================
// MEAL LOGS (Historial de comidas)
// =============================================================================

export const mealLogs = pgTable("meal_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  recipeId: integer("recipeId"),
  customMealName: varchar("customMealName", { length: 256 }),
  dayPartId: integer("dayPartId"),
  logDate: date("logDate").notNull(),
  servings: real("servings").default(1),
  // Nutritional data at time of logging
  calories: integer("calories"),
  proteins: real("proteins"),
  carbohydrates: real("carbohydrates"),
  fats: real("fats"),
  notes: text("notes"),
  photoUrl: varchar("photoUrl", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("meal_log_user_idx").on(t.userId),
  dateIdx: index("meal_log_date_idx").on(t.logDate),
}));

export type MealLog = typeof mealLogs.$inferSelect;
export type InsertMealLog = typeof mealLogs.$inferInsert;

// Health metrics history
export const userHealthMetrics = pgTable("user_health_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  weight: real("weight"),
  bodyFatPercentage: real("bodyFatPercentage"),
  muscleMass: real("muscleMass"),
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

export const buddyExperts = pgTable("buddy_experts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  specialty: varchar("specialty", { length: 128 }), // "Nutricionista", "Dietista", "Deportista", etc.
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  coverUrl: text("coverUrl"),
  instagramHandle: varchar("instagramHandle", { length: 64 }),
  websiteUrl: text("websiteUrl"),
  category: categoryEnum("category").default("dieta_equilibrada"),
  verified: boolean("verified").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  followersCount: integer("followersCount").default(0).notNull(),
  plansCount: integer("plansCount").default(0).notNull(),
  rating: real("rating").default(0),
  reviewsCount: integer("reviewsCount").default(0).notNull(),
  stripeAccountId: varchar("stripeAccountId", { length: 128 }), // Stripe Connect account
  stripeOnboardingCompleted: boolean("stripeOnboardingCompleted").default(false).notNull(),
  chargesEnabled: boolean("chargesEnabled").default(false).notNull(),
  payoutsEnabled: boolean("payoutsEnabled").default(false).notNull(),
  commissionRate: real("commissionRate").default(0.20).notNull(), // 20% por defecto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("buddy_experts_user_idx").on(t.userId),
  categoryIdx: index("buddy_experts_category_idx").on(t.category),
}));
export type BuddyExpert = typeof buddyExperts.$inferSelect;
export type InsertBuddyExpert = typeof buddyExperts.$inferInsert;

// Planes de menú creados por BuddyExperts
export const expertPlans = pgTable("expert_plans", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  coverUrl: text("coverUrl"),
  category: categoryEnum("category").default("dieta_equilibrada"),
  durationWeeks: integer("durationWeeks").default(4).notNull(),
  dailyCalories: integer("dailyCalories"),
  dailyMeals: integer("dailyMeals").default(3),
  level: levelEnum("level").default("principiante"),
  tags: text("tags"), // JSON array de tags
  isPublic: boolean("isPublic").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  copiesCount: integer("copiesCount").default(0).notNull(),
  likesCount: integer("likesCount").default(0).notNull(),
  price: real("price").default(0), // 0 = gratis, >0 = de pago
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("expert_plans_expert_idx").on(t.expertId),
  categoryIdx: index("expert_plans_category_idx").on(t.category),
}));
export type ExpertPlan = typeof expertPlans.$inferSelect;
export type InsertExpertPlan = typeof expertPlans.$inferInsert;

// Usuarios que han copiado/seguido un plan de experto
export const userExpertPlanCopies = pgTable("user_expert_plan_copies", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  planId: integer("planId").notNull(),
  expertId: integer("expertId").notNull(),
  copiedAt: timestamp("copiedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("plan_copies_user_idx").on(t.userId),
  planIdx: index("plan_copies_plan_idx").on(t.planId),
}));

// Seguidores de BuddyExperts
export const expertFollowers = pgTable("expert_followers", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  expertId: integer("expertId").notNull(),
  followedAt: timestamp("followedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("expert_followers_user_idx").on(t.userId),
  expertIdx: index("expert_followers_expert_idx").on(t.expertId),
}));

// =============================================================================
// BUDDY MAKERS — Creadores de contenido / recetas (tipo Instagram)
// =============================================================================

export const buddyMakers = pgTable("buddy_makers", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
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
  followersCount: integer("followersCount").default(0).notNull(),
  recipesCount: integer("recipesCount").default(0).notNull(),
  rating: real("rating").default(0),
  stripeAccountId: varchar("stripeAccountId", { length: 128 }),
  stripeOnboardingCompleted: boolean("stripeOnboardingCompleted").default(false).notNull(),
  chargesEnabled: boolean("chargesEnabled").default(false).notNull(),
  payoutsEnabled: boolean("payoutsEnabled").default(false).notNull(),
  commissionRate: real("commissionRate").default(0.20).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("buddy_makers_user_idx").on(t.userId),
}));
export type BuddyMaker = typeof buddyMakers.$inferSelect;
export type InsertBuddyMaker = typeof buddyMakers.$inferInsert;

// Seguidores de BuddyMakers
export const makerFollowers = pgTable("maker_followers", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  makerId: integer("makerId").notNull(),
  followedAt: timestamp("followedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("maker_followers_user_idx").on(t.userId),
  makerIdx: index("maker_followers_maker_idx").on(t.makerId),
}));

// =============================================================================
// STRIPE CONNECT — Comisiones y pagos a creadores
// =============================================================================

export const creatorEarnings = pgTable("creator_earnings", {
  id: serial("id").primaryKey(),
  creatorUserId: integer("creatorUserId").notNull(),
  creatorType: creatorTypeEnum("creatorType").notNull(),
  subscriberUserId: integer("subscriberUserId").notNull(),
  subscriptionId: varchar("subscriptionId", { length: 128 }), // Stripe subscription ID
  amount: real("amount").notNull(), // Importe en euros
  commissionRate: real("commissionRate").default(0.20).notNull(),
  commissionAmount: real("commissionAmount").notNull(), // amount * commissionRate
  stripeTransferId: varchar("stripeTransferId", { length: 128 }),
  status: statusEnum("status").default("pending").notNull(),
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

export const expertMenus = pgTable("expert_menus", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  coverUrl: text("coverUrl"),
  weekNumber: integer("weekNumber"), // Semana del año
  year: integer("year"),
  category: categoryEnum("category").default("dieta_equilibrada"),
  dailyCalories: integer("dailyCalories"),
  isFree: boolean("isFree").default(true).notNull(), // Siempre gratis para ganar seguidores
  isPublic: boolean("isPublic").default(true).notNull(),
  copiesCount: integer("copiesCount").default(0).notNull(),
  likesCount: integer("likesCount").default(0).notNull(),
  menuData: text("menuData"), // JSON con los días y comidas del menú semanal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("expert_menus_expert_idx").on(t.expertId),
  categoryIdx: index("expert_menus_category_idx").on(t.category),
}));
export type ExpertMenu = typeof expertMenus.$inferSelect;
export type InsertExpertMenu = typeof expertMenus.$inferInsert;

// =============================================================================
// CARREFOUR PRODUCTS CATALOG
// =============================================================================
export const carrefourProducts = pgTable("carrefour_products", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 512 }).notNull(),
  brand: varchar("brand", { length: 256 }),
  price: real("price"),
  pricePerUnit: varchar("price_per_unit", { length: 64 }),
  image: varchar("image", { length: 512 }),
  category: varchar("category", { length: 256 }),
  subcategory: varchar("subcategory", { length: 256 }),
  packaging: varchar("packaging", { length: 128 }),
  productUrl: varchar("product_url", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("carr_name_idx").on(t.name),
  categoryIdx: index("carr_category_idx").on(t.category),
}));

export type CarrefourProduct = typeof carrefourProducts.$inferSelect;
export type InsertCarrefourProduct = typeof carrefourProducts.$inferInsert;

// =============================================================================
// USER BODY METRICS — Historial de métricas corporales del usuario
// =============================================================================
export const userMetrics = pgTable("user_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: date("date").notNull(), // Fecha de la medición
  weight: real("weight"), // kg
  bodyFat: real("bodyFat"), // % grasa corporal
  muscleMass: real("muscleMass"), // kg masa muscular
  bmi: real("bmi"), // IMC
  waist: real("waist"), // cm cintura
  hip: real("hip"), // cm cadera
  chest: real("chest"), // cm pecho
  arm: real("arm"), // cm brazo
  thigh: real("thigh"), // cm muslo
  calf: real("calf"), // cm pantorrilla
  neck: real("neck"), // cm cuello
  visceralFat: real("visceralFat"), // grasa visceral (nivel 1-20)
  boneMass: real("boneMass"), // kg masa ósea
  waterPercentage: real("waterPercentage"), // % agua corporal
  metabolicAge: integer("metabolicAge"), // edad metabólica
  basalMetabolism: integer("basalMetabolism"), // kcal metabolismo basal
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
export const buddyApplications = pgTable("buddy_applications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: typeEnum("type").notNull(),
  status: statusEnum("status").default("pending").notNull(),
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
  reviewedBy: integer("reviewedBy"), // userId del admin que revisó
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("buddy_apps_user_idx").on(t.userId),
  statusIdx: index("buddy_apps_status_idx").on(t.status),
  typeIdx: index("buddy_apps_type_idx").on(t.type),
}));
export type BuddyApplication = typeof buddyApplications.$inferSelect;
export type InsertBuddyApplication = typeof buddyApplications.$inferInsert;


// ─── Saved Events ─────────────────────────────────────────────────────────────
export const savedEvents = pgTable("saved_events", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  eventName: varchar("eventName", { length: 128 }).notNull(),
  persons: integer("persons").notNull().default(4),
  categories: varchar("categories", { length: 256 }),
  menuData: text("menuData").notNull(), // JSON blob of generated menu
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("saved_events_user_idx").on(t.userId),
}));
export type SavedEvent = typeof savedEvents.$inferSelect;
export type InsertSavedEvent = typeof savedEvents.$inferInsert;

// ─── Recipe Favorites ─────────────────────────────────────────────────────────────────────────────────
export const recipeFavorites = pgTable("recipe_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  recipeId: integer("recipeId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("recipe_favorites_user_idx").on(t.userId),
  recipeIdx: index("recipe_favorites_recipe_idx").on(t.recipeId),
  uniqueUserRecipe: unique("recipe_favorites_unique").on(t.userId, t.recipeId),
}));
export type RecipeFavorite = typeof recipeFavorites.$inferSelect;
export type InsertRecipeFavorite = typeof recipeFavorites.$inferInsert;

// ─── Meal Reminders ───────────────────────────────────────────────────────────
export const mealReminders = pgTable("meal_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  mealType: varchar("mealType", { length: 20 }).notNull(), // desayuno | almuerzo | merienda | cena | snack
  time: varchar("time", { length: 5 }).notNull(), // HH:MM format
  enabled: boolean("enabled").default(true).notNull(),
  // Days bitmask: bit 0 = Monday, bit 1 = Tuesday, ..., bit 6 = Sunday
  // 127 = all days (1111111), 31 = weekdays (0011111), 96 = weekend (1100000)
  daysMask: integer("daysMask").default(127).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("meal_reminders_user_idx").on(t.userId),
  uniqueUserMeal: unique("meal_reminders_unique").on(t.userId, t.mealType),
}));
export type MealReminder = typeof mealReminders.$inferSelect;
export type InsertMealReminder = typeof mealReminders.$inferInsert;

// ─── Push Subscriptions ───────────────────────────────────────────────────────
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("push_subs_user_idx").on(t.userId),
}));
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// ─── Achievements ─────────────────────────────────────────────────────────────
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  achievementId: varchar("achievementId", { length: 64 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  pointsAwarded: integer("pointsAwarded").default(0).notNull(),
}, (t) => ({
  userIdx: index("user_achievements_user_idx").on(t.userId),
  uniqueUserAchievement: unique("user_achievements_unique").on(t.userId, t.achievementId),
}));
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// ─── User Points ──────────────────────────────────────────────────────────────
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  totalPoints: integer("totalPoints").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;

// =============================================================================
// ROLE REQUESTS (BuddyMaker / BuddyExpert)
// =============================================================================
// Any user can apply to become a BuddyMaker or BuddyExpert.
// BuddyMarket admins review and approve/reject from the admin panel.

export const roleRequests = pgTable("role_requests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  roleType: roleTypeEnum("roleType").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  motivation: text("motivation"), // Why the user wants this role
  socialLinks: text("socialLinks"), // JSON: { instagram, website, youtube }
  specialties: text("specialties"), // JSON array: for buddyexpert (nutrition, sports, etc.)
  reviewNote: text("reviewNote"), // Admin note on approval/rejection
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: integer("reviewedBy"), // admin userId
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("role_requests_user_idx").on(t.userId),
  userRoleUnique: unique("role_requests_user_role_unique").on(t.userId, t.roleType),
}));

export type RoleRequest = typeof roleRequests.$inferSelect;
export type InsertRoleRequest = typeof roleRequests.$inferInsert;

// ─── Recipe Likes ─────────────────────────────────────────────────────────────
export const recipeLikes = pgTable("recipe_likes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  recipeId: integer("recipeId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("recipe_likes_user_idx").on(t.userId),
  recipeIdx: index("recipe_likes_recipe_idx").on(t.recipeId),
  uniqueUserRecipe: unique("recipe_likes_unique").on(t.userId, t.recipeId),
}));
export type RecipeLike = typeof recipeLikes.$inferSelect;
export type InsertRecipeLike = typeof recipeLikes.$inferInsert;

// ─── Complements (small daily foods: coffee, tea, yogurt, protein shake, etc.) ─
export const complements = pgTable("complements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  nameEs: varchar("nameEs", { length: 256 }),
  category: categoryEnum("category").default("dieta_equilibrada").notNull(),
  servingSize: integer("servingSize").default(100).notNull(),
  servingUnit: varchar("servingUnit", { length: 20 }).default("g").notNull(),
  servingLabel: varchar("servingLabel", { length: 64 }),
  calories: integer("calories"),
  proteins: real("proteins"),
  carbs: real("carbs"),
  fats: real("fats"),
  fiber: real("fiber"),
  sugar: real("sugar"),
  caffeine: real("caffeine"),
  imageUrl: text("imageUrl"),
  emoji: varchar("emoji", { length: 8 }).default("🍽️"),
  isSeeded: boolean("isSeeded").default(false),
  isPublic: boolean("isPublic").default(true),
  userId: integer("userId"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("complements_name_idx").on(t.name),
  categoryIdx: index("complements_category_idx").on(t.category),
}));
export type Complement = typeof complements.$inferSelect;
export type InsertComplement = typeof complements.$inferInsert;

// ─── Complement Logs (diary entries for complements) ──────────────────────────
export const complementLogs = pgTable("complement_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  complementId: integer("complementId").notNull(),
  quantity: real("quantity").default(1).notNull(),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  mealType: mealTypeEnum("mealType").default("otro").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("complement_logs_user_idx").on(t.userId),
  dateIdx: index("complement_logs_date_idx").on(t.loggedAt),
}));
export type ComplementLog = typeof complementLogs.$inferSelect;
export type InsertComplementLog = typeof complementLogs.$inferInsert;

// ─── Email Sequence Queue (scheduled onboarding emails) ───────────────────────
export const emailSequenceQueue = pgTable("email_sequence_queue", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  sequenceStep: integer("sequenceStep").notNull(), // 1=day2, 2=day4, 3=day7
  scheduledAt: timestamp("scheduledAt").notNull(),
  sentAt: timestamp("sentAt"),
  status: statusEnum("status").default("pending").notNull(),
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
export const inAppNotifications = pgTable("in_app_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),                          // target user id (0 = broadcast to all)
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: notificationTypeEnum("type").default("info").notNull(),
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

// ─── Referral Codes ───────────────────────────────────────────────────────────
// Each BuddyExpert/BuddyMaker has one referral code.
// When a new user subscribes using this code they get a discount (Stripe coupon).
// The referrer earns 20% of each active subscription payment.
export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  ownerType: ownerTypeEnum("ownerType").notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  stripeCouponId: varchar("stripeCouponId", { length: 100 }),
  stripePromoCodeId: varchar("stripePromoCodeId", { length: 100 }),
  discountPercent: integer("discountPercent").default(15).notNull(),
  commissionPercent: integer("commissionPercent").default(20).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  usageCount: integer("usageCount").default(0).notNull(),
  totalEarned: integer("totalEarned").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("referral_user_idx").on(t.userId),
  codeIdx: index("referral_code_idx").on(t.code),
}));
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

// ─── Referral Earnings ────────────────────────────────────────────────────────
export const referralEarnings = pgTable("referral_earnings", {
  id: serial("id").primaryKey(),
  referralCodeId: integer("referralCodeId").notNull(),
  referrerId: integer("referrerId").notNull(),
  referredUserId: integer("referredUserId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 100 }),
  stripeTransferId: varchar("stripeTransferId", { length: 100 }),
  subscriptionAmount: integer("subscriptionAmount").notNull(),
  commissionAmount: integer("commissionAmount").notNull(),
  currency: varchar("currency", { length: 10 }).default("eur").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  transferredAt: timestamp("transferredAt"),
}, (t) => ({
  referralCodeIdx: index("ref_earn_code_idx").on(t.referralCodeId),
  referrerIdx: index("ref_earn_referrer_idx").on(t.referrerId),
}));
export type ReferralEarning = typeof referralEarnings.$inferSelect;
export type InsertReferralEarning = typeof referralEarnings.$inferInsert;

// ─── Referral Subscriptions ───────────────────────────────────────────────────
export const referralSubscriptions = pgTable("referral_subscriptions", {
  id: serial("id").primaryKey(),
  referralCodeId: integer("referralCodeId").notNull(),
  referrerId: integer("referrerId").notNull(),
  referredUserId: integer("referredUserId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  plan: varchar("plan", { length: 50 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  cancelledAt: timestamp("cancelledAt"),
}, (t) => ({
  codeIdx: index("ref_sub_code_idx").on(t.referralCodeId),
  referrerIdx: index("ref_sub_referrer_idx").on(t.referrerId),
  subIdx: index("ref_sub_stripe_idx").on(t.stripeSubscriptionId),
}));
export type ReferralSubscription = typeof referralSubscriptions.$inferSelect;
export type InsertReferralSubscription = typeof referralSubscriptions.$inferInsert;

// =============================================================================
// ALCAMPO PRODUCTS
// =============================================================================
export const alcampoProducts = pgTable("alcampo_products", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 512 }).notNull(),
  brand: varchar("brand", { length: 256 }),
  price: real("price"),
  pricePerUnit: varchar("price_per_unit", { length: 64 }),
  image: varchar("image", { length: 512 }),
  category: varchar("category", { length: 256 }),
  subcategory: varchar("subcategory", { length: 256 }),
  packaging: varchar("packaging", { length: 128 }),
  productUrl: varchar("product_url", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("alc_name_idx").on(t.name),
  categoryIdx: index("alc_category_idx").on(t.category),
}));
export type AlcampoProduct = typeof alcampoProducts.$inferSelect;
export type InsertAlcampoProduct = typeof alcampoProducts.$inferInsert;

// =============================================================================
// MENU COMPLEMENTS  (pequeños extras por menú: café, batido, snack, etc.)
// =============================================================================
export const menuComplements = pgTable("menu_complements", {
  id: serial("id").primaryKey(),
  menuOrganizerId: integer("menuOrganizerId").notNull(),
  userId: integer("userId").notNull(),
  // Si está vinculado a un complemento del catálogo
  complementId: integer("complementId"),
  // O es un complemento personalizado (texto libre)
  customName: varchar("customName", { length: 256 }),
  emoji: varchar("emoji", { length: 8 }).default("☕"),
  mealTime: mealTimeEnum("mealTime").default("cualquiera").notNull(),
  quantity: real("quantity").default(1).notNull(),
  unit: varchar("unit", { length: 32 }).default("ud"),
  calories: integer("calories"),
  notes: text("notes"),
  // Para que al copiar un menú se repliquen automáticamente
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  menuIdx: index("mc_menu_idx").on(t.menuOrganizerId),
  userIdx: index("mc_user_idx").on(t.userId),
}));
export type MenuComplement = typeof menuComplements.$inferSelect;
export type InsertMenuComplement = typeof menuComplements.$inferInsert;

// =============================================================================
// PANTRY STOCK (Despensa Inteligente)
// Tracks what the user has already purchased so the next shopping list
// can automatically mark those items as "already available".
// =============================================================================
export const pantryStock = pgTable("pantry_stock", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  /** Normalized ingredient key used for cross-list matching (lowercase, no accents) */
  ingredientKey: varchar("ingredientKey", { length: 256 }).notNull(),
  /** Human-readable ingredient name as it appeared in the shopping list */
  ingredientName: varchar("ingredientName", { length: 256 }).notNull(),
  /** Commercial unit label, e.g. "1 botella (750 ml)" */
  commercialLabel: varchar("commercialLabel", { length: 256 }),
  /** How many commercial units were purchased */
  quantityPurchased: real("quantityPurchased").default(1).notNull(),
  /** Remaining commercial units (decremented when used in a new list) */
  quantityAvailable: real("quantityAvailable").default(1).notNull(),
  /** Size in grams/ml of one commercial unit (for smart depletion) */
  unitSizeGrams: real("unitSizeGrams"),
  /** Estimated expiry date based on product category */
  estimatedExpiresAt: timestamp("estimatedExpiresAt"),
  /** When the item was purchased */
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("ps_user_idx").on(t.userId),
  userKeyIdx: index("ps_user_key_idx").on(t.userId, t.ingredientKey),
}));
export type PantryStock = typeof pantryStock.$inferSelect;
export type InsertPantryStock = typeof pantryStock.$inferInsert;

// =============================================================================
// AI FEEDBACK
// Stores user feedback on the accuracy of AI food analysis results.
// =============================================================================
export const aiFeedback = pgTable("ai_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  /** The meal log entry that was created from this AI analysis */
  mealLogId: integer("mealLogId"),
  /** Overall accuracy rating: 1 (very inaccurate) to 5 (very accurate) */
  rating: integer("rating").notNull(),
  /** Quick boolean: did the AI correctly identify the dish? */
  accurate: boolean("accurate").notNull(),
  /** Optional free-text comment from the user */
  comment: text("comment"),
  /** The dish name the AI detected */
  detectedDishName: varchar("detectedDishName", { length: 256 }),
  /** Calories the AI estimated */
  detectedCalories: integer("detectedCalories"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("ai_fb_user_idx").on(t.userId),
  ratingIdx: index("ai_fb_rating_idx").on(t.rating),
}));
export type AIFeedback = typeof aiFeedback.$inferSelect;
export type InsertAIFeedback = typeof aiFeedback.$inferInsert;

// =============================================================================
// OTP TOKENS (One-Time Password para login por email)
// =============================================================================
export const otpTokens = pgTable("otp_tokens", {
  id: serial("id").primaryKey(),
  /** Email al que se envió el código */
  email: varchar("email", { length: 320 }).notNull(),
  /** Código OTP de 6 dígitos (almacenado como hash SHA-256) */
  codeHash: varchar("codeHash", { length: 64 }).notNull(),
  /** Cuándo expira el código (10 minutos desde la creación) */
  expiresAt: timestamp("expiresAt").notNull(),
  /** Si el código ya fue usado */
  used: boolean("used").default(false).notNull(),
  /** Número de intentos fallidos de verificación */
  attempts: integer("attempts").default(0).notNull(),
  /** IP del solicitante para rate limiting */
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  emailIdx: index("otp_email_idx").on(t.email),
  expiresIdx: index("otp_expires_idx").on(t.expiresAt),
}));
export type OtpToken = typeof otpTokens.$inferSelect;
export type InsertOtpToken = typeof otpTokens.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// BLOG POSTS — Artículos escritos por BuddyExperts
// ─────────────────────────────────────────────────────────────────────────────
export const blogPostStatusEnum = pgEnum("blogPostStatus", ["draft", "published", "archived"]);

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImageUrl: text("coverImageUrl"),
  category: varchar("category", { length: 64 }).default("Nutrición"),
  tags: text("tags"),
  status: blogPostStatusEnum("status").default("draft").notNull(),
  readTimeMinutes: integer("readTimeMinutes").default(5),
  viewsCount: integer("viewsCount").default(0).notNull(),
  likesCount: integer("likesCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("blog_posts_expert_idx").on(t.expertId),
  statusIdx: index("blog_posts_status_idx").on(t.status),
  slugIdx: index("blog_posts_slug_idx").on(t.slug),
}));
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// =============================================================================
// EXPERT CLIENT PLANS — Planes personalizados con PDF subido por BuddyExperts
// =============================================================================
export const expertClientPlanStatusEnum = pgEnum("expertClientPlanStatus", ["draft", "active", "archived"]);

export const expertClientPlans = pgTable("expert_client_plans", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  clientUserId: integer("clientUserId"),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  pdfUrl: text("pdfUrl"),
  pdfKey: text("pdfKey"),
  pdfFileName: varchar("pdfFileName", { length: 256 }),
  status: expertClientPlanStatusEnum("status").default("draft").notNull(),
  isTemplate: boolean("isTemplate").default(false).notNull(),
  aiGeneratedMenu: text("aiGeneratedMenu"),
  aiGeneratedShoppingList: text("aiGeneratedShoppingList"),
  aiGeneratedAt: timestamp("aiGeneratedAt"),
  weekNumber: integer("weekNumber"),
  year: integer("year"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("ecp_expert_idx").on(t.expertId),
  clientIdx: index("ecp_client_idx").on(t.clientUserId),
  statusIdx: index("ecp_status_idx").on(t.status),
}));
export type ExpertClientPlan = typeof expertClientPlans.$inferSelect;
export type InsertExpertClientPlan = typeof expertClientPlans.$inferInsert;

// =============================================================================
// API HEALTH MONITORING — Sistema de monitorización de APIs
// =============================================================================
export const apiHealthStatusEnum = pgEnum("apiHealthStatus", ["ok", "degraded", "down", "unknown"]);

export const apiMonitors = pgTable("api_monitors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  endpoint: varchar("endpoint", { length: 512 }).notNull(),
  method: varchar("method", { length: 8 }).default("GET").notNull(),
  expectedStatus: integer("expectedStatus").default(200).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastStatus: apiHealthStatusEnum("lastStatus").default("unknown").notNull(),
  lastLatencyMs: integer("lastLatencyMs"),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastErrorMessage: text("lastErrorMessage"),
  failCount: integer("failCount").default(0).notNull(),
  notifiedAt: timestamp("notifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  amNameIdx: index("am_name_idx").on(t.name),
  amStatusIdx: index("am_status_idx").on(t.lastStatus),
}));
export type ApiMonitor = typeof apiMonitors.$inferSelect;
export type InsertApiMonitor = typeof apiMonitors.$inferInsert;

export const apiHealthLogs = pgTable("api_health_logs", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitorId").notNull(),
  status: apiHealthStatusEnum("status").notNull(),
  latencyMs: integer("latencyMs"),
  httpStatus: integer("httpStatus"),
  errorMessage: text("errorMessage"),
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
}, (t) => ({
  ahlMonitorIdx: index("ahl_monitor_idx").on(t.monitorId),
  ahlCheckedIdx: index("ahl_checked_idx").on(t.checkedAt),
}));
export type ApiHealthLog = typeof apiHealthLogs.$inferSelect;
export type InsertApiHealthLog = typeof apiHealthLogs.$inferInsert;

// =============================================================================
// HIPERDINO PRODUCTS
// =============================================================================
export const hiperdinoProducts = pgTable("hiperdino_products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 512 }).notNull(),
  brand: varchar("brand", { length: 256 }),
  image: varchar("image", { length: 512 }),
  price: real("price"),
  packaging: varchar("packaging", { length: 128 }),
  category: varchar("category", { length: 256 }),
  shareUrl: varchar("share_url", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  hdNameIdx: index("hd_name_idx").on(t.name),
  hdCatIdx: index("hd_cat_idx").on(t.category),
}));
export type HiperdinoProduct = typeof hiperdinoProducts.$inferSelect;
export type InsertHiperdinoProduct = typeof hiperdinoProducts.$inferInsert;

// =============================================================================
// HEALTH DATA INTEGRATION — Apple Health & Google Health Connect (Mobile App)
// =============================================================================

// Source of the health data
export const healthDataSourceEnum = pgEnum("healthDataSource", [
  "apple_health",
  "google_health_connect",
  "manual",
  "garmin",
  "fitbit",
  "samsung_health",
  "other",
]);

// Type of health metric
export const healthMetricTypeEnum = pgEnum("healthMetricType", [
  "steps",
  "calories_burned",
  "calories_consumed",
  "weight",
  "heart_rate",
  "heart_rate_resting",
  "sleep_duration",
  "sleep_deep",
  "sleep_rem",
  "sleep_light",
  "blood_pressure_systolic",
  "blood_pressure_diastolic",
  "blood_glucose",
  "oxygen_saturation",
  "body_temperature",
  "respiratory_rate",
  "active_minutes",
  "distance_km",
  "floors_climbed",
  "water_ml",
  "stress_level",
  "vo2_max",
  "hrv",
]);

// Daily health data synced from mobile apps
export const healthDailyData = pgTable("health_daily_data", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: date("date").notNull(),
  source: healthDataSourceEnum("source").notNull().default("manual"),
  steps: integer("steps"),
  caloriesBurned: integer("caloriesBurned"),
  activeMinutes: integer("activeMinutes"),
  distanceKm: real("distanceKm"),
  floorsClimbed: integer("floorsClimbed"),
  weightKg: real("weightKg"),
  heartRateAvg: integer("heartRateAvg"),
  heartRateResting: integer("heartRateResting"),
  heartRateMax: integer("heartRateMax"),
  heartRateMin: integer("heartRateMin"),
  hrv: real("hrv"),
  sleepDurationMin: integer("sleepDurationMin"),
  sleepDeepMin: integer("sleepDeepMin"),
  sleepRemMin: integer("sleepRemMin"),
  sleepLightMin: integer("sleepLightMin"),
  sleepScore: integer("sleepScore"),
  caloriesConsumed: integer("caloriesConsumed"),
  waterMl: integer("waterMl"),
  bloodGlucose: real("bloodGlucose"),
  oxygenSaturation: real("oxygenSaturation"),
  stressLevel: integer("stressLevel"),
  vo2Max: real("vo2Max"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  hddUserIdx: index("hdd_user_idx").on(t.userId),
  hddDateIdx: index("hdd_date_idx").on(t.date),
  hddUserDateIdx: index("hdd_user_date_idx").on(t.userId, t.date),
  hddSourceIdx: index("hdd_source_idx").on(t.source),
}));
export type HealthDailyData = typeof healthDailyData.$inferSelect;
export type InsertHealthDailyData = typeof healthDailyData.$inferInsert;

// Individual health metric readings (granular, for charts)
export const healthMetricReadings = pgTable("health_metric_readings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  metricType: healthMetricTypeEnum("metricType").notNull(),
  value: real("value").notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  source: healthDataSourceEnum("source").notNull().default("manual"),
  recordedAt: timestamp("recordedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  hmrUserIdx: index("hmr_user_idx").on(t.userId),
  hmrTypeIdx: index("hmr_type_idx").on(t.metricType),
  hmrRecordedIdx: index("hmr_recorded_idx").on(t.recordedAt),
  hmrUserTypeIdx: index("hmr_user_type_idx").on(t.userId, t.metricType),
}));
export type HealthMetricReading = typeof healthMetricReadings.$inferSelect;
export type InsertHealthMetricReading = typeof healthMetricReadings.$inferInsert;

// Health integration settings per user
export const healthIntegrations = pgTable("health_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  appleHealthEnabled: boolean("appleHealthEnabled").default(false).notNull(),
  googleHealthConnectEnabled: boolean("googleHealthConnectEnabled").default(false).notNull(),
  garminEnabled: boolean("garminEnabled").default(false).notNull(),
  fitbitEnabled: boolean("fitbitEnabled").default(false).notNull(),
  samsungHealthEnabled: boolean("samsungHealthEnabled").default(false).notNull(),
  syncSteps: boolean("syncSteps").default(true).notNull(),
  syncCalories: boolean("syncCalories").default(true).notNull(),
  syncWeight: boolean("syncWeight").default(true).notNull(),
  syncHeartRate: boolean("syncHeartRate").default(true).notNull(),
  syncSleep: boolean("syncSleep").default(true).notNull(),
  syncBloodGlucose: boolean("syncBloodGlucose").default(false).notNull(),
  syncOxygen: boolean("syncOxygen").default(false).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  hiUserIdx: index("hi_user_idx").on(t.userId),
}));
export type HealthIntegration = typeof healthIntegrations.$inferSelect;
export type InsertHealthIntegration = typeof healthIntegrations.$inferInsert;

// =============================================================================
// FEATURE EVENTS — Tracking de uso de funcionalidades específicas
// =============================================================================
export const featureEvents = pgTable("feature_events", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  /** Feature identifier: barcode_scan, ai_photo_analysis, ai_menu_gen, ai_shopping_gen, etc. */
  feature: varchar("feature", { length: 64 }).notNull(),
  /** Optional metadata (e.g., barcode value, result status) */
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  feIdx: index("fe_feature_idx").on(t.feature),
  feUserIdx: index("fe_user_idx").on(t.userId),
  feCreatedIdx: index("fe_created_idx").on(t.createdAt),
}));
export type FeatureEvent = typeof featureEvents.$inferSelect;
export type InsertFeatureEvent = typeof featureEvents.$inferInsert;

// ===========================================================================
// CONSUM PRODUCTS
// ===========================================================================
export const consumProducts = pgTable("consum_products", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 512 }).notNull(),
  brand: varchar("brand", { length: 256 }),
  price: real("price"),
  pricePerUnit: varchar("price_per_unit", { length: 64 }),
  image: varchar("image", { length: 512 }),
  category: varchar("category", { length: 256 }),
  subcategory: varchar("subcategory", { length: 256 }),
  packaging: varchar("packaging", { length: 128 }),
  productUrl: varchar("product_url", { length: 512 }),
  ean: varchar("ean", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("consum_name_idx").on(t.name),
  categoryIdx: index("consum_category_idx").on(t.category),
  eanIdx: index("consum_ean_idx").on(t.ean),
}));
export type ConsumProduct = typeof consumProducts.$inferSelect;
export type InsertConsumProduct = typeof consumProducts.$inferInsert;

// ===========================================================================
// CONSUM CART HISTORY — Historial de productos añadidos al carrito por usuario
// ===========================================================================
export const consumCartHistory = pgTable("consum_cart_history", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  productId: varchar("productId", { length: 128 }).notNull(),
  productName: varchar("productName", { length: 512 }).notNull(),
  productBrand: varchar("productBrand", { length: 256 }),
  productImage: varchar("productImage", { length: 512 }),
  productPrice: real("productPrice"),
  productCategory: varchar("productCategory", { length: 256 }),
  productPackaging: varchar("productPackaging", { length: 128 }),
  addCount: integer("addCount").default(1).notNull(),
  lastAddedAt: timestamp("lastAddedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  cchUserIdx: index("cch_user_idx").on(t.userId),
  cchProductIdx: index("cch_product_idx").on(t.productId),
  cchUserProductIdx: index("cch_user_product_idx").on(t.userId, t.productId),
  cchLastAddedIdx: index("cch_last_added_idx").on(t.lastAddedAt),
}));
export type ConsumCartHistory = typeof consumCartHistory.$inferSelect;
export type InsertConsumCartHistory = typeof consumCartHistory.$inferInsert;

// =============================================================================
// FOUNDER EMAILS — Usuarios originales de la antigua BuddyMarket
// =============================================================================
export const founderEmails = pgTable("founder_emails", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  claimedAt: timestamp("claimedAt"),
  claimedByUserId: integer("claimedByUserId"),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  addedBy: varchar("addedBy", { length: 128 }).default("import").notNull(),
  notes: varchar("notes", { length: 255 }),
}, (t) => ({
  founderEmailIdx: index("founder_emails_email_idx").on(t.email),
}));
export type FounderEmail = typeof founderEmails.$inferSelect;



// =============================================================================
// BADGES — Sistema de insignias y logros
// =============================================================================
export const badgeRarityEnum = pgEnum("badge_rarity", ["common", "rare", "epic", "legendary"]);
export const badgeCategoryEnum = pgEnum("badge_category", ["ai_adaptation", "community", "consistency", "nutrition", "explorer"]);

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nameEs: varchar("name_es", { length: 128 }).notNull(),
  nameEn: varchar("name_en", { length: 128 }).notNull(),
  descriptionEs: varchar("description_es", { length: 512 }).notNull(),
  descriptionEn: varchar("description_en", { length: 512 }).notNull(),
  icon: varchar("icon", { length: 8 }).notNull(),
  category: badgeCategoryEnum("category").notNull(),
  rarity: badgeRarityEnum("rarity").notNull().default("common"),
  points: integer("points").notNull().default(10),
  triggerCount: integer("trigger_count").default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  badgeSlugIdx: index("badge_slug_idx").on(t.slug),
  badgeCategoryIdx: index("badge_category_idx").on(t.category),
}));
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  metadata: text("metadata"),
}, (t) => ({
  ubUserIdx: index("ub_user_idx").on(t.userId),
  ubBadgeIdx: index("ub_badge_idx").on(t.badgeId),
}));
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

// =============================================================================
// ALLERGY SECURITY — Auditoría, historial y severidad (Recomendaciones #3, #5, #8)
// =============================================================================

// Enum de severidad para alergias del usuario (rec. #8)
export const allergySeverityEnum = pgEnum("allergy_severity", ["medical", "intolerance", "preference"]);

// Historial de cambios en las alergias del usuario (rec. #5)
export const allergyHistory = pgTable("allergy_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  allergyId: integer("allergy_id").notNull(),
  allergyNameEs: varchar("allergy_name_es", { length: 128 }).notNull(),
  action: varchar("action", { length: 16 }).notNull(), // "added" | "removed"
  severity: varchar("severity", { length: 16 }).notNull().default("medical"), // medical | intolerance | preference
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  changedByIp: varchar("changed_by_ip", { length: 64 }),
  userAgent: varchar("user_agent", { length: 512 }),
}, (t) => ({
  ahUserIdx: index("ah_user_idx").on(t.userId),
  ahChangedAtIdx: index("ah_changed_at_idx").on(t.changedAt),
}));
export type AllergyHistory = typeof allergyHistory.$inferSelect;
export type InsertAllergyHistory = typeof allergyHistory.$inferInsert;

// Severidad de las alergias del usuario (rec. #8) — complementa user_allergies
export const userAllergySeverity = pgTable("user_allergy_severity", {
  userId: integer("user_id").notNull(),
  allergyId: integer("allergy_id").notNull(),
  severity: varchar("severity", { length: 16 }).notNull().default("medical"), // medical | intolerance | preference
  confirmedAt: timestamp("confirmed_at").defaultNow().notNull(),
  notes: varchar("notes", { length: 255 }),
}, (t) => ({
  uasPk: unique().on(t.userId, t.allergyId),
  uasUserIdx: index("uas_user_idx").on(t.userId),
}));
export type UserAllergySeverity = typeof userAllergySeverity.$inferSelect;
export type InsertUserAllergySeverity = typeof userAllergySeverity.$inferInsert;

// Registro de auditoría de violaciones detectadas (rec. #3)
export const allergyViolationLogs = pgTable("allergy_violation_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  generationType: varchar("generation_type", { length: 64 }).notNull(), // "menu_questionnaire" | "recipe_expiring" | "menu_basic" | "adapt_recipe"
  forbiddenIngredients: text("forbidden_ingredients").notNull(), // JSON array of detected ingredients
  detectedInText: text("detected_in_text"), // fragmento del texto que provocó la violación (primeros 500 chars)
  restrictionsSnapshot: text("restrictions_snapshot"), // JSON snapshot del perfil en el momento
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  avlUserIdx: index("avl_user_idx").on(t.userId),
  avlCreatedIdx: index("avl_created_idx").on(t.createdAt),
  avlTypeIdx: index("avl_type_idx").on(t.generationType),
}));
export type AllergyViolationLog = typeof allergyViolationLogs.$inferSelect;
export type InsertAllergyViolationLog = typeof allergyViolationLogs.$inferInsert;

// =============================================================================
// PHONE OTP TOKENS (One-Time Password para login por número de teléfono via SMS)
// =============================================================================
export const phoneOtpTokens = pgTable("phone_otp_tokens", {
  id: serial("id").primaryKey(),
  /** Número de teléfono al que se envió el código (normalizado E.164) */
  phone: varchar("phone", { length: 32 }).notNull(),
  /** Código OTP de 6 dígitos (almacenado como hash SHA-256) */
  codeHash: varchar("code_hash", { length: 64 }).notNull(),
  /** Cuándo expira el código (10 minutos desde la creación) */
  expiresAt: timestamp("expires_at").notNull(),
  /** Si el código ya fue usado */
  used: boolean("used").default(false).notNull(),
  /** Número de intentos fallidos de verificación */
  attempts: integer("attempts").default(0).notNull(),
  /** IP del solicitante para rate limiting */
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  phoneOtpPhoneIdx: index("phone_otp_phone_idx").on(t.phone),
  phoneOtpExpiresIdx: index("phone_otp_expires_idx").on(t.expiresAt),
}));
export type PhoneOtpToken = typeof phoneOtpTokens.$inferSelect;
export type InsertPhoneOtpToken = typeof phoneOtpTokens.$inferInsert;

// =============================================================================
// USER REFERRALS — Sistema de referidos para todos los usuarios
// Cada usuario tiene un código único. Cuando un amigo se suscribe usando ese
// código, el referidor gana 1 mes gratis (extensión de suscripción).
// =============================================================================

export const userReferralRewardStatusEnum = pgEnum("user_referral_reward_status", [
  "pending",    // Referido registrado pero aún no suscrito
  "subscribed", // Referido se suscribió — recompensa pendiente de aplicar
  "rewarded",   // Recompensa ya aplicada al referidor
  "expired",    // El referido nunca se suscribió (más de 90 días)
]);

export const userReferrals = pgTable("user_referrals", {
  id: serial("id").primaryKey(),
  /** Usuario que compartió el código */
  referrerId: integer("referrerId").notNull(),
  /** Nuevo usuario que usó el código al registrarse */
  referredId: integer("referredId").notNull().unique(),
  /** Código que se usó */
  referralCode: varchar("referralCode", { length: 32 }).notNull(),
  /** Estado del referido */
  status: userReferralRewardStatusEnum("status").default("pending").notNull(),
  /** Stripe subscription ID del referido (cuando se suscribe) */
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  /** Cuándo el referido se suscribió */
  subscribedAt: timestamp("subscribedAt"),
  /** Cuándo se aplicó la recompensa al referidor */
  rewardedAt: timestamp("rewardedAt"),
  /** Días de suscripción gratuita otorgados al referidor */
  rewardDays: integer("rewardDays").default(30),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  referrerIdx: index("ur_referrer_idx").on(t.referrerId),
  referredIdx: index("ur_referred_idx").on(t.referredId),
  codeIdx: index("ur_code_idx").on(t.referralCode),
}));
export type UserReferral = typeof userReferrals.$inferSelect;
export type InsertUserReferral = typeof userReferrals.$inferInsert;

// Campo referralCode en users se gestiona con ALTER TABLE en migración
// Para evitar modificar la tabla users directamente, usamos una tabla auxiliar
export const userReferralCodes = pgTable("user_referral_codes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  /** Código único de 8 caracteres alfanumérico en mayúsculas */
  code: varchar("code", { length: 32 }).notNull().unique(),
  /** Número total de referidos que se han suscrito */
  totalRewarded: integer("totalRewarded").default(0).notNull(),
  /** Días totales de suscripción gratuita ganados */
  totalRewardDays: integer("totalRewardDays").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("urc_user_idx").on(t.userId),
  codeIdx: index("urc_code_idx").on(t.code),
}));
export type UserReferralCode = typeof userReferralCodes.$inferSelect;
export type InsertUserReferralCode = typeof userReferralCodes.$inferInsert;

// ─────────────────────────────────────────────────────────────
// BUDDYMARKET FOR BUSINESS — B2B Corporate Wellness
// ─────────────────────────────────────────────────────────────

export const companyPlanEnum = pgEnum("companyPlan", ["starter", "business", "enterprise", "corporate"]);
export const companyStatusEnum = pgEnum("companyStatus", ["pending", "trial", "active", "suspended", "cancelled"]);
export const activationCodeStatusEnum = pgEnum("activationCodeStatus", ["available", "used", "expired", "revoked"]);

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  taxId: varchar("taxId", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 30 }),
  plan: companyPlanEnum("plan").notNull().default("starter"),
  status: companyStatusEnum("status").notNull().default("pending"),
  licensesTotal: integer("licensesTotal").notNull().default(10),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  adminUserId: integer("adminUserId"),
  industry: varchar("industry", { length: 100 }),
  employeeCount: integer("employeeCount"),
  notes: text("notes"),
  contractStartAt: timestamp("contractStartAt"),
  contractEndAt: timestamp("contractEndAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  contactEmailIdx: index("company_email_idx").on(t.contactEmail),
  stripeCustomerIdx: index("company_stripe_idx").on(t.stripeCustomerId),
  adminUserIdx: index("company_admin_idx").on(t.adminUserId),
}));
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export const companyActivationCodes = pgTable("company_activation_codes", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  status: activationCodeStatusEnum("status").notNull().default("available"),
  redeemedByUserId: integer("redeemedByUserId"),
  redeemedAt: timestamp("redeemedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  companyIdx: index("cac_company_idx").on(t.companyId),
  codeIdx: index("cac_code_idx").on(t.code),
}));
export type CompanyActivationCode = typeof companyActivationCodes.$inferSelect;
export type InsertCompanyActivationCode = typeof companyActivationCodes.$inferInsert;

export const companyMembers = pgTable("company_members", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  userId: integer("userId").notNull(),
  activationCodeId: integer("activationCodeId"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt"),
  isActive: boolean("isActive").notNull().default(true),
}, (t) => ({
  companyIdx: index("cm_company_idx").on(t.companyId),
  userIdx: index("cm_user_idx").on(t.userId),
  uniqueMember: uniqueIndex("cm_unique_member").on(t.companyId, t.userId),
}));
export type CompanyMember = typeof companyMembers.$inferSelect;
export type InsertCompanyMember = typeof companyMembers.$inferInsert;

export const companyLeads = pgTable("company_leads", {
  id: serial("id").primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 255 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 30 }),
  employeeCount: integer("employeeCount"),
  industry: varchar("industry", { length: 100 }),
  planInterest: companyPlanEnum("planInterest"),
  message: text("message"),
  contacted: boolean("contacted").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  emailIdx: index("cl_email_idx").on(t.contactEmail),
}));
export type CompanyLead = typeof companyLeads.$inferSelect;
export type InsertCompanyLead = typeof companyLeads.$inferInsert;

// ─── B2B Reminders ────────────────────────────────────────────────────────────
export const reminderStatusEnum = pgEnum("reminderStatus", ["pending", "sent", "failed", "cancelled"]);
export const reminderTypeEnum = pgEnum("reminderType", ["activation", "engagement", "expiry_warning", "custom"]);

export const companyReminderCampaigns = pgTable("company_reminder_campaigns", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: reminderTypeEnum("type").notNull().default("activation"),
  subject: varchar("subject", { length: 255 }).notNull(),
  bodyHtml: text("bodyHtml").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  totalRecipients: integer("totalRecipients").notNull().default(0),
  sentCount: integer("sentCount").notNull().default(0),
  failedCount: integer("failedCount").notNull().default(0),
  status: reminderStatusEnum("status").notNull().default("pending"),
  createdByUserId: integer("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  companyIdx: index("crc_company_idx").on(t.companyId),
  statusIdx: index("crc_status_idx").on(t.status),
}));
export type CompanyReminderCampaign = typeof companyReminderCampaigns.$inferSelect;
export type InsertCompanyReminderCampaign = typeof companyReminderCampaigns.$inferInsert;

export const companyReminderLogs = pgTable("company_reminder_logs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaignId").notNull(),
  companyId: integer("companyId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 255 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  activationCode: varchar("activationCode", { length: 20 }),
  status: reminderStatusEnum("status").notNull().default("pending"),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  campaignIdx: index("crl_campaign_idx").on(t.campaignId),
  companyIdx: index("crl_company_idx").on(t.companyId),
  emailIdx: index("crl_email_idx").on(t.recipientEmail),
}));
export type CompanyReminderLog = typeof companyReminderLogs.$inferSelect;
export type InsertCompanyReminderLog = typeof companyReminderLogs.$inferInsert;
