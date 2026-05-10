CREATE TYPE "public"."accountType" AS ENUM('user', 'buddymaker', 'buddyexpert', 'business');--> statement-breakpoint
CREATE TYPE "public"."activityLevel" AS ENUM('sedentary', 'light', 'moderate', 'active', 'very_active');--> statement-breakpoint
CREATE TYPE "public"."alcoholConsumption" AS ENUM('none', 'occasional', 'moderate', 'frequent');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('perdida_peso', 'ganancia_muscular', 'definicion', 'dieta_equilibrada', 'rendimiento', 'bienestar', 'vegano');--> statement-breakpoint
CREATE TYPE "public"."cookingLevel" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."creatorType" AS ENUM('buddyexpert', 'buddymaker');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."eatOutFrequency" AS ENUM('never', '1_2_month', '1_2_week', '3_plus_week');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."goal" AS ENUM('perdida_peso', 'ganancia_muscular', 'tonificacion', 'perdida_grasa', 'mantenimiento', 'bienestar', 'vegano');--> statement-breakpoint
CREATE TYPE "public"."heightUnit" AS ENUM('cm', 'ft');--> statement-breakpoint
CREATE TYPE "public"."iapEnvironment" AS ENUM('sandbox', 'production');--> statement-breakpoint
CREATE TYPE "public"."iapPlatform" AS ENUM('apple', 'google');--> statement-breakpoint
CREATE TYPE "public"."level" AS ENUM('principiante', 'intermedio', 'avanzado');--> statement-breakpoint
CREATE TYPE "public"."mainGoal" AS ENUM('lose_weight', 'gain_muscle', 'maintain', 'improve_health', 'eat_healthier');--> statement-breakpoint
CREATE TYPE "public"."manualPlan" AS ENUM('free', 'basic', 'premium', 'pro_max');--> statement-breakpoint
CREATE TYPE "public"."mealPrepTime" AS ENUM('under_15', '15_30', '30_60', 'over_60');--> statement-breakpoint
CREATE TYPE "public"."mealTime" AS ENUM('desayuno', 'media_manana', 'comida', 'merienda', 'cena', 'cualquiera');--> statement-breakpoint
CREATE TYPE "public"."mealType" AS ENUM('desayuno', 'media_manana', 'comida', 'merienda', 'cena', 'otro');--> statement-breakpoint
CREATE TYPE "public"."motivationLevel" AS ENUM('low', 'medium', 'high', 'very_high');--> statement-breakpoint
CREATE TYPE "public"."ownerType" AS ENUM('buddyexpert', 'buddymaker');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'basic', 'premium', 'pro_max');--> statement-breakpoint
CREATE TYPE "public"."portionSize" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "public"."preferredMealComplexity" AS ENUM('simple', 'moderate', 'complex');--> statement-breakpoint
CREATE TYPE "public"."registrationStep" AS ENUM('account_type', 'profile_setup', 'application', 'pending_approval', 'completed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'buddyexpert', 'buddymaker', 'business');--> statement-breakpoint
CREATE TYPE "public"."roleType" AS ENUM('buddymaker', 'buddyexpert');--> statement-breakpoint
CREATE TYPE "public"."smokingStatus" AS ENUM('non_smoker', 'ex_smoker', 'smoker');--> statement-breakpoint
CREATE TYPE "public"."snackingHabits" AS ENUM('never', 'rarely', 'sometimes', 'often');--> statement-breakpoint
CREATE TYPE "public"."sportsFrequency" AS ENUM('never', '1_2_week', '3_4_week', '5_plus_week', 'daily');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'trial', 'cancelled', 'expired', 'past_due', 'pending');--> statement-breakpoint
CREATE TYPE "public"."stressLevel" AS ENUM('low', 'moderate', 'high', 'very_high');--> statement-breakpoint
CREATE TYPE "public"."supermarket" AS ENUM('general', 'mercadona', 'lidl', 'carrefour', 'alcampo', 'dia', 'el_corte_ingles');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('weekly', 'monthly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."weightUnit" AS ENUM('kg', 'lb');--> statement-breakpoint
CREATE TYPE "public"."workType" AS ENUM('sedentary_desk', 'light_standing', 'moderate_physical', 'heavy_physical');--> statement-breakpoint
CREATE TABLE "ai_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"mealLogId" integer,
	"rating" integer NOT NULL,
	"accurate" boolean NOT NULL,
	"comment" text,
	"detectedDishName" varchar(256),
	"detectedCalories" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alcampo_products" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(512) NOT NULL,
	"brand" varchar(256),
	"price" real,
	"price_per_unit" varchar(64),
	"image" varchar(512),
	"category" varchar(256),
	"subcategory" varchar(256),
	"packaging" varchar(128),
	"product_url" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "allergies" (
	"id" serial PRIMARY KEY NOT NULL,
	"apiParam" varchar(64) NOT NULL,
	"nameEs" varchar(128) NOT NULL,
	"nameEn" varchar(128),
	"imageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "allergies_apiParam_unique" UNIQUE("apiParam")
);
--> statement-breakpoint
CREATE TABLE "buddy_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "type" NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"displayName" varchar(128) NOT NULL,
	"bio" text,
	"specialty" varchar(128),
	"instagramHandle" varchar(64),
	"youtubeHandle" varchar(64),
	"tiktokHandle" varchar(64),
	"websiteUrl" varchar(256),
	"motivation" text,
	"experience" text,
	"expertCategory" varchar(64),
	"certifications" text,
	"adminNote" text,
	"reviewedAt" timestamp,
	"reviewedBy" integer,
	"appliedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buddy_experts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"displayName" varchar(128) NOT NULL,
	"specialty" varchar(128),
	"bio" text,
	"avatarUrl" text,
	"coverUrl" text,
	"instagramHandle" varchar(64),
	"websiteUrl" text,
	"category" "category" DEFAULT 'dieta_equilibrada',
	"verified" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"followersCount" integer DEFAULT 0 NOT NULL,
	"plansCount" integer DEFAULT 0 NOT NULL,
	"rating" real DEFAULT 0,
	"reviewsCount" integer DEFAULT 0 NOT NULL,
	"stripeAccountId" varchar(128),
	"stripeOnboardingCompleted" boolean DEFAULT false NOT NULL,
	"commissionRate" real DEFAULT 0.2 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "buddy_experts_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "buddy_makers" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"displayName" varchar(128) NOT NULL,
	"bio" text,
	"avatarUrl" text,
	"coverUrl" text,
	"instagramHandle" varchar(64),
	"youtubeHandle" varchar(64),
	"tiktokHandle" varchar(64),
	"specialty" varchar(128),
	"verified" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"followersCount" integer DEFAULT 0 NOT NULL,
	"recipesCount" integer DEFAULT 0 NOT NULL,
	"rating" real DEFAULT 0,
	"stripeAccountId" varchar(128),
	"stripeOnboardingCompleted" boolean DEFAULT false NOT NULL,
	"commissionRate" real DEFAULT 0.2 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "buddy_makers_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "carrefour_products" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(512) NOT NULL,
	"brand" varchar(256),
	"price" real,
	"price_per_unit" varchar(64),
	"image" varchar(512),
	"category" varchar(256),
	"subcategory" varchar(256),
	"packaging" varchar(128),
	"product_url" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complement_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"complementId" integer NOT NULL,
	"quantity" real DEFAULT 1 NOT NULL,
	"loggedAt" timestamp DEFAULT now() NOT NULL,
	"mealType" "mealType" DEFAULT 'otro' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complements" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"nameEs" varchar(256),
	"category" "category" DEFAULT 'otro' NOT NULL,
	"servingSize" integer DEFAULT 100 NOT NULL,
	"servingUnit" varchar(20) DEFAULT 'g' NOT NULL,
	"servingLabel" varchar(64),
	"calories" integer,
	"proteins" real,
	"carbs" real,
	"fats" real,
	"fiber" real,
	"sugar" real,
	"caffeine" real,
	"imageUrl" text,
	"emoji" varchar(8) DEFAULT '🍽️',
	"isSeeded" boolean DEFAULT false,
	"isPublic" boolean DEFAULT true,
	"userId" integer,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"creatorUserId" integer NOT NULL,
	"creatorType" "creatorType" NOT NULL,
	"subscriberUserId" integer NOT NULL,
	"subscriptionId" varchar(128),
	"amount" real NOT NULL,
	"commissionRate" real DEFAULT 0.2 NOT NULL,
	"commissionAmount" real NOT NULL,
	"stripeTransferId" varchar(128),
	"status" "status" DEFAULT 'pending' NOT NULL,
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "day_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"apiParam" varchar(64) NOT NULL,
	"nameEs" varchar(64) NOT NULL,
	"nameEn" varchar(64),
	"order" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "day_parts_apiParam_unique" UNIQUE("apiParam")
);
--> statement-breakpoint
CREATE TABLE "diet_restrictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"apiParam" varchar(64) NOT NULL,
	"nameEs" varchar(128) NOT NULL,
	"nameEn" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "diet_restrictions_apiParam_unique" UNIQUE("apiParam")
);
--> statement-breakpoint
CREATE TABLE "email_sequence_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"sequenceStep" integer NOT NULL,
	"scheduledAt" timestamp NOT NULL,
	"sentAt" timestamp,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_followers" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"expertId" integer NOT NULL,
	"followedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"coverUrl" text,
	"weekNumber" integer,
	"year" integer,
	"category" "category" DEFAULT 'dieta_equilibrada',
	"dailyCalories" integer,
	"isFree" boolean DEFAULT true NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"copiesCount" integer DEFAULT 0 NOT NULL,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"menuData" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"coverUrl" text,
	"category" "category" DEFAULT 'dieta_equilibrada',
	"durationWeeks" integer DEFAULT 4 NOT NULL,
	"dailyCalories" integer,
	"dailyMeals" integer DEFAULT 3,
	"level" "level" DEFAULT 'principiante',
	"tags" text,
	"isPublic" boolean DEFAULT true NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"copiesCount" integer DEFAULT 0 NOT NULL,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"price" real DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"apiParam" varchar(64) NOT NULL,
	"nameEs" varchar(128) NOT NULL,
	"nameEn" varchar(128),
	"imageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_categories_apiParam_unique" UNIQUE("apiParam")
);
--> statement-breakpoint
CREATE TABLE "in_app_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"type" "type" DEFAULT 'info' NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"link" varchar(500),
	"imageUrl" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"readAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "ingredient_allergies" (
	"ingredientId" integer NOT NULL,
	"allergyId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ingredient_allergies_ingredientId_allergyId_unique" UNIQUE("ingredientId","allergyId")
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"apiParam" varchar(128) NOT NULL,
	"nameEs" varchar(256) NOT NULL,
	"nameEn" varchar(256),
	"imageUrl" text,
	"purchaseUnitType" varchar(64),
	"purchaseGramsPerUnit" integer,
	"purchaseUnitSingular" varchar(64),
	"purchaseUnitPlural" varchar(64),
	"calories" integer,
	"proteins" real,
	"carbohydrates" real,
	"fats" real,
	"saturatedFats" real,
	"fiber" real,
	"sugars" real,
	"sodium" real,
	"potassium" real,
	"calcium" real,
	"iron" real,
	"magnesium" real,
	"phosphorus" real,
	"zinc" real,
	"vitaminC" real,
	"vitaminA" real,
	"vitaminD" real,
	"vitaminE" real,
	"vitaminK" real,
	"vitaminB1" real,
	"vitaminB2" real,
	"vitaminB3" real,
	"vitaminB6" real,
	"vitaminB12" real,
	"folate" real,
	"cholesterol" real,
	"omega3" real,
	"omega6" real,
	"category" varchar(64),
	"isVegan" boolean DEFAULT false,
	"isVegetarian" boolean DEFAULT false,
	"isGlutenFree" boolean DEFAULT false,
	"isDairyFree" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ingredients_apiParam_unique" UNIQUE("apiParam")
);
--> statement-breakpoint
CREATE TABLE "lidl_products" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(512) NOT NULL,
	"full_title" varchar(512),
	"brand" varchar(256),
	"image" varchar(512),
	"price" real,
	"packaging" varchar(128),
	"category" varchar(256),
	"canonical_path" varchar(512),
	"online_available" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maker_followers" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"makerId" integer NOT NULL,
	"followedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"recipeId" integer,
	"customMealName" varchar(256),
	"dayPartId" integer,
	"logDate" date NOT NULL,
	"servings" real DEFAULT 1,
	"calories" integer,
	"proteins" real,
	"carbohydrates" real,
	"fats" real,
	"notes" text,
	"photoUrl" varchar(1024),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"mealType" varchar(20) NOT NULL,
	"time" varchar(5) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"daysMask" integer DEFAULT 127 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meal_reminders_unique" UNIQUE("userId","mealType")
);
--> statement-breakpoint
CREATE TABLE "measures" (
	"id" serial PRIMARY KEY NOT NULL,
	"apiParam" varchar(64) NOT NULL,
	"nameEs" varchar(64) NOT NULL,
	"nameEn" varchar(64),
	"abbreviation" varchar(16),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "measures_apiParam_unique" UNIQUE("apiParam")
);
--> statement-breakpoint
CREATE TABLE "menu_complements" (
	"id" serial PRIMARY KEY NOT NULL,
	"menuOrganizerId" integer NOT NULL,
	"userId" integer NOT NULL,
	"complementId" integer,
	"customName" varchar(256),
	"emoji" varchar(8) DEFAULT '☕',
	"mealTime" "mealTime" DEFAULT 'otro' NOT NULL,
	"quantity" real DEFAULT 1 NOT NULL,
	"unit" varchar(32) DEFAULT 'ud',
	"calories" integer,
	"notes" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_dp_recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"menuOrganizerDayPartId" integer NOT NULL,
	"recipeId" integer NOT NULL,
	"servings" real DEFAULT 1,
	"completed" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mdpr_uniq" UNIQUE("menuOrganizerDayPartId","recipeId")
);
--> statement-breakpoint
CREATE TABLE "menu_organizer_day_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"menuOrganizerId" integer NOT NULL,
	"dayPartId" integer NOT NULL,
	"date" date,
	"dayNumber" integer,
	"mealNumber" integer,
	"name" varchar(128),
	"notes" text,
	"completed" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_organizers" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"type" "type" DEFAULT 'weekly',
	"isPublic" boolean DEFAULT false,
	"objective" text,
	"goal" "goal",
	"dailyCalories" integer,
	"persons" integer DEFAULT 1,
	"difficulty" "difficulty" DEFAULT 'facil',
	"isSeeded" boolean DEFAULT false,
	"dailyMealsCount" integer DEFAULT 3,
	"generatedByAI" boolean DEFAULT false,
	"isActive" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mercadona_products" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug" varchar(256) NOT NULL,
	"name" varchar(512) NOT NULL,
	"packaging" varchar(128),
	"thumbnail" varchar(512),
	"share_url" varchar(512),
	"category_id" integer,
	"category_name" varchar(256),
	"subcategory_id" integer,
	"subcategory_name" varchar(256),
	"bulk_price" varchar(32),
	"unit_price" varchar(32),
	"unit_size" real,
	"size_format" varchar(16),
	"reference_price" varchar(32),
	"reference_format" varchar(16),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"codeHash" varchar(64) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"ipAddress" varchar(45),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pantry_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"ingredientKey" varchar(256) NOT NULL,
	"ingredientName" varchar(256) NOT NULL,
	"commercialLabel" varchar(256),
	"quantityPurchased" real DEFAULT 1 NOT NULL,
	"quantityAvailable" real DEFAULT 1 NOT NULL,
	"unitSizeGrams" real,
	"estimatedExpiresAt" timestamp,
	"purchasedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_allergies" (
	"recipeId" integer NOT NULL,
	"allergyId" integer NOT NULL,
	CONSTRAINT "recipe_allergies_recipeId_allergyId_unique" UNIQUE("recipeId","allergyId")
);
--> statement-breakpoint
CREATE TABLE "recipe_diet_restrictions" (
	"recipeId" integer NOT NULL,
	"dietRestrictionId" integer NOT NULL,
	CONSTRAINT "recipe_diet_restrictions_recipeId_dietRestrictionId_unique" UNIQUE("recipeId","dietRestrictionId")
);
--> statement-breakpoint
CREATE TABLE "recipe_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"recipeId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_favorites_unique" UNIQUE("userId","recipeId")
);
--> statement-breakpoint
CREATE TABLE "recipe_food_categories" (
	"recipeId" integer NOT NULL,
	"foodCategoryId" integer NOT NULL,
	CONSTRAINT "recipe_food_categories_recipeId_foodCategoryId_unique" UNIQUE("recipeId","foodCategoryId")
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipeId" integer NOT NULL,
	"ingredientId" integer NOT NULL,
	"measureId" integer,
	"amount" real NOT NULL,
	"optional" boolean DEFAULT false,
	"notes" text,
	"order" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_ingredients_recipeId_ingredientId_unique" UNIQUE("recipeId","ingredientId")
);
--> statement-breakpoint
CREATE TABLE "recipe_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"recipeId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_likes_unique" UNIQUE("userId","recipeId")
);
--> statement-breakpoint
CREATE TABLE "recipe_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipeId" integer NOT NULL,
	"stepNumber" integer NOT NULL,
	"instruction" text NOT NULL,
	"imageUrl" text,
	"timing" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_steps_recipeId_stepNumber_unique" UNIQUE("recipeId","stepNumber")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"imageUrl" text,
	"description" text,
	"preparationTime" integer DEFAULT 0,
	"cookTime" integer DEFAULT 0,
	"servings" integer DEFAULT 1,
	"difficulty" "difficulty" DEFAULT 'medium',
	"isPublic" boolean DEFAULT true,
	"active" boolean DEFAULT true,
	"mealTime" "mealTime" DEFAULT 'cualquiera',
	"category" varchar(64),
	"cuisineType" varchar(64),
	"cookingMethod" varchar(64),
	"allergens" text,
	"tags" text,
	"caloriesPerServing" integer,
	"proteinsPerServing" real,
	"carbsPerServing" real,
	"fatsPerServing" real,
	"fiberPerServing" real,
	"buddyMakerId" integer,
	"ingredientsJson" text,
	"instructionsJson" text,
	"isSeeded" boolean DEFAULT false,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"ownerType" "ownerType" NOT NULL,
	"code" varchar(50) NOT NULL,
	"stripeCouponId" varchar(100),
	"stripePromoCodeId" varchar(100),
	"discountPercent" integer DEFAULT 15 NOT NULL,
	"commissionPercent" integer DEFAULT 20 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"totalEarned" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"referralCodeId" integer NOT NULL,
	"referrerId" integer NOT NULL,
	"referredUserId" integer NOT NULL,
	"stripeSubscriptionId" varchar(100),
	"stripeInvoiceId" varchar(100),
	"stripeTransferId" varchar(100),
	"subscriptionAmount" integer NOT NULL,
	"commissionAmount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'eur' NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"transferredAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "referral_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"referralCodeId" integer NOT NULL,
	"referrerId" integer NOT NULL,
	"referredUserId" integer NOT NULL,
	"stripeSubscriptionId" varchar(100) NOT NULL,
	"stripeCustomerId" varchar(100),
	"plan" varchar(50),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"cancelledAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "role_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"roleType" "roleType" NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"motivation" text,
	"socialLinks" text,
	"specialties" text,
	"reviewNote" text,
	"reviewedAt" timestamp,
	"reviewedBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_requests_user_role_unique" UNIQUE("userId","roleType")
);
--> statement-breakpoint
CREATE TABLE "saved_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"eventType" varchar(64) NOT NULL,
	"eventName" varchar(128) NOT NULL,
	"persons" integer DEFAULT 4 NOT NULL,
	"categories" varchar(256),
	"menuData" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_list_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"shoppingListId" integer NOT NULL,
	"ingredientId" integer,
	"customName" varchar(256),
	"amount" real,
	"measureId" integer,
	"category" varchar(128),
	"checked" boolean DEFAULT false,
	"inPantry" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_list_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"supermarket" varchar(64) DEFAULT 'general',
	"itemsJson" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"menuOrganizerId" integer,
	"supermarket" "supermarket" DEFAULT 'general',
	"persons" integer DEFAULT 1,
	"generatedByAI" boolean DEFAULT false,
	"completed" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"apiParam" varchar(64) NOT NULL,
	"nameEs" varchar(64) NOT NULL,
	"nameEn" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "storage_locations_apiParam_unique" UNIQUE("apiParam")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"achievementId" varchar(64) NOT NULL,
	"unlockedAt" timestamp DEFAULT now() NOT NULL,
	"pointsAwarded" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_achievements_unique" UNIQUE("userId","achievementId")
);
--> statement-breakpoint
CREATE TABLE "user_allergies" (
	"userId" integer NOT NULL,
	"allergyId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_allergies_userId_allergyId_unique" UNIQUE("userId","allergyId")
);
--> statement-breakpoint
CREATE TABLE "user_banned_ingredients" (
	"userId" integer NOT NULL,
	"ingredientId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_banned_ingredients_userId_ingredientId_unique" UNIQUE("userId","ingredientId")
);
--> statement-breakpoint
CREATE TABLE "user_diet_restrictions" (
	"userId" integer NOT NULL,
	"dietRestrictionId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_diet_restrictions_userId_dietRestrictionId_unique" UNIQUE("userId","dietRestrictionId")
);
--> statement-breakpoint
CREATE TABLE "user_expert_plan_copies" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"planId" integer NOT NULL,
	"expertId" integer NOT NULL,
	"copiedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorite_recipes" (
	"userId" integer NOT NULL,
	"recipeId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_favorite_recipes_userId_recipeId_unique" UNIQUE("userId","recipeId")
);
--> statement-breakpoint
CREATE TABLE "user_food_categories" (
	"userId" integer NOT NULL,
	"foodCategoryId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_food_categories_userId_foodCategoryId_unique" UNIQUE("userId","foodCategoryId")
);
--> statement-breakpoint
CREATE TABLE "user_health_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"weight" real,
	"bodyFatPercentage" real,
	"muscleMass" real,
	"recordedAt" date NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"ingredientId" integer,
	"customName" varchar(256),
	"amount" real NOT NULL,
	"measureId" integer,
	"storageLocationId" integer,
	"expirationDate" date,
	"purchaseDate" date,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_medical_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"nutritionalSupplements" text,
	"useNutritionalSupplements" boolean DEFAULT false,
	"medicalDiet" text,
	"hasMedicalDiet" boolean DEFAULT false,
	"surgery" text,
	"hasSurgery" boolean DEFAULT false,
	"medicalFamilyBackground" text,
	"hasMedicalFamilyBackground" boolean DEFAULT false,
	"metabolismMedication" text,
	"useMetabolismMedication" boolean DEFAULT false,
	"medicalConditions" text,
	"hasMedicalConditions" boolean DEFAULT false,
	"dietaryPattern" varchar(64),
	"lifestyle" text,
	"specialNeeds" text,
	"pregnancyWeek" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_medical_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "user_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" date NOT NULL,
	"weight" real,
	"bodyFat" real,
	"muscleMass" real,
	"bmi" real,
	"waist" real,
	"hip" real,
	"chest" real,
	"arm" real,
	"thigh" real,
	"calf" real,
	"neck" real,
	"visceralFat" real,
	"boneMass" real,
	"waterPercentage" real,
	"metabolicAge" integer,
	"basalMetabolism" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"totalPoints" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_points_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"purchaseFrequency" varchar(64),
	"purchaseLocation" varchar(128),
	"suggestHealthierProducts" boolean DEFAULT false,
	"suggestCheaperProducts" boolean DEFAULT false,
	"organicProducts" boolean,
	"interestedInNutritionalAdvices" boolean DEFAULT false,
	"notifications" boolean DEFAULT false,
	"newsletter" boolean DEFAULT false,
	"acceptTerms" boolean DEFAULT false,
	"preferredMealComplexity" "preferredMealComplexity",
	"portionSize" "portionSize",
	"preferSeasonalIngredients" boolean DEFAULT false,
	"preferLocalProducts" boolean DEFAULT false,
	"avoidProcessedFood" boolean DEFAULT false,
	"interestedInMealPrep" boolean DEFAULT false,
	"wantsShoppingListAutomation" boolean DEFAULT false,
	"wantsCalorieTracking" boolean DEFAULT false,
	"wantsMacroTracking" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"age" integer,
	"birthYear" integer,
	"height" real,
	"weight" real,
	"targetWeight" real,
	"bodyFatPercentage" real,
	"muscleMass" real,
	"basalMetabolicRate" real,
	"dailyCalorieGoal" integer,
	"dailyProteinGoal" real,
	"dailyCarbsGoal" real,
	"dailyFatGoal" real,
	"sleepHours" integer,
	"dailyMeals" integer,
	"gender" "gender",
	"cookingLevel" "cookingLevel",
	"activityLevel" "activityLevel",
	"mainGoal" "mainGoal",
	"heightUnit" "heightUnit" DEFAULT 'cm',
	"weightUnit" "weightUnit" DEFAULT 'kg',
	"practicesSports" boolean DEFAULT false,
	"sportsFrequency" "sportsFrequency",
	"sportsTypes" text,
	"workType" "workType",
	"stressLevel" "stressLevel",
	"waterIntake" real,
	"alcoholConsumption" "alcoholConsumption",
	"smokingStatus" "smokingStatus",
	"weightChangeRate" real,
	"mealPrepTime" "mealPrepTime",
	"budgetPerWeek" real,
	"favoriteCuisines" text,
	"dislikedIngredients" text,
	"cookingEquipment" text,
	"mealsPerDayDetail" text,
	"snackingHabits" "snackingHabits",
	"eatOutFrequency" "eatOutFrequency",
	"fitnessGoalDetail" text,
	"motivationLevel" "motivationLevel",
	"previousDietExperience" text,
	"menuDietType" varchar(32),
	"menuAllergies" text,
	"menuRestrictions" text,
	"menuDislikedFoods" text,
	"menuProteinSource" varchar(32),
	"menuCookingTime" varchar(32),
	"menuCookingSkill" varchar(32),
	"menuKitchenEquipment" text,
	"menuSupplements" text,
	"menuSpecialNotes" text,
	"menuPersons" integer,
	"menuMealsPerDay" integer,
	"menuPreferencesUpdatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"stripeSubscriptionId" varchar(128),
	"stripeCustomerId" varchar(128),
	"stripePriceId" varchar(128),
	"status" "status" DEFAULT 'pending' NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"currentPeriodStart" timestamp,
	"currentPeriodEnd" timestamp,
	"cancelAtPeriodEnd" boolean DEFAULT false,
	"manualPlan" "manualPlan" DEFAULT 'free',
	"manualPlanNote" varchar(255),
	"iapPlatform" "iapPlatform",
	"iapOriginalTransactionId" varchar(256),
	"iapTransactionId" varchar(256),
	"iapProductId" varchar(128),
	"iapEnvironment" "iapEnvironment",
	"iapExpiresAt" timestamp,
	"iapLastVerifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"phone" varchar(32),
	"imageUrl" text,
	"description" text,
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"accountType" "accountType" DEFAULT 'user' NOT NULL,
	"registrationStep" "registrationStep" DEFAULT 'account_type' NOT NULL,
	"locale" varchar(8) DEFAULT 'es' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"onboardingCompleted" boolean DEFAULT false NOT NULL,
	"stripeCustomerId" varchar(128),
	"emailVerifiedAt" timestamp,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE INDEX "ai_fb_user_idx" ON "ai_feedback" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ai_fb_rating_idx" ON "ai_feedback" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "alc_name_idx" ON "alcampo_products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "alc_category_idx" ON "alcampo_products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "buddy_apps_user_idx" ON "buddy_applications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "buddy_apps_status_idx" ON "buddy_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "buddy_apps_type_idx" ON "buddy_applications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "buddy_experts_user_idx" ON "buddy_experts" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "buddy_experts_category_idx" ON "buddy_experts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "buddy_makers_user_idx" ON "buddy_makers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "carr_name_idx" ON "carrefour_products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "carr_category_idx" ON "carrefour_products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "complement_logs_user_idx" ON "complement_logs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "complement_logs_date_idx" ON "complement_logs" USING btree ("loggedAt");--> statement-breakpoint
