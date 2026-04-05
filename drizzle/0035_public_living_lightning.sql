CREATE INDEX `recipe_name_idx` ON `recipes` (`name`);--> statement-breakpoint
CREATE INDEX `recipe_cuisine_idx` ON `recipes` (`cuisineType`);--> statement-breakpoint
CREATE INDEX `recipe_cooking_method_idx` ON `recipes` (`cookingMethod`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_active_idx` ON `users` (`active`);