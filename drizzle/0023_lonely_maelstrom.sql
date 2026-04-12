CREATE TYPE "public"."household_invite_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."household_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "household_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"householdId" integer NOT NULL,
	"invitedByUserId" integer NOT NULL,
	"invitedEmail" varchar(255) NOT NULL,
	"token" varchar(64) NOT NULL,
	"status" "household_invite_status" DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"acceptedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"householdId" integer NOT NULL,
	"userId" integer NOT NULL,
	"role" "household_role" DEFAULT 'member' NOT NULL,
	"displayName" varchar(80),
	"dietaryRestrictions" text,
	"allergies" text,
	"preferences" text,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"ownerId" integer NOT NULL,
	"maxMembers" integer DEFAULT 6 NOT NULL,
	"avatarUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "hhi_token_idx" ON "household_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "hhi_household_idx" ON "household_invitations" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "hhi_email_idx" ON "household_invitations" USING btree ("invitedEmail");--> statement-breakpoint
CREATE INDEX "hhm_household_idx" ON "household_members" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "hhm_user_idx" ON "household_members" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "hhm_unique_member" ON "household_members" USING btree ("householdId","userId");--> statement-breakpoint
CREATE INDEX "hh_owner_idx" ON "households" USING btree ("ownerId");