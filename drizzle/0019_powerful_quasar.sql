CREATE TABLE "phone_otp_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(32) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "phone_otp_phone_idx" ON "phone_otp_tokens" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "phone_otp_expires_idx" ON "phone_otp_tokens" USING btree ("expires_at");