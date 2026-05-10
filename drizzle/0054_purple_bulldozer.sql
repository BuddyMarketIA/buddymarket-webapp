ALTER TABLE "petNutritionProfiles" ADD COLUMN "currentFoodBrand" text;--> statement-breakpoint
ALTER TABLE "petNutritionProfiles" ADD COLUMN "currentFoodType" text;--> statement-breakpoint
ALTER TABLE "petNutritionProfiles" ADD COLUMN "currentFoodFrequency" integer;--> statement-breakpoint
ALTER TABLE "petNutritionProfiles" ADD COLUMN "currentFoodAmountGrams" integer;--> statement-breakpoint
ALTER TABLE "petNutritionProfiles" ADD COLUMN "currentFoodNotes" text;--> statement-breakpoint
ALTER TABLE "petNutritionProfiles" ADD COLUMN "supplementsJson" text;--> statement-breakpoint
ALTER TABLE "petNutritionProfiles" ADD COLUMN "treatsFrequency" text;--> statement-breakpoint
ALTER TABLE "petNutritionProfiles" ADD COLUMN "waterIntakeType" text;--> statement-breakpoint
ALTER TABLE "petNutritionProfiles" ADD COLUMN "feedingScheduleJson" text;--> statement-breakpoint
ALTER TABLE "petNutritionProfiles" ADD COLUMN "currentDietAnalysisJson" text;--> statement-breakpoint
ALTER TABLE "petNutritionProfiles" ADD COLUMN "currentDietAnalyzedAt" timestamp;