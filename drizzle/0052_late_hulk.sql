CREATE TYPE "public"."petActivityLevel" AS ENUM('sedentary', 'low', 'moderate', 'high', 'very_high');--> statement-breakpoint
CREATE TYPE "public"."petBodyCondition" AS ENUM('very_thin', 'thin', 'ideal', 'overweight', 'obese');--> statement-breakpoint
CREATE TYPE "public"."petDietType" AS ENUM('standard', 'barf', 'homecooked', 'mixed', 'prescription', 'vegetarian', 'senior', 'puppy_kitten', 'weight_loss', 'weight_gain', 'hypoallergenic', 'renal', 'diabetic');--> statement-breakpoint
CREATE TABLE "petMedications" (
	"id" serial PRIMARY KEY NOT NULL,
	"petId" integer NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"dosage" varchar(100),
	"frequency" varchar(100),
	"startDate" timestamp,
	"endDate" timestamp,
	"prescribedBy" varchar(150),
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petNutritionProfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"petId" integer NOT NULL,
	"userId" integer NOT NULL,
	"dietType" "petDietType" DEFAULT 'standard' NOT NULL,
	"activityLevel" "petActivityLevel" DEFAULT 'moderate' NOT NULL,
	"bodyCondition" "petBodyCondition" DEFAULT 'ideal' NOT NULL,
	"targetWeightKg" real,
	"allergiesJson" text,
	"foodsToAvoidJson" text,
	"favoriteFoodsJson" text,
	"medicalConditionsJson" text,
	"dailyCaloriesTarget" integer,
	"dailyGramsTarget" integer,
	"mealsPerDay" integer DEFAULT 2,
	"photoUrl" text,
	"photoAnalysisJson" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "petNutritionProfiles_petId_unique" UNIQUE("petId")
);
--> statement-breakpoint
CREATE TABLE "petVaccines" (
	"id" serial PRIMARY KEY NOT NULL,
	"petId" integer NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"administeredAt" timestamp,
	"nextDueAt" timestamp,
	"vetName" varchar(150),
	"batchNumber" varchar(100),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petWeightHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"petId" integer NOT NULL,
	"userId" integer NOT NULL,
	"weightValue" real NOT NULL,
	"weightUnit" "petWeightUnit" DEFAULT 'kg' NOT NULL,
	"bodyCondition" "petBodyCondition",
	"notes" text,
	"recordedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pm_pet_idx2" ON "petMedications" USING btree ("petId");--> statement-breakpoint
CREATE INDEX "pnp_pet_idx" ON "petNutritionProfiles" USING btree ("petId");--> statement-breakpoint
CREATE INDEX "pnp_user_idx" ON "petNutritionProfiles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "pv_pet_idx" ON "petVaccines" USING btree ("petId");--> statement-breakpoint
CREATE INDEX "pwh_pet_idx" ON "petWeightHistory" USING btree ("petId");--> statement-breakpoint
CREATE INDEX "pwh_user_idx" ON "petWeightHistory" USING btree ("userId");