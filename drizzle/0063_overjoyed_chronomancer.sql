CREATE TYPE "public"."eventType" AS ENUM('page_view', 'button_click', 'form_submit', 'feature_use', 'purchase', 'subscription', 'share', 'download', 'error', 'custom');--> statement-breakpoint
CREATE TYPE "public"."module" AS ENUM('buddycare', 'buddycoach', 'buddymarket', 'buddypets', 'buddykids', 'dashboard', 'profile', 'auth', 'other');--> statement-breakpoint
CREATE TABLE "conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"sourceModule" "module" NOT NULL,
	"targetModule" "module" NOT NULL,
	"conversionType" varchar(128) NOT NULL,
	"conversionValue" numeric(10, 2),
	"commission" numeric(10, 2),
	"sourceEventId" integer,
	"targetEventId" integer,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dailyAnalytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"module" "module" NOT NULL,
	"totalUsers" integer DEFAULT 0,
	"totalEvents" integer DEFAULT 0,
	"totalSessions" integer DEFAULT 0,
	"totalConversions" integer DEFAULT 0,
	"totalValue" numeric(12, 2) DEFAULT '0',
	"averageSessionDuration" numeric(8, 2) DEFAULT '0',
	"conversionRate" numeric(5, 4) DEFAULT '0',
	"topActions" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funnelAnalytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"funnelName" varchar(128) NOT NULL,
	"step" integer NOT NULL,
	"stepName" varchar(128) NOT NULL,
	"completed" boolean DEFAULT false,
	"abandonedAt" timestamp,
	"completedAt" timestamp,
	"duration" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moduleMetrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"module" "module" NOT NULL,
	"totalViews" integer DEFAULT 0,
	"totalInteractions" integer DEFAULT 0,
	"totalTime" integer DEFAULT 0,
	"totalValue" numeric(12, 2) DEFAULT '0',
	"lastAccessedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"eventType" "eventType" NOT NULL,
	"module" "module" NOT NULL,
	"action" varchar(128) NOT NULL,
	"itemId" varchar(256),
	"itemType" varchar(64),
	"value" numeric(10, 2),
	"duration" integer,
	"metadata" text,
	"userAgent" text,
	"ipAddress" varchar(45),
	"sessionId" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userSessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"sessionId" varchar(128) NOT NULL,
	"userAgent" text,
	"ipAddress" varchar(45),
	"deviceType" varchar(32),
	"browser" varchar(64),
	"os" varchar(64),
	"country" varchar(2),
	"city" varchar(128),
	"eventCount" integer DEFAULT 0,
	"totalDuration" integer DEFAULT 0,
	"totalValue" numeric(12, 2) DEFAULT '0',
	"conversionsCount" integer DEFAULT 0,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"endedAt" timestamp,
	CONSTRAINT "userSessions_sessionId_unique" UNIQUE("sessionId")
);
--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_sourceEventId_userEvents_id_fk" FOREIGN KEY ("sourceEventId") REFERENCES "public"."userEvents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_targetEventId_userEvents_id_fk" FOREIGN KEY ("targetEventId") REFERENCES "public"."userEvents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funnelAnalytics" ADD CONSTRAINT "funnelAnalytics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moduleMetrics" ADD CONSTRAINT "moduleMetrics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userEvents" ADD CONSTRAINT "userEvents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userSessions" ADD CONSTRAINT "userSessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversions_user_module_idx" ON "conversions" USING btree ("userId","sourceModule","targetModule");--> statement-breakpoint
CREATE INDEX "conversions_user_created_idx" ON "conversions" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "conversions_type_idx" ON "conversions" USING btree ("conversionType");--> statement-breakpoint
CREATE INDEX "daily_analytics_date_module_idx" ON "dailyAnalytics" USING btree ("date","module");--> statement-breakpoint
CREATE INDEX "daily_analytics_date_idx" ON "dailyAnalytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "funnel_user_funnel_idx" ON "funnelAnalytics" USING btree ("userId","funnelName");--> statement-breakpoint
CREATE INDEX "funnel_funnel_idx" ON "funnelAnalytics" USING btree ("funnelName");--> statement-breakpoint
CREATE INDEX "module_metrics_user_module_idx" ON "moduleMetrics" USING btree ("userId","module");--> statement-breakpoint
CREATE INDEX "module_metrics_user_idx" ON "moduleMetrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_events_user_module_idx" ON "userEvents" USING btree ("userId","module");--> statement-breakpoint
CREATE INDEX "user_events_user_created_idx" ON "userEvents" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "user_events_type_idx" ON "userEvents" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "user_events_module_idx" ON "userEvents" USING btree ("module");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "userSessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "sessions_session_idx" ON "userSessions" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "sessions_created_idx" ON "userSessions" USING btree ("startedAt");