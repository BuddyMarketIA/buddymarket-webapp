CREATE TABLE "collaboration_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"fromMakerId" integer NOT NULL,
	"toMakerId" integer NOT NULL,
	"recipeId" integer,
	"message" text,
	"proposedRole" varchar(64) NOT NULL,
	"proposedCommissionShare" real DEFAULT 0.5,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"respondedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maker_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"makerId" integer NOT NULL,
	"badgeType" varchar(64) NOT NULL,
	"title" varchar(128) NOT NULL,
	"description" text,
	"icon" text,
	"earnedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maker_collaborations" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipeId" integer NOT NULL,
	"primaryMakerId" integer NOT NULL,
	"collaboratorMakerId" integer NOT NULL,
	"role" varchar(64) NOT NULL,
	"commissionShare" real DEFAULT 0.5 NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"approvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "maker_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"makerId" integer NOT NULL,
	"type" varchar(64) NOT NULL,
	"title" varchar(256) NOT NULL,
	"message" text,
	"relatedId" integer,
	"isRead" boolean DEFAULT false NOT NULL,
	"actionUrl" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maker_referral_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"makerId" integer NOT NULL,
	"code" varchar(32) NOT NULL,
	"discountPercent" real DEFAULT 10,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"earningsFromCode" real DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "maker_referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "maker_resource_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"makerId" integer NOT NULL,
	"resourceId" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maker_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"category" varchar(64) NOT NULL,
	"content" text NOT NULL,
	"videoUrl" text,
	"imageUrl" text,
	"order" integer DEFAULT 0,
	"isPublished" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maker_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"makerId" integer NOT NULL,
	"recipeId" integer NOT NULL,
	"date" date NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"downloads" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"ratings" integer DEFAULT 0 NOT NULL,
	"averageRating" real DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "collab_req_from_idx" ON "collaboration_requests" USING btree ("fromMakerId");--> statement-breakpoint
CREATE INDEX "collab_req_to_idx" ON "collaboration_requests" USING btree ("toMakerId");--> statement-breakpoint
CREATE INDEX "maker_badges_maker_idx" ON "maker_badges" USING btree ("makerId");--> statement-breakpoint
CREATE INDEX "maker_badges_type_idx" ON "maker_badges" USING btree ("badgeType");--> statement-breakpoint
CREATE INDEX "maker_collaborations_recipe_idx" ON "maker_collaborations" USING btree ("recipeId");--> statement-breakpoint
CREATE INDEX "maker_collaborations_primary_idx" ON "maker_collaborations" USING btree ("primaryMakerId");--> statement-breakpoint
CREATE INDEX "maker_collaborations_collaborator_idx" ON "maker_collaborations" USING btree ("collaboratorMakerId");--> statement-breakpoint
CREATE INDEX "maker_notif_maker_idx" ON "maker_notifications" USING btree ("makerId");--> statement-breakpoint
CREATE INDEX "maker_notif_type_idx" ON "maker_notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "maker_notif_read_idx" ON "maker_notifications" USING btree ("isRead");--> statement-breakpoint
CREATE INDEX "maker_referral_codes_maker_idx" ON "maker_referral_codes" USING btree ("makerId");--> statement-breakpoint
CREATE INDEX "maker_referral_codes_code_idx" ON "maker_referral_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "maker_res_progress_maker_idx" ON "maker_resource_progress" USING btree ("makerId");--> statement-breakpoint
CREATE INDEX "maker_res_progress_resource_idx" ON "maker_resource_progress" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "maker_resources_category_idx" ON "maker_resources" USING btree ("category");--> statement-breakpoint
CREATE INDEX "maker_stats_maker_idx" ON "maker_stats" USING btree ("makerId");--> statement-breakpoint
CREATE INDEX "maker_stats_recipe_idx" ON "maker_stats" USING btree ("recipeId");--> statement-breakpoint
CREATE INDEX "maker_stats_date_idx" ON "maker_stats" USING btree ("date");