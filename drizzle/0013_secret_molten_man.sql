CREATE TABLE "consum_cart_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"productId" varchar(128) NOT NULL,
	"productName" varchar(512) NOT NULL,
	"productBrand" varchar(256),
	"productImage" varchar(512),
	"productPrice" real,
	"productCategory" varchar(256),
	"productPackaging" varchar(128),
	"addCount" integer DEFAULT 1 NOT NULL,
	"lastAddedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cch_user_idx" ON "consum_cart_history" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "cch_product_idx" ON "consum_cart_history" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "cch_user_product_idx" ON "consum_cart_history" USING btree ("userId","productId");--> statement-breakpoint
CREATE INDEX "cch_last_added_idx" ON "consum_cart_history" USING btree ("lastAddedAt");