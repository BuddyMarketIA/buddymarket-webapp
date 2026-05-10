/**
 * sync-carrefour-retry.mjs
 * Segunda pasada: descarga las páginas que fallaron con mayor espera entre peticiones.
 * Usa INSERT ON CONFLICT DO NOTHING para no duplicar.
 */

import pg from 'pg';
import { setTimeout as sleep } from 'timers/promises';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const OFF_BASE = 'https://world.openfoodfacts.org/cgi/search.pl';
const PAGE_SIZE = 100;
const HEADERS = {
  'User-Agent': 'BuddyMarket/1.0 (educational project; contact@buddymarket.app)',
  'Accept': 'application/json',
};

const CATEGORY_MAP = {
  'beverages': 'Bebidas', 'drinks': 'Bebidas', 'waters': 'Bebidas',
  'juices': 'Bebidas', 'sodas': 'Bebidas', 'beers': 'Bebidas', 'wines': 'Bebidas',
  'dairy': 'Lácteos', 'milks': 'Lácteos', 'yogurts': 'Lácteos',
  'cheeses': 'Lácteos', 'butters': 'Lácteos',
  'breads': 'Panadería',
  'cereals': 'Cereales y Galletas', 'biscuits': 'Cereales y Galletas', 'cookies': 'Cereales y Galletas',
  'chocolates': 'Dulces y Chocolates', 'candies': 'Dulces y Chocolates',
  'sugars': 'Dulces y Chocolates', 'jams': 'Dulces y Chocolates',
  'meats': 'Carnes',
  'fish': 'Pescados y Mariscos', 'seafood': 'Pescados y Mariscos',
  'fruits': 'Frutas y Verduras', 'vegetables': 'Frutas y Verduras',
  'frozen': 'Congelados',
  'pasta': 'Pasta, Arroz y Legumbres', 'rice': 'Pasta, Arroz y Legumbres', 'legumes': 'Pasta, Arroz y Legumbres',
  'sauces': 'Salsas y Condimentos', 'oils': 'Aceites y Vinagres', 'vinegars': 'Aceites y Vinagres',
  'snacks': 'Aperitivos', 'chips': 'Aperitivos', 'nuts': 'Aperitivos',
  'coffee': 'Café, Té e Infusiones', 'teas': 'Café, Té e Infusiones',
  'baby': 'Bebé', 'hygiene': 'Higiene y Cuidado Personal',
  'cleaning': 'Limpieza del Hogar', 'pet': 'Mascotas',
  'prepared': 'Platos Preparados', 'soups': 'Conservas y Sopas', 'canned': 'Conservas y Sopas',
  'eggs': 'Huevos', 'desserts': 'Postres', 'ice-creams': 'Postres',
};

function mapCategory(categoriesStr) {
  if (!categoriesStr) return 'Otros';
  const cats = categoriesStr.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (cats.includes(key)) return val;
  }
  return 'Otros';
}

function mapSubcategory(categoriesStr) {
  if (!categoriesStr) return null;
  const parts = categoriesStr.split(',').map(s => s.trim());
  const esCategory = parts.find(p => /^es:/i.test(p));
  if (esCategory) return esCategory.replace(/^es:/i, '').replace(/-/g, ' ');
  const last = parts[parts.length - 1];
  return last ? last.replace(/^[a-z]{2}:/i, '').replace(/-/g, ' ') : null;
}

async function fetchPageWithRetry(page, maxRetries = 5) {
  const params = new URLSearchParams({
    action: 'process',
    tagtype_0: 'stores',
    tag_contains_0: 'contains',
    tag_0: 'Carrefour',
    countries_tags: 'es',
    json: '1',
    page_size: String(PAGE_SIZE),
    page: String(page),
    fields: 'id,product_name,brands,image_url,image_front_url,categories,quantity',
    sort_by: 'unique_scans_n',
  });
  const url = `${OFF_BASE}?${params}`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) return await res.json();
      if (res.status === 503 || res.status === 429) {
        const wait = attempt * 3000; // espera progresiva: 3s, 6s, 9s, 12s, 15s
        process.stdout.write(`\r  ⏳ Página ${page}: HTTP ${res.status}, esperando ${wait/1000}s (intento ${attempt}/${maxRetries})...`);
        await sleep(wait);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      if (attempt === maxRetries) {
        process.stdout.write(`\r  ❌ Página ${page}: fallo definitivo tras ${maxRetries} intentos\n`);
        return null;
      }
      await sleep(attempt * 2000);
    }
  }
  return null;
}

