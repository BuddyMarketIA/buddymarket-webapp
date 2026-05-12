CREATE TYPE "public"."alertSeverity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alertStatus2" AS ENUM('active', 'acknowledged', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."dayOfWeek" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TYPE "public"."videoRoomStatus" AS ENUM('waiting', 'active', 'ended');--> statement-breakpoint
CREATE TABLE "b2b_companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"contactEmail" varchar(256) NOT NULL,
	"contactName" varchar(256),
	"logoUrl" text,
	"maxSeats" integer DEFAULT 10 NOT NULL,
	"usedSeats" integer DEFAULT 0 NOT NULL,
	"planType" varchar(64) DEFAULT 'standard' NOT NULL,
	"stripeCustomerId" varchar(128),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" integer NOT NULL,
	"userId" integer NOT NULL,
	"role" varchar(32) DEFAULT 'employee' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_availability_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"dayOfWeek" "dayOfWeek" NOT NULL,
	"startTime" varchar(5) NOT NULL,
	"endTime" varchar(5) NOT NULL,
	"slotDurationMinutes" integer DEFAULT 60 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"expertPatientId" integer NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(256),
	"content" text,
	"isVerified" boolean DEFAULT false NOT NULL,
	"weeksWithExpert" integer DEFAULT 0 NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"expertResponse" text,
	"expertRespondedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"expertPatientId" integer NOT NULL,
	"alertType" varchar(64) NOT NULL,
	"severity" "alertSeverity" DEFAULT 'medium' NOT NULL,
	"status" "alertStatus2" DEFAULT 'active' NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"metadata" text,
	"acknowledgedAt" timestamp,
	"resolvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointmentId" integer NOT NULL,
	"expertId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"roomCode" varchar(64) NOT NULL,
	"status" "videoRoomStatus" DEFAULT 'waiting' NOT NULL,
	"startedAt" timestamp,
	"endedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "video_rooms_roomCode_unique" UNIQUE("roomCode")
);
--> statement-breakpoint
CREATE INDEX "b2b_email_idx" ON "b2b_companies" USING btree ("contactEmail");--> statement-breakpoint
CREATE INDEX "b2be_company_idx" ON "b2b_employees" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "b2be_user_idx" ON "b2b_employees" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "eas_expert_idx" ON "expert_availability_slots" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "er_expert_idx" ON "expert_reviews" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "er_patient_idx" ON "expert_reviews" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "pa2_expert_idx" ON "patient_alerts" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "pa2_patient_idx" ON "patient_alerts" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "pa2_status_idx" ON "patient_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vr_appt_idx" ON "video_rooms" USING btree ("appointmentId");--> statement-breakpoint
CREATE INDEX "vr_code_idx" ON "video_rooms" USING btree ("roomCode");