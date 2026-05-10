CREATE TYPE "public"."recipeInteractionType" AS ENUM('view', 'long_view', 'save', 'cooked', 'like', 'dislike', 'skip', 'share', 'add_to_menu', 'log_meal');--> statement-breakpoint
CREATE TABLE "recipe_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"recipeId" integer NOT NULL,
	"type" "recipeInteractionType" NOT NULL,
	"signalWeight" real DEFAULT 0 NOT NULL,
	"context" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ai_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"feedbackType" varchar(64) NOT NULL,
	"entityId" integer,
	"entityType" varchar(32),
	"comment" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_taste_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"cuisineScores" text DEFAULT '{}',
	"ingredientScores" text DEFAULT '{}',
	"cookingMethodScores" text DEFAULT '{}',
	"mealTimeScores" text DEFAULT '{}',
	"complexityPreference" real DEFAULT 0,
	"avgPrepTimePreference" real DEFAULT 30,
	"avgCaloriesPreference" real DEFAULT 500,
	"totalInteractions" integer DEFAULT 0 NOT NULL,
	"confidenceScore" integer DEFAULT 0 NOT NULL,
	"lastCalculatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_taste_profile_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE INDEX "ri_user_idx" ON "recipe_interactions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ri_recipe_idx" ON "recipe_interactions" USING btree ("recipeId");--> statement-breakpoint
CREATE INDEX "ri_type_idx" ON "recipe_interactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ri_user_recipe_idx" ON "recipe_interactions" USING btree ("userId","recipeId");--> statement-breakpoint
CREATE INDEX "uaf_user_idx" ON "user_ai_feedback" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "uaf_type_idx" ON "user_ai_feedback" USING btree ("feedbackType");--> statement-breakpoint
CREATE INDEX "utp_user_idx" ON "user_taste_profile" USING btree ("userId");