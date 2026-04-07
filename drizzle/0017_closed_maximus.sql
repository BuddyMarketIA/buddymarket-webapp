CREATE TYPE "public"."badge_category" AS ENUM('ai_adaptation', 'community', 'consistency', 'nutrition', 'explorer');--> statement-breakpoint
CREATE TYPE "public"."badge_rarity" AS ENUM('common', 'rare', 'epic', 'legendary');--> statement-breakpoint
CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name_es" varchar(128) NOT NULL,
	"name_en" varchar(128) NOT NULL,
	"description_es" varchar(512) NOT NULL,
	"description_en" varchar(512) NOT NULL,
	"icon" varchar(8) NOT NULL,
	"category" "badge_category" NOT NULL,
	"rarity" "badge_rarity" DEFAULT 'common' NOT NULL,
	"points" integer DEFAULT 10 NOT NULL,
	"trigger_count" integer DEFAULT 1,
	"is_active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "badges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"badge_id" integer NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "badge_slug_idx" ON "badges" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "badge_category_idx" ON "badges" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ub_user_idx" ON "user_badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ub_badge_idx" ON "user_badges" USING btree ("badge_id");