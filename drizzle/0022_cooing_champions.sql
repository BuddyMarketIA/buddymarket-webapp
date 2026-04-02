ALTER TABLE `ingredients` ADD `potassium` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `calcium` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `iron` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `magnesium` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `phosphorus` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `zinc` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `vitaminC` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `vitaminA` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `vitaminD` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `vitaminE` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `vitaminK` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `vitaminB1` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `vitaminB2` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `vitaminB3` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `vitaminB6` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `vitaminB12` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `folate` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `cholesterol` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `omega3` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `omega6` float;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `category` varchar(64);--> statement-breakpoint
ALTER TABLE `ingredients` ADD `isVegan` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `isVegetarian` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `isGlutenFree` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `isDairyFree` boolean DEFAULT false;