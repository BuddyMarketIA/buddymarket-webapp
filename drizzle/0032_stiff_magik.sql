CREATE TYPE "public"."logLevel" AS ENUM('debug', 'info', 'warn', 'error', 'fatal');--> statement-breakpoint
CREATE TABLE "server_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" "logLevel" DEFAULT 'error' NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"path" varchar(500),
	"method" varchar(10),
	"statusCode" integer,
	"userId" integer,
	"userAgent" text,
	"ip" varchar(100),
	"metadata" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sl_level_idx" ON "server_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "sl_created_at_idx" ON "server_logs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "sl_resolved_idx" ON "server_logs" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "sl_user_idx" ON "server_logs" USING btree ("userId");