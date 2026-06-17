CREATE TYPE "public"."invoiceStatus" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."kanbanStage" AS ENUM('new', 'active', 'follow_up', 'inactive', 'discharged');--> statement-breakpoint
CREATE TABLE "offline_body_measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"expertUserId" integer NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL,
	"waist" real,
	"hip" real,
	"chest" real,
	"leftArm" real,
	"rightArm" real,
	"leftThigh" real,
	"rightThigh" real,
	"leftCalf" real,
	"rightCalf" real,
	"neck" real,
	"shoulder" real,
	"bodyFatPct" real,
	"muscleMassPct" real,
	"bmi" real,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertUserId" integer NOT NULL,
	"patientId" integer NOT NULL,
	"invoiceNumber" varchar(32) NOT NULL,
	"concept" varchar(256) NOT NULL,
	"amount" real NOT NULL,
	"currency" varchar(8) DEFAULT 'EUR' NOT NULL,
	"status" "invoiceStatus" DEFAULT 'draft' NOT NULL,
	"issuedAt" timestamp DEFAULT now() NOT NULL,
	"dueAt" timestamp,
	"paidAt" timestamp,
	"notes" text,
	"pdfUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_patient_change_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"expertUserId" integer NOT NULL,
	"fieldName" varchar(64) NOT NULL,
	"oldValue" text,
	"newValue" text,
	"changedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_patient_kanban" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"expertUserId" integer NOT NULL,
	"stage" "kanbanStage" DEFAULT 'new' NOT NULL,
	"stageOrder" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_patient_label_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"labelId" integer NOT NULL,
	"expertUserId" integer NOT NULL,
	"assignedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_patient_labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertUserId" integer NOT NULL,
	"name" varchar(64) NOT NULL,
	"color" varchar(16) DEFAULT '#6366f1' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_progress_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"expertUserId" integer NOT NULL,
	"photoUrl" text NOT NULL,
	"photoType" varchar(16) DEFAULT 'progress' NOT NULL,
	"angle" varchar(16) DEFAULT 'front',
	"takenAt" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"isVisibleToPatient" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_questionnaire_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"questionnaireId" integer NOT NULL,
	"patientId" integer NOT NULL,
	"expertUserId" integer NOT NULL,
	"answers" text NOT NULL,
	"completedAt" timestamp,
	"sentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_questionnaires" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertUserId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"questions" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "obm_patient_idx" ON "offline_body_measurements" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "obm_expert_idx" ON "offline_body_measurements" USING btree ("expertUserId");--> statement-breakpoint
CREATE INDEX "obm_date_idx" ON "offline_body_measurements" USING btree ("recordedAt");--> statement-breakpoint
CREATE INDEX "oi_expert_idx" ON "offline_invoices" USING btree ("expertUserId");--> statement-breakpoint
CREATE INDEX "oi_patient_idx" ON "offline_invoices" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "oi_status_idx" ON "offline_invoices" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "oi_number_idx" ON "offline_invoices" USING btree ("invoiceNumber");--> statement-breakpoint
CREATE INDEX "opcl_patient_idx" ON "offline_patient_change_log" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "opcl_date_idx" ON "offline_patient_change_log" USING btree ("changedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "opk_patient_idx" ON "offline_patient_kanban" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "opk_expert_idx" ON "offline_patient_kanban" USING btree ("expertUserId");--> statement-breakpoint
CREATE INDEX "opk_stage_idx" ON "offline_patient_kanban" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "opla_patient_idx" ON "offline_patient_label_assignments" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "opla_label_idx" ON "offline_patient_label_assignments" USING btree ("labelId");--> statement-breakpoint
CREATE UNIQUE INDEX "opla_unique" ON "offline_patient_label_assignments" USING btree ("patientId","labelId");--> statement-breakpoint
CREATE INDEX "opl_expert_idx" ON "offline_patient_labels" USING btree ("expertUserId");--> statement-breakpoint
CREATE INDEX "opp2_patient_idx" ON "offline_progress_photos" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "opp2_expert_idx" ON "offline_progress_photos" USING btree ("expertUserId");--> statement-breakpoint
CREATE INDEX "opp2_date_idx" ON "offline_progress_photos" USING btree ("takenAt");--> statement-breakpoint
CREATE INDEX "oqr_q_idx" ON "offline_questionnaire_responses" USING btree ("questionnaireId");--> statement-breakpoint
CREATE INDEX "oqr_patient_idx" ON "offline_questionnaire_responses" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "oq_expert_idx" ON "offline_questionnaires" USING btree ("expertUserId");