CREATE TYPE "public"."feedbackCategory" AS ENUM('bug', 'improvement', 'idea', 'other');--> statement-breakpoint
CREATE TYPE "public"."feedbackStatus" AS ENUM('pending', 'reviewed', 'resolved');--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"category" "feedbackCategory" NOT NULL,
	"message" text NOT NULL,
	"status" "feedbackStatus" DEFAULT 'pending' NOT NULL,
	"adminNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "fb_user_idx" ON "feedbacks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "fb_status_idx" ON "feedbacks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fb_created_idx" ON "feedbacks" USING btree ("createdAt");