CREATE INDEX "complements_name_idx" ON "complements" USING btree ("name");--> statement-breakpoint
CREATE INDEX "complements_category_idx" ON "complements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "creator_earnings_creator_idx" ON "creator_earnings" USING btree ("creatorUserId");--> statement-breakpoint
CREATE INDEX "creator_earnings_subscriber_idx" ON "creator_earnings" USING btree ("subscriberUserId");--> statement-breakpoint
CREATE INDEX "email_seq_user_idx" ON "email_sequence_queue" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "email_seq_status_idx" ON "email_sequence_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_seq_scheduled_idx" ON "email_sequence_queue" USING btree ("scheduledAt");--> statement-breakpoint
CREATE INDEX "expert_followers_user_idx" ON "expert_followers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "expert_followers_expert_idx" ON "expert_followers" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "expert_menus_expert_idx" ON "expert_menus" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "expert_menus_category_idx" ON "expert_menus" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expert_plans_expert_idx" ON "expert_plans" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "expert_plans_category_idx" ON "expert_plans" USING btree ("category");--> statement-breakpoint
CREATE INDEX "notif_user_idx" ON "in_app_notifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notif_read_idx" ON "in_app_notifications" USING btree ("isRead");--> statement-breakpoint
CREATE INDEX "notif_created_idx" ON "in_app_notifications" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "lidl_name_idx" ON "lidl_products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "lidl_cat_idx" ON "lidl_products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "maker_followers_user_idx" ON "maker_followers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "maker_followers_maker_idx" ON "maker_followers" USING btree ("makerId");--> statement-breakpoint
CREATE INDEX "meal_log_user_idx" ON "meal_logs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "meal_log_date_idx" ON "meal_logs" USING btree ("logDate");--> statement-breakpoint
CREATE INDEX "meal_reminders_user_idx" ON "meal_reminders" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "mc_menu_idx" ON "menu_complements" USING btree ("menuOrganizerId");--> statement-breakpoint
CREATE INDEX "mc_user_idx" ON "menu_complements" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "menu_dp_menu_idx" ON "menu_organizer_day_parts" USING btree ("menuOrganizerId");--> statement-breakpoint
CREATE INDEX "menu_dp_menu_date_idx" ON "menu_organizer_day_parts" USING btree ("menuOrganizerId","date");--> statement-breakpoint
CREATE INDEX "menu_user_idx" ON "menu_organizers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "menu_user_created_idx" ON "menu_organizers" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "menu_user_active_idx" ON "menu_organizers" USING btree ("userId","isActive");--> statement-breakpoint
CREATE INDEX "merc_slug_idx" ON "mercadona_products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "merc_cat_idx" ON "mercadona_products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "merc_name_idx" ON "mercadona_products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "otp_email_idx" ON "otp_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "otp_expires_idx" ON "otp_tokens" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "ps_user_idx" ON "pantry_stock" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ps_user_key_idx" ON "pantry_stock" USING btree ("userId","ingredientKey");--> statement-breakpoint
CREATE INDEX "push_subs_user_idx" ON "push_subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "recipe_favorites_user_idx" ON "recipe_favorites" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "recipe_favorites_recipe_idx" ON "recipe_favorites" USING btree ("recipeId");--> statement-breakpoint
CREATE INDEX "recipe_likes_user_idx" ON "recipe_likes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "recipe_likes_recipe_idx" ON "recipe_likes" USING btree ("recipeId");--> statement-breakpoint
CREATE INDEX "recipe_user_idx" ON "recipes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "recipe_user_created_idx" ON "recipes" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "recipe_meal_time_idx" ON "recipes" USING btree ("mealTime");--> statement-breakpoint
CREATE INDEX "recipe_buddy_maker_idx" ON "recipes" USING btree ("buddyMakerId");--> statement-breakpoint
CREATE INDEX "recipe_name_idx" ON "recipes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "recipe_cuisine_idx" ON "recipes" USING btree ("cuisineType");--> statement-breakpoint
CREATE INDEX "recipe_cooking_method_idx" ON "recipes" USING btree ("cookingMethod");--> statement-breakpoint
CREATE INDEX "referral_user_idx" ON "referral_codes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "referral_code_idx" ON "referral_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ref_earn_code_idx" ON "referral_earnings" USING btree ("referralCodeId");--> statement-breakpoint
CREATE INDEX "ref_earn_referrer_idx" ON "referral_earnings" USING btree ("referrerId");--> statement-breakpoint
CREATE INDEX "ref_sub_code_idx" ON "referral_subscriptions" USING btree ("referralCodeId");--> statement-breakpoint
CREATE INDEX "ref_sub_referrer_idx" ON "referral_subscriptions" USING btree ("referrerId");--> statement-breakpoint
CREATE INDEX "ref_sub_stripe_idx" ON "referral_subscriptions" USING btree ("stripeSubscriptionId");--> statement-breakpoint
CREATE INDEX "role_requests_user_idx" ON "role_requests" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "saved_events_user_idx" ON "saved_events" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "shopping_user_idx" ON "shopping_lists" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_achievements_user_idx" ON "user_achievements" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "plan_copies_user_idx" ON "user_expert_plan_copies" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "plan_copies_plan_idx" ON "user_expert_plan_copies" USING btree ("planId");--> statement-breakpoint
CREATE INDEX "health_metrics_user_idx" ON "user_health_metrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "inventory_user_idx" ON "user_inventory_items" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_metrics_user_idx" ON "user_metrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_metrics_date_idx" ON "user_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "user_metrics_user_date_idx" ON "user_metrics" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("active");