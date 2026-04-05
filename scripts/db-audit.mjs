/**
 * Database Query Audit Script
 * Runs EXPLAIN ANALYZE on the most critical queries to identify slow operations.
 *
 * Usage:
 *   node scripts/db-audit.mjs
 *
 * Output: Prints query plans and recommendations to stdout.
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const url = new URL(DB_URL);
const connection = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port || "4000"),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

console.log("✅ Connected to TiDB\n");

// ─── Queries to audit ─────────────────────────────────────────────────────────

const queries = [
  {
    name: "recipes — search by name (LIKE)",
    sql: "EXPLAIN ANALYZE SELECT id, name, imageUrl, preparationTime, caloriesPerServing FROM recipes WHERE name LIKE '%pollo%' LIMIT 20",
    recommendation: "CREATE INDEX idx_recipes_name ON recipes(name)",
  },
  {
    name: "recipes — filter by userId (my recipes)",
    sql: "EXPLAIN ANALYZE SELECT id, name, imageUrl FROM recipes WHERE userId = 1 ORDER BY createdAt DESC LIMIT 20",
    recommendation: "CREATE INDEX idx_recipes_userId_createdAt ON recipes(userId, createdAt DESC)",
  },
  {
    name: "recipes — filter by mealTime",
    sql: "EXPLAIN ANALYZE SELECT id, name, caloriesPerServing FROM recipes WHERE mealTime = 'comida' AND isSeeded = 1 LIMIT 20",
    recommendation: "CREATE INDEX idx_recipes_mealTime_isSeeded ON recipes(mealTime, isSeeded)",
  },
  {
    name: "menu_organizers — list by userId",
    sql: "EXPLAIN ANALYZE SELECT id, name, startDate, endDate, isActive FROM menu_organizers WHERE userId = 1 ORDER BY createdAt DESC LIMIT 20",
    recommendation: "CREATE INDEX idx_menus_userId_createdAt ON menu_organizers(userId, createdAt DESC)",
  },
  {
    name: "menu_organizers — get active menu for user",
    sql: "EXPLAIN ANALYZE SELECT id, name FROM menu_organizers WHERE userId = 1 AND isActive = 1 LIMIT 1",
    recommendation: "CREATE INDEX idx_menus_userId_isActive ON menu_organizers(userId, isActive)",
  },
  {
    name: "menu_organizer_day_parts — get days for a menu",
    sql: "EXPLAIN ANALYZE SELECT id, date, name FROM menu_organizer_day_parts WHERE menuOrganizerId = 1 ORDER BY date ASC",
    recommendation: "CREATE INDEX idx_menu_dp_menuId_date ON menu_organizer_day_parts(menuOrganizerId, date)",
  },
  {
    name: "shopping_lists — list by userId",
    sql: "EXPLAIN ANALYZE SELECT id, name, createdAt FROM shopping_lists WHERE userId = 1 ORDER BY createdAt DESC LIMIT 10",
    recommendation: "CREATE INDEX idx_shopping_lists_userId ON shopping_lists(userId, createdAt DESC)",
  },
  {
    name: "meal_logs — get logs for user by date range",
    sql: "EXPLAIN ANALYZE SELECT id, logDate, calories FROM meal_logs WHERE userId = 1 AND logDate >= '2026-01-01' ORDER BY logDate DESC LIMIT 50",
    recommendation: "CREATE INDEX idx_meal_logs_userId_logDate ON meal_logs(userId, logDate DESC)",
  },
  {
    name: "user_inventory_items — get items sorted by expiry",
    sql: "EXPLAIN ANALYZE SELECT id, customName, expirationDate, amount FROM user_inventory_items WHERE userId = 1 ORDER BY expirationDate ASC LIMIT 50",
    recommendation: "CREATE INDEX idx_inventory_userId_expiry ON user_inventory_items(userId, expirationDate)",
  },
  {
    name: "user_health_metrics — get latest metrics for user",
    sql: "EXPLAIN ANALYZE SELECT id, weight, recordedAt FROM user_health_metrics WHERE userId = 1 ORDER BY recordedAt DESC LIMIT 30",
    recommendation: "CREATE INDEX idx_health_metrics_userId_recordedAt ON user_health_metrics(userId, recordedAt DESC)",
  },
  {
    name: "users — lookup by email (auth flow)",
    sql: "EXPLAIN ANALYZE SELECT id, email, role FROM users WHERE email = 'test@example.com' LIMIT 1",
    recommendation: "Already indexed (unique constraint on email)",
  },
];

// ─── Run audits ───────────────────────────────────────────────────────────────

const results = [];

for (const q of queries) {
  try {
    const [rows] = await connection.execute(q.sql);
    const planStr = JSON.stringify(rows);

    // Detect full table scans in TiDB EXPLAIN output
    const hasFullScan = planStr.includes("TableFullScan") ||
      planStr.includes("table_full_scan") ||
      (planStr.includes("TableReader") && !planStr.includes("IndexRangeScan") && !planStr.includes("IndexLookUp"));
    const hasIndexScan = planStr.includes("IndexRangeScan") ||
      planStr.includes("IndexLookUp") ||
      planStr.includes("index_range_scan") ||
      planStr.includes("Point_Get");

    const status = hasFullScan ? "⚠️  FULL SCAN" : hasIndexScan ? "✅ INDEX SCAN" : "ℹ️  CHECK";

    // Extract execution time from plan
    const timeMatch = planStr.match(/time:([0-9.]+(?:ms|µs|s))/);
    const execTime = timeMatch ? timeMatch[1] : "unknown";

    results.push({ name: q.name, status, hasFullScan, execTime, recommendation: q.recommendation });
    console.log(`${status} — ${q.name} (${execTime})`);
    if (hasFullScan) {
      console.log(`  💡 Recommendation: ${q.recommendation}`);
    }
    console.log();
  } catch (err) {
    console.log(`❌ ERROR — ${q.name}: ${err.message}\n`);
    results.push({ name: q.name, status: "❌ ERROR", hasFullScan: false, execTime: "N/A", recommendation: q.recommendation });
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

const fullScans = results.filter(r => r.hasFullScan);
console.log("═══════════════════════════════════════════════════════════════");
console.log(`AUDIT SUMMARY: ${queries.length} queries analyzed`);
console.log(`  ✅ Using index: ${results.filter(r => r.status.includes("INDEX")).length}`);
console.log(`  ⚠️  Full scans: ${fullScans.length}`);
console.log(`  ❌ Errors: ${results.filter(r => r.status.includes("ERROR")).length}`);

if (fullScans.length > 0) {
  console.log("\n⚠️  Queries with full table scans — recommended indexes:");
  fullScans.forEach(r => {
    console.log(`  - ${r.name}`);
    console.log(`    SQL: ${r.recommendation}`);
  });
}
console.log("═══════════════════════════════════════════════════════════════\n");

await connection.end();
