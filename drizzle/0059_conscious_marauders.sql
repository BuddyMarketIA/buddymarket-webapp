CREATE TYPE "public"."contextualEventAction" AS ENUM('view_recipe', 'start_workout', 'view_product', 'view_pet_profile', 'view_child_profile', 'add_to_cart', 'purchase', 'favorite', 'share', 'complete_workout', 'log_meal');--> statement-breakpoint
CREATE TYPE "public"."contextualEventModule" AS ENUM('buddycare', 'buddycoach', 'buddymarket', 'buddypets', 'buddykids');--> statement-breakpoint
CREATE TYPE "public"."recommendationReason" AS ENUM('recipe_ingredients', 'recipe_utensils', 'goal_match', 'calorie_balance', 'pet_safe', 'kid_adapted', 'workout_nutrition', 'workout_performance', 'equipment_upgrade', 'sportswear', 'pet_nutrition', 'pet_accessories', 'pet_exercise', 'vet_service', 'child_nutrition', 'child_health', 'child_exercise', 'child_ingredients', 'trending', 'profile_match', 'purchase_history');--> statement-breakpoint
CREATE TYPE "public"."recommendationType" AS ENUM('ingredients', 'utensils', 'supplements', 'workout', 'pet_recipe', 'kid_recipe', 'nutrition', 'equipment', 'sportswear', 'pet_food', 'pet_accessories', 'pet_training', 'vet_consultation', 'child_menus', 'child_supplements', 'child_activities', 'cross_module', 'trending', 'personalized');--> statement-breakpoint
CREATE TABLE "contextualEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"module" "contextualEventModule" NOT NULL,
	"action" "contextualEventAction" NOT NULL,
	"sourceItemId" varchar(256),
	"context" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contextualRecommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"sourceModule" "contextualEventModule" NOT NULL,
	"sourceItemId" varchar(256),
	"targetModule" "contextualEventModule" NOT NULL,
	"targetItemId" varchar(256),
	"recommendationType" "recommendationType" NOT NULL,
	"recommendationReason" "recommendationReason" NOT NULL,
	"priority" varchar(16) DEFAULT 'medium',
	"score" real DEFAULT 0,
	"title" varchar(256) NOT NULL,
	"description" text,
	"imageUrl" text,
	"productData" text,
	"clicked" boolean DEFAULT false,
	"clickedAt" timestamp,
	"converted" boolean DEFAULT false,
	"convertedAt" timestamp,
	"conversionValue" numeric(10, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "crossModuleConversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"recommendationId" integer,
	"sourceModule" "contextualEventModule" NOT NULL,
	"targetModule" "contextualEventModule" NOT NULL,
	"conversionType" varchar(64) NOT NULL,
	"value" numeric(10, 2),
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendationAnalytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"sourceModule" "contextualEventModule" NOT NULL,
	"targetModule" "contextualEventModule" NOT NULL,
	"totalRecommendations" integer DEFAULT 0,
	"totalClicks" integer DEFAULT 0,
	"totalConversions" integer DEFAULT 0,
	"clickThroughRate" real DEFAULT 0,
	"conversionRate" real DEFAULT 0,
	"totalValue" numeric(10, 2) DEFAULT '0',
	"lastUpdatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contextualEvents" ADD CONSTRAINT "contextualEvents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contextualRecommendations" ADD CONSTRAINT "contextualRecommendations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crossModuleConversions" ADD CONSTRAINT "crossModuleConversions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crossModuleConversions" ADD CONSTRAINT "crossModuleConversions_recommendationId_contextualRecommendations_id_fk" FOREIGN KEY ("recommendationId") REFERENCES "public"."contextualRecommendations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendationAnalytics" ADD CONSTRAINT "recommendationAnalytics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contextual_events_user_module_idx" ON "contextualEvents" USING btree ("userId","module");--> statement-breakpoint
CREATE INDEX "contextual_events_user_action_idx" ON "contextualEvents" USING btree ("userId","action");--> statement-breakpoint
CREATE INDEX "contextual_events_created_idx" ON "contextualEvents" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "recommendations_user_module_idx" ON "contextualRecommendations" USING btree ("userId","targetModule");--> statement-breakpoint
CREATE INDEX "recommendations_user_source_idx" ON "contextualRecommendations" USING btree ("userId","sourceModule");--> statement-breakpoint
CREATE INDEX "recommendations_score_idx" ON "contextualRecommendations" USING btree ("score");--> statement-breakpoint
CREATE INDEX "recommendations_created_idx" ON "contextualRecommendations" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "conversions_user_module_idx" ON "crossModuleConversions" USING btree ("userId","targetModule");--> statement-breakpoint
CREATE INDEX "conversions_source_target_idx" ON "crossModuleConversions" USING btree ("sourceModule","targetModule");--> statement-breakpoint
CREATE INDEX "conversions_created_idx" ON "crossModuleConversions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "analytics_user_module_idx" ON "recommendationAnalytics" USING btree ("userId","targetModule");--> statement-breakpoint
CREATE INDEX "analytics_source_target_idx" ON "recommendationAnalytics" USING btree ("sourceModule","targetModule");