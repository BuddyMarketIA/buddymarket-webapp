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
export const supermarketEnum = pgEnum("supermarket", ["general", "mercadona", "lidl", "carrefour", "alcampo", "dia", "el_corte_ingles", "consum", "hiperdino"]);
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
  /** Código usado al registrarse (empresa tipo EMPRESA2024 o referido de experto/maker) */
  usedReferralCode: varchar("usedReferralCode", { length: 50 }),
  /** Tipo de código usado: company | expert | maker | promo */
  referralCodeType: varchar("referralCodeType", { length: 20 }),
  /** Roles adicionales del usuario (además del role principal). Ej: ["buddyexpert"] para un admin que también es experto */
  secondaryRoles: text("secondaryRoles").array().default([]).notNull(),
}, (t) => ({
  emailIdx: index("users_email_idx").on(t.email),
  roleIdx: index("users_role_idx").on(t.role),
  activeIdx: index("users_active_idx").on(t.active),
  referralCodeIdx: index("users_referral_code_idx").on(t.usedReferralCode),
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
  // Menstrual cycle tracking (only for female users)
  trackMenstrualCycle: boolean("trackMenstrualCycle").default(false),
  menstrualCycleLength: integer("menstrualCycleLength").default(28), // days (typical 21-35)
  menstrualPeriodLength: integer("menstrualPeriodLength").default(5), // days of bleeding (typical 3-7)
  lastPeriodDate: timestamp("lastPeriodDate"), // date of last period start
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
  userId: integer("userId"), // nullable: seeded/BuddyMarket recipes have no owner
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
  // Etiquetas para niños y bebés
  isKidFriendly: boolean("isKidFriendly").default(false),   // apto para niños (>1 año)
  isBabyFriendly: boolean("isBabyFriendly").default(false), // apto para bebés (6-12 meses)
  isFingerFood: boolean("isFingerFood").default(false),      // finger food / BLW
  noAddedSugar: boolean("noAddedSugar").default(false),      // sin azúcar añadido
  highIron: boolean("highIron").default(false),              // alta en hierro
  highCalcium: boolean("highCalcium").default(false),        // alta en calcio
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
  // Google Calendar integration
  googleCalendarConnected: boolean("googleCalendarConnected").default(false).notNull(),
  googleCalendarAccessToken: text("googleCalendarAccessToken"),
  googleCalendarRefreshToken: text("googleCalendarRefreshToken"),
  googleCalendarTokenExpiry: timestamp("googleCalendarTokenExpiry"),
  googleCalendarEmail: varchar("googleCalendarEmail", { length: 256 }),
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
  // Campos específicos para BuddyExpert
  expertCategory: varchar("expertCategory", { length: 64 }),
  certifications: text("certifications"),
  collegiateNumber: varchar("collegiateNumber", { length: 64 }), // Número de colegiado
  yearsExperience: integer("yearsExperience"), // Años de experiencia clínica
  servicesOffered: text("servicesOffered"), // JSON array: consulta_online, presencial, seguimiento, etc.
  consultationPrice: real("consultationPrice"), // Precio por consulta en EUR
  targetAudience: text("targetAudience"), // Público objetivo: adultos, deportistas, niños, etc.
  // Campos específicos para BuddyMaker
  contentNiche: varchar("contentNiche", { length: 128 }), // Nicho: recetas veganas, fitness, etc.
  platforms: text("platforms"), // JSON: { instagram, youtube, tiktok, blog } con seguidores
  followersCount: integer("followersCount"), // Total de seguidores aproximado
  contentFrequency: varchar("contentFrequency", { length: 64 }), // diario, semanal, mensual
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
// EXPERT KNOWLEDGE BASE — Biblioteca de PDFs de dietas del BuddyExpert para IA
// =============================================================================
export const expertKnowledgePdfs = pgTable("expert_knowledge_pdfs", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  pdfUrl: text("pdfUrl").notNull(),
  pdfKey: text("pdfKey").notNull(),
  pdfFileName: varchar("pdfFileName", { length: 256 }),
  extractedContent: text("extractedContent"), // Contenido extraído del PDF para búsqueda IA
  tags: text("tags"), // JSON array: ["perdida_peso", "mediterranea", "diabeticos"]
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("ekp_expert_idx").on(t.expertId),
  activeIdx: index("ekp_active_idx").on(t.isActive),
}));
export type ExpertKnowledgePdf = typeof expertKnowledgePdfs.$inferSelect;
export type InsertExpertKnowledgePdf = typeof expertKnowledgePdfs.$inferInsert;

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

// LLM Latency Log — stores every LLM call for historical latency charting
export const llmLatencyLogs = pgTable("llm_latency_logs", {
  id: serial("id").primaryKey(),
  procedure: varchar("procedure", { length: 100 }).notNull().default("unknown"),
  latencyMs: integer("latencyMs").notNull(),
  success: boolean("success").notNull().default(true),
  finishReason: varchar("finishReason", { length: 50 }),
  totalTokens: integer("totalTokens"),
  errorMessage: text("errorMessage"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, (t) => ({
  lllRecordedIdx: index("lll_recorded_idx").on(t.recordedAt),
  lllProcedureIdx: index("lll_procedure_idx").on(t.procedure),
}));
export type LLMLatencyLog = typeof llmLatencyLogs.$inferSelect;
export type InsertLLMLatencyLog = typeof llmLatencyLogs.$inferInsert;

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

export const companyPlanEnum = pgEnum("companyPlan", ["starter", "growth", "business", "enterprise", "corporate", "global"]);
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
  /** Código único de acceso tipo EMPRESA2024 — los empleados lo usan al registrarse */
  accessCode: varchar("accessCode", { length: 32 }).unique(),
  /** Licencias activas facturadas este mes */
  licensesActive: integer("licensesActive").default(0).notNull(),
  /** Mensaje de bienvenida personalizable que ve el empleado al activar */
  welcomeMessage: text("welcomeMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  contactEmailIdx: index("company_email_idx").on(t.contactEmail),
  stripeCustomerIdx: index("company_stripe_idx").on(t.stripeCustomerId),
  adminUserIdx: index("company_admin_idx").on(t.adminUserId),
  accessCodeIdx: index("company_access_code_idx").on(t.accessCode),
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

/** Estado del snapshot de facturación mensual */
export const billingSnapshotStatusEnum = pgEnum("billing_snapshot_status", [
  "pending",
  "confirmed",
  "paid",
  "disputed",
]);

/**
 * Snapshot mensual de licencias activas por empresa.
 * Se genera el día 28 de cada mes y se actualiza cuando Stripe confirma el pago.
 */
export const companyBillingSnapshots = pgTable("company_billing_snapshots", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  billingPeriodStart: timestamp("billingPeriodStart").notNull(),
  billingPeriodEnd: timestamp("billingPeriodEnd").notNull(),
  /** Empleados con lastActiveAt en los últimos 30 días */
  activeLicenses: integer("activeLicenses").notNull().default(0),
  /** Precio unitario en euros (snapshot del plan ese mes) */
  pricePerLicense: numeric("pricePerLicense", { precision: 10, scale: 2 }).notNull(),
  /** Total = activeLicenses × pricePerLicense */
  totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  stripeSubscriptionItemId: varchar("stripeSubscriptionItemId", { length: 255 }),
  status: billingSnapshotStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  companyIdx: index("cbs_company_idx").on(t.companyId),
  periodIdx: index("cbs_period_idx").on(t.billingPeriodStart),
  invoiceIdx: index("cbs_invoice_idx").on(t.stripeInvoiceId),
}));
export type CompanyBillingSnapshot = typeof companyBillingSnapshots.$inferSelect;
export type InsertCompanyBillingSnapshot = typeof companyBillingSnapshots.$inferInsert;

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

// ─── Modo Familia / Hogar Compartido ─────────────────────────────────────────
export const householdRoleEnum = pgEnum("household_role", ["owner", "admin", "member"]);
export const householdInviteStatusEnum = pgEnum("household_invite_status", ["pending", "accepted", "declined", "expired"]);
export const householdMemberTypeEnum = pgEnum("household_member_type", ["adult", "child", "baby"]);
export const feedingPhaseEnum = pgEnum("feeding_phase", ["breastfeeding", "formula", "purees", "soft_solids", "normal"]);

export const households = pgTable("households", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  ownerId: integer("ownerId").notNull(),
  maxMembers: integer("maxMembers").notNull().default(6),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  ownerIdx: index("hh_owner_idx").on(t.ownerId),
}));
export type Household = typeof households.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;

export const householdMembers = pgTable("household_members", {
  id: serial("id").primaryKey(),
  householdId: integer("householdId").notNull(),
  userId: integer("userId"),  // nullable: miembros manuales (sin cuenta) tienen userId null
  role: householdRoleEnum("role").notNull().default("member"),
  displayName: varchar("displayName", { length: 80 }),
  // Preferencias y restricciones individuales
  dietaryRestrictions: text("dietaryRestrictions"), // JSON array: ["gluten","lactosa",...]
  allergies: text("allergies"),                      // JSON array: ["frutos_secos","mariscos",...]
  preferences: text("preferences"),                 // JSON: { calories: 2000, goal: "lose_weight" }
  // Perfil enriquecido: tipo de miembro y datos pediátricos
  memberType: householdMemberTypeEnum("memberType").notNull().default("adult"),
  birthDate: timestamp("birthDate"),                // para calcular edad automáticamente
  weightKg: real("weightKg"),                       // peso en kg
  heightCm: real("heightCm"),                       // talla en cm
  feedingPhase: feedingPhaseEnum("feedingPhase"),   // fase de alimentación (bebés/niños)
  dislikedFoods: text("dislikedFoods"),             // JSON: ["brócoli", "pescado"]
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  householdIdx: index("hhm_household_idx").on(t.householdId),
  userIdx: index("hhm_user_idx").on(t.userId),
  // uniqueMember solo aplica cuando userId no es null; se gestiona a nivel de aplicación
}));
export type HouseholdMember = typeof householdMembers.$inferSelect;
export type InsertHouseholdMember = typeof householdMembers.$inferInsert;

export const householdInvitations = pgTable("household_invitations", {
  id: serial("id").primaryKey(),
  householdId: integer("householdId").notNull(),
  invitedByUserId: integer("invitedByUserId").notNull(),
  invitedEmail: varchar("invitedEmail", { length: 255 }).notNull(),
  token: varchar("token", { length: 64 }).notNull(),
  status: householdInviteStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  tokenIdx: uniqueIndex("hhi_token_idx").on(t.token),
  householdIdx: index("hhi_household_idx").on(t.householdId),
  emailIdx: index("hhi_email_idx").on(t.invitedEmail),
}));
export type HouseholdInvitation = typeof householdInvitations.$inferSelect;
export type InsertHouseholdInvitation = typeof householdInvitations.$inferInsert;

// ─── Household Recipe Assignments ─────────────────────────────────────────────
export const householdRecipeAssignments = pgTable("household_recipe_assignments", {
  id: serial("id").primaryKey(),
  householdId: integer("householdId").notNull(),
  memberId: integer("memberId").notNull(),        // householdMembers.id
  recipeId: integer("recipeId").notNull(),
  assignedByUserId: integer("assignedByUserId").notNull(),
  note: text("note"),                             // nota opcional del asignador
  mealType: varchar("mealType", { length: 32 }),  // desayuno, almuerzo, cena, snack
  scheduledDate: timestamp("scheduledDate"),      // fecha sugerida (opcional)
  isCompleted: boolean("isCompleted").default(false),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  householdIdx: index("hra_household_idx").on(t.householdId),
  memberIdx: index("hra_member_idx").on(t.memberId),
  recipeIdx: index("hra_recipe_idx").on(t.recipeId),
  uniqueAssignment: uniqueIndex("hra_unique_assignment").on(t.householdId, t.memberId, t.recipeId),
}));
export type HouseholdRecipeAssignment = typeof householdRecipeAssignments.$inferSelect;
export type InsertHouseholdRecipeAssignment = typeof householdRecipeAssignments.$inferInsert;

// =============================================================================
// SUPPORT TICKETS
// =============================================================================
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "waiting_user", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export const ticketCategoryEnum = pgEnum("ticket_category", ["billing", "technical", "account", "feature", "nutrition", "other"]);

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  category: ticketCategoryEnum("category").default("other").notNull(),
  priority: ticketPriorityEnum("priority").default("medium").notNull(),
  status: ticketStatusEnum("status").default("open").notNull(),
  assignedAdminId: integer("assignedAdminId"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("st_user_idx").on(t.userId),
  statusIdx: index("st_status_idx").on(t.status),
  priorityIdx: index("st_priority_idx").on(t.priority),
  categoryIdx: index("st_category_idx").on(t.category),
}));
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull(),
  authorId: integer("authorId").notNull(),
  authorRole: varchar("authorRole", { length: 16 }).notNull(), // "user" | "admin"
  message: text("message").notNull(),
  isInternal: boolean("isInternal").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  ticketIdx: index("sm_ticket_idx").on(t.ticketId),
  authorIdx: index("sm_author_idx").on(t.authorId),
}));
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

