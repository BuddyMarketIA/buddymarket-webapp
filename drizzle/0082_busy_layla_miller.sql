CREATE TYPE "public"."expert_fr_category" AS ENUM('patient_management', 'plans_menus', 'tracking_metrics', 'communication', 'billing', 'integrations', 'other');--> statement-breakpoint
CREATE TYPE "public"."expert_fr_status" AS ENUM('under_review', 'planned', 'in_progress', 'completed', 'declined');--> statement-breakpoint
CREATE TABLE "expert_feature_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" "expert_fr_category" NOT NULL,
	"status" "expert_fr_status" DEFAULT 'under_review' NOT NULL,
	"adminNote" text,
	"voteCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_feature_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"requestId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "efv_request_user_unique" UNIQUE("requestId","userId")
);
--> statement-breakpoint
CREATE INDEX "efr_user_idx" ON "expert_feature_requests" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "efr_category_idx" ON "expert_feature_requests" USING btree ("category");--> statement-breakpoint
CREATE INDEX "efr_status_idx" ON "expert_feature_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "efr_votes_idx" ON "expert_feature_requests" USING btree ("voteCount");--> statement-breakpoint
CREATE INDEX "efv_request_idx" ON "expert_feature_votes" USING btree ("requestId");--> statement-breakpoint
CREATE INDEX "efv_user_idx" ON "expert_feature_votes" USING btree ("userId");