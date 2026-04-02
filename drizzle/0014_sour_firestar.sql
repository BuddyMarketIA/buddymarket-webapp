CREATE TABLE `recipe_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recipeId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recipe_favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `recipe_favorites_unique` UNIQUE(`userId`,`recipeId`)
);
--> statement-breakpoint
CREATE INDEX `recipe_favorites_user_idx` ON `recipe_favorites` (`userId`);--> statement-breakpoint
CREATE INDEX `recipe_favorites_recipe_idx` ON `recipe_favorites` (`recipeId`);