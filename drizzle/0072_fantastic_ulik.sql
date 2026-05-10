CREATE TYPE "public"."wearableType" AS ENUM('oura', 'whoop', 'apple_health', 'google_fit');--> statement-breakpoint
CREATE TABLE "ouraRingData" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" date NOT NULL,
	"sleepDuration" integer,
	"sleepScore" integer,
	"deepSleep" integer,
	"remSleep" integer,
	"lightSleep" integer,
	"sleepLatency" integer,
	"activityScore" integer,
	"activeCalories" integer,
	"totalCalories" integer,
	"steps" integer,
	"distance" numeric(10, 2),
	"readinessScore" integer,
	"heartRateVariability" numeric(10, 2),
	"restingHeartRate" integer,
	"bodyTemperature" numeric(4, 2),
	"recoveryIndex" integer,
	"rawData" text,
	"syncedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wearableConnections" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"wearableType" "wearableType" NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text,
	"tokenExpiresAt" timestamp,
	"externalUserId" varchar(256),
	"connectedAt" timestamp DEFAULT now() NOT NULL,
	"lastSyncedAt" timestamp,
	"isActive" boolean DEFAULT true,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wearableInsights" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" date NOT NULL,
	"insight" text NOT NULL,
	"category" varchar(64),
	"severity" varchar(64),
	"correlations" text,
	"recommendations" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whoopData" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" date NOT NULL,
	"strain" numeric(4, 2),
	"strainScore" integer,
	"kilojoules" numeric(10, 2),
	"averageHeartRate" integer,
	"maxHeartRate" integer,
	"recovery" numeric(4, 2),
	"recoveryScore" integer,
	"restingHeartRate" integer,
	"heartRateVariability" numeric(10, 2),
	"skinTemperature" numeric(4, 2),
	"sleepDuration" integer,
	"sleepScore" integer,
	"sleepQuality" numeric(4, 2),
	"mood" varchar(64),
	"muscleSoreness" varchar(64),
	"rawData" text,
	"syncedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ouraRingData" ADD CONSTRAINT "ouraRingData_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearableConnections" ADD CONSTRAINT "wearableConnections_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wearableInsights" ADD CONSTRAINT "wearableInsights_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whoopData" ADD CONSTRAINT "whoopData_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "od_user_idx" ON "ouraRingData" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "od_date_idx" ON "ouraRingData" USING btree ("date");--> statement-breakpoint
CREATE INDEX "od_user_date_idx" ON "ouraRingData" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX "wconn_user_idx" ON "wearableConnections" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "wconn_type_idx" ON "wearableConnections" USING btree ("wearableType");--> statement-breakpoint
CREATE INDEX "wconn_user_wearable_idx" ON "wearableConnections" USING btree ("userId","wearableType");--> statement-breakpoint
CREATE INDEX "wi_user_idx" ON "wearableInsights" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "wi_date_idx" ON "wearableInsights" USING btree ("date");--> statement-breakpoint
CREATE INDEX "wi_user_date_idx" ON "wearableInsights" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX "wd_user_idx" ON "whoopData" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "wd_date_idx" ON "whoopData" USING btree ("date");--> statement-breakpoint
CREATE INDEX "wd_user_date_idx" ON "whoopData" USING btree ("userId","date");