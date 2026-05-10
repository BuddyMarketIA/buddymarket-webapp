CREATE TYPE "public"."apiHealthStatus" AS ENUM('ok', 'degraded', 'down', 'unknown');--> statement-breakpoint
CREATE TABLE "api_health_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"monitorId" integer NOT NULL,
	"status" "apiHealthStatus" NOT NULL,
	"latencyMs" integer,
	"httpStatus" integer,
	"errorMessage" text,
	"checkedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_monitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"endpoint" varchar(512) NOT NULL,
	"method" varchar(8) DEFAULT 'GET' NOT NULL,
	"expectedStatus" integer DEFAULT 200 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastStatus" "apiHealthStatus" DEFAULT 'unknown' NOT NULL,
	"lastLatencyMs" integer,
	"lastCheckedAt" timestamp,
	"lastErrorMessage" text,
	"failCount" integer DEFAULT 0 NOT NULL,
	"notifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ahl_monitor_idx" ON "api_health_logs" USING btree ("monitorId");--> statement-breakpoint
CREATE INDEX "ahl_checked_idx" ON "api_health_logs" USING btree ("checkedAt");--> statement-breakpoint
CREATE INDEX "am_name_idx" ON "api_monitors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "am_status_idx" ON "api_monitors" USING btree ("lastStatus");