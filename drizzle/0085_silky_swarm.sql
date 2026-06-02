CREATE TYPE "public"."patientDocumentType" AS ENUM('nutrition_plan', 'blood_test', 'medical_report', 'scale_export', 'progress_photo', 'consent_form', 'other');--> statement-breakpoint
CREATE TYPE "public"."patientDocumentVisibility" AS ENUM('expert_only', 'shared');--> statement-breakpoint
CREATE TABLE "patient_clinical_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertPatientId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL,
	"bloodPressureSystolic" integer,
	"bloodPressureDiastolic" integer,
	"heartRate" integer,
	"glucoseFasting" real,
	"hba1c" real,
	"totalCholesterol" real,
	"ldlCholesterol" real,
	"hdlCholesterol" real,
	"triglycerides" real,
	"boneMass" real,
	"waterPercentage" real,
	"visceralFat" integer,
	"metabolicAge" integer,
	"calf" real,
	"neck" real,
	"shoulder" real,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_daily_diary" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"expertPatientId" integer,
	"diaryDate" date NOT NULL,
	"weight" real,
	"energyLevel" integer,
	"digestiveComfort" integer,
	"sleepQuality" integer,
	"moodLevel" integer,
	"stressLevel" integer,
	"planAdherence" varchar(16),
	"activityType" varchar(64),
	"activityDuration" integer,
	"activityIntensity" varchar(16),
	"sleepHours" real,
	"symptoms" text,
	"generalNotes" text,
	"foodPhotoUrl" text,
	"progressPhotoUrl" text,
	"expertFeedback" text,
	"expertFeedbackAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertPatientId" integer NOT NULL,
	"expertId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"uploadedBy" integer NOT NULL,
	"uploaderRole" varchar(16) DEFAULT 'expert' NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"fileUrl" text NOT NULL,
	"fileKey" text NOT NULL,
	"fileName" varchar(256) NOT NULL,
	"fileSize" integer,
	"mimeType" varchar(128),
	"documentType" "patientDocumentType" DEFAULT 'other' NOT NULL,
	"visibility" "patientDocumentVisibility" DEFAULT 'shared' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pcm_ep_idx" ON "patient_clinical_metrics" USING btree ("expertPatientId");--> statement-breakpoint
CREATE INDEX "pcm_patient_idx" ON "patient_clinical_metrics" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "pcm_date_idx" ON "patient_clinical_metrics" USING btree ("recordedAt");--> statement-breakpoint
CREATE INDEX "pdd_user_idx" ON "patient_daily_diary" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "pdd_date_idx" ON "patient_daily_diary" USING btree ("diaryDate");--> statement-breakpoint
CREATE INDEX "pdd_ep_idx" ON "patient_daily_diary" USING btree ("expertPatientId");--> statement-breakpoint
CREATE INDEX "pd_ep_idx" ON "patient_documents" USING btree ("expertPatientId");--> statement-breakpoint
CREATE INDEX "pd_expert_idx" ON "patient_documents" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "pd_patient_idx" ON "patient_documents" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "pd_type_idx" ON "patient_documents" USING btree ("documentType");