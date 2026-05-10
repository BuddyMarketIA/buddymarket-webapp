import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  try {
    const envFile = readFileSync(join(__dirname, "../.env"), "utf8");
    const match = envFile.match(/DATABASE_URL=(.+)/);
    if (match) DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, "");
  } catch (e) {}
}

const { Client } = pg;
const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

// Check menus
const { rows: menus } = await client.query(
  'SELECT "expertId", COUNT(*) as count FROM menus WHERE "expertId" IN (6,7,8) GROUP BY "expertId"'
);
console.log("Menus with deleted expertId:", menus.length ? menus : "None");

// Check blog posts
const { rows: blogs } = await client.query(
  'SELECT "expertId", COUNT(*) as count FROM blog_posts WHERE "expertId" IN (6,7,8) GROUP BY "expertId"'
);
console.log("Blog posts with deleted expertId:", blogs.length ? blogs : "None");

// Check expert_patient_assignments
try {
  const { rows: assignments } = await client.query(
    'SELECT "expertId", COUNT(*) as count FROM expert_patient_assignments WHERE "expertId" IN (6,7,8) GROUP BY "expertId"'
  );
  console.log("Expert patient assignments with deleted expertId:", assignments.length ? assignments : "None");
} catch (e) {
  console.log("expert_patient_assignments table not found");
}

// Check public menus
const { rows: publicMenus } = await client.query(
  'SELECT "expertId", COUNT(*) as count FROM menus WHERE "expertId" IN (6,7,8) AND "isPublic" = true GROUP BY "expertId"'
);
console.log("Public menus with deleted expertId:", publicMenus.length ? publicMenus : "None");

await client.end();
console.log("\nDone");
