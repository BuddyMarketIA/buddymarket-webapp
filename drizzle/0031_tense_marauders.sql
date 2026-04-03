CREATE TABLE `referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ownerType` enum('buddyexpert','buddymaker') NOT NULL,
	`code` varchar(50) NOT NULL,
	`stripeCouponId` varchar(100),
	`stripePromoCodeId` varchar(100),
	`discountPercent` int NOT NULL DEFAULT 15,
	`commissionPercent` int NOT NULL DEFAULT 20,
	`isActive` boolean NOT NULL DEFAULT true,
	`usageCount` int NOT NULL DEFAULT 0,
	`totalEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `referral_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referralCodeId` int NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`stripeSubscriptionId` varchar(100),
	`stripeInvoiceId` varchar(100),
	`stripeTransferId` varchar(100),
	`subscriptionAmount` int NOT NULL,
	`commissionAmount` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'eur',
	`status` enum('pending','transferred','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`transferredAt` timestamp,
	CONSTRAINT `referral_earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referralCodeId` int NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`stripeSubscriptionId` varchar(100) NOT NULL,
	`stripeCustomerId` varchar(100),
	`plan` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`cancelledAt` timestamp,
	CONSTRAINT `referral_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `referral_user_idx` ON `referral_codes` (`userId`);--> statement-breakpoint
CREATE INDEX `referral_code_idx` ON `referral_codes` (`code`);--> statement-breakpoint
CREATE INDEX `ref_earn_code_idx` ON `referral_earnings` (`referralCodeId`);--> statement-breakpoint
CREATE INDEX `ref_earn_referrer_idx` ON `referral_earnings` (`referrerId`);--> statement-breakpoint
CREATE INDEX `ref_sub_code_idx` ON `referral_subscriptions` (`referralCodeId`);--> statement-breakpoint
CREATE INDEX `ref_sub_referrer_idx` ON `referral_subscriptions` (`referrerId`);--> statement-breakpoint
CREATE INDEX `ref_sub_stripe_idx` ON `referral_subscriptions` (`stripeSubscriptionId`);