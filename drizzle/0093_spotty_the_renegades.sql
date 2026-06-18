CREATE TABLE "expert_weekly_plan_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"weeklyPlanId" integer NOT NULL,
	"dayOfWeek" integer NOT NULL,
	"mealTime" "mealTime" NOT NULL,
	"recipeId" integer,
	"customName" varchar(256),
	"customCalories" integer,
	"servings" real DEFAULT 1,
	"notes" text,
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_weekly_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertUserId" integer NOT NULL,
	"offlinePatientId" integer,
	"title" varchar(256) NOT NULL,
	"description" text,
	"weekStartDate" date,
	"isTemplate" boolean DEFAULT false NOT NULL,
	"totalCalories" integer,
	"totalProtein" real,
	"totalCarbs" real,
	"totalFat" real,
	"sentAt" timestamp,
	"sentChannel" varchar(20),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ewps_plan_idx" ON "expert_weekly_plan_slots" USING btree ("weeklyPlanId");--> statement-breakpoint
CREATE INDEX "ewps_plan_day_idx" ON "expert_weekly_plan_slots" USING btree ("weeklyPlanId","dayOfWeek");--> statement-breakpoint
CREATE INDEX "ewp_expert_idx" ON "expert_weekly_plans" USING btree ("expertUserId");--> statement-breakpoint
CREATE INDEX "ewp_patient_idx" ON "expert_weekly_plans" USING btree ("offlinePatientId");--> statement-breakpoint
CREATE INDEX "ewp_template_idx" ON "expert_weekly_plans" USING btree ("isTemplate");