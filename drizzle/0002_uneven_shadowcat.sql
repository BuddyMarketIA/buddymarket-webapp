ALTER TABLE "users" ADD COLUMN "passwordHash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "passwordResetToken" varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "passwordResetExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerificationToken" varchar(128);