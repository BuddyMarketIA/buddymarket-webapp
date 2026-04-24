CREATE TYPE "public"."petAlertStatus" AS ENUM('pending', 'sent', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."petAlertType" AS ENUM('vaccine', 'checkup', 'medication', 'weight', 'diet', 'deworming', 'dental', 'surgery', 'other');--> statement-breakpoint
CREATE TYPE "public"."petClinicLinkStatus" AS ENUM('pending', 'active', 'revoked');--> statement-breakpoint
CREATE TABLE "petAlerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"petId" integer NOT NULL,
	"clinicId" integer,
	"ownerId" integer NOT NULL,
	"type" "petAlertType" NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"dueDate" timestamp,
	"status" "petAlertStatus" DEFAULT 'pending' NOT NULL,
	"resolvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petClinicLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"petId" integer NOT NULL,
	"clinicId" integer NOT NULL,
	"ownerId" integer NOT NULL,
	"status" "petClinicLinkStatus" DEFAULT 'active' NOT NULL,
	"linkedAt" timestamp DEFAULT now() NOT NULL,
	"revokedAt" timestamp,
	"vetNotes" text
);
--> statement-breakpoint
CREATE TABLE "petVetVisits" (
	"id" serial PRIMARY KEY NOT NULL,
	"petId" integer NOT NULL,
	"clinicId" integer NOT NULL,
	"ownerId" integer NOT NULL,
	"visitDate" timestamp NOT NULL,
	"reason" varchar(300),
	"diagnosis" text,
	"treatment" text,
	"weight" real,
	"nextVisitDate" timestamp,
	"vetName" varchar(150),
	"attachmentsJson" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vetClinicUsers" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinicId" integer NOT NULL,
	"userId" integer NOT NULL,
	"role" varchar(32) DEFAULT 'vet' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vetClinics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"address" text,
	"phone" varchar(32),
	"email" varchar(320),
	"website" varchar(300),
	"logoUrl" text,
	"description" text,
	"accessCode" varchar(12) NOT NULL,
	"ownerId" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vetClinics_accessCode_unique" UNIQUE("accessCode")
);
--> statement-breakpoint
CREATE INDEX "pa_pet_idx" ON "petAlerts" USING btree ("petId");--> statement-breakpoint
CREATE INDEX "pa_owner_idx" ON "petAlerts" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "pa_clinic_idx" ON "petAlerts" USING btree ("clinicId");--> statement-breakpoint
CREATE INDEX "pa_status_idx" ON "petAlerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pcl_pet_idx" ON "petClinicLinks" USING btree ("petId");--> statement-breakpoint
CREATE INDEX "pcl_clinic_idx" ON "petClinicLinks" USING btree ("clinicId");--> statement-breakpoint
CREATE INDEX "pvv_pet_idx" ON "petVetVisits" USING btree ("petId");--> statement-breakpoint
CREATE INDEX "pvv_clinic_idx" ON "petVetVisits" USING btree ("clinicId");--> statement-breakpoint
CREATE INDEX "vcu_clinic_idx" ON "vetClinicUsers" USING btree ("clinicId");--> statement-breakpoint
CREATE INDEX "vcu_user_idx" ON "vetClinicUsers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "vc_owner_idx" ON "vetClinics" USING btree ("ownerId");--> statement-breakpoint
CREATE UNIQUE INDEX "vc_code_idx" ON "vetClinics" USING btree ("accessCode");