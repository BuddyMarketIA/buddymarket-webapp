CREATE TABLE `expert_menus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expertId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`coverUrl` text,
	`weekNumber` int,
	`year` int,
	`category` enum('perdida_peso','ganancia_muscular','definicion','dieta_equilibrada','rendimiento','bienestar','vegano') DEFAULT 'dieta_equilibrada',
	`dailyCalories` int,
	`isFree` boolean NOT NULL DEFAULT true,
	`isPublic` boolean NOT NULL DEFAULT true,
	`copiesCount` int NOT NULL DEFAULT 0,
	`likesCount` int NOT NULL DEFAULT 0,
	`menuData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expert_menus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `expert_menus_expert_idx` ON `expert_menus` (`expertId`);--> statement-breakpoint
CREATE INDEX `expert_menus_category_idx` ON `expert_menus` (`category`);