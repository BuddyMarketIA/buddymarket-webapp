CREATE TYPE "public"."contextualModule" AS ENUM('buddycare', 'buddycoach', 'buddymarket', 'buddypets', 'buddykids');--> statement-breakpoint
CREATE TYPE "public"."recommendationType" AS ENUM('ingredients', 'utensils', 'supplements', 'training', 'recipes', 'products', 'services', 'plans');--> statement-breakpoint
CREATE TABLE "contextualEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"module" "contextualModule" NOT NULL,
	"action" varchar(128) NOT NULL,
	"sourceItemId" varchar(256),
	"sourceItemType" varchar(64),
	"context" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contextualRecommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"sourceModule" "contextualModule" NOT NULL,
	"targetModule" "contextualModule" NOT NULL,
	"recommendationType" "recommendationType" NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"targetItemId" varchar(256),
	"targetItemType" varchar(64),
	"imageUrl" text,
	"priority" varchar(16) DEFAULT 'medium',
	"relevanceScore" numeric(3, 2) DEFAULT '0.5',
	"clicked" boolean DEFAULT false,
	"clickedAt" timestamp,
	"converted" boolean DEFAULT false,
	"convertedAt" timestamp,
	"conversionValue" numeric(10, 2),
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crossModuleConversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"recommendationId" integer,
	"sourceModule" "contextualModule" NOT NULL,
	"targetModule" "contextualModule" NOT NULL,
	"conversionType" varchar(128) NOT NULL,
	"conversionValue" numeric(10, 2),
	"commission" numeric(10, 2),
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendationAnalytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"sourceModule" "contextualModule" NOT NULL,
	"targetModule" "contextualModule" NOT NULL,
	"totalRecommendations" integer DEFAULT 0,
	"totalClicks" integer DEFAULT 0,
	"totalConversions" integer DEFAULT 0,
	"clickThroughRate" numeric(5, 4) DEFAULT '0',
	"conversionRate" numeric(5, 4) DEFAULT '0',
	"totalRevenue" numeric(12, 2) DEFAULT '0',
	"averageRelevanceScore" numeric(3, 2) DEFAULT '0.5',
	"lastUpdatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contextualEvents" ADD CONSTRAINT "contextualEvents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contextualRecommendations" ADD CONSTRAINT "contextualRecommendations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crossModuleConversions" ADD CONSTRAINT "crossModuleConversions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crossModuleConversions" ADD CONSTRAINT "crossModuleConversions_recommendationId_contextualRecommendations_id_fk" FOREIGN KEY ("recommendationId") REFERENCES "public"."contextualRecommendations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendationAnalytics" ADD CONSTRAINT "recommendationAnalytics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contextual_events_user_module_idx" ON "contextualEvents" USING btree ("userId","module");--> statement-breakpoint
CREATE INDEX "contextual_events_user_created_idx" ON "contextualEvents" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "contextual_events_module_action_idx" ON "contextualEvents" USING btree ("module","action");--> statement-breakpoint
CREATE INDEX "contextual_recs_user_module_idx" ON "contextualRecommendations" USING btree ("userId","sourceModule","targetModule");--> statement-breakpoint
CREATE INDEX "contextual_recs_user_created_idx" ON "contextualRecommendations" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "contextual_recs_priority_relevance_idx" ON "contextualRecommendations" USING btree ("priority","relevanceScore");--> statement-breakpoint
CREATE INDEX "contextual_recs_converted_idx" ON "contextualRecommendations" USING btree ("converted");--> statement-breakpoint
CREATE INDEX "cross_conversions_user_module_idx" ON "crossModuleConversions" USING btree ("userId","sourceModule","targetModule");--> statement-breakpoint
CREATE INDEX "cross_conversions_user_created_idx" ON "crossModuleConversions" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "cross_conversions_type_idx" ON "crossModuleConversions" USING btree ("conversionType");--> statement-breakpoint
CREATE INDEX "analytics_user_module_idx" ON "recommendationAnalytics" USING btree ("userId","sourceModule","targetModule");--> statement-breakpoint
CREATE INDEX "analytics_revenue_idx" ON "recommendationAnalytics" USING btree ("totalRevenue");