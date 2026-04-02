CREATE TABLE `mercadona_products` (
	`id` int NOT NULL,
	`slug` varchar(256) NOT NULL,
	`name` varchar(512) NOT NULL,
	`packaging` varchar(128),
	`thumbnail` varchar(512),
	`share_url` varchar(512),
	`category_id` int,
	`category_name` varchar(256),
	`subcategory_id` int,
	`subcategory_name` varchar(256),
	`bulk_price` varchar(32),
	`unit_price` varchar(32),
	`unit_size` float,
	`size_format` varchar(16),
	`reference_price` varchar(32),
	`reference_format` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mercadona_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `merc_slug_idx` ON `mercadona_products` (`slug`);--> statement-breakpoint
CREATE INDEX `merc_cat_idx` ON `mercadona_products` (`category_id`);--> statement-breakpoint
CREATE INDEX `merc_name_idx` ON `mercadona_products` (`name`);