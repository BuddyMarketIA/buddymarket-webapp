import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

// Load .env manually
const envFile = readFileSync("/home/ubuntu/buddymarket-webapp/.env", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
}

const conn = await createConnection(env.DATABASE_URL);

const testTerms = ["pechuga de pollo", "ternera magra", "atún en lata", "arroz basmati", "avena en copos", "pasta integral", "mantequilla de cacahuete", "yogur griego"];

for (const term of testTerms) {
  const [rows] = await conn.execute(
    `SELECT name, category_name FROM mercadona_products WHERE name LIKE ? OR name LIKE ? LIMIT 5`,
    [`%${term}%`, `%${term.split(" ")[0]}%`]
  );
  console.log(`\n🔍 "${term}" → ${rows.length} resultados:`);
  rows.slice(0, 3).forEach(r => console.log(`  - ${r.name} (${r.category_name})`));
}

await conn.end();
