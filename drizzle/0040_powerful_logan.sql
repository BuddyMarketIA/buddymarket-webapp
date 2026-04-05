CREATE TABLE `otp_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`codeHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`attempts` int NOT NULL DEFAULT 0,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `otp_email_idx` ON `otp_tokens` (`email`);--> statement-breakpoint
CREATE INDEX `otp_expires_idx` ON `otp_tokens` (`expiresAt`);