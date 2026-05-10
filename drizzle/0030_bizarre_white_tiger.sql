CREATE TYPE "public"."appointmentStatus" AS ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."assignedMenuStatus" AS ENUM('pending_adaptation', 'adapted', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."expertPatientStatus" AS ENUM('invited', 'active', 'paused', 'discharged');--> statement-breakpoint
CREATE TABLE "expert_appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertPatientId" integer NOT NULL,
	"expertId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"status" "appointmentStatus" DEFAULT 'scheduled' NOT NULL,
	"modality" varchar(16) DEFAULT 'online' NOT NULL,
	"meetingUrl" text,
	"location" text,
	"googleCalendarEventId" varchar(256),
	"googleCalendarLink" text,
	"reminderSentAt" timestamp,
	"cancelledAt" timestamp,
	"cancelReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_assigned_menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertPatientId" integer NOT NULL,
	"expertId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"originalMenuId" integer,
	"originalMenuTitle" varchar(256),
	"adaptedMenuData" text,
	"adaptationNotes" text,
	"status" "assignedMenuStatus" DEFAULT 'pending_adaptation' NOT NULL,
	"weekStartDate" timestamp,
	"expertNotes" text,
	"patientFeedback" text,
	"patientRating" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertPatientId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"senderRole" varchar(16) NOT NULL,
	"content" text NOT NULL,
	"attachmentUrl" text,
	"attachmentType" varchar(32),
	"isRead" boolean DEFAULT false NOT NULL,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"status" "expertPatientStatus" DEFAULT 'invited' NOT NULL,
	"notes" text,
	"startDate" timestamp,
	"endDate" timestamp,
	"inviteToken" varchar(64),
	"inviteAcceptedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertPatientId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL,
	"weight" real,
	"bodyFat" real,
	"muscleMass" real,
	"waist" real,
	"hip" real,
	"chest" real,
	"arm" real,
	"thigh" real,
	"photoUrl" text,
	"notes" text,
	"expertComment" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipeId" integer NOT NULL,
	"makerId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"uniqueViews" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ea_rel_idx" ON "expert_appointments" USING btree ("expertPatientId");--> statement-breakpoint
CREATE INDEX "ea_expert_idx" ON "expert_appointments" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "ea_patient_idx" ON "expert_appointments" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "ea_start_idx" ON "expert_appointments" USING btree ("startTime");--> statement-breakpoint
CREATE INDEX "eam_rel_idx" ON "expert_assigned_menus" USING btree ("expertPatientId");--> statement-breakpoint
CREATE INDEX "eam_expert_idx" ON "expert_assigned_menus" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "eam_patient_idx" ON "expert_assigned_menus" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "em_rel_idx" ON "expert_messages" USING btree ("expertPatientId");--> statement-breakpoint
CREATE INDEX "em_sender_idx" ON "expert_messages" USING btree ("senderId");--> statement-breakpoint
CREATE INDEX "ep_expert_idx" ON "expert_patients" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "ep_patient_idx" ON "expert_patients" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "ep_token_idx" ON "expert_patients" USING btree ("inviteToken");--> statement-breakpoint
CREATE INDEX "pp_rel_idx" ON "patient_progress" USING btree ("expertPatientId");--> statement-breakpoint
CREATE INDEX "pp_patient_idx" ON "patient_progress" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "pp_date_idx" ON "patient_progress" USING btree ("recordedAt");--> statement-breakpoint
CREATE INDEX "ra_recipe_idx" ON "recipe_analytics" USING btree ("recipeId");--> statement-breakpoint
CREATE INDEX "ra_maker_idx" ON "recipe_analytics" USING btree ("makerId");--> statement-breakpoint
CREATE INDEX "ra_date_idx" ON "recipe_analytics" USING btree ("date");