// =============================================================================
// BUDDYEXPERTS — GESTIÓN DE PACIENTES
// =============================================================================
export const expertPatientStatusEnum = pgEnum("expertPatientStatus", ["invited", "active", "paused", "discharged"]);
export const expertPatients = pgTable("expert_patients", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  status: expertPatientStatusEnum("status").default("invited").notNull(),
  notes: text("notes"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  inviteToken: varchar("inviteToken", { length: 64 }),
  inviteEmail: varchar("inviteEmail", { length: 255 }),
  inviteAcceptedAt: timestamp("inviteAcceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("ep_expert_idx").on(t.expertId),
  patientIdx: index("ep_patient_idx").on(t.patientUserId),
  tokenIdx: index("ep_token_idx").on(t.inviteToken),
}));
export type ExpertPatient = typeof expertPatients.$inferSelect;
export type InsertExpertPatient = typeof expertPatients.$inferInsert;

export const expertMessages = pgTable("expert_messages", {
  id: serial("id").primaryKey(),
  expertPatientId: integer("expertPatientId").notNull(),
  senderId: integer("senderId").notNull(),
  senderRole: varchar("senderRole", { length: 16 }).notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentType: varchar("attachmentType", { length: 32 }),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  relIdx: index("em_rel_idx").on(t.expertPatientId),
  senderIdx: index("em_sender_idx").on(t.senderId),
}));
export type ExpertMessage = typeof expertMessages.$inferSelect;
export type InsertExpertMessage = typeof expertMessages.$inferInsert;

export const appointmentStatusEnum = pgEnum("appointmentStatus", ["scheduled", "confirmed", "completed", "cancelled", "no_show"]);
export const expertAppointments = pgTable("expert_appointments", {
  id: serial("id").primaryKey(),
  expertPatientId: integer("expertPatientId").notNull(),
  expertId: integer("expertId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  status: appointmentStatusEnum("status").default("scheduled").notNull(),
  modality: varchar("modality", { length: 16 }).default("online").notNull(),
  meetingUrl: text("meetingUrl"),
  location: text("location"),
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 256 }),
  googleCalendarLink: text("googleCalendarLink"),
  googleMeetUrl: text("googleMeetUrl"),
  reminderSentAt: timestamp("reminderSentAt"),
  cancelledAt: timestamp("cancelledAt"),
  cancelReason: text("cancelReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  relIdx: index("ea_rel_idx").on(t.expertPatientId),
  expertIdx: index("ea_expert_idx").on(t.expertId),
  patientIdx: index("ea_patient_idx").on(t.patientUserId),
  startIdx: index("ea_start_idx").on(t.startTime),
}));
export type ExpertAppointment = typeof expertAppointments.$inferSelect;
export type InsertExpertAppointment = typeof expertAppointments.$inferInsert;

export const assignedMenuStatusEnum = pgEnum("assignedMenuStatus", ["pending_adaptation", "adapted", "active", "archived"]);
export const expertAssignedMenus = pgTable("expert_assigned_menus", {
  id: serial("id").primaryKey(),
  expertPatientId: integer("expertPatientId").notNull(),
  expertId: integer("expertId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  originalMenuId: integer("originalMenuId"),
  originalMenuTitle: varchar("originalMenuTitle", { length: 256 }),
  adaptedMenuData: text("adaptedMenuData"),
  adaptationNotes: text("adaptationNotes"),
  status: assignedMenuStatusEnum("status").default("pending_adaptation").notNull(),
  weekStartDate: timestamp("weekStartDate"),
  expertNotes: text("expertNotes"),
  patientFeedback: text("patientFeedback"),
  patientRating: integer("patientRating"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  relIdx: index("eam_rel_idx").on(t.expertPatientId),
  expertIdx: index("eam_expert_idx").on(t.expertId),
  patientIdx: index("eam_patient_idx").on(t.patientUserId),
}));
export type ExpertAssignedMenu = typeof expertAssignedMenus.$inferSelect;
export type InsertExpertAssignedMenu = typeof expertAssignedMenus.$inferInsert;

export const patientProgress = pgTable("patient_progress", {
  id: serial("id").primaryKey(),
  expertPatientId: integer("expertPatientId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  weight: real("weight"),
  bodyFat: real("bodyFat"),
  muscleMass: real("muscleMass"),
  waist: real("waist"),
  hip: real("hip"),
  chest: real("chest"),
  arm: real("arm"),
  thigh: real("thigh"),
  photoUrl: text("photoUrl"),
  notes: text("notes"),
  expertComment: text("expertComment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  relIdx: index("pp_rel_idx").on(t.expertPatientId),
  patientIdx: index("pp_patient_idx").on(t.patientUserId),
  dateIdx: index("pp_date_idx").on(t.recordedAt),
}));
export type PatientProgress = typeof patientProgress.$inferSelect;
export type InsertPatientProgress = typeof patientProgress.$inferInsert;

// =============================================================================
// BUDDYMAKERS — ANALÍTICAS DE ALCANCE
// =============================================================================
export const recipeAnalytics = pgTable("recipe_analytics", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipeId").notNull(),
  makerId: integer("makerId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  views: integer("views").default(0).notNull(),
  uniqueViews: integer("uniqueViews").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  saves: integer("saves").default(0).notNull(),
  shares: integer("shares").default(0).notNull(),
  comments: integer("comments").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  recipeIdx: index("ra_recipe_idx").on(t.recipeId),
  makerIdx: index("ra_maker_idx").on(t.makerId),
  dateIdx: index("ra_date_idx").on(t.date),
}));
export type RecipeAnalytic = typeof recipeAnalytics.$inferSelect;
export type InsertRecipeAnalytic = typeof recipeAnalytics.$inferInsert;

// =============================================================================
// SERVER LOGS — REGISTROS DE ERRORES Y EVENTOS DEL SERVIDOR
// =============================================================================
export const logLevelEnum = pgEnum("logLevel", ["debug", "info", "warn", "error", "fatal"]);

export const serverLogs = pgTable("server_logs", {
  id: serial("id").primaryKey(),
  level: logLevelEnum("level").notNull().default("error"),
  message: text("message").notNull(),
  stack: text("stack"),
  path: varchar("path", { length: 500 }),
  method: varchar("method", { length: 10 }),
  statusCode: integer("statusCode"),
  userId: integer("userId"),
  userAgent: text("userAgent"),
  ip: varchar("ip", { length: 100 }),
  metadata: text("metadata"), // JSON serializado
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  levelIdx: index("sl_level_idx").on(t.level),
  createdAtIdx: index("sl_created_at_idx").on(t.createdAt),
  resolvedIdx: index("sl_resolved_idx").on(t.resolved),
  userIdx: index("sl_user_idx").on(t.userId),
}));
export type ServerLog = typeof serverLogs.$inferSelect;
export type InsertServerLog = typeof serverLogs.$inferInsert;

// =============================================================================
// INGREDIENT NUTRITION — BASE DE DATOS NUTRICIONAL DE INGREDIENTES
// =============================================================================
export const ingredientNutrition = pgTable("ingredient_nutrition", {
  id: serial("id").primaryKey(),
  // Identificación
  name: varchar("name", { length: 200 }).notNull(),
  nameEn: varchar("nameEn", { length: 200 }),
  aliases: text("aliases"),          // JSON array de sinónimos/variantes
  category: varchar("category", { length: 100 }),
  // Valores por 100g
  calories: real("calories").default(0).notNull(),
  protein: real("protein").default(0).notNull(),
  carbs: real("carbs").default(0).notNull(),
  fat: real("fat").default(0).notNull(),
  fiber: real("fiber").default(0),
  sugar: real("sugar").default(0),
  sodium: real("sodium").default(0),
  saturatedFat: real("saturatedFat").default(0),
  // Micronutrientes (por 100g)
  vitaminC: real("vitaminC"),
  vitaminA: real("vitaminA"),
  vitaminD: real("vitaminD"),
  vitaminB12: real("vitaminB12"),
  calcium: real("calcium"),
  iron: real("iron"),
  potassium: real("potassium"),
  magnesium: real("magnesium"),
  // Metadatos
  glycemicIndex: integer("glycemicIndex"),
  isProcessed: boolean("isProcessed").default(false),
  source: varchar("source", { length: 100 }).default("generated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("in_name_idx").on(t.name),
  categoryIdx: index("in_category_idx").on(t.category),
}));
export type IngredientNutrition = typeof ingredientNutrition.$inferSelect;
export type InsertIngredientNutrition = typeof ingredientNutrition.$inferInsert;

// =============================================================================
// EXPERT MENU TEMPLATES (Plantillas de menú del nutricionista)
// =============================================================================
export const expertMenuTemplates = pgTable("expert_menu_templates", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).default("dieta_equilibrada").notNull(),
  targetGoal: varchar("targetGoal", { length: 64 }),
  dailyCalories: integer("dailyCalories"),
  durationDays: integer("durationDays").default(7).notNull(),
  menuData: text("menuData").notNull(),
  restrictions: text("restrictions"),
  allergensFree: text("allergensFree"),
  tags: text("tags"),
  isActive: boolean("isActive").default(true).notNull(),
  timesAssigned: integer("timesAssigned").default(0).notNull(),
  sourceType: varchar("sourceType", { length: 32 }).default("manual").notNull(),
  sourcePdfUrl: text("sourcePdfUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("emt_expert_idx").on(t.expertId),
  categoryIdx: index("emt_category_idx").on(t.category),
}));
export type ExpertMenuTemplate = typeof expertMenuTemplates.$inferSelect;
export type InsertExpertMenuTemplate = typeof expertMenuTemplates.$inferInsert;

// =============================================================================
// PDF MENU IMPORTS (Importaciones de PDF a menú)
// =============================================================================
export const pdfMenuImports = pgTable("pdf_menu_imports", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  originalFilename: varchar("originalFilename", { length: 256 }).notNull(),
  pdfUrl: text("pdfUrl").notNull(),
  status: varchar("status", { length: 32 }).default("processing").notNull(),
  extractedText: text("extractedText"),
  parsedMenuData: text("parsedMenuData"),
  errorMessage: text("errorMessage"),
  templateId: integer("templateId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("pmi_expert_idx").on(t.expertId),
}));
export type PdfMenuImport = typeof pdfMenuImports.$inferSelect;
export type InsertPdfMenuImport = typeof pdfMenuImports.$inferInsert;

// =============================================================================
// EXPERT PATIENT NOTES (Notas internas del nutricionista sobre pacientes)
// =============================================================================
export const expertPatientNotes = pgTable("expert_patient_notes", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  expertPatientId: integer("expertPatientId").notNull(),
  content: text("content").notNull(),
  noteType: varchar("noteType", { length: 32 }).default("general").notNull(), // general | clinical | diet | goal | alert
  isPinned: boolean("isPinned").default(false).notNull(),
  isPrivate: boolean("isPrivate").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("epn_expert_idx").on(t.expertId),
  patientIdx: index("epn_patient_idx").on(t.patientUserId),
  expertPatientIdx: index("epn_ep_idx").on(t.expertPatientId),
}));
export type ExpertPatientNote = typeof expertPatientNotes.$inferSelect;
export type InsertExpertPatientNote = typeof expertPatientNotes.$inferInsert;

// =============================================================================
// PATIENT WELLBEING LOGS (Registro de síntomas y bienestar del paciente)
// =============================================================================
export const patientWellbeingLogs = pgTable("patient_wellbeing_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  logDate: date("logDate").notNull(),
  energyLevel: integer("energyLevel"), // 1-10
  digestiveComfort: integer("digestiveComfort"), // 1-10
  sleepQuality: integer("sleepQuality"), // 1-10
  moodLevel: integer("moodLevel"), // 1-10
  hungerLevel: integer("hungerLevel"), // 1-10
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("pwl_user_idx").on(t.userId),
  dateIdx: index("pwl_date_idx").on(t.logDate),
}));
export type PatientWellbeingLog = typeof patientWellbeingLogs.$inferSelect;
export type InsertPatientWellbeingLog = typeof patientWellbeingLogs.$inferInsert;

