CREATE TABLE `complement_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`complementId` int NOT NULL,
	`quantity` float NOT NULL DEFAULT 1,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	`mealType` enum('desayuno','media_manana','comida','merienda','cena','otro') NOT NULL DEFAULT 'otro',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complement_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`nameEs` varchar(256),
	`category` enum('bebida_caliente','bebida_fria','lacteo','proteina','fruta','snack_saludable','suplemento','otro') NOT NULL DEFAULT 'otro',
	`servingSize` int NOT NULL DEFAULT 100,
	`servingUnit` varchar(20) NOT NULL DEFAULT 'g',
	`servingLabel` varchar(64),
	`calories` int,
	`proteins` float,
	`carbs` float,
	`fats` float,
	`fiber` float,
	`sugar` float,
	`caffeine` float,
	`imageUrl` text,
	`emoji` varchar(8) DEFAULT '🍽️',
	`isSeeded` boolean DEFAULT false,
	`isPublic` boolean DEFAULT true,
	`userId` int,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipe_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recipeId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recipe_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `recipe_likes_unique` UNIQUE(`userId`,`recipeId`)
);
--> statement-breakpoint
CREATE INDEX `complement_logs_user_idx` ON `complement_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `complement_logs_date_idx` ON `complement_logs` (`loggedAt`);--> statement-breakpoint
CREATE INDEX `complements_name_idx` ON `complements` (`name`);--> statement-breakpoint
CREATE INDEX `complements_category_idx` ON `complements` (`category`);--> statement-breakpoint
CREATE INDEX `recipe_likes_user_idx` ON `recipe_likes` (`userId`);--> statement-breakpoint
CREATE INDEX `recipe_likes_recipe_idx` ON `recipe_likes` (`recipeId`);