CREATE TABLE `buddy_experts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`specialty` varchar(128),
	`bio` text,
	`avatarUrl` text,
	`coverUrl` text,
	`instagramHandle` varchar(64),
	`websiteUrl` text,
	`category` enum('perdida_peso','ganancia_muscular','definicion','dieta_equilibrada','rendimiento','bienestar','vegano') DEFAULT 'dieta_equilibrada',
	`verified` boolean NOT NULL DEFAULT false,
	`featured` boolean NOT NULL DEFAULT false,
	`followersCount` int NOT NULL DEFAULT 0,
	`plansCount` int NOT NULL DEFAULT 0,
	`rating` float DEFAULT 0,
	`reviewsCount` int NOT NULL DEFAULT 0,
	`stripeAccountId` varchar(128),
	`stripeOnboardingCompleted` boolean NOT NULL DEFAULT false,
	`commissionRate` float NOT NULL DEFAULT 0.2,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buddy_experts_id` PRIMARY KEY(`id`),
	CONSTRAINT `buddy_experts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `buddy_makers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`bio` text,
	`avatarUrl` text,
	`coverUrl` text,
	`instagramHandle` varchar(64),
	`youtubeHandle` varchar(64),
	`tiktokHandle` varchar(64),
	`specialty` varchar(128),
	`verified` boolean NOT NULL DEFAULT false,
	`featured` boolean NOT NULL DEFAULT false,
	`followersCount` int NOT NULL DEFAULT 0,
	`recipesCount` int NOT NULL DEFAULT 0,
	`rating` float DEFAULT 0,
	`stripeAccountId` varchar(128),
	`stripeOnboardingCompleted` boolean NOT NULL DEFAULT false,
	`commissionRate` float NOT NULL DEFAULT 0.2,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buddy_makers_id` PRIMARY KEY(`id`),
	CONSTRAINT `buddy_makers_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `creator_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorUserId` int NOT NULL,
	`creatorType` enum('buddyexpert','buddymaker') NOT NULL,
	`subscriberUserId` int NOT NULL,
	`subscriptionId` varchar(128),
	`amount` float NOT NULL,
	`commissionRate` float NOT NULL DEFAULT 0.2,
	`commissionAmount` float NOT NULL,
	`stripeTransferId` varchar(128),
	`status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creator_earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expert_followers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`expertId` int NOT NULL,
	`followedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expert_followers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expert_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expertId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`coverUrl` text,
	`category` enum('perdida_peso','ganancia_muscular','definicion','dieta_equilibrada','rendimiento','bienestar','vegano') DEFAULT 'dieta_equilibrada',
	`durationWeeks` int NOT NULL DEFAULT 4,
	`dailyCalories` int,
	`dailyMeals` int DEFAULT 3,
	`level` enum('principiante','intermedio','avanzado') DEFAULT 'principiante',
	`tags` text,
	`isPublic` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`copiesCount` int NOT NULL DEFAULT 0,
	`likesCount` int NOT NULL DEFAULT 0,
	`price` float DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expert_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maker_followers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`makerId` int NOT NULL,
	`followedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `maker_followers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_expert_plan_copies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`expertId` int NOT NULL,
	`copiedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_expert_plan_copies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `buddy_experts_user_idx` ON `buddy_experts` (`userId`);--> statement-breakpoint
CREATE INDEX `buddy_experts_category_idx` ON `buddy_experts` (`category`);--> statement-breakpoint
CREATE INDEX `buddy_makers_user_idx` ON `buddy_makers` (`userId`);--> statement-breakpoint
CREATE INDEX `creator_earnings_creator_idx` ON `creator_earnings` (`creatorUserId`);--> statement-breakpoint
CREATE INDEX `creator_earnings_subscriber_idx` ON `creator_earnings` (`subscriberUserId`);--> statement-breakpoint
CREATE INDEX `expert_followers_user_idx` ON `expert_followers` (`userId`);--> statement-breakpoint
CREATE INDEX `expert_followers_expert_idx` ON `expert_followers` (`expertId`);--> statement-breakpoint
CREATE INDEX `expert_plans_expert_idx` ON `expert_plans` (`expertId`);--> statement-breakpoint
CREATE INDEX `expert_plans_category_idx` ON `expert_plans` (`category`);--> statement-breakpoint
CREATE INDEX `maker_followers_user_idx` ON `maker_followers` (`userId`);--> statement-breakpoint
CREATE INDEX `maker_followers_maker_idx` ON `maker_followers` (`makerId`);--> statement-breakpoint
CREATE INDEX `plan_copies_user_idx` ON `user_expert_plan_copies` (`userId`);--> statement-breakpoint
CREATE INDEX `plan_copies_plan_idx` ON `user_expert_plan_copies` (`planId`);