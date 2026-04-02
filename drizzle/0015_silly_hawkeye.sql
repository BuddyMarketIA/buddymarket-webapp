CREATE TABLE `meal_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mealType` enum('desayuno','almuerzo','merienda','cena','snack') NOT NULL,
	`time` varchar(5) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`daysMask` int NOT NULL DEFAULT 127,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meal_reminders_id` PRIMARY KEY(`id`),
	CONSTRAINT `meal_reminders_unique` UNIQUE(`userId`,`mealType`)
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `meal_reminders_user_idx` ON `meal_reminders` (`userId`);--> statement-breakpoint
CREATE INDEX `push_subs_user_idx` ON `push_subscriptions` (`userId`);