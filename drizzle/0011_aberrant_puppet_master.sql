CREATE TABLE `carrefour_products` (
	`id` varchar(128) NOT NULL,
	`name` varchar(512) NOT NULL,
	`brand` varchar(256),
	`price` float,
	`price_per_unit` varchar(64),
	`image` varchar(512),
	`category` varchar(256),
	`subcategory` varchar(256),
	`packaging` varchar(128),
	`product_url` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carrefour_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `carr_name_idx` ON `carrefour_products` (`name`);--> statement-breakpoint
CREATE INDEX `carr_category_idx` ON `carrefour_products` (`category`);