// =============================================================================
// WEEKLY CHECKINS (Check-in semanal del paciente)
// =============================================================================
export const weeklyCheckins = pgTable("weekly_checkins", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  expertPatientId: integer("expertPatientId"),
  weekStart: date("weekStart").notNull(),
  weight: real("weight"),
  photoUrl: varchar("photoUrl", { length: 1024 }),
  adherenceRating: integer("adherenceRating"), // 1-10
  hungerRating: integer("hungerRating"), // 1-10
  energyRating: integer("energyRating"), // 1-10
  difficultyNotes: text("difficultyNotes"),
  generalNotes: text("generalNotes"),
  expertFeedback: text("expertFeedback"),
  expertFeedbackAt: timestamp("expertFeedbackAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("wc_user_idx").on(t.userId),
  weekIdx: index("wc_week_idx").on(t.weekStart),
}));
export type WeeklyCheckin = typeof weeklyCheckins.$inferSelect;
export type InsertWeeklyCheckin = typeof weeklyCheckins.$inferInsert;

// =============================================================================
// PATIENT MILESTONES (Hitos y logros del paciente marcados por el experto)
// =============================================================================
export const patientMilestones = pgTable("patient_milestones", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  expertPatientId: integer("expertPatientId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  milestoneDate: date("milestoneDate").notNull(),
  icon: varchar("icon", { length: 8 }).default("🏆"),
  isNotified: boolean("isNotified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("pm_expert_idx").on(t.expertId),
  patientIdx: index("pm_patient_idx").on(t.patientUserId),
}));
export type PatientMilestone = typeof patientMilestones.$inferSelect;
export type InsertPatientMilestone = typeof patientMilestones.$inferInsert;

// =============================================================================
// SESSION NOTES (Actas de sesión / historial de consultas del experto)
// =============================================================================
export const sessionNotes = pgTable("session_notes", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  expertPatientId: integer("expertPatientId").notNull(),
  appointmentId: integer("appointmentId"),
  sessionDate: date("sessionDate").notNull(),
  summary: text("summary").notNull(),
  agreements: text("agreements"),
  nextObjectives: text("nextObjectives"),
  nextAppointmentDate: date("nextAppointmentDate"),
  patientWeight: real("patientWeight"),
  patientMood: integer("patientMood"),
  adherenceScore: integer("adherenceScore"),
  privateNotes: text("privateNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("sn_expert_idx").on(t.expertId),
  patientIdx: index("sn_patient_idx").on(t.patientUserId),
  expertPatientIdx: index("sn_ep_idx").on(t.expertPatientId),
  dateIdx: index("sn_date_idx").on(t.sessionDate),
}));
export type SessionNote = typeof sessionNotes.$inferSelect;
export type InsertSessionNote = typeof sessionNotes.$inferInsert;

// =============================================================================
// MENU TEMPLATES (Plantillas de menús reutilizables del experto)
// =============================================================================
export const menuTemplates = pgTable("menu_templates", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).default("general"),
  targetCalories: integer("targetCalories"),
  weekData: text("weekData").notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  usageCount: integer("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("mt_expert_idx").on(t.expertId),
  categoryIdx: index("mt_category_idx").on(t.category),
}));
export type MenuTemplate = typeof menuTemplates.$inferSelect;
export type InsertMenuTemplate = typeof menuTemplates.$inferInsert;

// =============================================================================
// FOOD SUBSTITUTIONS (Banco de sustituciones de alimentos)
// =============================================================================
export const foodSubstitutions = pgTable("food_substitutions", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  originalFood: varchar("originalFood", { length: 256 }).notNull(),
  originalAmount: varchar("originalAmount", { length: 64 }),
  substitutes: text("substitutes").notNull(),
  category: varchar("category", { length: 64 }).default("general"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("fs_expert_idx").on(t.expertId),
  foodIdx: index("fs_food_idx").on(t.originalFood),
}));
export type FoodSubstitution = typeof foodSubstitutions.$inferSelect;
export type InsertFoodSubstitution = typeof foodSubstitutions.$inferInsert;

// =============================================================================
// SESSION PACKAGES (Paquetes de sesiones / bonos)
// =============================================================================
export const sessionPackages = pgTable("session_packages", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  sessionsCount: integer("sessionsCount").notNull(),
  price: real("price").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("sp_expert_idx").on(t.expertId),
}));
export type SessionPackage = typeof sessionPackages.$inferSelect;
export type InsertSessionPackage = typeof sessionPackages.$inferInsert;

export const patientPackages = pgTable("patient_packages", {
  id: serial("id").primaryKey(),
  expertPatientId: integer("expertPatientId").notNull(),
  packageId: integer("packageId").notNull(),
  sessionsUsed: integer("sessionsUsed").default(0).notNull(),
  sessionsTotal: integer("sessionsTotal").notNull(),
  stripePaymentId: varchar("stripePaymentId", { length: 256 }),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
}, (t) => ({
  patientPkgIdx: index("patient_pkg_patient_idx").on(t.expertPatientId),
}));
export type PatientPackage = typeof patientPackages.$inferSelect;
export type InsertPatientPackage = typeof patientPackages.$inferInsert;

// =============================================================================
// PLANES DE SERVICIO DEL NUTRICIONISTA (para contratación por pacientes)
// =============================================================================
export const expertServicePlans = pgTable("expert_service_plans", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  price: real("price").notNull(),
  billingPeriod: varchar("billingPeriod", { length: 32 }).default("monthly").notNull(),
  durationMonths: integer("durationMonths"),
  includes: text("includes"), // JSON array de strings
  maxConsultations: integer("maxConsultations"),
  isActive: boolean("isActive").default(true).notNull(),
  isPopular: boolean("isPopular").default(false).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  espExpertIdx: index("esp_expert_idx").on(t.expertId),
}));
export type ExpertServicePlan = typeof expertServicePlans.$inferSelect;
export type InsertExpertServicePlan = typeof expertServicePlans.$inferInsert;

// =============================================================================
// SOLICITUDES DE CONTRATACIÓN (paciente → nutricionista)
// =============================================================================
export const expertHireRequests = pgTable("expert_hire_requests", {
  id: serial("id").primaryKey(),
  patientUserId: integer("patientUserId").notNull(),
  expertId: integer("expertId").notNull(),
  servicePlanId: integer("servicePlanId"),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  message: text("message"),
  expertResponse: text("expertResponse"),
  expertPatientId: integer("expertPatientId"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  ehrPatientIdx: index("ehr_patient_idx").on(t.patientUserId),
  ehrExpertIdx: index("ehr_expert_idx").on(t.expertId),
  ehrStatusIdx: index("ehr_status_idx").on(t.status),
}));
export type ExpertHireRequest = typeof expertHireRequests.$inferSelect;
export type InsertExpertHireRequest = typeof expertHireRequests.$inferInsert;

// =============================================================================
// SISTEMA DE APRENDIZAJE ADAPTATIVO — BUDDY INTELLIGENCE
// =============================================================================

export const recipeInteractionTypeEnum = pgEnum("recipeInteractionType", [
  "view", "long_view", "save", "cooked", "like", "dislike", "skip", "share", "add_to_menu", "log_meal"
]);

export const userTasteProfile = pgTable("user_taste_profile", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  cuisineScores: text("cuisineScores").default("{}"),
  ingredientScores: text("ingredientScores").default("{}"),
  cookingMethodScores: text("cookingMethodScores").default("{}"),
  mealTimeScores: text("mealTimeScores").default("{}"),
  complexityPreference: real("complexityPreference").default(0),
  avgPrepTimePreference: real("avgPrepTimePreference").default(30),
  avgCaloriesPreference: real("avgCaloriesPreference").default(500),
  totalInteractions: integer("totalInteractions").default(0).notNull(),
  confidenceScore: integer("confidenceScore").default(0).notNull(),
  lastCalculatedAt: timestamp("lastCalculatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  utpUserIdx: index("utp_user_idx").on(t.userId),
}));
export type UserTasteProfile = typeof userTasteProfile.$inferSelect;
export type InsertUserTasteProfile = typeof userTasteProfile.$inferInsert;

export const recipeInteractions = pgTable("recipe_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  recipeId: integer("recipeId").notNull(),
  type: recipeInteractionTypeEnum("type").notNull(),
  signalWeight: real("signalWeight").default(0).notNull(),
  context: text("context"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  riUserIdx: index("ri_user_idx").on(t.userId),
  riRecipeIdx: index("ri_recipe_idx").on(t.recipeId),
  riTypeIdx: index("ri_type_idx").on(t.type),
  riUserRecipeIdx: index("ri_user_recipe_idx").on(t.userId, t.recipeId),
}));
export type RecipeInteraction = typeof recipeInteractions.$inferSelect;
export type InsertRecipeInteraction = typeof recipeInteractions.$inferInsert;

export const userAIFeedback = pgTable("user_ai_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  feedbackType: varchar("feedbackType", { length: 64 }).notNull(),
  entityId: integer("entityId"),
  entityType: varchar("entityType", { length: 32 }),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uafUserIdx: index("uaf_user_idx").on(t.userId),
  uafTypeIdx: index("uaf_type_idx").on(t.feedbackType),
}));
export type UserAIFeedback = typeof userAIFeedback.$inferSelect;
export type InsertUserAIFeedback = typeof userAIFeedback.$inferInsert;

// =============================================================================
// RETENTION FEATURES — Streak Shield, Weekly Challenges, 30-Day Challenge, Monthly Reports, Taste Insights
// =============================================================================

// ─── Streak Shield ────────────────────────────────────────────────────────────
export const streakShields = pgTable("streak_shields", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  shieldsAvailable: integer("shieldsAvailable").default(1).notNull(),
  lastShieldGrantedAt: timestamp("lastShieldGrantedAt"),
  shieldsUsedTotal: integer("shieldsUsedTotal").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  ssUserIdx: index("ss_user_idx").on(t.userId),
}));
export type StreakShield = typeof streakShields.$inferSelect;
export type InsertStreakShield = typeof streakShields.$inferInsert;

// ─── Weekly Challenges ────────────────────────────────────────────────────────
export const weeklyChallenges = pgTable("weekly_challenges", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  titleEs: varchar("titleEs", { length: 128 }).notNull(),
  descriptionEs: text("descriptionEs").notNull(),
  icon: varchar("icon", { length: 8 }).notNull(),
  targetValue: integer("targetValue").notNull(),
  metricType: varchar("metricType", { length: 64 }).notNull(),
  pointsReward: integer("pointsReward").default(100).notNull(),
  badgeSlug: varchar("badgeSlug", { length: 64 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WeeklyChallenge = typeof weeklyChallenges.$inferSelect;

export const userWeeklyChallenges = pgTable("user_weekly_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  challengeId: integer("challengeId").notNull(),
  weekStart: date("weekStart").notNull(),
  currentValue: integer("currentValue").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  pointsAwarded: integer("pointsAwarded").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  uwcUserIdx: index("uwc_user_idx").on(t.userId),
  uwcWeekIdx: index("uwc_week_idx").on(t.weekStart),
  uwcUnique: unique("uwc_unique").on(t.userId, t.challengeId, t.weekStart),
}));
export type UserWeeklyChallenge = typeof userWeeklyChallenges.$inferSelect;

// ─── 30-Day Challenge ─────────────────────────────────────────────────────────
export const thirtyDayChallengeTypeEnum = pgEnum("thirtyDayChallengeType", ["weight_loss", "muscle_gain", "wellness"]);

export const thirtyDayChallenges = pgTable("thirty_day_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  challengeType: thirtyDayChallengeTypeEnum("challengeType").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  currentDay: integer("currentDay").default(0).notNull(),
  completedDays: text("completedDays").default("[]").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  tdcUserIdx: index("tdc_user_idx").on(t.userId),
}));
export type ThirtyDayChallenge = typeof thirtyDayChallenges.$inferSelect;

// ─── Monthly Reports ──────────────────────────────────────────────────────────
export const monthlyReports = pgTable("monthly_reports", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  pdfUrl: text("pdfUrl"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  summaryJson: text("summaryJson"),
}, (t) => ({
  mrUserIdx: index("mr_user_idx").on(t.userId),
  mrUnique: unique("mr_unique").on(t.userId, t.year, t.month),
}));
export type MonthlyReport = typeof monthlyReports.$inferSelect;

