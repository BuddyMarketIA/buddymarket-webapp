/**
 * Import Mercadona product catalog from their public API
 * Strategy: 
 *   1. GET /api/categories/ → list of top categories with subcategory IDs
 *   2. GET /api/categories/{subcategoryId}/ → leaf category with products
 */
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("No DATABASE_URL"); process.exit(1); }

const BASE_URL = "https://tienda.mercadona.es/api";
const HEADERS = {
  "Accept": "application/json",
  "Accept-Language": "es-ES,es;q=0.9",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://tienda.mercadona.es/",
};

async function fetchJSON(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const conn = await createConnection(DB_URL);
  
  console.log("🗑️  Clearing existing Mercadona products...");
  await conn.execute("DELETE FROM mercadona_products");
  
  // Step 1: Get all top-level categories (which include subcategory IDs)
  console.log("📂 Fetching top-level categories...");
  const topData = await fetchJSON(`${BASE_URL}/categories/`);
  const topCategories = Array.isArray(topData) ? topData : (topData.results || []);
  console.log(`Found ${topCategories.length} top-level categories`);
  
  let totalInserted = 0;
  let totalErrors = 0;
  
  for (const topCat of topCategories) {
    const subCategoryIds = (topCat.categories || []).map(s => ({ id: s.id, name: s.name }));
    if (subCategoryIds.length === 0) continue;
    
    console.log(`\n📁 ${topCat.name} → ${subCategoryIds.length} subcategories`);
    
    for (const subRef of subCategoryIds) {
      // Fetch the leaf subcategory which contains products grouped in sub-subcategories
      let leafData;
      try {
        leafData = await fetchJSON(`${BASE_URL}/categories/${subRef.id}/`);
        await sleep(300);
      } catch (e) {
        console.error(`  ❌ Error fetching subcategory ${subRef.id}: ${e.message}`);
        continue;
      }
      
      // The leaf category has its own "categories" array, each with products
      const leafSubcats = leafData.categories || [];
      let subTotal = 0;
      
      for (const leafSub of leafSubcats) {
        const products = leafSub.products || [];
        
        for (const product of products) {
          try {
            const price = product.price_instructions || {};
            await conn.execute(
              `INSERT INTO mercadona_products 
                (id, slug, name, packaging, thumbnail, share_url, category_id, category_name, subcategory_id, subcategory_name, bulk_price, unit_price, unit_size, size_format, reference_price, reference_format)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                 name = VALUES(name),
                 thumbnail = VALUES(thumbnail),
                 bulk_price = VALUES(bulk_price),
                 unit_price = VALUES(unit_price),
                 updatedAt = NOW()`,
              [
                parseInt(product.id),
                product.slug || "",
                product.display_name || product.slug || "",
                product.packaging || null,
                product.thumbnail || null,
                product.share_url || null,
                topCat.id,
                topCat.name,
                subRef.id,
                subRef.name,
                price.bulk_price || null,
                price.unit_price || null,
                price.unit_size || null,
                price.size_format || null,
                price.reference_price || null,
                price.reference_format || null,
              ]
            );
            totalInserted++;
            subTotal++;
          } catch (e) {
            console.error(`    ❌ Error inserting product ${product.id}: ${e.message}`);
            totalErrors++;
          }
        }
      }
      
      if (subTotal > 0) {
        console.log(`  ✅ ${subRef.name}: ${subTotal} products`);
      }
      
      await sleep(200);
    }
  }
  
  const [countResult] = await conn.execute("SELECT COUNT(*) as total FROM mercadona_products");
  const total = countResult[0].total;
  
  console.log(`\n✅ Import complete!`);
  console.log(`   Inserted/updated: ${totalInserted}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Total in DB: ${total}`);
  
  // Show category breakdown
  const [catBreakdown] = await conn.execute(
    "SELECT category_name, COUNT(*) as count FROM mercadona_products GROUP BY category_name ORDER BY count DESC"
  );
  console.log("\n📊 Products by category:");
  for (const row of catBreakdown) {
    console.log(`   ${row.category_name}: ${row.count}`);
  }
  
  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
