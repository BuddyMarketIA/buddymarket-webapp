CREATE TYPE "public"."ticket_category" AS ENUM('billing', 'technical', 'account', 'feature', 'nutrition', 'other');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'waiting_user', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticketId" integer NOT NULL,
	"authorId" integer NOT NULL,
	"authorRole" varchar(16) NOT NULL,
	"message" text NOT NULL,
	"isInternal" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"subject" varchar(256) NOT NULL,
	"category" "ticket_category" DEFAULT 'other' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'medium' NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"assignedAdminId" integer,
	"closedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sm_ticket_idx" ON "support_messages" USING btree ("ticketId");--> statement-breakpoint
CREATE INDEX "sm_author_idx" ON "support_messages" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "st_user_idx" ON "support_tickets" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "st_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "st_priority_idx" ON "support_tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "st_category_idx" ON "support_tickets" USING btree ("category");