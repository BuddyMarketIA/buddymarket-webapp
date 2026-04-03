CREATE TABLE `lidl_products` (
	`id` varchar(64) NOT NULL,
	`name` varchar(512) NOT NULL,
	`full_title` varchar(512),
	`brand` varchar(256),
	`image` varchar(512),
	`price` float,
	`packaging` varchar(128),
	`category` varchar(256),
	`canonical_path` varchar(512),
	`online_available` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lidl_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `lidl_name_idx` ON `lidl_products` (`name`);--> statement-breakpoint
CREATE INDEX `lidl_cat_idx` ON `lidl_products` (`category`);