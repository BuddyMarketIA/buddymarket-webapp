CREATE TYPE "public"."billing_snapshot_status" AS ENUM('pending', 'confirmed', 'paid', 'disputed');--> statement-breakpoint
CREATE TABLE "company_billing_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyId" integer NOT NULL,
	"billingPeriodStart" timestamp NOT NULL,
	"billingPeriodEnd" timestamp NOT NULL,
	"activeLicenses" integer DEFAULT 0 NOT NULL,
	"pricePerLicense" numeric(10, 2) NOT NULL,
	"totalAmount" numeric(10, 2) NOT NULL,
	"stripeInvoiceId" varchar(255),
	"stripeSubscriptionItemId" varchar(255),
	"status" "billing_snapshot_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cbs_company_idx" ON "company_billing_snapshots" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "cbs_period_idx" ON "company_billing_snapshots" USING btree ("billingPeriodStart");--> statement-breakpoint
CREATE INDEX "cbs_invoice_idx" ON "company_billing_snapshots" USING btree ("stripeInvoiceId");