async function insertProducts(client, products, seen) {
  const toInsert = [];
  for (const p of products) {
    if (!p.id || !p.product_name) continue;
    const productId = `carr-off-${p.id}`;
    if (seen.has(productId)) continue;
    seen.add(productId);
    const imageUrl = p.image_front_url || p.image_url || null;
    const category = mapCategory(p.categories);
    const subcategory = mapSubcategory(p.categories);
    const brand = p.brands ? p.brands.split(',')[0].trim() : 'Carrefour';
    const productUrl = `https://world.openfoodfacts.org/product/${p.id}`;
    toInsert.push({ id: productId, name: p.product_name, brand, image: imageUrl, category, subcategory, packaging: p.quantity || null, product_url: productUrl });
  }
  if (!toInsert.length) return 0;

  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const rawBatch = toInsert.slice(i, i + BATCH);
    const batchSeen = new Set();
    const batch = rawBatch.filter(r => { if (batchSeen.has(r.id)) return false; batchSeen.add(r.id); return true; });
    if (!batch.length) continue;
    const values = batch.map((_, idx) => { const b = idx * 9; return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9})`; }).join(',');
    const params = batch.flatMap(r => [r.id, r.name, r.brand, r.image, r.category, r.subcategory, r.packaging, r.product_url, null]);
    const result = await client.query(
      `INSERT INTO carrefour_products (id, name, brand, image, category, subcategory, packaging, product_url, price)
       VALUES ${values} ON CONFLICT (id) DO NOTHING`,
      params
    );
    inserted += result.rowCount || 0;
  }
  return inserted;
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('🔄 Segunda pasada: recuperando páginas fallidas de Carrefour...\n');

    // Obtener total actual
    const { rows: currentTotal } = await client.query('SELECT COUNT(*) FROM carrefour_products');
    console.log(`📦 Productos actuales en BD: ${currentTotal[0].count}`);

    // Obtener total de páginas
    const first = await fetchPageWithRetry(1);
    if (!first) { console.error('No se pudo obtener la primera página'); return; }
    const total = first.count || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    console.log(`📄 Total páginas a procesar: ${totalPages}\n`);

    const seen = new Set();
    let totalInserted = 0;

    // Procesar todas las páginas con mayor espera
    for (let page = 1; page <= totalPages; page++) {
      if (page > 1) await sleep(1500); // 1.5s entre peticiones para evitar 503
      
      const data = await fetchPageWithRetry(page);
      if (!data || !data.products?.length) {
        process.stdout.write(`\r  ⚠ Página ${page}/${totalPages}: sin datos\n`);
        continue;
      }
      
      const inserted = await insertProducts(client, data.products, seen);
      totalInserted += inserted;
      process.stdout.write(`\r  ✅ Página ${page}/${totalPages}: +${inserted} nuevos (total nuevos: ${totalInserted})    `);
    }
    console.log('\n');

    // Resumen final
    const { rows: finalTotal } = await client.query('SELECT COUNT(*) FROM carrefour_products');
    const { rows: withPhoto } = await client.query("SELECT COUNT(*) FROM carrefour_products WHERE image IS NOT NULL AND image != ''");
    const { rows: cats } = await client.query('SELECT category, COUNT(*) as cnt FROM carrefour_products GROUP BY category ORDER BY cnt DESC');

    console.log('\n========================================');
    console.log('✅ SEGUNDA PASADA COMPLETADA');
    console.log(`   Total productos en BD: ${finalTotal[0].count}`);
    console.log(`   Con foto: ${withPhoto[0].count}`);
    console.log(`   Nuevos añadidos esta pasada: ${totalInserted}`);
    console.log('\n   Productos por categoría:');
    for (const c of cats) console.log(`   - ${c.category}: ${c.cnt}`);
    console.log('========================================\n');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => { console.error('❌ Error fatal:', err); process.exit(1); });
