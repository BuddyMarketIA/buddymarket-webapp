/**
 * Import Lidl Spain food product catalog from their public website
 * Strategy: search for common food terms and extract product data from HTML
 */
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("No DATABASE_URL"); process.exit(1); }

const BASE_URL = "https://www.lidl.es";
const HEADERS = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9",
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://www.lidl.es/",
};

// Food search terms to cover the main categories
const FOOD_TERMS = [
  "leche", "yogur", "queso", "mantequilla", "nata",
  "pan", "cereales", "galletas", "bollería",
  "arroz", "pasta", "legumbres", "harina",
  "aceite", "vinagre", "sal", "azúcar",
  "tomate", "conservas", "salsas",
  "pollo", "ternera", "cerdo", "jamón", "embutido",
  "pescado", "atún", "salmón", "sardinas",
  "fruta", "verdura", "patata", "cebolla",
  "huevos", "mayonesa", "ketchup",
  "agua", "zumo", "refresco", "cerveza", "vino",
  "café", "té", "infusiones",
  "chocolate", "mermelada", "miel",
  "congelados", "pizza", "helado",
  "snacks", "frutos secos", "patatas fritas",
  "detergente", "jabón", "papel",
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchProducts(query) {
  const url = `${BASE_URL}/q/search?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const html = await res.text();
    
    // Extract data-grid-data attributes
    const matches = html.match(/data-grid-data="([^"]+)"/g) || [];
    const products = [];
    
    for (const match of matches) {
      try {
        const jsonStr = match.replace('data-grid-data="', '').slice(0, -1);
        // Unescape HTML entities
        const unescaped = jsonStr
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        const d = JSON.parse(unescaped);
        
        // Only include food/grocery products
        const cat = d.category || '';
        if (!['Food', 'Bebidas', 'Droguería', 'Higiene', 'Alimentación'].includes(cat)) continue;
        
        const price = d.price?.price;
        const packaging = d.price?.packaging?.text || '';
        const image = d.image || (d.imageList?.[0]?.url) || '';
        
        products.push({
          id: String(d.erpNumber || d.productId),
          name: (d.fullTitle || d.title || '').trim(),
          fullTitle: (d.fullTitle || d.title || '').trim(),
          brand: d.brand?.name || '',
          image: image,
          price: price || null,
          packaging: packaging,
          category: cat,
          canonicalPath: d.canonicalPath || d.canonicalUrl || '',
          onlineAvailable: d.stockAvailability?.onlineAvailable ? 1 : 0,
        });
      } catch (e) {
        // skip malformed entries
      }
    }
    return products;
  } catch (e) {
    console.error(`  Error fetching "${query}": ${e.message}`);
    return [];
  }
}

async function main() {
  const conn = await createConnection(DB_URL);
  
  console.log("🗑️  Clearing existing Lidl products...");
  await conn.execute("DELETE FROM lidl_products");
  
  const seen = new Set();
  let totalInserted = 0;
  
  for (const term of FOOD_TERMS) {
    console.log(`\n🔍 Searching: "${term}"`);
    const products = await fetchProducts(term);
    
    let newCount = 0;
    for (const p of products) {
      if (!p.id || !p.name || seen.has(p.id)) continue;
      seen.add(p.id);
      
      try {
        await conn.execute(
          `INSERT INTO lidl_products (id, name, full_title, brand, image, price, packaging, category, canonical_path, online_available)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             image = VALUES(image),
             price = VALUES(price),
             packaging = VALUES(packaging),
             online_available = VALUES(online_available)`,
          [p.id, p.name, p.fullTitle, p.brand, p.image, p.price, p.packaging, p.category, p.canonicalPath, p.onlineAvailable]
        );
        newCount++;
        totalInserted++;
      } catch (e) {
        // skip
      }
    }
    console.log(`  ✓ Found ${products.length} products, inserted ${newCount} new`);
    await sleep(500); // be polite
  }
  
  console.log(`\n✅ Done! Total unique products inserted: ${totalInserted}`);
  await conn.end();
}

main().catch(console.error);
