CREATE TYPE "public"."activationCodeStatus" AS ENUM('available', 'used', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."companyPlan" AS ENUM('starter', 'business', 'enterprise', 'corporate');--> statement-breakpoint
CREATE TYPE "public"."companyStatus" AS ENUM('pending', 'trial', 'active', 'suspended', 'cancelled');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"taxId" varchar(20),
	"contactEmail" varchar(255) NOT NULL,
	"contactName" varchar(255),
	"contactPhone" varchar(30),
	"plan" "companyPlan" DEFAULT 'starter' NOT NULL,
	"status" "companyStatus" DEFAULT 'pending' NOT NULL,
	"licensesTotal" integer DEFAULT 10 NOT NULL,
	"stripeCustomerId" varchar(255),
	"stripeSubscriptionId" varchar(255),
	"adminUserId" integer,
	"industry" varchar(100),
	"employeeCount" integer,
	"notes" text,
	"contractStartAt" timestamp,
	"contractEndAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_activation_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" integer NOT NULL,
	"code" varchar(20) NOT NULL,
	"status" "activationCodeStatus" DEFAULT 'available' NOT NULL,
	"redeemedByUserId" integer,
	"redeemedAt" timestamp,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_activation_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "company_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyName" varchar(255) NOT NULL,
	"contactName" varchar(255) NOT NULL,
	"contactEmail" varchar(255) NOT NULL,
	"contactPhone" varchar(30),
	"employeeCount" integer,
	"industry" varchar(100),
	"planInterest" "companyPlan",
	"message" text,
	"contacted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" integer NOT NULL,
	"userId" integer NOT NULL,
	"activationCodeId" integer,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"lastActiveAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX "company_email_idx" ON "companies" USING btree ("contactEmail");--> statement-breakpoint
CREATE INDEX "company_stripe_idx" ON "companies" USING btree ("stripeCustomerId");--> statement-breakpoint
CREATE INDEX "company_admin_idx" ON "companies" USING btree ("adminUserId");--> statement-breakpoint
CREATE INDEX "cac_company_idx" ON "company_activation_codes" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "cac_code_idx" ON "company_activation_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "cl_email_idx" ON "company_leads" USING btree ("contactEmail");--> statement-breakpoint
CREATE INDEX "cm_company_idx" ON "company_members" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "cm_user_idx" ON "company_members" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "cm_unique_member" ON "company_members" USING btree ("companyId","userId");