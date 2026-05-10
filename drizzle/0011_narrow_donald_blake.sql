CREATE TABLE "feature_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"feature" varchar(64) NOT NULL,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "fe_feature_idx" ON "feature_events" USING btree ("feature");--> statement-breakpoint
CREATE INDEX "fe_user_idx" ON "feature_events" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "fe_created_idx" ON "feature_events" USING btree ("createdAt");