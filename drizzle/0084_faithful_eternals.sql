CREATE TYPE "public"."campaignStatus" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "email_campaign_sends" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaignId" integer NOT NULL,
	"contactId" integer NOT NULL,
	"email" varchar(320) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"messageId" varchar(255),
	"sentAt" timestamp,
	"errorMessage" text
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"previewText" varchar(255),
	"htmlContent" text NOT NULL,
	"listId" integer,
	"status" "campaignStatus" DEFAULT 'draft' NOT NULL,
	"scheduledAt" timestamp,
	"sentAt" timestamp,
	"totalRecipients" integer DEFAULT 0,
	"totalSent" integer DEFAULT 0,
	"totalFailed" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(255),
	"company" varchar(255),
	"tags" text,
	"source" varchar(100) DEFAULT 'manual',
	"subscribed" boolean DEFAULT true NOT NULL,
	"bouncedAt" timestamp,
	"unsubscribedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_list_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"listId" integer NOT NULL,
	"contactId" integer NOT NULL,
	"addedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_list_member_unique" UNIQUE("listId","contactId")
);
--> statement-breakpoint
CREATE TABLE "email_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#F97316',
	"contactCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "email_sends_campaign_idx" ON "email_campaign_sends" USING btree ("campaignId");--> statement-breakpoint
CREATE INDEX "email_sends_contact_idx" ON "email_campaign_sends" USING btree ("contactId");--> statement-breakpoint
CREATE INDEX "email_sends_status_idx" ON "email_campaign_sends" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "email_contacts_email_idx" ON "email_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_contacts_subscribed_idx" ON "email_contacts" USING btree ("subscribed");--> statement-breakpoint
CREATE INDEX "email_list_members_list_idx" ON "email_list_members" USING btree ("listId");--> statement-breakpoint
CREATE INDEX "email_list_members_contact_idx" ON "email_list_members" USING btree ("contactId");