CREATE TABLE `role_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleType` enum('buddymaker','buddyexpert') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`motivation` text,
	`socialLinks` text,
	`specialties` text,
	`reviewNote` text,
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `role_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `role_requests_user_role_unique` UNIQUE(`userId`,`roleType`)
);
--> statement-breakpoint
CREATE INDEX `role_requests_user_idx` ON `role_requests` (`userId`);