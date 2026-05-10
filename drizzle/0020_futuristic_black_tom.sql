CREATE TYPE "public"."user_referral_reward_status" AS ENUM('pending', 'subscribed', 'rewarded', 'expired');--> statement-breakpoint
CREATE TABLE "user_referral_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"code" varchar(32) NOT NULL,
	"totalRewarded" integer DEFAULT 0 NOT NULL,
	"totalRewardDays" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_referral_codes_userId_unique" UNIQUE("userId"),
	CONSTRAINT "user_referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrerId" integer NOT NULL,
	"referredId" integer NOT NULL,
	"referralCode" varchar(32) NOT NULL,
	"status" "user_referral_reward_status" DEFAULT 'pending' NOT NULL,
	"stripeSubscriptionId" varchar(128),
	"subscribedAt" timestamp,
	"rewardedAt" timestamp,
	"rewardDays" integer DEFAULT 30,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_referrals_referredId_unique" UNIQUE("referredId")
);
--> statement-breakpoint
CREATE INDEX "urc_user_idx" ON "user_referral_codes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "urc_code_idx" ON "user_referral_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ur_referrer_idx" ON "user_referrals" USING btree ("referrerId");--> statement-breakpoint
CREATE INDEX "ur_referred_idx" ON "user_referrals" USING btree ("referredId");--> statement-breakpoint
CREATE INDEX "ur_code_idx" ON "user_referrals" USING btree ("referralCode");