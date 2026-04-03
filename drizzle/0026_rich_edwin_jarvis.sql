CREATE TABLE `in_app_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`type` enum('info','success','warning','update','promo') NOT NULL DEFAULT 'info',
	`isRead` boolean NOT NULL DEFAULT false,
	`link` varchar(500),
	`imageUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `in_app_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `notif_user_idx` ON `in_app_notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notif_read_idx` ON `in_app_notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `notif_created_idx` ON `in_app_notifications` (`createdAt`);