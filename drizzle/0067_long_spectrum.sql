CREATE TYPE "public"."feedbackType" AS ENUM('bug', 'feature_request', 'improvement', 'general', 'other');--> statement-breakpoint
CREATE TABLE "userFeedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"feedbackType" "feedbackType" NOT NULL,
	"title" varchar(256) NOT NULL,
	"message" text NOT NULL,
	"page" varchar(256),
	"userAgent" text,
	"email" varchar(256),
	"rating" integer,
	"status" varchar(32) DEFAULT 'new',
	"response" text,
	"respondedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "userFeedback" ADD CONSTRAINT "userFeedback_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_user_idx" ON "userFeedback" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "feedback_type_idx" ON "userFeedback" USING btree ("feedbackType");--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "userFeedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_created_idx" ON "userFeedback" USING btree ("createdAt");