CREATE TYPE "public"."allergyType" AS ENUM('gluten', 'lactose', 'nuts', 'peanuts', 'shellfish', 'eggs', 'soy', 'sesame', 'fish', 'other');--> statement-breakpoint
CREATE TYPE "public"."childAgeGroup" AS ENUM('1_3', '4_6', '7_12', '13_17');--> statement-breakpoint
CREATE TYPE "public"."habitType" AS ENUM('water', 'fruit_vegetable', 'sleep', 'activity', 'breakfast', 'ultraprocesados', 'other');--> statement-breakpoint
CREATE TABLE "childAllergies" (
	"id" serial PRIMARY KEY NOT NULL,
	"childId" integer NOT NULL,
	"allergyType" "allergyType" NOT NULL,
	"allergyName" varchar(128) NOT NULL,
	"severity" varchar(32),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "childHabitLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"habitId" integer NOT NULL,
	"logDate" date NOT NULL,
	"completed" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "childHabits" (
	"id" serial PRIMARY KEY NOT NULL,
	"childId" integer NOT NULL,
	"habitType" "habitType" NOT NULL,
	"habitName" varchar(128) NOT NULL,
	"dailyTarget" integer,
	"unit" varchar(32),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "childLunchboxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"childId" integer NOT NULL,
	"dayOfWeek" varchar(32) NOT NULL,
	"lunchboxName" varchar(128) NOT NULL,
	"itemsJson" text,
	"calorieTarget" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "childMenus" (
	"id" serial PRIMARY KEY NOT NULL,
	"childId" integer NOT NULL,
	"weekStartDate" date NOT NULL,
	"menuType" varchar(64) NOT NULL,
	"mondayJson" text,
	"tuesdayJson" text,
	"wednesdayJson" text,
	"thursdayJson" text,
	"fridayJson" text,
	"saturdayJson" text,
	"sundayJson" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "childProfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(128) NOT NULL,
	"dateOfBirth" date NOT NULL,
	"ageGroup" "childAgeGroup" NOT NULL,
	"height" numeric(5, 2),
	"weight" numeric(5, 2),
	"gender" "gender",
	"favoriteFood" text[] DEFAULT '{}' NOT NULL,
	"dislikedFood" text[] DEFAULT '{}' NOT NULL,
	"objective" text,
	"notes" text,
	"imageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "childProgress" (
	"id" serial PRIMARY KEY NOT NULL,
	"childId" integer NOT NULL,
	"weekStartDate" date NOT NULL,
	"foodVarietyCount" integer,
	"fruitVegetableServings" integer,
	"mealsLogged" integer,
	"hydrationDays" integer,
	"newFoodsTried" text[] DEFAULT '{}' NOT NULL,
	"rejectedFoods" text[] DEFAULT '{}' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "childRecipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipeId" integer NOT NULL,
	"ageGroup" "childAgeGroup" NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"preparationTimeMinutes" integer,
	"cookingTimeMinutes" integer,
	"servings" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "familyCalendarEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"childId" integer,
	"eventType" varchar(64) NOT NULL,
	"eventDate" date NOT NULL,
	"eventTime" varchar(8),
	"title" varchar(256) NOT NULL,
	"description" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "childAllergies" ADD CONSTRAINT "childAllergies_childId_childProfiles_id_fk" FOREIGN KEY ("childId") REFERENCES "public"."childProfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "childHabitLogs" ADD CONSTRAINT "childHabitLogs_habitId_childHabits_id_fk" FOREIGN KEY ("habitId") REFERENCES "public"."childHabits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "childHabits" ADD CONSTRAINT "childHabits_childId_childProfiles_id_fk" FOREIGN KEY ("childId") REFERENCES "public"."childProfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "childLunchboxes" ADD CONSTRAINT "childLunchboxes_childId_childProfiles_id_fk" FOREIGN KEY ("childId") REFERENCES "public"."childProfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "childMenus" ADD CONSTRAINT "childMenus_childId_childProfiles_id_fk" FOREIGN KEY ("childId") REFERENCES "public"."childProfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "childProfiles" ADD CONSTRAINT "childProfiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "childProgress" ADD CONSTRAINT "childProgress_childId_childProfiles_id_fk" FOREIGN KEY ("childId") REFERENCES "public"."childProfiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "childRecipes" ADD CONSTRAINT "childRecipes_recipeId_recipes_id_fk" FOREIGN KEY ("recipeId") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "familyCalendarEvents" ADD CONSTRAINT "familyCalendarEvents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ca_child_idx" ON "childAllergies" USING btree ("childId");--> statement-breakpoint
CREATE INDEX "chl_habit_idx" ON "childHabitLogs" USING btree ("habitId");--> statement-breakpoint
CREATE INDEX "chl_date_idx" ON "childHabitLogs" USING btree ("logDate");--> statement-breakpoint
CREATE INDEX "ch_child_idx" ON "childHabits" USING btree ("childId");--> statement-breakpoint
CREATE INDEX "clb_child_idx" ON "childLunchboxes" USING btree ("childId");--> statement-breakpoint
CREATE INDEX "cm_child_idx" ON "childMenus" USING btree ("childId");--> statement-breakpoint
CREATE INDEX "cp_user_idx" ON "childProfiles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "cp_child_idx" ON "childProgress" USING btree ("childId");--> statement-breakpoint
CREATE INDEX "cr_recipe_idx" ON "childRecipes" USING btree ("recipeId");--> statement-breakpoint
CREATE INDEX "fce_user_idx" ON "familyCalendarEvents" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "fce_child_idx" ON "familyCalendarEvents" USING btree ("childId");