CREATE INDEX `menu_dp_menu_idx` ON `menu_organizer_day_parts` (`menuOrganizerId`);--> statement-breakpoint
CREATE INDEX `menu_dp_menu_date_idx` ON `menu_organizer_day_parts` (`menuOrganizerId`,`date`);--> statement-breakpoint
CREATE INDEX `menu_user_created_idx` ON `menu_organizers` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `menu_user_active_idx` ON `menu_organizers` (`userId`,`isActive`);--> statement-breakpoint
CREATE INDEX `recipe_user_created_idx` ON `recipes` (`userId`,`createdAt`);