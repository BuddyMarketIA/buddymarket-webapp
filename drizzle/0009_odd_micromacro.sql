ALTER TABLE `user_preferences` ADD `preferredMealComplexity` enum('simple','moderate','complex');--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `portionSize` enum('small','medium','large');--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `preferSeasonalIngredients` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `preferLocalProducts` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `avoidProcessedFood` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `interestedInMealPrep` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `wantsShoppingListAutomation` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `wantsCalorieTracking` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `wantsMacroTracking` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `sportsFrequency` enum('never','1_2_week','3_4_week','5_plus_week','daily');--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `sportsTypes` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `workType` enum('sedentary_desk','light_standing','moderate_physical','heavy_physical');--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `stressLevel` enum('low','moderate','high','very_high');--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `waterIntake` float;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `alcoholConsumption` enum('none','occasional','moderate','frequent');--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `smokingStatus` enum('non_smoker','ex_smoker','smoker');--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `weightChangeRate` float;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `mealPrepTime` enum('under_15','15_30','30_60','over_60');--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `budgetPerWeek` float;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `favoriteCuisines` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `dislikedIngredients` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `cookingEquipment` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `mealsPerDayDetail` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `snackingHabits` enum('never','rarely','sometimes','often');--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `eatOutFrequency` enum('never','1_2_month','1_2_week','3_plus_week');--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `fitnessGoalDetail` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `motivationLevel` enum('low','medium','high','very_high');--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `previousDietExperience` text;