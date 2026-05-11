CREATE TYPE "public"."insightFeedback" AS ENUM('positive', 'negative');--> statement-breakpoint
CREATE TABLE "insight_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"insightTitle" text NOT NULL,
	"insightCategory" text NOT NULL,
	"insightDescription" text NOT NULL,
	"feedback" "insightFeedback" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "insight_feedback" ADD CONSTRAINT "insight_feedback_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ifb_user_idx" ON "insight_feedback" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ifb_category_idx" ON "insight_feedback" USING btree ("insightCategory");