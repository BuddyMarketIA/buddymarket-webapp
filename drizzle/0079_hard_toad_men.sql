CREATE TYPE "public"."ecosystem_activity_source" AS ENUM('buddyone', 'buddycoach', 'buddycare', 'buddyshop', 'healthhub');--> statement-breakpoint
CREATE TYPE "public"."supplement_frequency" AS ENUM('daily', 'twice_daily', 'weekly', 'as_needed');--> statement-breakpoint
CREATE TABLE "ecosystem_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"source" "ecosystem_activity_source" NOT NULL,
	"eventType" varchar(64) NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplement_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"supplementId" integer NOT NULL,
	"takenAt" timestamp DEFAULT now() NOT NULL,
	"skipped" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "user_supplements" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"dosage" varchar(128),
	"frequency" "supplement_frequency" DEFAULT 'daily' NOT NULL,
	"timeOfDay" varchar(32),
	"notes" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ecosystem_activity" ADD CONSTRAINT "ecosystem_activity_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplement_logs" ADD CONSTRAINT "supplement_logs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplement_logs" ADD CONSTRAINT "supplement_logs_supplementId_user_supplements_id_fk" FOREIGN KEY ("supplementId") REFERENCES "public"."user_supplements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_supplements" ADD CONSTRAINT "user_supplements_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "eact_user_idx" ON "ecosystem_activity" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "eact_date_idx" ON "ecosystem_activity" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "eact_source_idx" ON "ecosystem_activity" USING btree ("source");--> statement-breakpoint
CREATE INDEX "slog_user_idx" ON "supplement_logs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "slog_date_idx" ON "supplement_logs" USING btree ("takenAt");--> statement-breakpoint
CREATE INDEX "usup_user_idx" ON "user_supplements" USING btree ("userId");