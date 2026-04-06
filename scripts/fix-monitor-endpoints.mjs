/**
 * Fix incorrect monitor endpoints in api_monitors table.
 * Uses pg (node-postgres) which is the driver used by this project.
 */
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
const { config } = await import("dotenv");
config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const { default: pg } = await import("pg");
const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Correct endpoint mappings: wrong → correct
const fixes = [
  {
    wrongEndpoint: "/api/trpc/catalogs.getAllergies",
    correctEndpoint: "/api/trpc/catalogs.allergies",
    name: "Catálogos - Alergias",
  },
  {
    wrongEndpoint: "/api/trpc/recipes.getRecipes",
    correctEndpoint: "/api/trpc/recipes.list",
    name: "Recetas - Listado",
  },
  {
    wrongEndpoint: "/api/trpc/menus.getLibraryMenus",
    correctEndpoint: "/api/trpc/menus.list",
    name: "Menús - Biblioteca",
  },
];

console.log("Fixing incorrect monitor endpoints...\n");

const client = await pool.connect();
try {
  for (const fix of fixes) {
    // Try by wrong endpoint first
    let result = await client.query(
      `UPDATE api_monitors 
       SET endpoint = $1, last_status = 'unknown', fail_count = 0, last_error = null, updated_at = NOW()
       WHERE endpoint = $2
       RETURNING id, name, endpoint`,
      [fix.correctEndpoint, fix.wrongEndpoint]
    );
    
    if (result.rowCount > 0) {
      console.log(`✓ Fixed: ${fix.name}`);
      console.log(`  ${fix.wrongEndpoint} → ${fix.correctEndpoint}`);
    } else {
      // Try by name
      const byName = await client.query(
        `SELECT id, name, endpoint FROM api_monitors WHERE name = $1`,
        [fix.name]
      );
      if (byName.rows.length > 0) {
        const currentEndpoint = byName.rows[0].endpoint;
        if (currentEndpoint !== fix.correctEndpoint) {
          await client.query(
            `UPDATE api_monitors 
             SET endpoint = $1, last_status = 'unknown', fail_count = 0, last_error = null, updated_at = NOW()
             WHERE name = $2`,
            [fix.correctEndpoint, fix.name]
          );
          console.log(`✓ Fixed by name: ${fix.name}`);
          console.log(`  ${currentEndpoint} → ${fix.correctEndpoint}`);
        } else {
          console.log(`✓ Already correct: ${fix.name} (${fix.correctEndpoint})`);
          // Reset status to unknown so it gets rechecked
          await client.query(
            `UPDATE api_monitors SET last_status = 'unknown', fail_count = 0, last_error = null WHERE name = $1`,
            [fix.name]
          );
        }
      } else {
        console.log(`⚠ Not found: ${fix.name}`);
      }
    }
  }

  // Show all monitors
  console.log("\n--- All monitors after fix ---");
  const allMonitors = await client.query(
    `SELECT name, endpoint, last_status, is_active FROM api_monitors ORDER BY name`
  );
  for (const m of allMonitors.rows) {
    const active = m.is_active ? "✓" : "○";
    console.log(`${active} [${(m.last_status || "unknown").toUpperCase().padEnd(8)}] ${m.name}`);
    console.log(`   ${m.endpoint}`);
  }

  // Test the corrected endpoints
  console.log("\n--- Testing corrected endpoints ---");
  const allFixed = [
    { name: "Catálogos - Alergias", endpoint: "/api/trpc/catalogs.allergies" },
    { name: "Recetas - Listado", endpoint: "/api/trpc/recipes.list" },
    { name: "Menús - Biblioteca", endpoint: "/api/trpc/menus.list" },
  ];
  
  for (const fix of allFixed) {
    try {
      const url = `http://localhost:3000${fix.endpoint}?input=%7B%7D`;
      const res = await fetch(url);
      const status = res.status;
      const ok = status < 400 ? "✓ OK" : `✗ HTTP ${status}`;
      console.log(`${ok}: ${fix.name} → HTTP ${status}`);
    } catch (err) {
      console.log(`✗ Error: ${fix.name} - ${err.message}`);
    }
  }

} finally {
  client.release();
  await pool.end();
}

console.log("\nDone!");
