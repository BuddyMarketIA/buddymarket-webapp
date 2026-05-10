CREATE TYPE "public"."productRecommendationSource" AS ENUM('buddyshop', 'buddycare', 'buddycoach');--> statement-breakpoint
CREATE TYPE "public"."recommendationTrigger" AS ENUM('muscle_gain', 'weight_loss', 'frequent_cooking', 'complex_recipes', 'vitamin_deficiency', 'health_goal', 'active_training', 'macro_deficit');--> statement-breakpoint
CREATE TABLE "productCache" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" "productRecommendationSource" NOT NULL,
	"externalProductId" varchar(255) NOT NULL,
	"data" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productRecommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"externalProductId" varchar(255) NOT NULL,
	"source" "productRecommendationSource" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"reason" text NOT NULL,
	"trigger" "recommendationTrigger" NOT NULL,
	"productUrl" text NOT NULL,
	"productImage" text,
	"productPrice" numeric(10, 2),
	"productCategory" varchar(128),
	"relevanceScore" integer DEFAULT 50,
	"cta" varchar(255) DEFAULT 'Ver producto',
	"clicked" boolean DEFAULT false,
	"clickedAt" timestamp,
	"converted" boolean DEFAULT false,
	"convertedAt" timestamp,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendationEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"recommendationId" integer NOT NULL,
	"eventType" varchar(64) NOT NULL,
	"source" "productRecommendationSource" NOT NULL,
	"context" varchar(255),
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userProductInteractions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"source" "productRecommendationSource" NOT NULL,
	"externalProductId" varchar(255) NOT NULL,
	"interactionType" varchar(64) NOT NULL,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "productRecommendations" ADD CONSTRAINT "productRecommendations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendationEvents" ADD CONSTRAINT "recommendationEvents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendationEvents" ADD CONSTRAINT "recommendationEvents_recommendationId_productRecommendations_id_fk" FOREIGN KEY ("recommendationId") REFERENCES "public"."productRecommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userProductInteractions" ADD CONSTRAINT "userProductInteractions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pc_source_idx" ON "productCache" USING btree ("source");--> statement-breakpoint
CREATE INDEX "pc_product_idx" ON "productCache" USING btree ("externalProductId");--> statement-breakpoint
CREATE INDEX "pc_expires_idx" ON "productCache" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "pc_source_product_idx" ON "productCache" USING btree ("source","externalProductId");--> statement-breakpoint
CREATE INDEX "pr_user_idx" ON "productRecommendations" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "pr_source_idx" ON "productRecommendations" USING btree ("source");--> statement-breakpoint
CREATE INDEX "pr_user_source_idx" ON "productRecommendations" USING btree ("userId","source");--> statement-breakpoint
CREATE INDEX "pr_expires_idx" ON "productRecommendations" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "pr_trigger_idx" ON "productRecommendations" USING btree ("trigger");--> statement-breakpoint
CREATE INDEX "re_user_idx" ON "recommendationEvents" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "re_rec_idx" ON "recommendationEvents" USING btree ("recommendationId");--> statement-breakpoint
CREATE INDEX "re_event_type_idx" ON "recommendationEvents" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "re_user_event_idx" ON "recommendationEvents" USING btree ("userId","eventType");--> statement-breakpoint
CREATE INDEX "upi_user_idx" ON "userProductInteractions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "upi_source_idx" ON "userProductInteractions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "upi_user_source_idx" ON "userProductInteractions" USING btree ("userId","source");--> statement-breakpoint
CREATE INDEX "upi_interaction_idx" ON "userProductInteractions" USING btree ("interactionType");