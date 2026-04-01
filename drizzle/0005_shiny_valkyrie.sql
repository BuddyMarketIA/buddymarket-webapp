ALTER TABLE `menu_organizers` ADD `goal` enum('perdida_peso','ganancia_muscular','tonificacion','perdida_grasa','mantenimiento','bienestar','vegano');--> statement-breakpoint
ALTER TABLE `menu_organizers` ADD `dailyCalories` int;--> statement-breakpoint
ALTER TABLE `menu_organizers` ADD `persons` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `menu_organizers` ADD `difficulty` enum('facil','medio','dificil') DEFAULT 'facil';--> statement-breakpoint
ALTER TABLE `menu_organizers` ADD `isSeeded` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `shopping_lists` ADD `supermarket` enum('general','mercadona','lidl','carrefour','alcampo','dia','el_corte_ingles') DEFAULT 'general';--> statement-breakpoint
ALTER TABLE `shopping_lists` ADD `persons` int DEFAULT 1;