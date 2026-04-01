CREATE TABLE `allergies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiParam` varchar(64) NOT NULL,
	`nameEs` varchar(128) NOT NULL,
	`nameEn` varchar(128),
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `allergies_id` PRIMARY KEY(`id`),
	CONSTRAINT `allergies_apiParam_unique` UNIQUE(`apiParam`)
);
--> statement-breakpoint
CREATE TABLE `day_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiParam` varchar(64) NOT NULL,
	`nameEs` varchar(64) NOT NULL,
	`nameEn` varchar(64),
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `day_parts_id` PRIMARY KEY(`id`),
	CONSTRAINT `day_parts_apiParam_unique` UNIQUE(`apiParam`)
);
--> statement-breakpoint
CREATE TABLE `diet_restrictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiParam` varchar(64) NOT NULL,
	`nameEs` varchar(128) NOT NULL,
	`nameEn` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diet_restrictions_id` PRIMARY KEY(`id`),
	CONSTRAINT `diet_restrictions_apiParam_unique` UNIQUE(`apiParam`)
);
--> statement-breakpoint
CREATE TABLE `food_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiParam` varchar(64) NOT NULL,
	`nameEs` varchar(128) NOT NULL,
	`nameEn` varchar(128),
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `food_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `food_categories_apiParam_unique` UNIQUE(`apiParam`)
);
--> statement-breakpoint
CREATE TABLE `ingredient_allergies` (
	`ingredientId` int NOT NULL,
	`allergyId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredient_allergies_ingredientId_allergyId_unique` UNIQUE(`ingredientId`,`allergyId`)
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiParam` varchar(128) NOT NULL,
	`nameEs` varchar(256) NOT NULL,
	`nameEn` varchar(256),
	`imageUrl` text,
	`purchaseUnitType` varchar(64),
	`purchaseGramsPerUnit` int,
	`purchaseUnitSingular` varchar(64),
	`purchaseUnitPlural` varchar(64),
	`calories` int,
	`proteins` float,
	`carbohydrates` float,
	`fats` float,
	`saturatedFats` float,
	`fiber` float,
	`sugars` float,
	`sodium` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`),
	CONSTRAINT `ingredients_apiParam_unique` UNIQUE(`apiParam`)
);
--> statement-breakpoint
CREATE TABLE `meal_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recipeId` int,
	`customMealName` varchar(256),
	`dayPartId` int,
	`logDate` date NOT NULL,
	`servings` float DEFAULT 1,
	`calories` int,
	`proteins` float,
	`carbohydrates` float,
	`fats` float,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meal_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `measures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiParam` varchar(64) NOT NULL,
	`nameEs` varchar(64) NOT NULL,
	`nameEn` varchar(64),
	`abbreviation` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `measures_id` PRIMARY KEY(`id`),
	CONSTRAINT `measures_apiParam_unique` UNIQUE(`apiParam`)
);
--> statement-breakpoint
CREATE TABLE `menu_organizer_day_part_recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuOrganizerDayPartId` int NOT NULL,
	`recipeId` int NOT NULL,
	`servings` float DEFAULT 1,
	`completed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_organizer_day_part_recipes_id` PRIMARY KEY(`id`),
	CONSTRAINT `menu_organizer_day_part_recipes_menuOrganizerDayPartId_recipeId_unique` UNIQUE(`menuOrganizerDayPartId`,`recipeId`)
);
--> statement-breakpoint
CREATE TABLE `menu_organizer_day_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuOrganizerId` int NOT NULL,
	`dayPartId` int NOT NULL,
	`date` date,
	`dayNumber` int,
	`mealNumber` int,
	`name` varchar(128),
	`completed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_organizer_day_parts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_organizers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`type` enum('weekly','monthly','custom') DEFAULT 'weekly',
	`isPublic` boolean DEFAULT false,
	`objective` text,
	`dailyMealsCount` int DEFAULT 3,
	`generatedByAI` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_organizers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recipe_allergies` (
	`recipeId` int NOT NULL,
	`allergyId` int NOT NULL,
	CONSTRAINT `recipe_allergies_recipeId_allergyId_unique` UNIQUE(`recipeId`,`allergyId`)
);
--> statement-breakpoint
CREATE TABLE `recipe_diet_restrictions` (
	`recipeId` int NOT NULL,
	`dietRestrictionId` int NOT NULL,
	CONSTRAINT `recipe_diet_restrictions_recipeId_dietRestrictionId_unique` UNIQUE(`recipeId`,`dietRestrictionId`)
);
--> statement-breakpoint
CREATE TABLE `recipe_food_categories` (
	`recipeId` int NOT NULL,
	`foodCategoryId` int NOT NULL,
	CONSTRAINT `recipe_food_categories_recipeId_foodCategoryId_unique` UNIQUE(`recipeId`,`foodCategoryId`)
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`measureId` int,
	`amount` float NOT NULL,
	`optional` boolean DEFAULT false,
	`notes` text,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recipe_ingredients_id` PRIMARY KEY(`id`),
	CONSTRAINT `recipe_ingredients_recipeId_ingredientId_unique` UNIQUE(`recipeId`,`ingredientId`)
);
--> statement-breakpoint
CREATE TABLE `recipe_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipeId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`instruction` text NOT NULL,
	`imageUrl` text,
	`timing` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recipe_steps_id` PRIMARY KEY(`id`),
	CONSTRAINT `recipe_steps_recipeId_stepNumber_unique` UNIQUE(`recipeId`,`stepNumber`)
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`imageUrl` text,
	`description` text,
	`preparationTime` int DEFAULT 0,
	`cookTime` int DEFAULT 0,
	`servings` int DEFAULT 1,
	`difficulty` enum('easy','medium','hard') DEFAULT 'medium',
	`isPublic` boolean DEFAULT true,
	`active` boolean DEFAULT true,
	`caloriesPerServing` int,
	`proteinsPerServing` float,
	`carbsPerServing` float,
	`fatsPerServing` float,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopping_list_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shoppingListId` int NOT NULL,
	`ingredientId` int,
	`customName` varchar(256),
	`amount` float,
	`measureId` int,
	`category` varchar(128),
	`checked` boolean DEFAULT false,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopping_list_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`menuOrganizerId` int,
	`generatedByAI` boolean DEFAULT false,
	`completed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopping_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storage_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiParam` varchar(64) NOT NULL,
	`nameEs` varchar(64) NOT NULL,
	`nameEn` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storage_locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `storage_locations_apiParam_unique` UNIQUE(`apiParam`)
);
--> statement-breakpoint
CREATE TABLE `user_allergies` (
	`userId` int NOT NULL,
	`allergyId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_allergies_userId_allergyId_unique` UNIQUE(`userId`,`allergyId`)
);
--> statement-breakpoint
CREATE TABLE `user_banned_ingredients` (
	`userId` int NOT NULL,
	`ingredientId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_banned_ingredients_userId_ingredientId_unique` UNIQUE(`userId`,`ingredientId`)
);
--> statement-breakpoint
CREATE TABLE `user_diet_restrictions` (
	`userId` int NOT NULL,
	`dietRestrictionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_diet_restrictions_userId_dietRestrictionId_unique` UNIQUE(`userId`,`dietRestrictionId`)
);
--> statement-breakpoint
CREATE TABLE `user_favorite_recipes` (
	`userId` int NOT NULL,
	`recipeId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_favorite_recipes_userId_recipeId_unique` UNIQUE(`userId`,`recipeId`)
);
--> statement-breakpoint
CREATE TABLE `user_food_categories` (
	`userId` int NOT NULL,
	`foodCategoryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_food_categories_userId_foodCategoryId_unique` UNIQUE(`userId`,`foodCategoryId`)
);
--> statement-breakpoint
CREATE TABLE `user_health_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weight` float,
	`bodyFatPercentage` float,
	`muscleMass` float,
	`recordedAt` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_health_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_inventory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ingredientId` int,
	`customName` varchar(256),
	`amount` float NOT NULL,
	`measureId` int,
	`storageLocationId` int,
	`expirationDate` date,
	`purchaseDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_inventory_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_medical_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nutritionalSupplements` text,
	`useNutritionalSupplements` boolean DEFAULT false,
	`medicalDiet` text,
	`hasMedicalDiet` boolean DEFAULT false,
	`surgery` text,
	`hasSurgery` boolean DEFAULT false,
	`medicalFamilyBackground` text,
	`hasMedicalFamilyBackground` boolean DEFAULT false,
	`metabolismMedication` text,
	`useMetabolismMedication` boolean DEFAULT false,
	`medicalConditions` text,
	`hasMedicalConditions` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_medical_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_medical_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`purchaseFrequency` varchar(64),
	`purchaseLocation` varchar(128),
	`suggestHealthierProducts` boolean DEFAULT false,
	`suggestCheaperProducts` boolean DEFAULT false,
	`organicProducts` boolean,
	`interestedInNutritionalAdvices` boolean DEFAULT false,
	`notifications` boolean DEFAULT false,
	`newsletter` boolean DEFAULT false,
	`acceptTerms` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`age` int,
	`birthYear` int,
	`height` float,
	`weight` float,
	`targetWeight` float,
	`bodyFatPercentage` float,
	`muscleMass` float,
	`basalMetabolicRate` float,
	`dailyCalorieGoal` int,
	`dailyProteinGoal` float,
	`dailyCarbsGoal` float,
	`dailyFatGoal` float,
	`sleepHours` int,
	`dailyMeals` int,
	`gender` enum('male','female','other'),
	`cookingLevel` enum('beginner','intermediate','advanced'),
	`activityLevel` enum('sedentary','light','moderate','active','very_active'),
	`mainGoal` enum('lose_weight','gain_muscle','maintain','improve_health','eat_healthier'),
	`heightUnit` enum('cm','ft') DEFAULT 'cm',
	`weightUnit` enum('kg','lb') DEFAULT 'kg',
	`practicesSports` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeSubscriptionId` varchar(128),
	`stripeCustomerId` varchar(128),
	`stripePriceId` varchar(128),
	`status` enum('active','trial','cancelled','expired','past_due','pending') NOT NULL DEFAULT 'pending',
	`plan` enum('free','basic','premium','pro_max') NOT NULL DEFAULT 'free',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','buddyexpert') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `imageUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `description` text;--> statement-breakpoint
ALTER TABLE `users` ADD `locale` varchar(8) DEFAULT 'es' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `deletedAt` timestamp;--> statement-breakpoint
CREATE INDEX `meal_log_user_idx` ON `meal_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `meal_log_date_idx` ON `meal_logs` (`logDate`);--> statement-breakpoint
CREATE INDEX `menu_user_idx` ON `menu_organizers` (`userId`);--> statement-breakpoint
CREATE INDEX `recipe_user_idx` ON `recipes` (`userId`);--> statement-breakpoint
CREATE INDEX `shopping_user_idx` ON `shopping_lists` (`userId`);--> statement-breakpoint
CREATE INDEX `health_metrics_user_idx` ON `user_health_metrics` (`userId`);--> statement-breakpoint
CREATE INDEX `inventory_user_idx` ON `user_inventory_items` (`userId`);