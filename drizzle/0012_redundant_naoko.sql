CREATE TABLE `buddy_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('expert','maker') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`displayName` varchar(128) NOT NULL,
	`bio` text,
	`specialty` varchar(128),
	`instagramHandle` varchar(64),
	`youtubeHandle` varchar(64),
	`tiktokHandle` varchar(64),
	`websiteUrl` varchar(256),
	`motivation` text,
	`experience` text,
	`expertCategory` varchar(64),
	`certifications` text,
	`adminNote` text,
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buddy_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`weight` float,
	`bodyFat` float,
	`muscleMass` float,
	`bmi` float,
	`waist` float,
	`hip` float,
	`chest` float,
	`arm` float,
	`thigh` float,
	`calf` float,
	`neck` float,
	`visceralFat` float,
	`boneMass` float,
	`waterPercentage` float,
	`metabolicAge` int,
	`basalMetabolism` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `buddy_apps_user_idx` ON `buddy_applications` (`userId`);--> statement-breakpoint
CREATE INDEX `buddy_apps_status_idx` ON `buddy_applications` (`status`);--> statement-breakpoint
CREATE INDEX `buddy_apps_type_idx` ON `buddy_applications` (`type`);--> statement-breakpoint
CREATE INDEX `user_metrics_user_idx` ON `user_metrics` (`userId`);--> statement-breakpoint
CREATE INDEX `user_metrics_date_idx` ON `user_metrics` (`date`);--> statement-breakpoint
CREATE INDEX `user_metrics_user_date_idx` ON `user_metrics` (`userId`,`date`);