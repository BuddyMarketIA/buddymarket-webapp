CREATE TABLE `pantry_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ingredientKey` varchar(256) NOT NULL,
	`ingredientName` varchar(256) NOT NULL,
	`commercialLabel` varchar(256),
	`quantityPurchased` float NOT NULL DEFAULT 1,
	`quantityAvailable` float NOT NULL DEFAULT 1,
	`unitSizeGrams` float,
	`estimatedExpiresAt` timestamp,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pantry_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ps_user_idx` ON `pantry_stock` (`userId`);--> statement-breakpoint
CREATE INDEX `ps_user_key_idx` ON `pantry_stock` (`userId`,`ingredientKey`);