// ─── Taste Insights ───────────────────────────────────────────────────────────
export const tasteInsights = pgTable("taste_insights", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  topCuisines: text("topCuisines").default("[]").notNull(),
  topIngredients: text("topIngredients").default("[]").notNull(),
  avoidedIngredients: text("avoidedIngredients").default("[]").notNull(),
  preferredComplexity: varchar("preferredComplexity", { length: 32 }),
  insightSummaryEs: text("insightSummaryEs"),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().notNull(),
}, (t) => ({
  tiUserIdx: index("ti_user_idx").on(t.userId),
}));
export type TasteInsight = typeof tasteInsights.$inferSelect;

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const feedbackCategoryEnum = pgEnum("feedbackCategory", ["bug", "improvement", "idea", "other"]);
export const feedbackStatusEnum = pgEnum("feedbackStatus", ["pending", "reviewed", "resolved"]);
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  category: feedbackCategoryEnum("category").notNull(),
  message: text("message").notNull(),
  status: feedbackStatusEnum("status").default("pending").notNull(),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  fbUserIdx: index("fb_user_idx").on(t.userId),
  fbStatusIdx: index("fb_status_idx").on(t.status),
  fbCreatedIdx: index("fb_created_idx").on(t.createdAt),
}));
export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;

// ─── BuddyPet ─────────────────────────────────────────────────────────────────
export const petSpeciesEnum = pgEnum("petSpecies", [
  "dog", "cat", "rabbit", "bird", "hamster", "guinea_pig", "fish", "turtle", "ferret", "other"
]);
export const petWeightUnitEnum = pgEnum("petWeightUnit", ["kg", "lb"]);

export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  species: petSpeciesEnum("species").notNull(),
  breed: varchar("breed", { length: 150 }),
  weightValue: real("weightValue").notNull(),
  weightUnit: petWeightUnitEnum("weightUnit").default("kg").notNull(),
  ageYears: integer("ageYears"),
  ageMonths: integer("ageMonths"),
  gender: varchar("gender", { length: 10 }),
  neutered: boolean("neutered").default(false),
  healthNotes: text("healthNotes"),
  avatarEmoji: varchar("avatarEmoji", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  petUserIdx: index("pet_user_idx").on(t.userId),
}));
export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;

export const petMenus = pgTable("petMenus", {
  id: serial("id").primaryKey(),
  petId: integer("petId").notNull(),
  userId: integer("userId").notNull(),
  weekLabel: varchar("weekLabel", { length: 50 }),
  menuJson: text("menuJson").notNull(),
  shoppingListJson: text("shoppingListJson"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pmPetIdx: index("pm_pet_idx").on(t.petId),
  pmUserIdx: index("pm_user_idx").on(t.userId),
}));
export type PetMenu = typeof petMenus.$inferSelect;
export type NewPetMenu = typeof petMenus.$inferInsert;

// ─── Veterinary Clinics ───────────────────────────────────────────────────────
export const petAlertTypeEnum = pgEnum("petAlertType", [
  "vaccine", "checkup", "medication", "weight", "diet", "deworming", "dental", "surgery", "other"
]);
export const petAlertStatusEnum = pgEnum("petAlertStatus", ["pending", "sent", "resolved", "dismissed"]);
export const petClinicLinkStatusEnum = pgEnum("petClinicLinkStatus", ["pending", "active", "revoked"]);

export const vetClinics = pgTable("vetClinics", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 300 }),
  logoUrl: text("logoUrl"),
  description: text("description"),
  city: varchar("city", { length: 64 }),
  province: varchar("province", { length: 64 }),
  licenseNumber: varchar("licenseNumber", { length: 64 }),
  specialtiesJson: text("specialtiesJson"),  // JSON array de especialidades
  coverUrl: text("coverUrl"),
  accessCode: varchar("accessCode", { length: 12 }).notNull().unique(), // código que comparte la clínica con los dueños
  ownerId: integer("ownerId").notNull(),                                  // usuario que creó la clínica
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  vcOwnerIdx: index("vc_owner_idx").on(t.ownerId),
  vcCodeIdx: uniqueIndex("vc_code_idx").on(t.accessCode),
}));
export type VetClinic = typeof vetClinics.$inferSelect;
export type NewVetClinic = typeof vetClinics.$inferInsert;

// Staff de la clínica (veterinarios con acceso al panel)
export const vetClinicUsers = pgTable("vetClinicUsers", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinicId").notNull(),
  userId: integer("userId").notNull(),
  role: varchar("role", { length: 32 }).default("vet").notNull(), // owner | vet | admin
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (t) => ({
  vcuClinicIdx: index("vcu_clinic_idx").on(t.clinicId),
  vcuUserIdx: index("vcu_user_idx").on(t.userId),
}));
export type VetClinicUser = typeof vetClinicUsers.$inferSelect;

// Vinculación mascota ↔ clínica
export const petClinicLinks = pgTable("petClinicLinks", {
  id: serial("id").primaryKey(),
  petId: integer("petId").notNull(),
  clinicId: integer("clinicId").notNull(),
  ownerId: integer("ownerId").notNull(),          // dueño de la mascota
  status: petClinicLinkStatusEnum("status").default("active").notNull(),
  linkedAt: timestamp("linkedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  vetNotes: text("vetNotes"),                     // notas internas del veterinario
}, (t) => ({
  pclPetIdx: index("pcl_pet_idx").on(t.petId),
  pclClinicIdx: index("pcl_clinic_idx").on(t.clinicId),
}));
export type PetClinicLink = typeof petClinicLinks.$inferSelect;

// Alertas veterinarias
export const petAlerts = pgTable("petAlerts", {
  id: serial("id").primaryKey(),
  petId: integer("petId").notNull(),
  clinicId: integer("clinicId"),                  // null si la crea el dueño
  ownerId: integer("ownerId").notNull(),
  type: petAlertTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),                  // fecha límite de la alerta
  status: petAlertStatusEnum("status").default("pending").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  paPetIdx: index("pa_pet_idx").on(t.petId),
  paOwnerIdx: index("pa_owner_idx").on(t.ownerId),
  paClinicIdx: index("pa_clinic_idx").on(t.clinicId),
  paStatusIdx: index("pa_status_idx").on(t.status),
}));
export type PetAlert = typeof petAlerts.$inferSelect;
export type NewPetAlert = typeof petAlerts.$inferInsert;

// Historial de visitas veterinarias
export const petVetVisits = pgTable("petVetVisits", {
  id: serial("id").primaryKey(),
  petId: integer("petId").notNull(),
  clinicId: integer("clinicId").notNull(),
  ownerId: integer("ownerId").notNull(),
  visitDate: timestamp("visitDate").notNull(),
  reason: varchar("reason", { length: 300 }),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  weight: real("weight"),                         // peso en la visita (kg)
  nextVisitDate: timestamp("nextVisitDate"),
  vetName: varchar("vetName", { length: 150 }),
  attachmentsJson: text("attachmentsJson"),       // JSON array de URLs de documentos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pvvPetIdx: index("pvv_pet_idx").on(t.petId),
  pvvClinicIdx: index("pvv_clinic_idx").on(t.clinicId),
}));
export type PetVetVisit = typeof petVetVisits.$inferSelect;
export type NewPetVetVisit = typeof petVetVisits.$inferInsert;

// ─── BuddyPet Extended Schema ─────────────────────────────────────────────────

export const petDietTypeEnum = pgEnum("petDietType", [
  "standard",      // alimentación estándar (pienso)
  "barf",          // BARF (huesos y carne cruda)
  "homecooked",    // comida casera cocinada
  "mixed",         // mixta (pienso + comida natural)
  "prescription",  // dieta veterinaria prescrita
  "vegetarian",    // vegetariana (para ciertas especies)
  "senior",        // senior (mascotas mayores)
  "puppy_kitten",  // cachorro/gatito
  "weight_loss",   // pérdida de peso
  "weight_gain",   // ganancia de peso/masa muscular
  "hypoallergenic",// hipoalergénica
  "renal",         // renal (insuficiencia renal)
  "diabetic",      // diabética
]);

export const petActivityLevelEnum = pgEnum("petActivityLevel", [
  "sedentary",   // sedentario (poco ejercicio)
  "low",         // baja actividad
  "moderate",    // actividad moderada
  "high",        // alta actividad
  "very_high",   // muy activo (perros de trabajo/deporte)
]);

export const petBodyConditionEnum = pgEnum("petBodyCondition", [
  "very_thin",   // muy delgado (1-2/9)
  "thin",        // delgado (3/9)
  "ideal",       // peso ideal (4-5/9)
  "overweight",  // sobrepeso (6-7/9)
  "obese",       // obeso (8-9/9)
]);

// Historial de peso de la mascota
export const petWeightHistory = pgTable("petWeightHistory", {
  id: serial("id").primaryKey(),
  petId: integer("petId").notNull(),
  userId: integer("userId").notNull(),
  weightValue: real("weightValue").notNull(),
  weightUnit: petWeightUnitEnum("weightUnit").default("kg").notNull(),
  bodyCondition: petBodyConditionEnum("bodyCondition"),
  notes: text("notes"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, (t) => ({
  pwh_pet_idx: index("pwh_pet_idx").on(t.petId),
  pwh_user_idx: index("pwh_user_idx").on(t.userId),
}));
export type PetWeightRecord = typeof petWeightHistory.$inferSelect;
export type NewPetWeightRecord = typeof petWeightHistory.$inferInsert;

// Registro de vacunas
export const petVaccines = pgTable("petVaccines", {
  id: serial("id").primaryKey(),
  petId: integer("petId").notNull(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  administeredAt: timestamp("administeredAt"),
  nextDueAt: timestamp("nextDueAt"),
  vetName: varchar("vetName", { length: 150 }),
  batchNumber: varchar("batchNumber", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pv_pet_idx: index("pv_pet_idx").on(t.petId),
}));
export type PetVaccine = typeof petVaccines.$inferSelect;
export type NewPetVaccine = typeof petVaccines.$inferInsert;

// Medicamentos activos
export const petMedications = pgTable("petMedications", {
  id: serial("id").primaryKey(),
  petId: integer("petId").notNull(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  dosage: varchar("dosage", { length: 100 }),
  frequency: varchar("frequency", { length: 100 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  prescribedBy: varchar("prescribedBy", { length: 150 }),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  pm_pet_idx2: index("pm_pet_idx2").on(t.petId),
}));
export type PetMedication = typeof petMedications.$inferSelect;
export type NewPetMedication = typeof petMedications.$inferInsert;

// Perfil nutricional extendido de la mascota (complementa la tabla pets)
export const petNutritionProfiles = pgTable("petNutritionProfiles", {
  id: serial("id").primaryKey(),
  petId: integer("petId").notNull().unique(),
  userId: integer("userId").notNull(),
  dietType: petDietTypeEnum("dietType").default("standard").notNull(),
  activityLevel: petActivityLevelEnum("activityLevel").default("moderate").notNull(),
  bodyCondition: petBodyConditionEnum("bodyCondition").default("ideal").notNull(),
  targetWeightKg: real("targetWeightKg"),
  allergiesJson: text("allergiesJson"),        // JSON array de alergias/intolerancias
  foodsToAvoidJson: text("foodsToAvoidJson"),  // JSON array de alimentos a evitar
  favoriteFoodsJson: text("favoriteFoodsJson"),// JSON array de alimentos favoritos
  medicalConditionsJson: text("medicalConditionsJson"), // JSON array de condiciones médicas
  dailyCaloriesTarget: integer("dailyCaloriesTarget"),
  dailyGramsTarget: integer("dailyGramsTarget"),
  mealsPerDay: integer("mealsPerDay").default(2),
  photoUrl: text("photoUrl"),                  // URL de la foto de la mascota
  photoAnalysisJson: text("photoAnalysisJson"),// Resultado del análisis IA de la foto
  // ── Alimentación actual ──────────────────────────────────────────────────
  currentFoodBrand: text("currentFoodBrand"),        // Marca del pienso/alimento actual
  currentFoodType: text("currentFoodType"),          // pienso_seco, pienso_humedo, barf, casero, mixto
  currentFoodFrequency: integer("currentFoodFrequency"), // Veces al día que come
  currentFoodAmountGrams: integer("currentFoodAmountGrams"), // Gramos por toma
  currentFoodNotes: text("currentFoodNotes"),        // Notas adicionales sobre la dieta actual
  supplementsJson: text("supplementsJson"),          // JSON array de suplementos actuales
  treatsFrequency: text("treatsFrequency"),           // nunca, ocasional, diario
  waterIntakeType: text("waterIntakeType"),           // grifo, filtrada, fuente
  feedingScheduleJson: text("feedingScheduleJson"),  // JSON array de horarios de comida
  currentDietAnalysisJson: text("currentDietAnalysisJson"), // Análisis IA de la dieta actual
  currentDietAnalyzedAt: timestamp("currentDietAnalyzedAt"), // Fecha del último análisis
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  pnp_pet_idx: index("pnp_pet_idx").on(t.petId),
  pnp_user_idx: index("pnp_user_idx").on(t.userId),
}));
export type PetNutritionProfile = typeof petNutritionProfiles.$inferSelect;
export type NewPetNutritionProfile = typeof petNutritionProfiles.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// FRIDGE SCANNER — Escáner de nevera con IA
// ─────────────────────────────────────────────────────────────────────────────
export const fridgeScans = pgTable("fridgeScans", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  detectedIngredientsJson: text("detectedIngredientsJson"), // JSON array de ingredientes detectados
  editedIngredientsJson: text("editedIngredientsJson"),     // JSON array editado por el usuario
  suggestedMenuJson: text("suggestedMenuJson"),              // JSON del menú generado con los ingredientes
  savedAsMenuId: integer("savedAsMenuId"),                   // Si el menú fue guardado, referencia al menú
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  fs_user_idx: index("fs_user_idx").on(t.userId),
}));
export type FridgeScan = typeof fridgeScans.$inferSelect;
export type NewFridgeScan = typeof fridgeScans.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// BLOOD TESTS — Análisis de analítica de sangre con IA
// ─────────────────────────────────────────────────────────────────────────────
export const bloodTests = pgTable("bloodTests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  fileUrl: text("fileUrl"),                          // URL del PDF/imagen subido
  testDate: timestamp("testDate"),                   // Fecha de la analítica
  labName: text("labName"),                          // Nombre del laboratorio
  extractedValuesJson: text("extractedValuesJson"),  // JSON con valores extraídos (glucosa, colesterol, etc.)
  analysisJson: text("analysisJson"),                // JSON con análisis IA (semáforo, puntuación, observaciones)
  recommendationsJson: text("recommendationsJson"),  // JSON con recomendaciones nutricionales
  menuAdjustmentsJson: text("menuAdjustmentsJson"),  // JSON con ajustes sugeridos al menú
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  bt_user_idx: index("bt_user_idx").on(t.userId),
}));
export type BloodTest = typeof bloodTests.$inferSelect;
export type NewBloodTest = typeof bloodTests.$inferInsert;


