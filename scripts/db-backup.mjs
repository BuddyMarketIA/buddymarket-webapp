/**
 * Database Backup Script
 * Creates a compressed SQL dump of the TiDB database and uploads it to S3.
 *
 * Usage:
 *   node scripts/db-backup.mjs
 *
 * Environment variables required:
 *   DATABASE_URL — MySQL connection string
 *   BUILT_IN_FORGE_API_KEY — Manus S3 API key (for upload)
 *   BUILT_IN_FORGE_API_URL — Manus S3 API URL
 *   SLACK_WEBHOOK_URL — (optional) Slack webhook for notifications
 *
 * Backup strategy:
 *   - Daily backups retained for 7 days
 *   - Weekly backups (Sunday) retained for 4 weeks
 *   - Monthly backups (1st of month) retained for 12 months
 */

import "dotenv/config";
import { execSync, spawnSync } from "child_process";
import { createWriteStream, unlinkSync, existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { createGzip } from "zlib";
import { pipeline } from "stream/promises";
import { createReadStream } from "fs";

const DB_URL = process.env.DATABASE_URL;
const SLACK_URL = process.env.SLACK_WEBHOOK_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;

if (!DB_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

// ─── Parse connection info ────────────────────────────────────────────────────

const dbUrl = new URL(DB_URL);
const host = dbUrl.hostname;
const port = dbUrl.port || "4000";
const user = dbUrl.username;
const password = dbUrl.password;
const database = dbUrl.pathname.slice(1);

// ─── Determine backup type ────────────────────────────────────────────────────

const now = new Date();
const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
const dayOfWeek = now.getDay(); // 0 = Sunday
const dayOfMonth = now.getDate();

let backupType = "daily";
if (dayOfMonth === 1) backupType = "monthly";
else if (dayOfWeek === 0) backupType = "weekly";

const backupDir = "/tmp/buddymarket-backups";
if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });

const dumpFile = join(backupDir, `backup-${backupType}-${dateStr}.sql`);
const gzipFile = `${dumpFile}.gz`;

console.log(`🗄️  Starting ${backupType} backup for ${database} (${dateStr})...`);

// ─── Create mysqldump ─────────────────────────────────────────────────────────

const startTime = Date.now();

