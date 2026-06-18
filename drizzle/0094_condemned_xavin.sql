CREATE TYPE "public"."profileType" AS ENUM('user', 'buddyexpert', 'buddymaker', 'empresa', 'clinica_vet', 'colaborador');--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"profileType" "profileType" NOT NULL,
	"completedSteps" text[] DEFAULT '{}' NOT NULL,
	"tourCompleted" boolean DEFAULT false NOT NULL,
	"tourCompletedAt" timestamp,
	"tourRestartedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_progress_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "organization_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"profileType" "profileType" NOT NULL,
	"organizationName" varchar(256) NOT NULL,
	"cif" varchar(20),
	"address" text,
	"city" varchar(128),
	"postalCode" varchar(10),
	"country" varchar(64) DEFAULT 'España',
	"phone" varchar(32),
	"website" text,
	"logoUrl" text,
	"employeeCount" integer,
	"sector" varchar(128),
	"licenseCount" integer DEFAULT 0,
	"contactPersonName" varchar(128),
	"contactPersonEmail" varchar(320),
	"contactPersonPhone" varchar(32),
	"vetLicenseNumber" varchar(64),
	"specializations" text,
	"vetCount" integer,
	"verified" boolean DEFAULT false NOT NULL,
	"verifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "profile_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"profileType" "profileType" NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"motivation" text,
	"experience" text,
	"socialLinks" text,
	"specialties" text,
	"certifications" text,
	"portfolioUrl" text,
	"referralNetwork" text,
	"reviewNote" text,
	"reviewedAt" timestamp,
	"reviewedBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_apps_user_type_unique" UNIQUE("userId","profileType")
);
--> statement-breakpoint
CREATE INDEX "onboarding_progress_user_idx" ON "onboarding_progress" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "org_profiles_user_idx" ON "organization_profiles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "profile_apps_user_idx" ON "profile_applications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "profile_apps_status_idx" ON "profile_applications" USING btree ("status");