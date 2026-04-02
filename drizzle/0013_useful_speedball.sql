CREATE TABLE `saved_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`eventName` varchar(128) NOT NULL,
	`persons` int NOT NULL DEFAULT 4,
	`categories` varchar(256),
	`menuData` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `saved_events_user_idx` ON `saved_events` (`userId`);