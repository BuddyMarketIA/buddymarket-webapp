CREATE TABLE `menu_complements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuOrganizerId` int NOT NULL,
	`userId` int NOT NULL,
	`complementId` int,
	`customName` varchar(256),
	`emoji` varchar(8) DEFAULT '☕',
	`mealTime` enum('desayuno','media_manana','comida','merienda','cena','otro') NOT NULL DEFAULT 'otro',
	`quantity` float NOT NULL DEFAULT 1,
	`unit` varchar(32) DEFAULT 'ud',
	`calories` int,
	`notes` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_complements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `mc_menu_idx` ON `menu_complements` (`menuOrganizerId`);--> statement-breakpoint
CREATE INDEX `mc_user_idx` ON `menu_complements` (`userId`);