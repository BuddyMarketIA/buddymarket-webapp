CREATE TYPE "public"."allergy_severity" AS ENUM('medical', 'intolerance', 'preference');--> statement-breakpoint
CREATE TABLE "allergy_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"allergy_id" integer NOT NULL,
	"allergy_name_es" varchar(128) NOT NULL,
	"action" varchar(16) NOT NULL,
	"severity" varchar(16) DEFAULT 'medical' NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"changed_by_ip" varchar(64),
	"user_agent" varchar(512)
);
--> statement-breakpoint
CREATE TABLE "allergy_violation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"generation_type" varchar(64) NOT NULL,
	"forbidden_ingredients" text NOT NULL,
	"detected_in_text" text,
	"restrictions_snapshot" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_allergy_severity" (
	"user_id" integer NOT NULL,
	"allergy_id" integer NOT NULL,
	"severity" varchar(16) DEFAULT 'medical' NOT NULL,
	"confirmed_at" timestamp DEFAULT now() NOT NULL,
	"notes" varchar(255),
	CONSTRAINT "user_allergy_severity_user_id_allergy_id_unique" UNIQUE("user_id","allergy_id")
);
--> statement-breakpoint
CREATE INDEX "ah_user_idx" ON "allergy_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ah_changed_at_idx" ON "allergy_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "avl_user_idx" ON "allergy_violation_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "avl_created_idx" ON "allergy_violation_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "avl_type_idx" ON "allergy_violation_logs" USING btree ("generation_type");--> statement-breakpoint
CREATE INDEX "uas_user_idx" ON "user_allergy_severity" USING btree ("user_id");