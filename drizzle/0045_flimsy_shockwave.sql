CREATE TYPE "public"."thirtyDayChallengeType" AS ENUM('weight_loss', 'muscle_gain', 'wellness');--> statement-breakpoint
CREATE TABLE "monthly_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"pdfUrl" text,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"summaryJson" text,
	CONSTRAINT "mr_unique" UNIQUE("userId","year","month")
);
--> statement-breakpoint
CREATE TABLE "streak_shields" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"shieldsAvailable" integer DEFAULT 1 NOT NULL,
	"lastShieldGrantedAt" timestamp,
	"shieldsUsedTotal" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "streak_shields_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "taste_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"topCuisines" text DEFAULT '[]' NOT NULL,
	"topIngredients" text DEFAULT '[]' NOT NULL,
	"avoidedIngredients" text DEFAULT '[]' NOT NULL,
	"preferredComplexity" varchar(32),
	"insightSummaryEs" text,
	"lastUpdatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "taste_insights_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "thirty_day_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"challengeType" "thirtyDayChallengeType" NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"currentDay" integer DEFAULT 0 NOT NULL,
	"completedDays" text DEFAULT '[]' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_weekly_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"weekStart" date NOT NULL,
	"currentValue" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"pointsAwarded" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uwc_unique" UNIQUE("userId","challengeId","weekStart")
);
--> statement-breakpoint
CREATE TABLE "weekly_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"titleEs" varchar(128) NOT NULL,
	"descriptionEs" text NOT NULL,
	"icon" varchar(8) NOT NULL,
	"targetValue" integer NOT NULL,
	"metricType" varchar(64) NOT NULL,
	"pointsReward" integer DEFAULT 100 NOT NULL,
	"badgeSlug" varchar(64),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_challenges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "mr_user_idx" ON "monthly_reports" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ss_user_idx" ON "streak_shields" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ti_user_idx" ON "taste_insights" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "tdc_user_idx" ON "thirty_day_challenges" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "uwc_user_idx" ON "user_weekly_challenges" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "uwc_week_idx" ON "user_weekly_challenges" USING btree ("weekStart");