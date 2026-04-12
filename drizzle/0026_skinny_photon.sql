ALTER TABLE "companies" ADD COLUMN "accessCode" varchar(32);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "licensesActive" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "welcomeMessage" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "usedReferralCode" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referralCodeType" varchar(20);--> statement-breakpoint
CREATE INDEX "company_access_code_idx" ON "companies" USING btree ("accessCode");--> statement-breakpoint
CREATE INDEX "users_referral_code_idx" ON "users" USING btree ("usedReferralCode");--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_accessCode_unique" UNIQUE("accessCode");