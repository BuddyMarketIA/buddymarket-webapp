CREATE TYPE "public"."household_menu_type" AS ENUM('adults', 'kids', 'baby', 'custom', 'family');--> statement-breakpoint
CREATE TABLE "household_menu_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"householdId" integer NOT NULL,
	"memberId" integer,
	"createdByUserId" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"menuType" "household_menu_type" DEFAULT 'adults' NOT NULL,
	"weekStartDate" timestamp NOT NULL,
	"meals" text,
	"notes" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"generatedByAI" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hmp_household_idx" ON "household_menu_plans" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "hmp_member_idx" ON "household_menu_plans" USING btree ("memberId");--> statement-breakpoint
CREATE INDEX "hmp_week_idx" ON "household_menu_plans" USING btree ("householdId","weekStartDate");