CREATE TYPE "public"."expert_invoice_status" AS ENUM('draft', 'sent', 'paid', 'cancelled');--> statement-breakpoint
CREATE TABLE "expert_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertUserId" integer NOT NULL,
	"patientUserId" integer,
	"expertPatientId" integer,
	"invoiceNumber" text NOT NULL,
	"concept" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"status" "expert_invoice_status" DEFAULT 'draft' NOT NULL,
	"issuedAt" timestamp DEFAULT now() NOT NULL,
	"paidAt" timestamp,
	"dueDate" timestamp,
	"notes" text,
	"patientName" text,
	"patientEmail" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "expert_inv_expert_idx" ON "expert_invoices" USING btree ("expertUserId");--> statement-breakpoint
CREATE INDEX "expert_inv_patient_idx" ON "expert_invoices" USING btree ("patientUserId");