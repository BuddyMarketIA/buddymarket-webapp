/**
 * Database Restore Script
 * Restores a database backup from a .sql.gz file.
 *
 * Usage:
 *   node scripts/db-restore.mjs <backup-file.sql.gz>
 *
 * ⚠️  WARNING: This will OVERWRITE the current database!
 * Only use in emergencies or when setting up a new environment.
 */

import "dotenv/config";
import { execSync } from "child_process";
import { createReadStream, existsSync } from "fs";
import { createGunzip } from "zlib";
import { pipeline } from "stream/promises";
import { createWriteStream } from "fs";
import { join } from "path";

const backupFile = process.argv[2];

if (!backupFile) {
  console.error("Usage: node scripts/db-restore.mjs <backup-file.sql.gz>");
  console.error("Example: node scripts/db-restore.mjs backup-daily-2026-04-05.sql.gz");
  process.exit(1);
}

if (!existsSync(backupFile)) {
  console.error(`❌ File not found: ${backupFile}`);
  process.exit(1);
}

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const dbUrl = new URL(DB_URL);
const host = dbUrl.hostname;
const port = dbUrl.port || "4000";
const user = dbUrl.username;
const password = dbUrl.password;
const database = dbUrl.pathname.slice(1);

console.log(`⚠️  WARNING: This will restore ${database} from ${backupFile}`);
console.log("⚠️  ALL CURRENT DATA WILL BE OVERWRITTEN!");
console.log("");
console.log("Press Ctrl+C to cancel, or wait 10 seconds to continue...");

await new Promise(res => setTimeout(res, 10000));

const sqlFile = backupFile.replace(".gz", "");

console.log("🗜️  Decompressing backup...");
await pipeline(
  createReadStream(backupFile),
  createGunzip(),
  createWriteStream(sqlFile)
);

console.log("🗄️  Restoring database...");
try {
  execSync(
    `mysql --host="${host}" --port="${port}" --user="${user}" --password="${password}" ` +
    `--ssl-mode=REQUIRED "${database}" < "${sqlFile}"`,
    { stdio: "inherit" }
  );
  console.log("✅ Database restored successfully!");
} catch (err) {
  console.error(`❌ Restore failed: ${err.message}`);
  process.exit(1);
} finally {
  // Clean up decompressed file
  import("fs").then(fs => {
    if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
  });
}
