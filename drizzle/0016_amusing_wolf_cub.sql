CREATE TABLE "founder_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"claimedAt" timestamp,
	"claimedByUserId" integer,
	"addedAt" timestamp DEFAULT now() NOT NULL,
	"addedBy" varchar(128) DEFAULT 'import' NOT NULL,
	"notes" varchar(255),
	CONSTRAINT "founder_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "founder_emails_email_idx" ON "founder_emails" USING btree ("email");