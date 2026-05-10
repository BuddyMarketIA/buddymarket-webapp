CREATE TABLE "hiperdino_products" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(512) NOT NULL,
	"brand" varchar(256),
	"image" varchar(512),
	"price" real,
	"packaging" varchar(128),
	"category" varchar(256),
	"share_url" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hd_name_idx" ON "hiperdino_products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "hd_cat_idx" ON "hiperdino_products" USING btree ("category");