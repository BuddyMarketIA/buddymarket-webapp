CREATE TYPE "public"."blogPostStatus" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"slug" varchar(256) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"coverImageUrl" text,
	"category" varchar(64) DEFAULT 'Nutrición',
	"tags" text,
	"status" "blogPostStatus" DEFAULT 'draft' NOT NULL,
	"readTimeMinutes" integer DEFAULT 5,
	"viewsCount" integer DEFAULT 0 NOT NULL,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "blog_posts_expert_idx" ON "blog_posts" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");