// =============================================================================
// BUDDYKIDS — Nutrición, hábitos y bienestar infantil
// =============================================================================

// Enums para BuddyKids
export const childAgeGroupEnum = pgEnum("childAgeGroup", ["1_3", "4_6", "7_12", "13_17"]);
export const allergyTypeEnum = pgEnum("allergyType", ["gluten", "lactose", "nuts", "peanuts", "shellfish", "eggs", "soy", "sesame", "fish", "other"]);
export const habitTypeEnum = pgEnum("habitType", ["water", "fruit_vegetable", "sleep", "activity", "breakfast", "ultraprocesados", "other"]);

// ─────────────────────────────────────────────────────────────────────────────
// Perfiles infantiles
// ─────────────────────────────────────────────────────────────────────────────
export const childProfiles = pgTable("childProfiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  dateOfBirth: date("dateOfBirth").notNull(),
  ageGroup: childAgeGroupEnum("ageGroup").notNull(), // 1-3, 4-6, 7-12, 13-17
  height: numeric("height", { precision: 5, scale: 2 }), // en cm
  weight: numeric("weight", { precision: 5, scale: 2 }), // en kg
  gender: genderEnum("gender"),
  favoriteFood: text("favoriteFood").array().default([]).notNull(), // Array de alimentos favoritos
  dislikedFood: text("dislikedFood").array().default([]).notNull(), // Array de alimentos que no le gustan
  objective: text("objective"), // Ej: "comer más verdura", "mejorar hábitos"
  notes: text("notes"), // Notas de los padres
  imageUrl: text("imageUrl"), // Foto del niño
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  cp_user_idx: index("cp_user_idx").on(t.userId),
}));
export type ChildProfile = typeof childProfiles.$inferSelect;
export type NewChildProfile = typeof childProfiles.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Alergias e intolerancias infantiles
// ─────────────────────────────────────────────────────────────────────────────
export const childAllergies = pgTable("childAllergies", {
  id: serial("id").primaryKey(),
  childId: integer("childId").notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
  allergyType: allergyTypeEnum("allergyType").notNull(),
  allergyName: varchar("allergyName", { length: 128 }).notNull(),
  severity: varchar("severity", { length: 32 }), // mild, moderate, severe
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  ca_child_idx: index("ca_child_idx").on(t.childId),
}));
export type ChildAllergy = typeof childAllergies.$inferSelect;
export type NewChildAllergy = typeof childAllergies.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Menús infantiles personalizados
// ─────────────────────────────────────────────────────────────────────────────
export const childMenus = pgTable("childMenus", {
  id: serial("id").primaryKey(),
  childId: integer("childId").notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
  weekStartDate: date("weekStartDate").notNull(),
  menuType: varchar("menuType", { length: 64 }).notNull(), // "1_3_years", "4_6_years", "7_12_years", "13_17_years", "family_compatible"
  mondayJson: text("mondayJson"), // JSON con desayuno, media mañana, comida, merienda, cena
  tuesdayJson: text("tuesdayJson"),
  wednesdayJson: text("wednesdayJson"),
  thursdayJson: text("thursdayJson"),
  fridayJson: text("fridayJson"),
  saturdayJson: text("saturdayJson"),
  sundayJson: text("sundayJson"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  cm_child_idx: index("cm_child_idx").on(t.childId),
}));
export type ChildMenu = typeof childMenus.$inferSelect;
export type NewChildMenu = typeof childMenus.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Lunchbox y meriendas
// ─────────────────────────────────────────────────────────────────────────────
export const childLunchboxes = pgTable("childLunchboxes", {
  id: serial("id").primaryKey(),
  childId: integer("childId").notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
  dayOfWeek: varchar("dayOfWeek", { length: 32 }).notNull(), // Monday, Tuesday, etc.
  lunchboxName: varchar("lunchboxName", { length: 128 }).notNull(),
  itemsJson: text("itemsJson"), // JSON array con items del lunchbox
  calorieTarget: integer("calorieTarget"), // Calorías objetivo
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  clb_child_idx: index("clb_child_idx").on(t.childId),
}));
export type ChildLunchbox = typeof childLunchboxes.$inferSelect;
export type NewChildLunchbox = typeof childLunchboxes.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Rutinas y hábitos infantiles
// ─────────────────────────────────────────────────────────────────────────────
export const childHabits = pgTable("childHabits", {
  id: serial("id").primaryKey(),
  childId: integer("childId").notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
  habitType: habitTypeEnum("habitType").notNull(),
  habitName: varchar("habitName", { length: 128 }).notNull(),
  dailyTarget: integer("dailyTarget"), // Ej: 8 vasos de agua
  unit: varchar("unit", { length: 32 }), // vasos, porciones, minutos, etc.
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  ch_child_idx: index("ch_child_idx").on(t.childId),
}));
export type ChildHabit = typeof childHabits.$inferSelect;
export type NewChildHabit = typeof childHabits.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Seguimiento diario de hábitos
// ─────────────────────────────────────────────────────────────────────────────
export const childHabitLogs = pgTable("childHabitLogs", {
  id: serial("id").primaryKey(),
  habitId: integer("habitId").notNull().references(() => childHabits.id, { onDelete: "cascade" }),
  logDate: date("logDate").notNull(),
  completed: integer("completed").notNull().default(0), // Cantidad completada
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  chl_habit_idx: index("chl_habit_idx").on(t.habitId),
  chl_date_idx: index("chl_date_idx").on(t.logDate),
}));
export type ChildHabitLog = typeof childHabitLogs.$inferSelect;
export type NewChildHabitLog = typeof childHabitLogs.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Recetas para niños (relación con tabla recipes existente)
// ─────────────────────────────────────────────────────────────────────────────
export const childRecipes = pgTable("childRecipes", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipeId").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  ageGroup: childAgeGroupEnum("ageGroup").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  preparationTimeMinutes: integer("preparationTimeMinutes"),
  cookingTimeMinutes: integer("cookingTimeMinutes"),
  servings: integer("servings"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  cr_recipe_idx: index("cr_recipe_idx").on(t.recipeId),
}));
export type ChildRecipe = typeof childRecipes.$inferSelect;
export type NewChildRecipe = typeof childRecipes.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Progreso e indicadores infantiles
// ─────────────────────────────────────────────────────────────────────────────
export const childProgress = pgTable("childProgress", {
  id: serial("id").primaryKey(),
  childId: integer("childId").notNull().references(() => childProfiles.id, { onDelete: "cascade" }),
  weekStartDate: date("weekStartDate").notNull(),
  foodVarietyCount: integer("foodVarietyCount"), // Número de alimentos diferentes probados
  fruitVegetableServings: integer("fruitVegetableServings"), // Porciones de frutas/verduras
  mealsLogged: integer("mealsLogged"), // Comidas registradas
  hydrationDays: integer("hydrationDays"), // Días con hidratación adecuada
  newFoodsTried: text("newFoodsTried").array().default([]).notNull(), // Array de alimentos nuevos
  rejectedFoods: text("rejectedFoods").array().default([]).notNull(), // Array de alimentos rechazados
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  cp_child_idx: index("cp_child_idx").on(t.childId),
}));
export type ChildProgress = typeof childProgress.$inferSelect;
export type NewChildProgress = typeof childProgress.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Calendario familiar con eventos infantiles
// ─────────────────────────────────────────────────────────────────────────────
export const familyCalendarEvents = pgTable("familyCalendarEvents", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  childId: integer("childId"), // Opcional: si es específico de un niño
  eventType: varchar("eventType", { length: 64 }).notNull(), // pediatric_appointment, school_menu, birthday, activity, meal_reminder
  eventDate: date("eventDate").notNull(),
  eventTime: varchar("eventTime", { length: 8 }), // HH:MM
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  fce_user_idx: index("fce_user_idx").on(t.userId),
  fce_child_idx: index("fce_child_idx").on(t.childId),
}));
export type FamilyCalendarEvent = typeof familyCalendarEvents.$inferSelect;
export type NewFamilyCalendarEvent = typeof familyCalendarEvents.$inferInsert;


// ─── Special Menus (Menús Especiales) ──────────────────────────────────────────
export const specialMenusEnum = pgEnum("specialMenuType", [
  "dieta_especial",
  "alergia",
  "restriccion_religiosa",
  "preferencia_cultural",
  "condicion_medica",
  "otro"
]);

export const specialMenus = pgTable("specialMenus", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  menuType: specialMenusEnum("menuType").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  dailyCalories: integer("dailyCalories"),
  persons: integer("persons").default(1),
  difficulty: difficultyEnum("difficulty").default("easy"),
  coverImage: text("coverImage"),
  menuJson: text("menuJson"), // JSON con estructura de menú
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("special_menus_user_idx").on(t.userId),
  userCreatedAtIdx: index("special_menus_user_created_idx").on(t.userId, t.createdAt),
}));
export type SpecialMenu = typeof specialMenus.$inferSelect;
export type NewSpecialMenu = typeof specialMenus.$inferInsert;

// ─── Event Menus (Menús de Eventos) ───────────────────────────────────────────
export const eventMenusEnum = pgEnum("eventMenuType", [
  "cumpleanos",
  "boda",
  "aniversario",
  "reunion_familiar",
  "comida_negocios",
  "picnic",
  "cena_romantica",
  "fiesta",
  "otro"
]);

export const eventMenus = pgTable("eventMenus", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  eventType: eventMenusEnum("eventType").notNull(),
  eventDate: date("eventDate").notNull(),
  guestCount: integer("guestCount").default(1),
  budget: numeric("budget", { precision: 10, scale: 2 }),
  difficulty: difficultyEnum("difficulty").default("easy"),
  cuisineType: varchar("cuisineType", { length: 64 }),
  coverImage: text("coverImage"),
  menuJson: text("menuJson"), // JSON con estructura de menú
  shoppingListJson: text("shoppingListJson"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("event_menus_user_idx").on(t.userId),
  eventDateIdx: index("event_menus_date_idx").on(t.eventDate),
  userCreatedAtIdx: index("event_menus_user_created_idx").on(t.userId, t.createdAt),
}));
export type EventMenu = typeof eventMenus.$inferSelect;
export type NewEventMenu = typeof eventMenus.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// Wearables Integration (Oura Ring & Whoop)
// ─────────────────────────────────────────────────────────────────────────────

export const wearableConnectionsEnum = pgEnum("wearableType", ["oura", "whoop", "apple_health", "google_fit"]);

