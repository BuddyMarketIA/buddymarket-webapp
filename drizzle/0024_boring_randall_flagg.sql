CREATE TABLE `email_sequence_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`sequenceStep` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_sequence_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `email_seq_user_idx` ON `email_sequence_queue` (`userId`);--> statement-breakpoint
CREATE INDEX `email_seq_status_idx` ON `email_sequence_queue` (`status`);--> statement-breakpoint
CREATE INDEX `email_seq_scheduled_idx` ON `email_sequence_queue` (`scheduledAt`);