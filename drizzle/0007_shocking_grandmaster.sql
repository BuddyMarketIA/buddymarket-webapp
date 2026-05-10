CREATE TYPE "public"."expertClientPlanStatus" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "expert_client_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"clientUserId" integer,
	"title" varchar(256) NOT NULL,
	"description" text,
	"pdfUrl" text,
	"pdfKey" text,
	"pdfFileName" varchar(256),
	"status" "expertClientPlanStatus" DEFAULT 'draft' NOT NULL,
	"isTemplate" boolean DEFAULT false NOT NULL,
	"aiGeneratedMenu" text,
	"aiGeneratedShoppingList" text,
	"aiGeneratedAt" timestamp,
	"weekNumber" integer,
	"year" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ecp_expert_idx" ON "expert_client_plans" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "ecp_client_idx" ON "expert_client_plans" USING btree ("clientUserId");--> statement-breakpoint
CREATE INDEX "ecp_status_idx" ON "expert_client_plans" USING btree ("status");