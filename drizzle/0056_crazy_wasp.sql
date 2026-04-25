ALTER TABLE "user_profiles" ADD COLUMN "trackMenstrualCycle" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "menstrualCycleLength" integer DEFAULT 28;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "menstrualPeriodLength" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "lastPeriodDate" timestamp;