export const wearableConnections = pgTable("wearableConnections", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  wearableType: wearableConnectionsEnum("wearableType").notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  externalUserId: varchar("externalUserId", { length: 256 }),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  isActive: boolean("isActive").default(true),
  metadata: text("metadata"), // JSON for extra data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("wconn_user_idx").on(t.userId),
  wearableTypeIdx: index("wconn_type_idx").on(t.wearableType),
  userWearableIdx: index("wconn_user_wearable_idx").on(t.userId, t.wearableType),
}));
export type WearableConnection = typeof wearableConnections.$inferSelect;
export type NewWearableConnection = typeof wearableConnections.$inferInsert;

// Oura Ring Data
export const ouraRingData = pgTable("ouraRingData", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  
  // Sleep metrics
  sleepDuration: integer("sleepDuration"), // minutes
  sleepScore: integer("sleepScore"), // 0-100
  deepSleep: integer("deepSleep"), // minutes
  remSleep: integer("remSleep"), // minutes
  lightSleep: integer("lightSleep"), // minutes
  sleepLatency: integer("sleepLatency"), // minutes
  
  // Activity metrics
  activityScore: integer("activityScore"), // 0-100
  activeCalories: integer("activeCalories"),
  totalCalories: integer("totalCalories"),
  steps: integer("steps"),
  distance: numeric("distance", { precision: 10, scale: 2 }), // km
  
  // Readiness metrics
  readinessScore: integer("readinessScore"), // 0-100
  heartRateVariability: numeric("heartRateVariability", { precision: 10, scale: 2 }), // ms
  restingHeartRate: integer("restingHeartRate"), // bpm
  bodyTemperature: numeric("bodyTemperature", { precision: 4, scale: 2 }), // Celsius
  
  // Recovery metrics
  recoveryIndex: integer("recoveryIndex"), // 0-100
  
  // Raw data
  rawData: text("rawData"), // JSON
  
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("od_user_idx").on(t.userId),
  dateIdx: index("od_date_idx").on(t.date),
  userDateIdx: index("od_user_date_idx").on(t.userId, t.date),
}));
export type OuraRingData = typeof ouraRingData.$inferSelect;
export type NewOuraRingData = typeof ouraRingData.$inferInsert;

// Whoop Data
export const whoopData = pgTable("whoopData", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  
  // Strain metrics
  strain: numeric("strain", { precision: 4, scale: 2 }), // 0-21
  strainScore: integer("strainScore"), // 0-100
  kilojoules: numeric("kilojoules", { precision: 10, scale: 2 }),
  averageHeartRate: integer("averageHeartRate"), // bpm
  maxHeartRate: integer("maxHeartRate"), // bpm
  
  // Recovery metrics
  recovery: numeric("recovery", { precision: 4, scale: 2 }), // 0-100%
  recoveryScore: integer("recoveryScore"), // 0-100
  restingHeartRate: integer("restingHeartRate"), // bpm
  heartRateVariability: numeric("heartRateVariability", { precision: 10, scale: 2 }), // ms
  skinTemperature: numeric("skinTemperature", { precision: 4, scale: 2 }), // Celsius
  
  // Sleep metrics
  sleepDuration: integer("sleepDuration"), // minutes
  sleepScore: integer("sleepScore"), // 0-100
  sleepQuality: numeric("sleepQuality", { precision: 4, scale: 2 }), // 0-100%
  
  // Mood & Muscle Soreness
  mood: varchar("mood", { length: 64 }), // good, okay, bad
  muscleSoreness: varchar("muscleSoreness", { length: 64 }), // none, light, moderate, heavy
  
  // Raw data
  rawData: text("rawData"), // JSON
  
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("wd_user_idx").on(t.userId),
  dateIdx: index("wd_date_idx").on(t.date),
  userDateIdx: index("wd_user_date_idx").on(t.userId, t.date),
}));
export type WhoopData = typeof whoopData.$inferSelect;
export type NewWhoopData = typeof whoopData.$inferInsert;

// Wearable Insights & Correlations
export const wearableInsights = pgTable("wearableInsights", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  
  // Insights
  insight: text("insight").notNull(), // AI-generated insight
  category: varchar("category", { length: 64 }), // sleep, recovery, performance, health
  severity: varchar("severity", { length: 64 }), // low, medium, high
  
  // Correlations
  correlations: text("correlations"), // JSON array of correlated metrics
  recommendations: text("recommendations"), // JSON array of recommendations
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("wi_user_idx").on(t.userId),
  dateIdx: index("wi_date_idx").on(t.date),
  userDateIdx: index("wi_user_date_idx").on(t.userId, t.date),
}));
export type WearableInsight = typeof wearableInsights.$inferSelect;
export type NewWearableInsight = typeof wearableInsights.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// GAMIFICATION (Streaks, Badges, Achievements)
// ─────────────────────────────────────────────────────────────────────────────

export const streaks = pgTable("streaks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  streakType: varchar("streakType", { length: 64 }).notNull(), // daily_login, daily_meals, daily_exercise, daily_water
  currentStreak: integer("currentStreak").default(0),
  longestStreak: integer("longestStreak").default(0),
  lastActivityDate: date("lastActivityDate"),
  startDate: date("startDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("streak_user_idx").on(t.userId),
  userTypeIdx: index("streak_user_type_idx").on(t.userId, t.streakType),
}));
export type Streak = typeof streaks.$inferSelect;
export type NewStreak = typeof streaks.$inferInsert;

// Tablas de Gamificación, Social y Premium ya están definidas arriba


// =============================================================================
// PRODUCT RECOMMENDATIONS (BuddyShop, BuddyCare, BuddyCoach Integration)
// =============================================================================

export const productRecommendationSourceEnum = pgEnum("productRecommendationSource", [
  "buddyshop",
  "buddycare",
  "buddycoach",
]);

export const recommendationTriggerEnum = pgEnum("recommendationTrigger", [
  "muscle_gain",
  "weight_loss",
  "frequent_cooking",
  "complex_recipes",
  "vitamin_deficiency",
  "health_goal",
  "active_training",
  "macro_deficit",
]);

// Product Recommendations Table
export const productRecommendations = pgTable("productRecommendations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Product Info
  externalProductId: varchar("externalProductId", { length: 255 }).notNull(), // ID from external API
  source: productRecommendationSourceEnum("source").notNull(), // buddyshop, buddycare, buddycoach
  
  // Recommendation Details
  title: text("title").notNull(),
  description: text("description"),
  reason: text("reason").notNull(), // Why this product is recommended
  trigger: recommendationTriggerEnum("trigger").notNull(), // What triggered this recommendation
  
  // Product Details
  productUrl: text("productUrl").notNull(),
  productImage: text("productImage"),
  productPrice: numeric("productPrice", { precision: 10, scale: 2 }),
  productCategory: varchar("productCategory", { length: 128 }),
  
  // Recommendation Metrics
  relevanceScore: integer("relevanceScore").default(50), // 0-100
  cta: varchar("cta", { length: 255 }).default("Ver producto"), // Call to action text
  
  // Tracking
  clicked: boolean("clicked").default(false),
  clickedAt: timestamp("clickedAt"),
  converted: boolean("converted").default(false),
  convertedAt: timestamp("convertedAt"),
  
  // Lifecycle
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("pr_user_idx").on(t.userId),
  sourceIdx: index("pr_source_idx").on(t.source),
  userSourceIdx: index("pr_user_source_idx").on(t.userId, t.source),
  expiresIdx: index("pr_expires_idx").on(t.expiresAt),
  triggerIdx: index("pr_trigger_idx").on(t.trigger),
}));

export type ProductRecommendation = typeof productRecommendations.$inferSelect;
export type NewProductRecommendation = typeof productRecommendations.$inferInsert;

// Recommendation Events Table (for analytics)
export const recommendationEvents = pgTable("recommendationEvents", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  recommendationId: integer("recommendationId").notNull().references(() => productRecommendations.id, { onDelete: "cascade" }),
  
  // Event Type
  eventType: varchar("eventType", { length: 64 }).notNull(), // impression, click, hover, convert, dismiss
  
  // Context
  source: productRecommendationSourceEnum("source").notNull(),
  context: varchar("context", { length: 255 }), // Where the recommendation was shown (dashboard, banner, carousel)
  
  // Metadata
  metadata: text("metadata"), // JSON with additional data
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("re_user_idx").on(t.userId),
  recIdx: index("re_rec_idx").on(t.recommendationId),
  eventTypeIdx: index("re_event_type_idx").on(t.eventType),
  userEventIdx: index("re_user_event_idx").on(t.userId, t.eventType),
}));

export type RecommendationEvent = typeof recommendationEvents.$inferSelect;
export type NewRecommendationEvent = typeof recommendationEvents.$inferInsert;

// Product Cache Table (for caching external API responses)
export const productCache = pgTable("productCache", {
  id: serial("id").primaryKey(),
  
  // Cache Key
  source: productRecommendationSourceEnum("source").notNull(),
  externalProductId: varchar("externalProductId", { length: 255 }).notNull(),
  
  // Cached Data
  data: text("data").notNull(), // JSON with product data
  
  // Cache Lifecycle
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  sourceIdx: index("pc_source_idx").on(t.source),
  productIdx: index("pc_product_idx").on(t.externalProductId),
  expiresIdx: index("pc_expires_idx").on(t.expiresAt),
  sourceProductIdx: index("pc_source_product_idx").on(t.source, t.externalProductId),
}));

export type ProductCache = typeof productCache.$inferSelect;
export type NewProductCache = typeof productCache.$inferInsert;

// User Product Interactions (for personalization)
export const userProductInteractions = pgTable("userProductInteractions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Product Reference
  source: productRecommendationSourceEnum("source").notNull(),
  externalProductId: varchar("externalProductId", { length: 255 }).notNull(),
  
  // Interaction
  interactionType: varchar("interactionType", { length: 64 }).notNull(), // view, click, purchase, favorite, review
  
  // Metadata
  metadata: text("metadata"), // JSON with additional data
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("upi_user_idx").on(t.userId),
  sourceIdx: index("upi_source_idx").on(t.source),
  userSourceIdx: index("upi_user_source_idx").on(t.userId, t.source),
  interactionIdx: index("upi_interaction_idx").on(t.interactionType),
}));

export type UserProductInteraction = typeof userProductInteractions.$inferSelect;
export type NewUserProductInteraction = typeof userProductInteractions.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// WELLNESS GOALS
// ─────────────────────────────────────────────────────────────────────────────

export const wellnessGoalCategoryEnum = pgEnum("wellnessGoalCategory", [
  "sleep", "recovery", "activity", "stress", "nutrition", "hydration"
]);

export const wellnessGoalPriorityEnum = pgEnum("wellnessGoalPriority", [
  "low", "medium", "high"
]);

export const wellnessGoalStatusEnum = pgEnum("wellnessGoalStatus", [
  "active", "completed", "abandoned"
]);

export const wellnessGoals = pgTable("wellnessGoals", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  category: wellnessGoalCategoryEnum("category").notNull(),
  currentValue: real("currentValue").default(0).notNull(),
  targetValue: real("targetValue").notNull(),
  unit: varchar("unit", { length: 64 }).notNull(),
  priority: wellnessGoalPriorityEnum("priority").default("medium").notNull(),
  status: wellnessGoalStatusEnum("status").default("active").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  targetDate: timestamp("targetDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("wg_user_idx").on(t.userId),
  statusIdx: index("wg_status_idx").on(t.status),
  userStatusIdx: index("wg_user_status_idx").on(t.userId, t.status),
}));
export type WellnessGoal = typeof wellnessGoals.$inferSelect;
export type NewWellnessGoal = typeof wellnessGoals.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// ECOSYSTEM CONNECTOR (BuddyOne ↔ BuddyCoach sync)
// ─────────────────────────────────────────────────────────────────────────────

export const ecosystemConnectionStatusEnum = pgEnum("ecosystemConnectionStatus", [
  "active", "paused", "revoked", "expired"
]);

export const ecosystemConnections = pgTable("ecosystemConnections", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetApp: varchar("targetApp", { length: 64 }).notNull(), // buddycoach, buddycare, buddyshop
  targetUserId: varchar("targetUserId", { length: 255 }), // openId in target app
  status: ecosystemConnectionStatusEnum("status").default("active").notNull(),
  permissions: text("permissions"), // JSON array of granted permissions
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("ec_user_idx").on(t.userId),
  targetIdx: index("ec_target_idx").on(t.targetApp),
  userTargetIdx: index("ec_user_target_idx").on(t.userId, t.targetApp),
}));
export type EcosystemConnection = typeof ecosystemConnections.$inferSelect;
export type NewEcosystemConnection = typeof ecosystemConnections.$inferInsert;

