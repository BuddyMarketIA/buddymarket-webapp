CREATE TYPE "public"."b2b_team_goal" AS ENUM('weight_loss', 'muscle_gain', 'energy_performance', 'stress_management', 'balanced_diet', 'cardiovascular_health', 'digestive_health', 'diabetes_management', 'other');--> statement-breakpoint
CREATE TABLE "b2b_team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"teamId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256),
	"age" integer,
	"gender" varchar(16),
	"weight" integer,
	"height" integer,
	"specificConditions" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_team_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"teamId" integer NOT NULL,
	"expertId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"planContent" text,
	"recommendations" text,
	"weeklyMenuSummary" text,
	"isAiGenerated" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"companyName" varchar(256),
	"goal" varchar(64) NOT NULL,
	"conditions" text,
	"dietaryRestrictions" text,
	"maxMembers" integer DEFAULT 10 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "b2btm_team_idx" ON "b2b_team_members" USING btree ("teamId");--> statement-breakpoint
CREATE INDEX "b2btp_team_idx" ON "b2b_team_plans" USING btree ("teamId");--> statement-breakpoint
CREATE INDEX "b2btp_expert_idx" ON "b2b_team_plans" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "b2bt_expert_idx" ON "b2b_teams" USING btree ("expertId");