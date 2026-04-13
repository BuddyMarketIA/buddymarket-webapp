CREATE TABLE "ingredient_nutrition" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"nameEn" varchar(200),
	"aliases" text,
	"category" varchar(100),
	"calories" real DEFAULT 0 NOT NULL,
	"protein" real DEFAULT 0 NOT NULL,
	"carbs" real DEFAULT 0 NOT NULL,
	"fat" real DEFAULT 0 NOT NULL,
	"fiber" real DEFAULT 0,
	"sugar" real DEFAULT 0,
	"sodium" real DEFAULT 0,
	"saturatedFat" real DEFAULT 0,
	"vitaminC" real,
	"vitaminA" real,
	"vitaminD" real,
	"vitaminB12" real,
	"calcium" real,
	"iron" real,
	"potassium" real,
	"magnesium" real,
	"glycemicIndex" integer,
	"isProcessed" boolean DEFAULT false,
	"source" varchar(100) DEFAULT 'generated',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "in_name_idx" ON "ingredient_nutrition" USING btree ("name");--> statement-breakpoint
CREATE INDEX "in_category_idx" ON "ingredient_nutrition" USING btree ("category");