CREATE TABLE "patient_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"expertPatientId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"milestoneDate" date NOT NULL,
	"icon" varchar(8) DEFAULT '🏆',
	"isNotified" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_wellbeing_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"logDate" date NOT NULL,
	"energyLevel" integer,
	"digestiveComfort" integer,
	"sleepQuality" integer,
	"moodLevel" integer,
	"hungerLevel" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_checkins" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"expertPatientId" integer,
	"weekStart" date NOT NULL,
	"weight" real,
	"photoUrl" varchar(1024),
	"adherenceRating" integer,
	"hungerRating" integer,
	"energyRating" integer,
	"difficultyNotes" text,
	"generalNotes" text,
	"expertFeedback" text,
	"expertFeedbackAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pm_expert_idx" ON "patient_milestones" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "pm_patient_idx" ON "patient_milestones" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "pwl_user_idx" ON "patient_wellbeing_logs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "pwl_date_idx" ON "patient_wellbeing_logs" USING btree ("logDate");--> statement-breakpoint
CREATE INDEX "wc_user_idx" ON "weekly_checkins" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "wc_week_idx" ON "weekly_checkins" USING btree ("weekStart");