export const ecosystemSyncDirectionEnum = pgEnum("ecosystemSyncDirection", [
  "push", "pull", "bidirectional"
]);

export const ecosystemSyncStatusEnum = pgEnum("ecosystemSyncStatus", [
  "pending", "in_progress", "completed", "failed"
]);

export const ecosystemSyncLogs = pgTable("ecosystemSyncLogs", {
  id: serial("id").primaryKey(),
  connectionId: integer("connectionId").notNull().references(() => ecosystemConnections.id, { onDelete: "cascade" }),
  direction: ecosystemSyncDirectionEnum("direction").notNull(),
  dataType: varchar("dataType", { length: 64 }).notNull(), // nutrition, workouts, goals, metrics
  status: ecosystemSyncStatusEnum("syncStatus").default("pending").notNull(),
  recordsProcessed: integer("recordsProcessed").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (t) => ({
  connectionIdx: index("esl_connection_idx").on(t.connectionId),
  statusIdx: index("esl_status_idx").on(t.status),
}));
export type EcosystemSyncLog = typeof ecosystemSyncLogs.$inferSelect;
export type NewEcosystemSyncLog = typeof ecosystemSyncLogs.$inferInsert;

export const ecosystemSharedData = pgTable("ecosystemSharedData", {
  id: serial("id").primaryKey(),
  connectionId: integer("connectionId").notNull().references(() => ecosystemConnections.id, { onDelete: "cascade" }),
  dataType: varchar("dataType", { length: 64 }).notNull(),
  dataKey: varchar("dataKey", { length: 255 }).notNull(),
  dataValue: text("dataValue").notNull(), // JSON serialized
  version: integer("version").default(1).notNull(),
  lastModifiedBy: varchar("lastModifiedBy", { length: 64 }).notNull(), // which app last modified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  connectionIdx: index("esd_connection_idx").on(t.connectionId),
  dataTypeIdx: index("esd_datatype_idx").on(t.dataType),
  keyIdx: index("esd_key_idx").on(t.dataKey),
}));
export type EcosystemSharedData = typeof ecosystemSharedData.$inferSelect;
export type NewEcosystemSharedData = typeof ecosystemSharedData.$inferInsert;

export const ecosystemSyncQueueStatusEnum = pgEnum("ecosystemSyncQueueStatus", [
  "queued", "processing", "done", "failed"
]);

export const ecosystemSyncQueue = pgTable("ecosystemSyncQueue", {
  id: serial("id").primaryKey(),
  connectionId: integer("connectionId").notNull().references(() => ecosystemConnections.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 64 }).notNull(), // create, update, delete
  dataType: varchar("dataType", { length: 64 }).notNull(),
  payload: text("payload").notNull(), // JSON
  status: ecosystemSyncQueueStatusEnum("queueStatus").default("queued").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("maxAttempts").default(3).notNull(),
  lastError: text("lastError"),
  scheduledFor: timestamp("scheduledFor").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  connectionIdx: index("esq_connection_idx").on(t.connectionId),
  statusIdx: index("esq_status_idx").on(t.status),
  scheduledIdx: index("esq_scheduled_idx").on(t.scheduledFor),
}));
export type EcosystemSyncQueue = typeof ecosystemSyncQueue.$inferSelect;
export type NewEcosystemSyncQueue = typeof ecosystemSyncQueue.$inferInsert;


// ── Insight Feedback ─────────────────────────────────────────────────────
export const insightFeedbackEnum = pgEnum("insightFeedback", ["positive", "negative"]);

export const insightFeedback = pgTable("insight_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  insightTitle: text("insightTitle").notNull(),
  insightCategory: text("insightCategory").notNull(),
  insightDescription: text("insightDescription").notNull(),
  feedback: insightFeedbackEnum("feedback").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("ifb_user_idx").on(t.userId),
  categoryIdx: index("ifb_category_idx").on(t.insightCategory),
}));
export type InsightFeedback = typeof insightFeedback.$inferSelect;
export type NewInsightFeedback = typeof insightFeedback.$inferInsert;

// ── Supplement Tracker (BuddyCare) ───────────────────────────────────────
export const supplementFrequencyEnum = pgEnum("supplement_frequency", ["daily", "twice_daily", "weekly", "as_needed"]);

export const userSupplements = pgTable("user_supplements", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  dosage: varchar("dosage", { length: 128 }),
  frequency: supplementFrequencyEnum("frequency").default("daily").notNull(),
  timeOfDay: varchar("timeOfDay", { length: 32 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("usup_user_idx").on(t.userId),
}));
export type UserSupplement = typeof userSupplements.$inferSelect;
export type InsertUserSupplement = typeof userSupplements.$inferInsert;

export const supplementLogs = pgTable("supplement_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  supplementId: integer("supplementId").notNull().references(() => userSupplements.id, { onDelete: "cascade" }),
  takenAt: timestamp("takenAt").defaultNow().notNull(),
  skipped: boolean("skipped").default(false).notNull(),
  notes: text("notes"),
}, (t) => ({
  userIdx: index("slog_user_idx").on(t.userId),
  dateIdx: index("slog_date_idx").on(t.takenAt),
}));
export type SupplementLog = typeof supplementLogs.$inferSelect;
export type InsertSupplementLog = typeof supplementLogs.$inferInsert;

// ── Ecosystem Activity Feed ──────────────────────────────────────────────
export const ecosystemActivitySourceEnum = pgEnum("ecosystem_activity_source", ["buddyone", "buddycoach", "buddycare", "buddyshop", "healthhub"]);

export const ecosystemActivity = pgTable("ecosystem_activity", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  source: ecosystemActivitySourceEnum("source").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("eact_user_idx").on(t.userId),
  dateIdx: index("eact_date_idx").on(t.createdAt),
  sourceIdx: index("eact_source_idx").on(t.source),
}));
export type EcosystemActivityRow = typeof ecosystemActivity.$inferSelect;
export type InsertEcosystemActivity = typeof ecosystemActivity.$inferInsert;

// =============================================================================
// EXPERT REVIEWS (Reseñas verificadas de pacientes)
// =============================================================================
export const expertReviews = pgTable("expert_reviews", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  expertPatientId: integer("expertPatientId").notNull(),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 256 }),
  content: text("content"),
  isVerified: boolean("isVerified").default(false).notNull(),
  weeksWithExpert: integer("weeksWithExpert").default(0).notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  expertResponse: text("expertResponse"),
  expertRespondedAt: timestamp("expertRespondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("er_expert_idx").on(t.expertId),
  patientIdx: index("er_patient_idx").on(t.patientUserId),
}));
export type ExpertReview = typeof expertReviews.$inferSelect;
export type InsertExpertReview = typeof expertReviews.$inferInsert;

// =============================================================================
// EXPERT AVAILABILITY (Disponibilidad y reserva directa)
// =============================================================================
export const dayOfWeekEnum = pgEnum("dayOfWeek", ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
export const expertAvailabilitySlots = pgTable("expert_availability_slots", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  dayOfWeek: dayOfWeekEnum("dayOfWeek").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  slotDurationMinutes: integer("slotDurationMinutes").default(60).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("eas_expert_idx").on(t.expertId),
}));
export type ExpertAvailabilitySlot = typeof expertAvailabilitySlots.$inferSelect;
export type InsertExpertAvailabilitySlot = typeof expertAvailabilitySlots.$inferInsert;

// =============================================================================
// VIDEO ROOMS (Salas de videoconsulta)
// =============================================================================
export const videoRoomStatusEnum = pgEnum("videoRoomStatus", ["waiting", "active", "ended"]);
export const videoRooms = pgTable("video_rooms", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointmentId").notNull(),
  expertId: integer("expertId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  roomCode: varchar("roomCode", { length: 64 }).notNull().unique(),
  status: videoRoomStatusEnum("status").default("waiting").notNull(),
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  appointmentIdx: index("vr_appt_idx").on(t.appointmentId),
  codeIdx: index("vr_code_idx").on(t.roomCode),
}));
export type VideoRoom = typeof videoRooms.$inferSelect;
export type InsertVideoRoom = typeof videoRooms.$inferInsert;

// =============================================================================
// PATIENT ALERTS (Alertas inteligentes para el experto)
// =============================================================================
export const alertSeverityEnum = pgEnum("alertSeverity", ["low", "medium", "high", "critical"]);
export const alertStatusEnum2 = pgEnum("alertStatus2", ["active", "acknowledged", "resolved"]);
export const patientAlerts = pgTable("patient_alerts", {
  id: serial("id").primaryKey(),
  expertId: integer("expertId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  expertPatientId: integer("expertPatientId").notNull(),
  alertType: varchar("alertType", { length: 64 }).notNull(),
  severity: alertSeverityEnum("severity").default("medium").notNull(),
  status: alertStatusEnum2("status").default("active").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  metadata: text("metadata"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("pa2_expert_idx").on(t.expertId),
  patientIdx: index("pa2_patient_idx").on(t.patientUserId),
  statusIdx: index("pa2_status_idx").on(t.status),
}));
export type PatientAlert = typeof patientAlerts.$inferSelect;
export type InsertPatientAlert = typeof patientAlerts.$inferInsert;

// =============================================================================
// B2B COMPANIES (Plan empresarial de wellness)
// =============================================================================
export const b2bCompanies = pgTable("b2b_companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 256 }).notNull(),
  contactName: varchar("contactName", { length: 256 }),
  logoUrl: text("logoUrl"),
  maxSeats: integer("maxSeats").default(10).notNull(),
  usedSeats: integer("usedSeats").default(0).notNull(),
  planType: varchar("planType", { length: 64 }).default("standard").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  emailIdx: index("b2b_email_idx").on(t.contactEmail),
}));
export type B2bCompany = typeof b2bCompanies.$inferSelect;
export type InsertB2bCompany = typeof b2bCompanies.$inferInsert;

export const b2bEmployees = pgTable("b2b_employees", {
  id: serial("id").primaryKey(),
  companyId: integer("companyId").notNull(),
  userId: integer("userId").notNull(),
  role: varchar("role", { length: 32 }).default("employee").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
}, (t) => ({
  companyIdx: index("b2be_company_idx").on(t.companyId),
  userIdx: index("b2be_user_idx").on(t.userId),
}));
export type B2bEmployee = typeof b2bEmployees.$inferSelect;
export type InsertB2bEmployee = typeof b2bEmployees.$inferInsert;


// ── Expert Feature Requests (Product Board) ─────────────────────────────────
export const expertFeatureRequestCategoryEnum = pgEnum("expert_fr_category", [
  "patient_management",
  "plans_menus",
  "tracking_metrics",
  "communication",
  "billing",
  "integrations",
  "other",
]);

export const expertFeatureRequestStatusEnum = pgEnum("expert_fr_status", [
  "under_review",
  "planned",
  "in_progress",
  "completed",
  "declined",
]);

export const expertFeatureRequests = pgTable("expert_feature_requests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: expertFeatureRequestCategoryEnum("category").notNull(),
  status: expertFeatureRequestStatusEnum("status").default("under_review").notNull(),
  adminNote: text("adminNote"),
  voteCount: integer("voteCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("efr_user_idx").on(t.userId),
  categoryIdx: index("efr_category_idx").on(t.category),
  statusIdx: index("efr_status_idx").on(t.status),
  votesIdx: index("efr_votes_idx").on(t.voteCount),
}));
export type ExpertFeatureRequest = typeof expertFeatureRequests.$inferSelect;
export type InsertExpertFeatureRequest = typeof expertFeatureRequests.$inferInsert;

export const expertFeatureVotes = pgTable("expert_feature_votes", {
  id: serial("id").primaryKey(),
  requestId: integer("requestId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  requestUserUnique: unique("efv_request_user_unique").on(t.requestId, t.userId),
  requestIdx: index("efv_request_idx").on(t.requestId),
  userIdx: index("efv_user_idx").on(t.userId),
}));
export type ExpertFeatureVote = typeof expertFeatureVotes.$inferSelect;
export type InsertExpertFeatureVote = typeof expertFeatureVotes.$inferInsert;


// ── Newsletter Subscribers ───────────────────────────────────────────────────
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  source: varchar("source", { length: 100 }).default("blog"),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
  active: boolean("active").default(true).notNull(),
}, (t) => ({
  emailUnique: unique("newsletter_email_unique").on(t.email),
  activeIdx: index("newsletter_active_idx").on(t.active),
}));
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;


// =============================================================================
// EMAIL CAMPAIGNS
// =============================================================================

export const campaignStatusEnum = pgEnum("campaignStatus", ["draft", "scheduled", "sending", "sent", "failed"]);

