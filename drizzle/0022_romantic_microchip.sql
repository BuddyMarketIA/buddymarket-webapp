CREATE TYPE "public"."reminderStatus" AS ENUM('pending', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."reminderType" AS ENUM('activation', 'engagement', 'expiry_warning', 'custom');--> statement-breakpoint
CREATE TABLE "company_reminder_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "reminderType" DEFAULT 'activation' NOT NULL,
	"subject" varchar(255) NOT NULL,
	"bodyHtml" text NOT NULL,
	"scheduledAt" timestamp,
	"sentAt" timestamp,
	"totalRecipients" integer DEFAULT 0 NOT NULL,
	"sentCount" integer DEFAULT 0 NOT NULL,
	"failedCount" integer DEFAULT 0 NOT NULL,
	"status" "reminderStatus" DEFAULT 'pending' NOT NULL,
	"createdByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_reminder_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaignId" integer NOT NULL,
	"companyId" integer NOT NULL,
	"recipientEmail" varchar(255) NOT NULL,
	"recipientName" varchar(255),
	"activationCode" varchar(20),
	"status" "reminderStatus" DEFAULT 'pending' NOT NULL,
	"sentAt" timestamp,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "crc_company_idx" ON "company_reminder_campaigns" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "crc_status_idx" ON "company_reminder_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crl_campaign_idx" ON "company_reminder_logs" USING btree ("campaignId");--> statement-breakpoint
CREATE INDEX "crl_company_idx" ON "company_reminder_logs" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "crl_email_idx" ON "company_reminder_logs" USING btree ("recipientEmail");