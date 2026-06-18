CREATE TABLE "patient_daily_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"expertPatientId" integer,
	"logDate" text NOT NULL,
	"weight" real,
	"energyLevel" integer,
	"moodLevel" integer,
	"sleepHours" real,
	"waterLiters" real,
	"symptoms" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "patient_daily_log_user_idx" ON "patient_daily_log" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "patient_daily_log_date_idx" ON "patient_daily_log" USING btree ("userId","logDate");