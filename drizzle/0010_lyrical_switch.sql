CREATE TYPE "public"."healthDataSource" AS ENUM('apple_health', 'google_health_connect', 'manual', 'garmin', 'fitbit', 'samsung_health', 'other');--> statement-breakpoint
CREATE TYPE "public"."healthMetricType" AS ENUM('steps', 'calories_burned', 'calories_consumed', 'weight', 'heart_rate', 'heart_rate_resting', 'sleep_duration', 'sleep_deep', 'sleep_rem', 'sleep_light', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'blood_glucose', 'oxygen_saturation', 'body_temperature', 'respiratory_rate', 'active_minutes', 'distance_km', 'floors_climbed', 'water_ml', 'stress_level', 'vo2_max', 'hrv');--> statement-breakpoint
CREATE TABLE "health_daily_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" date NOT NULL,
	"source" "healthDataSource" DEFAULT 'manual' NOT NULL,
	"steps" integer,
	"caloriesBurned" integer,
	"activeMinutes" integer,
	"distanceKm" real,
	"floorsClimbed" integer,
	"weightKg" real,
	"heartRateAvg" integer,
	"heartRateResting" integer,
	"heartRateMax" integer,
	"heartRateMin" integer,
	"hrv" real,
	"sleepDurationMin" integer,
	"sleepDeepMin" integer,
	"sleepRemMin" integer,
	"sleepLightMin" integer,
	"sleepScore" integer,
	"caloriesConsumed" integer,
	"waterMl" integer,
	"bloodGlucose" real,
	"oxygenSaturation" real,
	"stressLevel" integer,
	"vo2Max" real,
	"syncedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"appleHealthEnabled" boolean DEFAULT false NOT NULL,
	"googleHealthConnectEnabled" boolean DEFAULT false NOT NULL,
	"garminEnabled" boolean DEFAULT false NOT NULL,
	"fitbitEnabled" boolean DEFAULT false NOT NULL,
	"samsungHealthEnabled" boolean DEFAULT false NOT NULL,
	"syncSteps" boolean DEFAULT true NOT NULL,
	"syncCalories" boolean DEFAULT true NOT NULL,
	"syncWeight" boolean DEFAULT true NOT NULL,
	"syncHeartRate" boolean DEFAULT true NOT NULL,
	"syncSleep" boolean DEFAULT true NOT NULL,
	"syncBloodGlucose" boolean DEFAULT false NOT NULL,
	"syncOxygen" boolean DEFAULT false NOT NULL,
	"lastSyncAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "health_integrations_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "health_metric_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"metricType" "healthMetricType" NOT NULL,
	"value" real NOT NULL,
	"unit" varchar(32) NOT NULL,
	"source" "healthDataSource" DEFAULT 'manual' NOT NULL,
	"recordedAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hdd_user_idx" ON "health_daily_data" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "hdd_date_idx" ON "health_daily_data" USING btree ("date");--> statement-breakpoint
CREATE INDEX "hdd_user_date_idx" ON "health_daily_data" USING btree ("userId","date");--> statement-breakpoint
CREATE INDEX "hdd_source_idx" ON "health_daily_data" USING btree ("source");--> statement-breakpoint
CREATE INDEX "hi_user_idx" ON "health_integrations" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "hmr_user_idx" ON "health_metric_readings" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "hmr_type_idx" ON "health_metric_readings" USING btree ("metricType");--> statement-breakpoint
CREATE INDEX "hmr_recorded_idx" ON "health_metric_readings" USING btree ("recordedAt");--> statement-breakpoint
CREATE INDEX "hmr_user_type_idx" ON "health_metric_readings" USING btree ("userId","metricType");