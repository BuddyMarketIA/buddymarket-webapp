CREATE TABLE "consum_products" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(512) NOT NULL,
	"brand" varchar(256),
	"price" real,
	"price_per_unit" varchar(64),
	"image" varchar(512),
	"category" varchar(256),
	"subcategory" varchar(256),
	"packaging" varchar(128),
	"product_url" varchar(512),
	"ean" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "consum_name_idx" ON "consum_products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "consum_category_idx" ON "consum_products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "consum_ean_idx" ON "consum_products" USING btree ("ean");