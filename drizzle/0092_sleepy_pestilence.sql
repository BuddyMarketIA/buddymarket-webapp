CREATE TABLE "expert_recipe_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertUserId" integer NOT NULL,
	"patientId" integer NOT NULL,
	"recipeId" integer NOT NULL,
	"notes" text,
	"servings" integer DEFAULT 1,
	"mealTime" "mealTime" DEFAULT 'cualquiera',
	"assignedAt" timestamp DEFAULT now() NOT NULL,
	"sentByEmail" boolean DEFAULT false,
	"emailSentAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "expert_recipe_collection_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"collectionId" integer NOT NULL,
	"recipeId" integer NOT NULL,
	"addedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_recipe_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertUserId" integer NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"color" varchar(16) DEFAULT '#f97316',
	"icon" varchar(32) DEFAULT 'book',
	"recipeCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "era_expert_idx" ON "expert_recipe_assignments" USING btree ("expertUserId");--> statement-breakpoint
CREATE INDEX "era_patient_idx" ON "expert_recipe_assignments" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "era_recipe_idx" ON "expert_recipe_assignments" USING btree ("recipeId");--> statement-breakpoint
CREATE INDEX "erci_collection_idx" ON "expert_recipe_collection_items" USING btree ("collectionId");--> statement-breakpoint
CREATE INDEX "erci_recipe_idx" ON "expert_recipe_collection_items" USING btree ("recipeId");--> statement-breakpoint
CREATE UNIQUE INDEX "erci_unique_item" ON "expert_recipe_collection_items" USING btree ("collectionId","recipeId");--> statement-breakpoint
CREATE INDEX "erc_expert_idx" ON "expert_recipe_collections" USING btree ("expertUserId");