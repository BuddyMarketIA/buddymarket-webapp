CREATE TYPE "public"."feeding_phase" AS ENUM('breastfeeding', 'formula', 'purees', 'soft_solids', 'normal');--> statement-breakpoint
CREATE TYPE "public"."household_member_type" AS ENUM('adult', 'child', 'baby');--> statement-breakpoint
ALTER TABLE "household_members" ADD COLUMN "memberType" "household_member_type" DEFAULT 'adult' NOT NULL;--> statement-breakpoint
ALTER TABLE "household_members" ADD COLUMN "birthDate" timestamp;--> statement-breakpoint
ALTER TABLE "household_members" ADD COLUMN "weightKg" real;--> statement-breakpoint
ALTER TABLE "household_members" ADD COLUMN "heightCm" real;--> statement-breakpoint
ALTER TABLE "household_members" ADD COLUMN "feedingPhase" "feeding_phase";--> statement-breakpoint
ALTER TABLE "household_members" ADD COLUMN "dislikedFoods" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "isKidFriendly" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "isBabyFriendly" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "isFingerFood" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "noAddedSugar" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "highIron" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "highCalcium" boolean DEFAULT false;