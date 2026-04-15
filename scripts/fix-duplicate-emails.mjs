import pg from "/home/ubuntu/buddymarket-webapp/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// 1. Find all duplicate emails
const dupes = await client.query(`
  SELECT email, COUNT(*) as cnt, STRING_AGG(id::text, ',' ORDER BY "createdAt" ASC) as ids
  FROM users
  WHERE email IS NOT NULL AND email != ''
  GROUP BY email
  HAVING COUNT(*) > 1
`);

console.log("=== Duplicate emails found ===");
console.log(JSON.stringify(dupes.rows, null, 2));

// 2. Show details for luismariaccc@gmail.com specifically
const luisRows = await client.query(
  `SELECT id, "openId", email, "loginMethod", role, "onboardingCompleted", "createdAt", "lastSignedIn" 
   FROM users WHERE email = $1 ORDER BY "createdAt" ASC`,
  ["luismariaccc@gmail.com"]
);
console.log("\n=== luismariaccc@gmail.com accounts ===");
console.log(JSON.stringify(luisRows.rows, null, 2));

await client.end();
