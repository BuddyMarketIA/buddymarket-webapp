import pg from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  console.log("Connected to DB");

  // Create enum if not exists
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE "apiHealthStatus" AS ENUM ('ok', 'degraded', 'down', 'unknown');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  console.log("Enum apiHealthStatus ready");

  // Create api_monitors table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "api_monitors" (
      "id" serial PRIMARY KEY,
      "name" varchar(128) NOT NULL,
      "endpoint" varchar(512) NOT NULL,
      "method" varchar(8) NOT NULL DEFAULT 'GET',
      "expectedStatus" integer NOT NULL DEFAULT 200,
      "isActive" boolean NOT NULL DEFAULT true,
      "lastStatus" "apiHealthStatus" NOT NULL DEFAULT 'unknown',
      "lastLatencyMs" integer,
      "lastCheckedAt" timestamp,
      "lastErrorMessage" text,
      "failCount" integer NOT NULL DEFAULT 0,
      "notifiedAt" timestamp,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );
  `);
  console.log("Table api_monitors created");

  // Create api_health_logs table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "api_health_logs" (
      "id" serial PRIMARY KEY,
      "monitorId" integer NOT NULL,
      "status" "apiHealthStatus" NOT NULL,
      "latencyMs" integer,
      "httpStatus" integer,
      "errorMessage" text,
      "checkedAt" timestamp NOT NULL DEFAULT now()
    );
  `);
  console.log("Table api_health_logs created");

  // Create indexes
  await client.query(`CREATE INDEX IF NOT EXISTS "am_name_idx" ON "api_monitors" ("name");`);
  await client.query(`CREATE INDEX IF NOT EXISTS "am_status_idx" ON "api_monitors" ("lastStatus");`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ahl_monitor_idx" ON "api_health_logs" ("monitorId");`);
  await client.query(`CREATE INDEX IF NOT EXISTS "ahl_checked_idx" ON "api_health_logs" ("checkedAt");`);
  console.log("Indexes created");

  // Seed default monitors for BuddyMarket critical APIs
  const monitors = [
    { name: "Auth - Me", endpoint: "/api/trpc/auth.me", method: "GET", expectedStatus: 200 },
    { name: "Catálogos - Alergias", endpoint: "/api/trpc/catalogs.getAllergies", method: "GET", expectedStatus: 200 },
    { name: "Recetas - Listado", endpoint: "/api/trpc/recipes.getRecipes", method: "GET", expectedStatus: 200 },
    { name: "Mercadona - Categorías", endpoint: "/api/trpc/mercadona.categories", method: "GET", expectedStatus: 200 },
    { name: "Carrefour - Categorías", endpoint: "/api/trpc/carrefour.categories", method: "GET", expectedStatus: 200 },
    { name: "Alcampo - Categorías", endpoint: "/api/trpc/alcampo.categories", method: "GET", expectedStatus: 200 },
    { name: "Lidl - Categorías", endpoint: "/api/trpc/lidl.categories", method: "GET", expectedStatus: 200 },
    { name: "BuddyExperts - Listado", endpoint: "/api/trpc/buddyExperts.list", method: "GET", expectedStatus: 200 },
    { name: "BuddyMakers - Listado", endpoint: "/api/trpc/buddyMakers.list", method: "GET", expectedStatus: 200 },
    { name: "Menús - Biblioteca", endpoint: "/api/trpc/menus.getLibraryMenus", method: "GET", expectedStatus: 200 },
    { name: "Stripe - Webhook", endpoint: "/api/stripe/webhook", method: "POST", expectedStatus: 400 },
    { name: "Health Check General", endpoint: "/api/health", method: "GET", expectedStatus: 200 },
  ];

  for (const m of monitors) {
    await client.query(
      `INSERT INTO "api_monitors" ("name", "endpoint", "method", "expectedStatus")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [m.name, m.endpoint, m.method, m.expectedStatus]
    );
  }
  console.log(`Seeded ${monitors.length} monitors`);

  await client.end();
  console.log("Done!");
}

main().catch((e) => { console.error(e); process.exit(1); });
