CREATE TYPE "public"."ecosystemConnectionStatus" AS ENUM('active', 'paused', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."ecosystemSyncDirection" AS ENUM('push', 'pull', 'bidirectional');--> statement-breakpoint
CREATE TYPE "public"."ecosystemSyncQueueStatus" AS ENUM('queued', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ecosystemSyncStatus" AS ENUM('pending', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."wellnessGoalCategory" AS ENUM('sleep', 'recovery', 'activity', 'stress', 'nutrition', 'hydration');--> statement-breakpoint
CREATE TYPE "public"."wellnessGoalPriority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."wellnessGoalStatus" AS ENUM('active', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "ecosystemConnections" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"targetApp" varchar(64) NOT NULL,
	"targetUserId" varchar(255),
	"status" "ecosystemConnectionStatus" DEFAULT 'active' NOT NULL,
	"permissions" text,
	"lastSyncAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecosystemSharedData" (
	"id" serial PRIMARY KEY NOT NULL,
	"connectionId" integer NOT NULL,
	"dataType" varchar(64) NOT NULL,
	"dataKey" varchar(255) NOT NULL,
	"dataValue" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"lastModifiedBy" varchar(64) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecosystemSyncLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"connectionId" integer NOT NULL,
	"direction" "ecosystemSyncDirection" NOT NULL,
	"dataType" varchar(64) NOT NULL,
	"syncStatus" "ecosystemSyncStatus" DEFAULT 'pending' NOT NULL,
	"recordsProcessed" integer DEFAULT 0,
	"errorMessage" text,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "ecosystemSyncQueue" (
	"id" serial PRIMARY KEY NOT NULL,
	"connectionId" integer NOT NULL,
	"action" varchar(64) NOT NULL,
	"dataType" varchar(64) NOT NULL,
	"payload" text NOT NULL,
	"queueStatus" "ecosystemSyncQueueStatus" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"maxAttempts" integer DEFAULT 3 NOT NULL,
	"lastError" text,
	"scheduledFor" timestamp DEFAULT now() NOT NULL,
	"processedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wellnessGoals" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" "wellnessGoalCategory" NOT NULL,
	"currentValue" real DEFAULT 0 NOT NULL,
	"targetValue" real NOT NULL,
	"unit" varchar(64) NOT NULL,
	"priority" "wellnessGoalPriority" DEFAULT 'medium' NOT NULL,
	"status" "wellnessGoalStatus" DEFAULT 'active' NOT NULL,
	"startDate" timestamp DEFAULT now() NOT NULL,
	"targetDate" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ecosystemConnections" ADD CONSTRAINT "ecosystemConnections_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecosystemSharedData" ADD CONSTRAINT "ecosystemSharedData_connectionId_ecosystemConnections_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."ecosystemConnections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecosystemSyncLogs" ADD CONSTRAINT "ecosystemSyncLogs_connectionId_ecosystemConnections_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."ecosystemConnections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecosystemSyncQueue" ADD CONSTRAINT "ecosystemSyncQueue_connectionId_ecosystemConnections_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."ecosystemConnections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellnessGoals" ADD CONSTRAINT "wellnessGoals_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ec_user_idx" ON "ecosystemConnections" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ec_target_idx" ON "ecosystemConnections" USING btree ("targetApp");--> statement-breakpoint
CREATE INDEX "ec_user_target_idx" ON "ecosystemConnections" USING btree ("userId","targetApp");--> statement-breakpoint
CREATE INDEX "esd_connection_idx" ON "ecosystemSharedData" USING btree ("connectionId");--> statement-breakpoint
CREATE INDEX "esd_datatype_idx" ON "ecosystemSharedData" USING btree ("dataType");--> statement-breakpoint
CREATE INDEX "esd_key_idx" ON "ecosystemSharedData" USING btree ("dataKey");--> statement-breakpoint
CREATE INDEX "esl_connection_idx" ON "ecosystemSyncLogs" USING btree ("connectionId");--> statement-breakpoint
CREATE INDEX "esl_status_idx" ON "ecosystemSyncLogs" USING btree ("syncStatus");--> statement-breakpoint
CREATE INDEX "esq_connection_idx" ON "ecosystemSyncQueue" USING btree ("connectionId");--> statement-breakpoint
CREATE INDEX "esq_status_idx" ON "ecosystemSyncQueue" USING btree ("queueStatus");--> statement-breakpoint
CREATE INDEX "esq_scheduled_idx" ON "ecosystemSyncQueue" USING btree ("scheduledFor");--> statement-breakpoint
CREATE INDEX "wg_user_idx" ON "wellnessGoals" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "wg_status_idx" ON "wellnessGoals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wg_user_status_idx" ON "wellnessGoals" USING btree ("userId","status");