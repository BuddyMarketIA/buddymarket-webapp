import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = `
-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE "public"."healthDataSource" AS ENUM('apple_health', 'google_health_connect', 'manual', 'garmin', 'fitbit', 'samsung_health', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."healthMetricType" AS ENUM('steps', 'calories_burned', 'calories_consumed', 'weight', 'heart_rate', 'heart_rate_resting', 'sleep_duration', 'sleep_deep', 'sleep_rem', 'sleep_light', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'blood_glucose', 'oxygen_saturation', 'body_temperature', 'respiratory_rate', 'active_minutes', 'distance_km', 'floors_climbed', 'water_ml', 'stress_level', 'vo2_max', 'hrv');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create health_daily_data table
CREATE TABLE IF NOT EXISTS "health_daily_data" (
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

-- Create health_integrations table
CREATE TABLE IF NOT EXISTS "health_integrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL UNIQUE,
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
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Create health_metric_readings table
CREATE TABLE IF NOT EXISTS "health_metric_readings" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "metricType" "healthMetricType" NOT NULL,
  "value" real NOT NULL,
  "unit" varchar(32) NOT NULL,
  "source" "healthDataSource" DEFAULT 'manual' NOT NULL,
  "recordedAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "hdd_user_idx" ON "health_daily_data" ("userId");
CREATE INDEX IF NOT EXISTS "hdd_date_idx" ON "health_daily_data" ("date");
CREATE INDEX IF NOT EXISTS "hdd_user_date_idx" ON "health_daily_data" ("userId","date");
CREATE INDEX IF NOT EXISTS "hdd_source_idx" ON "health_daily_data" ("source");
CREATE INDEX IF NOT EXISTS "hi_user_idx" ON "health_integrations" ("userId");
CREATE INDEX IF NOT EXISTS "hmr_user_idx" ON "health_metric_readings" ("userId");
CREATE INDEX IF NOT EXISTS "hmr_type_idx" ON "health_metric_readings" ("metricType");
CREATE INDEX IF NOT EXISTS "hmr_recorded_idx" ON "health_metric_readings" ("recordedAt");
CREATE INDEX IF NOT EXISTS "hmr_user_type_idx" ON "health_metric_readings" ("userId","metricType");

-- Register migration in drizzle migrations table
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '0010_lyrical_switch', EXTRACT(EPOCH FROM NOW()) * 1000
WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '0010_lyrical_switch');
`;

try {
  await pool.query(sql);
  console.log("✅ Health tables migration applied successfully!");
  
  // Verify tables were created
  const result = await pool.query(`
    SELECT tablename FROM pg_tables 
    WHERE tablename IN ('health_daily_data', 'health_integrations', 'health_metric_readings')
    ORDER BY tablename
  `);
  console.log("Tables created:", result.rows.map(r => r.tablename).join(", "));
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
