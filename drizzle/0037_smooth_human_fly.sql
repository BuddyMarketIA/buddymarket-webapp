ALTER TABLE `user_profiles` ADD `menuDietType` varchar(32);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuAllergies` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuRestrictions` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuDislikedFoods` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuProteinSource` varchar(32);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuCookingTime` varchar(32);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuCookingSkill` varchar(32);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuKitchenEquipment` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuSupplements` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuSpecialNotes` text;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuPersons` int;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuMealsPerDay` int;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `menuPreferencesUpdatedAt` timestamp;