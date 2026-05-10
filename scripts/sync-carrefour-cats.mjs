/**
 * sync-carrefour-cats.mjs
 * Descarga productos de Carrefour España por categorías específicas
 * para evitar el rate limit de Open Food Facts.
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

// Categorías de Open Food Facts para buscar en Carrefour España
const CATEGORIES = [
  { tag: 'en:beverages', name: 'Bebidas' },
  { tag: 'en:waters', name: 'Bebidas' },
  { tag: 'en:fruit-juices', name: 'Bebidas' },
  { tag: 'en:sodas', name: 'Bebidas' },
  { tag: 'en:beers', name: 'Bebidas' },
  { tag: 'en:wines', name: 'Bebidas' },
  { tag: 'en:dairy', name: 'Lácteos' },
  { tag: 'en:milks', name: 'Lácteos' },
  { tag: 'en:yogurts', name: 'Lácteos' },
  { tag: 'en:cheeses', name: 'Lácteos' },
  { tag: 'en:breads', name: 'Panadería' },
  { tag: 'en:cereals', name: 'Cereales y Galletas' },
  { tag: 'en:biscuits', name: 'Cereales y Galletas' },
  { tag: 'en:chocolates', name: 'Dulces y Chocolates' },
  { tag: 'en:candies', name: 'Dulces y Chocolates' },
  { tag: 'en:jams-and-marmalades', name: 'Dulces y Chocolates' },
  { tag: 'en:meats', name: 'Carnes' },
  { tag: 'en:fish', name: 'Pescados y Mariscos' },
  { tag: 'en:seafood', name: 'Pescados y Mariscos' },
  { tag: 'en:fruits', name: 'Frutas y Verduras' },
  { tag: 'en:vegetables', name: 'Frutas y Verduras' },
  { tag: 'en:frozen-foods', name: 'Congelados' },
  { tag: 'en:pastas', name: 'Pasta, Arroz y Legumbres' },
  { tag: 'en:rice', name: 'Pasta, Arroz y Legumbres' },
  { tag: 'en:legumes', name: 'Pasta, Arroz y Legumbres' },
  { tag: 'en:sauces', name: 'Salsas y Condimentos' },
  { tag: 'en:oils', name: 'Aceites y Vinagres' },
  { tag: 'en:snacks', name: 'Aperitivos' },
  { tag: 'en:nuts', name: 'Aperitivos' },
  { tag: 'en:chips-and-fries', name: 'Aperitivos' },
  { tag: 'en:coffees', name: 'Café, Té e Infusiones' },
  { tag: 'en:teas', name: 'Café, Té e Infusiones' },
  { tag: 'en:baby-foods', name: 'Bebé' },
  { tag: 'en:pet-foods', name: 'Mascotas' },
  { tag: 'en:prepared-meals', name: 'Platos Preparados' },
  { tag: 'en:soups', name: 'Conservas y Sopas' },
  { tag: 'en:canned-foods', name: 'Conservas y Sopas' },
  { tag: 'en:eggs', name: 'Huevos' },
  { tag: 'en:desserts', name: 'Postres' },
  { tag: 'en:ice-creams', name: 'Postres' },
  { tag: 'en:condiments', name: 'Salsas y Condimentos' },
  { tag: 'en:deli-meats', name: 'Charcutería' },
  { tag: 'en:cold-cuts', name: 'Charcutería' },
  { tag: 'en:breakfast-cereals', name: 'Cereales y Galletas' },
  { tag: 'en:plant-based-foods', name: 'Alimentación Vegetal' },
];

async function fetchCategoryPage(categoryTag, page) {
  const params = new URLSearchParams({
    action: 'process',
    tagtype_0: 'stores',
    tag_contains_0: 'contains',
    tag_0: 'Carrefour',
    tagtype_1: 'categories',
    tag_contains_1: 'contains',
    tag_1: categoryTag,
    countries_tags: 'es',
    json: '1',
    page_size: String(PAGE_SIZE),
    page: String(page),
    fields: 'id,product_name,brands,image_url,image_front_url,categories,quantity',
    sort_by: 'unique_scans_n',
  });
  const url = `${OFF_BASE}?${params}`;
  
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) return await res.json();
      if (res.status === 503 || res.status === 429) {
        await sleep(attempt * 4000);
      } else {
        return null;
      }
    } catch (e) {
      await sleep(attempt * 2000);
    }
  }
  return null;
}

async function insertProducts(client, products, categoryName, seen) {
  const toInsert = [];
  for (const p of products) {
    if (!p.id || !p.product_name) continue;
    const productId = `carr-off-${p.id}`;
    if (seen.has(productId)) continue;
    seen.add(productId);
    const imageUrl = p.image_front_url || p.image_url || null;
    const brand = p.brands ? p.brands.split(',')[0].trim() : 'Carrefour';
    const productUrl = `https://world.openfoodfacts.org/product/${p.id}`;
    // Subcategoría: última parte de categories en español
    const parts = (p.categories || '').split(',').map(s => s.trim());
    const esCategory = parts.find(p => /^es:/i.test(p));
    const subcategory = esCategory 
      ? esCategory.replace(/^es:/i, '').replace(/-/g, ' ')
      : (parts[parts.length - 1] || '').replace(/^[a-z]{2}:/i, '').replace(/-/g, ' ');
    
    toInsert.push({ id: productId, name: p.product_name, brand, image: imageUrl, category: categoryName, subcategory: subcategory || null, packaging: p.quantity || null, product_url: productUrl });
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
    console.log('🔄 Sincronización por categorías de Carrefour España...\n');
    const { rows: currentTotal } = await client.query('SELECT COUNT(*) FROM carrefour_products');
    console.log(`📦 Productos actuales en BD: ${currentTotal[0].count}\n`);

    const seen = new Set();
    // Cargar IDs existentes para no duplicar
    const { rows: existingIds } = await client.query('SELECT id FROM carrefour_products');
    for (const r of existingIds) seen.add(r.id);
    
    let totalNewInserted = 0;

    for (const cat of CATEGORIES) {
      await sleep(2000); // 2s entre categorías
      
      // Obtener primera página para saber el total
      const firstPage = await fetchCategoryPage(cat.tag, 1);
      if (!firstPage || !firstPage.products?.length) {
        console.log(`  ⚠ ${cat.name} (${cat.tag}): sin productos`);
        continue;
      }
      
      const catTotal = firstPage.count || 0;
      const catPages = Math.ceil(catTotal / PAGE_SIZE);
      let catInserted = await insertProducts(client, firstPage.products, cat.name, seen);
      
      // Descargar páginas adicionales
      for (let page = 2; page <= Math.min(catPages, 20); page++) { // máx 20 páginas por categoría = 2000 productos
        await sleep(2000);
        const pageData = await fetchCategoryPage(cat.tag, page);
        if (!pageData?.products?.length) break;
        catInserted += await insertProducts(client, pageData.products, cat.name, seen);
      }
      
      totalNewInserted += catInserted;
      console.log(`  ✅ ${cat.name} (${cat.tag}): ${catTotal} disponibles, +${catInserted} nuevos`);
    }

    // Resumen final
    const { rows: finalTotal } = await client.query('SELECT COUNT(*) FROM carrefour_products');
    const { rows: withPhoto } = await client.query("SELECT COUNT(*) FROM carrefour_products WHERE image IS NOT NULL AND image != ''");
    const { rows: cats } = await client.query('SELECT category, COUNT(*) as cnt FROM carrefour_products GROUP BY category ORDER BY cnt DESC');

    console.log('\n========================================');
    console.log('✅ SINCRONIZACIÓN POR CATEGORÍAS COMPLETADA');
    console.log(`   Total productos en BD: ${finalTotal[0].count}`);
    console.log(`   Con foto: ${withPhoto[0].count}`);
    console.log(`   Nuevos añadidos: ${totalNewInserted}`);
    console.log('\n   Productos por categoría:');
    for (const c of cats) console.log(`   - ${c.category}: ${c.cnt}`);
    console.log('========================================\n');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => { console.error('❌ Error fatal:', err); process.exit(1); });
