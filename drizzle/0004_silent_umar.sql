ALTER TABLE `recipes` ADD `mealTime` enum('desayuno','media_manana','comida','merienda','cena','cualquiera') DEFAULT 'cualquiera';--> statement-breakpoint
ALTER TABLE `recipes` ADD `category` varchar(64);--> statement-breakpoint
ALTER TABLE `recipes` ADD `allergens` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `fiberPerServing` float;--> statement-breakpoint
ALTER TABLE `recipes` ADD `buddyMakerId` int;--> statement-breakpoint
ALTER TABLE `recipes` ADD `isSeeded` boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX `recipe_meal_time_idx` ON `recipes` (`mealTime`);--> statement-breakpoint
CREATE INDEX `recipe_buddy_maker_idx` ON `recipes` (`buddyMakerId`);