export const emailContacts = pgTable("email_contacts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  tags: text("tags"), // JSON array of tags
  source: varchar("source", { length: 100 }).default("manual"),
  subscribed: boolean("subscribed").default(true).notNull(),
  bouncedAt: timestamp("bouncedAt"),
  unsubscribedAt: timestamp("unsubscribedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  emailIdx: uniqueIndex("email_contacts_email_idx").on(t.email),
  subscribedIdx: index("email_contacts_subscribed_idx").on(t.subscribed),
}));
export type EmailContact = typeof emailContacts.$inferSelect;
export type InsertEmailContact = typeof emailContacts.$inferInsert;

export const emailLists = pgTable("email_lists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#F97316"),
  contactCount: integer("contactCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type EmailList = typeof emailLists.$inferSelect;
export type InsertEmailList = typeof emailLists.$inferInsert;

export const emailListMembers = pgTable("email_list_members", {
  id: serial("id").primaryKey(),
  listId: integer("listId").notNull(),
  contactId: integer("contactId").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
}, (t) => ({
  listContactUnique: unique("email_list_member_unique").on(t.listId, t.contactId),
  listIdx: index("email_list_members_list_idx").on(t.listId),
  contactIdx: index("email_list_members_contact_idx").on(t.contactId),
}));
export type EmailListMember = typeof emailListMembers.$inferSelect;
export type InsertEmailListMember = typeof emailListMembers.$inferInsert;

export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  previewText: varchar("previewText", { length: 255 }),
  htmlContent: text("htmlContent").notNull(),
  listId: integer("listId"),
  status: campaignStatusEnum("status").default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  totalRecipients: integer("totalRecipients").default(0),
  totalSent: integer("totalSent").default(0),
  totalFailed: integer("totalFailed").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

export const emailCampaignSends = pgTable("email_campaign_sends", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaignId").notNull(),
  contactId: integer("contactId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, sent, failed, bounced
  messageId: varchar("messageId", { length: 255 }),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
}, (t) => ({
  campaignIdx: index("email_sends_campaign_idx").on(t.campaignId),
  contactIdx: index("email_sends_contact_idx").on(t.contactId),
  statusIdx: index("email_sends_status_idx").on(t.status),
}));
export type EmailCampaignSend = typeof emailCampaignSends.$inferSelect;
export type InsertEmailCampaignSend = typeof emailCampaignSends.$inferInsert;

// =============================================================================
// PATIENT DOCUMENTS — Documentos clínicos compartidos entre expert y paciente
// =============================================================================
export const patientDocumentTypeEnum = pgEnum("patientDocumentType", [
  "nutrition_plan",
  "blood_test",
  "medical_report",
  "scale_export",
  "progress_photo",
  "consent_form",
  "other"
]);
export const patientDocumentVisibilityEnum = pgEnum("patientDocumentVisibility", [
  "expert_only",
  "shared"
]);

export const patientDocuments = pgTable("patient_documents", {
  id: serial("id").primaryKey(),
  expertPatientId: integer("expertPatientId").notNull(),
  expertId: integer("expertId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  uploadedBy: integer("uploadedBy").notNull(), // userId who uploaded
  uploaderRole: varchar("uploaderRole", { length: 16 }).notNull().default("expert"), // expert | patient
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileName: varchar("fileName", { length: 256 }).notNull(),
  fileSize: integer("fileSize"), // bytes
  mimeType: varchar("mimeType", { length: 128 }),
  documentType: patientDocumentTypeEnum("documentType").default("other").notNull(),
  visibility: patientDocumentVisibilityEnum("visibility").default("shared").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  epIdx: index("pd_ep_idx").on(t.expertPatientId),
  expertIdx: index("pd_expert_idx").on(t.expertId),
  patientIdx: index("pd_patient_idx").on(t.patientUserId),
  typeIdx: index("pd_type_idx").on(t.documentType),
}));

export type PatientDocument = typeof patientDocuments.$inferSelect;
export type InsertPatientDocument = typeof patientDocuments.$inferInsert;

// =============================================================================
// PATIENT CLINICAL METRICS — Métricas clínicas adicionales (tensión, glucosa, etc.)
// =============================================================================
export const patientClinicalMetrics = pgTable("patient_clinical_metrics", {
  id: serial("id").primaryKey(),
  expertPatientId: integer("expertPatientId").notNull(),
  patientUserId: integer("patientUserId").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  // Cardiovascular
  bloodPressureSystolic: integer("bloodPressureSystolic"),   // mmHg
  bloodPressureDiastolic: integer("bloodPressureDiastolic"), // mmHg
  heartRate: integer("heartRate"),                           // bpm
  // Metabolic
  glucoseFasting: real("glucoseFasting"),   // mg/dL
  hba1c: real("hba1c"),                     // %
  totalCholesterol: real("totalCholesterol"), // mg/dL
  ldlCholesterol: real("ldlCholesterol"),
  hdlCholesterol: real("hdlCholesterol"),
  triglycerides: real("triglycerides"),
  // Body composition extras
  boneMass: real("boneMass"),       // kg
  waterPercentage: real("waterPercentage"), // %
  visceralFat: integer("visceralFat"), // index 1-59
  metabolicAge: integer("metabolicAge"),
  // Measurements
  calf: real("calf"),       // cm
  neck: real("neck"),       // cm
  shoulder: real("shoulder"), // cm
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  epIdx: index("pcm_ep_idx").on(t.expertPatientId),
  patientIdx: index("pcm_patient_idx").on(t.patientUserId),
  dateIdx: index("pcm_date_idx").on(t.recordedAt),
}));

export type PatientClinicalMetric = typeof patientClinicalMetrics.$inferSelect;
export type InsertPatientClinicalMetric = typeof patientClinicalMetrics.$inferInsert;

// =============================================================================
// PATIENT DAILY DIARY — Diario de salud diario del paciente
// =============================================================================
export const patientDailyDiary = pgTable("patient_daily_diary", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  expertPatientId: integer("expertPatientId"),
  diaryDate: date("diaryDate").notNull(),
  // Biometrics
  weight: real("weight"),
  // Subjective ratings (1-5)
  energyLevel: integer("energyLevel"),
  digestiveComfort: integer("digestiveComfort"),
  sleepQuality: integer("sleepQuality"),
  moodLevel: integer("moodLevel"),
  stressLevel: integer("stressLevel"),
  // Plan adherence
  planAdherence: varchar("planAdherence", { length: 16 }), // full | partial | no
  // Physical activity
  activityType: varchar("activityType", { length: 64 }),
  activityDuration: integer("activityDuration"), // minutes
  activityIntensity: varchar("activityIntensity", { length: 16 }), // low | medium | high
  // Sleep
  sleepHours: real("sleepHours"),
  // Notes and photos
  symptoms: text("symptoms"),
  generalNotes: text("generalNotes"),
  foodPhotoUrl: text("foodPhotoUrl"),
  progressPhotoUrl: text("progressPhotoUrl"),
  // Expert feedback
  expertFeedback: text("expertFeedback"),
  expertFeedbackAt: timestamp("expertFeedbackAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("pdd_user_idx").on(t.userId),
  dateIdx: index("pdd_date_idx").on(t.diaryDate),
  epIdx: index("pdd_ep_idx").on(t.expertPatientId),
}));

export type PatientDailyDiary = typeof patientDailyDiary.$inferSelect;
export type InsertPatientDailyDiary = typeof patientDailyDiary.$inferInsert;

// =============================================================================
// BUDDYSHOP PRODUCTS — Utensilios y menaje de cocina
// =============================================================================
export const shopProducts = pgTable("shop_products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: real("price"),
  imageUrl: text("imageUrl"),
  affiliateUrl: text("affiliateUrl"),
  category: varchar("category", { length: 64 }),
  tags: text("tags"), // JSON array: ["bbq","parrilla","verano"]
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ShopProduct = typeof shopProducts.$inferSelect;
export type InsertShopProduct = typeof shopProducts.$inferInsert;

// =============================================================================
// BUDDYCARE PRODUCTS — Suplementos y parafarmacia
// =============================================================================
export const careProducts = pgTable("care_products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: real("price"),
  imageUrl: text("imageUrl"),
  affiliateUrl: text("affiliateUrl"),
  category: varchar("category", { length: 64 }),
  tags: text("tags"), // JSON array: ["retencion_liquidos","drenante","detox"]
  healthBenefits: text("healthBenefits"), // JSON array of benefit strings
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CareProduct = typeof careProducts.$inferSelect;
export type InsertCareProduct = typeof careProducts.$inferInsert;

// =============================================================================
// HOUSEHOLD MENU PLANS — Menús semanales por miembro del hogar
// =============================================================================
export const householdMenuTypeEnum = pgEnum("household_menu_type", [
  "adults",
  "kids",
  "baby",
  "custom",
  "family",
]);

export const householdMenuPlans = pgTable("household_menu_plans", {
  id: serial("id").primaryKey(),
  householdId: integer("householdId").notNull(),
  memberId: integer("memberId"),
  createdByUserId: integer("createdByUserId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  menuType: householdMenuTypeEnum("menuType").notNull().default("adults"),
  weekStartDate: timestamp("weekStartDate").notNull(),
  meals: text("meals"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  generatedByAI: boolean("generatedByAI").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  householdIdx: index("hmp_household_idx").on(t.householdId),
  memberIdx: index("hmp_member_idx").on(t.memberId),
  weekIdx: index("hmp_week_idx").on(t.householdId, t.weekStartDate),
}));
export type HouseholdMenuPlan = typeof householdMenuPlans.$inferSelect;
export type InsertHouseholdMenuPlan = typeof householdMenuPlans.$inferInsert;

// =============================================================================
// OFFLINE PATIENTS (pacientes sin cuenta Buddy, gestionados por el experto)
// =============================================================================
export const offlinePatients = pgTable("offline_patients", {
  id: serial("id").primaryKey(),
  expertUserId: integer("expertUserId").notNull(),
  buddyUserId: integer("buddyUserId"),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 40 }),
  birthDate: timestamp("birthDate"),
  gender: varchar("gender", { length: 20 }),
  heightCm: integer("heightCm"),
  initialWeightKg: real("initialWeightKg"),
  targetWeightKg: real("targetWeightKg"),
  activityLevel: varchar("activityLevel", { length: 50 }),
  objective: varchar("objective", { length: 100 }),
  allergies: text("allergies"),
  pathologies: text("pathologies"),
  medications: text("medications"),
  notes: text("notes"),
  consultationFrequencyWeeks: integer("consultationFrequencyWeeks").default(2),
  isActive: boolean("isActive").default(true).notNull(),
  inviteSentAt: timestamp("inviteSentAt"),
  inviteAcceptedAt: timestamp("inviteAcceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  expertIdx: index("op_expert_idx").on(t.expertUserId),
  emailIdx: index("op_email_idx").on(t.email),
}));
export type OfflinePatient = typeof offlinePatients.$inferSelect;
export type InsertOfflinePatient = typeof offlinePatients.$inferInsert;

export const patientWeightHistory = pgTable("patient_weight_history", {
  id: serial("id").primaryKey(),
  patientId: integer("patientId").notNull(),
  expertUserId: integer("expertUserId").notNull(),
  weightKg: real("weightKg").notNull(),
  bodyFatPct: real("bodyFatPct"),
  muscleMassPct: real("muscleMassPct"),
  waistCm: real("waistCm"),
  hipCm: real("hipCm"),
  notes: text("notes"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
}, (t) => ({
  patientIdx: index("pwh_patient_idx").on(t.patientId),
  expertIdx: index("pwh_expert_idx").on(t.expertUserId),
}));
export type PatientWeightHistory = typeof patientWeightHistory.$inferSelect;
export type InsertPatientWeightHistory = typeof patientWeightHistory.$inferInsert;

export const patientPlansSent = pgTable("patient_plans_sent", {
  id: serial("id").primaryKey(),
  patientId: integer("patientId").notNull(),
  expertUserId: integer("expertUserId").notNull(),
  channel: varchar("channel", { length: 20 }).notNull().default("email"),
  subject: varchar("subject", { length: 300 }),
  menuData: text("menuData"),
  weekStartDate: timestamp("weekStartDate"),
  weekEndDate: timestamp("weekEndDate"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
  openedAt: timestamp("openedAt"),
}, (t) => ({
  patientIdx: index("pps_patient_idx").on(t.patientId),
  expertIdx: index("pps_expert_idx").on(t.expertUserId),
}));
export type PatientPlanSent = typeof patientPlansSent.$inferSelect;
export type InsertPatientPlanSent = typeof patientPlansSent.$inferInsert;
