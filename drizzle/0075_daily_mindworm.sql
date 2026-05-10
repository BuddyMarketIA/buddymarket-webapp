CREATE TABLE "ecosystem_access_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"appName" varchar(128) NOT NULL,
	"accessType" varchar(32) NOT NULL,
	"allowed" boolean NOT NULL,
	"denialReason" varchar(256),
	"ipAddress" varchar(45),
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecosystem_app_access_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"appName" varchar(128) NOT NULL,
	"appUrl" varchar(512) NOT NULL,
	"freeAccess" boolean DEFAULT false NOT NULL,
	"basicAccess" boolean DEFAULT false NOT NULL,
	"premiumAccess" boolean DEFAULT true NOT NULL,
	"proMaxAccess" boolean DEFAULT true NOT NULL,
	"syncEnabled" boolean DEFAULT true NOT NULL,
	"syncInterval" integer DEFAULT 3600 NOT NULL,
	"webhookUrl" varchar(512),
	"webhookSecret" varchar(256),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ecosystem_app_access_rules_appName_unique" UNIQUE("appName")
);
--> statement-breakpoint
CREATE TABLE "ecosystem_subscription_sync" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"sourceApp" varchar(128) NOT NULL,
	"sourceSubscriptionId" varchar(256) NOT NULL,
	"sourcePlan" "plan" NOT NULL,
	"syncedApps" text NOT NULL,
	"lastSyncedAt" timestamp,
	"nextSyncAt" timestamp,
	"syncStatus" varchar(32) DEFAULT 'pending' NOT NULL,
	"syncError" text,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecosystem_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"token" text NOT NULL,
	"appName" varchar(128) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"revokedAt" timestamp,
	"allowedApps" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ecosystem_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "ecosystem_access_log" ADD CONSTRAINT "ecosystem_access_log_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecosystem_subscription_sync" ADD CONSTRAINT "ecosystem_subscription_sync_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecosystem_tokens" ADD CONSTRAINT "ecosystem_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "eal_user_idx" ON "ecosystem_access_log" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "eal_app_idx" ON "ecosystem_access_log" USING btree ("appName");--> statement-breakpoint
CREATE INDEX "eal_access_type_idx" ON "ecosystem_access_log" USING btree ("accessType");--> statement-breakpoint
CREATE INDEX "eal_allowed_idx" ON "ecosystem_access_log" USING btree ("allowed");--> statement-breakpoint
CREATE INDEX "ess_user_idx" ON "ecosystem_subscription_sync" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ess_source_app_idx" ON "ecosystem_subscription_sync" USING btree ("sourceApp");--> statement-breakpoint
CREATE INDEX "ess_sync_status_idx" ON "ecosystem_subscription_sync" USING btree ("syncStatus");--> statement-breakpoint
CREATE INDEX "ess_next_sync_idx" ON "ecosystem_subscription_sync" USING btree ("nextSyncAt");--> statement-breakpoint
CREATE INDEX "et_user_idx" ON "ecosystem_tokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "et_app_idx" ON "ecosystem_tokens" USING btree ("appName");--> statement-breakpoint
CREATE INDEX "et_expires_idx" ON "ecosystem_tokens" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "et_token_idx" ON "ecosystem_tokens" USING btree ("token");