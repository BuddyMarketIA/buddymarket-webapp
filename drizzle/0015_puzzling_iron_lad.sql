ALTER TABLE "users" ADD COLUMN "termsAcceptedAt" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "termsVersion" varchar(16);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacyAcceptedAt" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "marketingConsent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "marketingConsentAt" timestamp;