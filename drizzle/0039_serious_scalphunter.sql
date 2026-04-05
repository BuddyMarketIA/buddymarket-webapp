CREATE TABLE `ai_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mealLogId` int,
	`rating` int NOT NULL,
	`accurate` boolean NOT NULL,
	`comment` text,
	`detectedDishName` varchar(256),
	`detectedCalories` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ai_fb_user_idx` ON `ai_feedback` (`userId`);--> statement-breakpoint
CREATE INDEX `ai_fb_rating_idx` ON `ai_feedback` (`rating`);