try {
  // Check if mysqldump is available
  const hasMysqldump = spawnSync("which", ["mysqldump"]).status === 0;

  if (hasMysqldump) {
    console.log("📦 Running mysqldump (TiDB compatible)...");
    // TiDB doesn't support --single-transaction with savepoints or --set-gtid-purged
    const result = spawnSync("mysqldump", [
      `--host=${host}`, `--port=${port}`, `--user=${user}`, `--password=${password}`,
      `--ssl-mode=REQUIRED`, `--no-tablespaces`,
      `--skip-lock-tables`, database
    ], { encoding: "utf8", maxBuffer: 500 * 1024 * 1024 });

    if (result.status !== 0) {
      // TiDB savepoint error — fall back to Node.js exporter
      console.log("⚠️  mysqldump failed with TiDB, using Node.js exporter...");
      await nodeExport(dumpFile, { host, port, user, password, database });
    } else {
      writeFileSync(dumpFile, result.stdout);
    }
  } else {
    // Fallback: use Node.js mysql2 to export schema + data
    console.log("📦 mysqldump not available, using Node.js export...");
    await nodeExport(dumpFile, { host, port, user, password, database });
  }

  // Compress the dump
  console.log("🗜️  Compressing backup...");
  await pipeline(
    createReadStream(dumpFile),
    createGzip({ level: 9 }),
    createWriteStream(gzipFile)
  );

  // Clean up uncompressed file
  unlinkSync(dumpFile);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const sizeKb = Math.round(statSync(gzipFile).size / 1024);

  console.log(`✅ Backup created: ${gzipFile} (${sizeKb} KB, ${duration}s)`);

  // ─── Upload to S3 ───────────────────────────────────────────────────────────

  let uploadUrl = null;

  if (FORGE_API_KEY && FORGE_API_URL) {
    console.log("☁️  Uploading to S3...");
    try {
      const fileBuffer = readFileSync(gzipFile);
      const s3Key = `backups/${backupType}/backup-${dateStr}.sql.gz`;

      const response = await fetch(`${FORGE_API_URL}/storage/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FORGE_API_KEY}`,
          "Content-Type": "application/gzip",
          "X-File-Key": s3Key,
        },
        body: fileBuffer,
      });

      if (response.ok) {
        const data = await response.json();
        uploadUrl = data.url || s3Key;
        console.log(`✅ Uploaded to S3: ${s3Key}`);
      } else {
        console.warn(`⚠️  S3 upload failed: ${response.status} ${response.statusText}`);
      }
    } catch (uploadErr) {
      console.warn(`⚠️  S3 upload error: ${uploadErr.message}`);
    }
  } else {
    console.log("ℹ️  S3 upload skipped (FORGE_API_KEY not set) — backup saved locally");
  }

  // Clean up local gzip after upload
  if (uploadUrl) {
    unlinkSync(gzipFile);
  }

  // ─── Slack notification ─────────────────────────────────────────────────────

  if (SLACK_URL) {
    const message = {
      text: `:floppy_disk: *BuddyMarket DB Backup* — ${backupType.toUpperCase()} — ${dateStr}`,
      attachments: [{
        color: "#36a64f",
        fields: [
          { title: "Type", value: backupType, short: true },
          { title: "Size", value: `${sizeKb} KB`, short: true },
          { title: "Duration", value: `${duration}s`, short: true },
          { title: "Storage", value: uploadUrl ? "S3 ✅" : "Local only", short: true },
          { title: "Database", value: database, short: true },
          { title: "Date", value: dateStr, short: true },
        ],
        footer: "BuddyMarket Backup System",
      }],
    };

    await fetch(SLACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    console.log("📣 Slack notification sent");
  }

  console.log(`\n✅ Backup completed successfully (${backupType}, ${sizeKb} KB, ${duration}s)\n`);

} catch (err) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.error(`❌ Backup FAILED after ${duration}s: ${err.message}`);

  // Send failure alert to Slack
  if (SLACK_URL) {
    await fetch(SLACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `:x: *BuddyMarket DB Backup FAILED* — ${dateStr}`,
        attachments: [{
          color: "#ff0000",
          fields: [
            { title: "Error", value: err.message, short: false },
            { title: "Duration", value: `${duration}s`, short: true },
          ],
        }],
      }),
    }).catch(() => {});
  }

  process.exit(1);
}

// ─── Node.js fallback export ──────────────────────────────────────────────────

async function nodeExport(outputFile, { host, port, user, password, database }) {
  const mysql = await import("mysql2/promise");
  const fs = await import("fs");

  const conn = await mysql.default.createConnection({
    host, port: parseInt(port), user, password, database,
    ssl: { rejectUnauthorized: false },
  });

  const stream = fs.createWriteStream(outputFile);
  const write = (s) => new Promise((res, rej) => stream.write(s, err => err ? rej(err) : res()));

  await write(`-- BuddyMarket Database Backup\n-- Date: ${new Date().toISOString()}\n-- Database: ${database}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`);

  // Get all tables
  const [tables] = await conn.execute("SHOW TABLES");
  const tableNames = tables.map(r => Object.values(r)[0]);

  for (const table of tableNames) {
    // Get CREATE TABLE statement
    const [[createRow]] = await conn.execute(`SHOW CREATE TABLE \`${table}\``);
    const createSql = Object.values(createRow)[1];
    await write(`-- Table: ${table}\nDROP TABLE IF EXISTS \`${table}\`;\n${createSql};\n\n`);

    // Export data in batches of 500
    let offset = 0;
    const batchSize = 500;
    while (true) {
      const [rows] = await conn.execute(`SELECT * FROM \`${table}\` LIMIT ${batchSize} OFFSET ${offset}`);
      if (rows.length === 0) break;

      const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(", ");
      const values = rows.map(row =>
        "(" + Object.values(row).map(v =>
          v === null ? "NULL" :
          typeof v === "string" ? `'${v.replace(/'/g, "\\'")}'` :
          v instanceof Date ? `'${v.toISOString().slice(0, 19).replace("T", " ")}'` :
          String(v)
        ).join(", ") + ")"
      ).join(",\n");

      await write(`INSERT INTO \`${table}\` (${cols}) VALUES\n${values};\n\n`);
      offset += batchSize;
      if (rows.length < batchSize) break;
    }
  }

  await write("SET FOREIGN_KEY_CHECKS=1;\n");
  await new Promise(res => stream.end(res));
  await conn.end();
}
