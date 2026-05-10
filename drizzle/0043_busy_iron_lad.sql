DROP INDEX "hhm_unique_member";--> statement-breakpoint
ALTER TABLE "household_members" ALTER COLUMN "userId" DROP NOT NULL;