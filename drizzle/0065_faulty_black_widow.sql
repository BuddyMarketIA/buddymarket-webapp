CREATE TYPE "public"."tutorialStatus" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "userOnboardingProgress" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tutorialStatus" "tutorialStatus" DEFAULT 'not_started' NOT NULL,
	"completedSteps" text,
	"currentStep" integer DEFAULT 0,
	"totalSteps" integer DEFAULT 6,
	"completedAt" timestamp,
	"skippedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userOnboardingProgress_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "userOnboardingProgress" ADD CONSTRAINT "userOnboardingProgress_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "onboarding_user_idx" ON "userOnboardingProgress" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "onboarding_status_idx" ON "userOnboardingProgress" USING btree ("tutorialStatus");