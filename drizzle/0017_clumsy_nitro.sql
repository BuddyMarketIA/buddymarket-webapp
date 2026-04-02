CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` varchar(64) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`pointsAwarded` int NOT NULL DEFAULT 0,
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_achievements_unique` UNIQUE(`userId`,`achievementId`)
);
--> statement-breakpoint
CREATE TABLE `user_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_points_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `user_achievements_user_idx` ON `user_achievements` (`userId`);