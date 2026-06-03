CREATE TABLE "care_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" real,
	"imageUrl" text,
	"affiliateUrl" text,
	"category" varchar(64),
	"tags" text,
	"healthBenefits" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" real,
	"imageUrl" text,
	"affiliateUrl" text,
	"category" varchar(64),
	"tags" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
