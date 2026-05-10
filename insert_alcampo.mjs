import { readFileSync } from 'fs';
import { createPool } from 'mysql2/promise';

// Read the generated products
const raw = readFileSync('/home/ubuntu/generate_alcampo_products.json', 'utf8');
const data = JSON.parse(raw);

// Parse the DATABASE_URL carefully - strip query params for connection
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error('No DATABASE_URL'); process.exit(1); }

// Strip query params from the URL before parsing
const cleanUrl = dbUrl.split('?')[0];
const m = cleanUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!m) { console.error('Invalid DATABASE_URL:', cleanUrl); process.exit(1); }

console.log(`Connecting to ${m[3]}:${m[4]}/${m[5]}...`);

const pool = createPool({
  host: m[3],
  port: parseInt(m[4]),
  user: m[1],
  password: m[2],
  database: m[5],
  ssl: { rejectUnauthorized: false },
  connectionLimit: 5
});

let totalInserted = 0;
let totalErrors = 0;

for (const result of data.results) {
  if (!result.output?.products_json) continue;
  
  let products;
  try {
    let jsonStr = result.output.products_json.trim();
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    products = JSON.parse(jsonStr);
  } catch (e) {
    console.error(`Failed to parse products for ${result.output.category}:`, e.message);
    totalErrors++;
    continue;
  }
  
  if (!Array.isArray(products)) {
    console.error(`Not an array for ${result.output.category}`);
    continue;
  }
  
  let batchInserted = 0;
  for (const p of products) {
    if (!p.id || !p.name) continue;
    try {
      await pool.execute(
        `INSERT IGNORE INTO alcampo_products (id, name, brand, price, price_per_unit, image, category, subcategory, packaging, product_url, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          String(p.id).substring(0, 128),
          String(p.name).substring(0, 512),
          p.brand ? String(p.brand).substring(0, 256) : null,
          p.price ? parseFloat(p.price) : null,
          p.pricePerUnit ? String(p.pricePerUnit).substring(0, 64) : null,
          p.image ? String(p.image).substring(0, 512) : null,
          p.category ? String(p.category).substring(0, 256) : null,
          p.subcategory ? String(p.subcategory).substring(0, 256) : null,
          p.packaging ? String(p.packaging).substring(0, 128) : null,
          p.productUrl ? String(p.productUrl).substring(0, 512) : null,
        ]
      );
      batchInserted++;
    } catch (e) {
      totalErrors++;
      if (totalErrors <= 3) console.error('Insert error:', e.message);
    }
  }
  totalInserted += batchInserted;
  console.log(`✓ ${result.output.category}: ${batchInserted} products inserted`);
}

// Final count
const [rows] = await pool.execute('SELECT COUNT(*) as c FROM alcampo_products');
console.log(`\n✅ Total inserted: ${totalInserted} | Errors: ${totalErrors}`);
console.log(`📦 Total in alcampo_products table: ${rows[0].c}`);

await pool.end();
