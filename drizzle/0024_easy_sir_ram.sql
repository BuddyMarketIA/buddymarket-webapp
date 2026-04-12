CREATE TABLE "household_recipe_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"householdId" integer NOT NULL,
	"memberId" integer NOT NULL,
	"recipeId" integer NOT NULL,
	"assignedByUserId" integer NOT NULL,
	"note" text,
	"mealType" varchar(32),
	"scheduledDate" timestamp,
	"isCompleted" boolean DEFAULT false,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hra_household_idx" ON "household_recipe_assignments" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "hra_member_idx" ON "household_recipe_assignments" USING btree ("memberId");--> statement-breakpoint
CREATE INDEX "hra_recipe_idx" ON "household_recipe_assignments" USING btree ("recipeId");--> statement-breakpoint
CREATE UNIQUE INDEX "hra_unique_assignment" ON "household_recipe_assignments" USING btree ("householdId","memberId","recipeId");