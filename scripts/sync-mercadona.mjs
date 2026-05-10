/**
 * sync-mercadona.mjs
 * Descarga TODOS los productos de la API oficial de Mercadona y los inserta en Supabase.
 * Fotos originales de prod-mercadona.imgix.net
 * Uso: node scripts/sync-mercadona.mjs
 */

import pg from 'pg';
import { setTimeout as sleep } from 'timers/promises';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const BASE = 'https://tienda.mercadona.es/api';
const HEADERS = {
  'Accept': 'application/json',
  'Accept-Language': 'es',
  'User-Agent': 'Mozilla/5.0 (compatible; BuddyMarket/1.0)',
};

async function fetchJSON(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} → ${url}`);
  return res.json();
}

async function getAllCategories() {
  const data = await fetchJSON(`${BASE}/categories/`);
  return data.results || data;
}

async function getSubcategoryProducts(subcatId) {
  try {
    const data = await fetchJSON(`${BASE}/categories/${subcatId}/`);
    // The response has an array of subcategories, each with products
    const products = [];
    if (Array.isArray(data)) {
      for (const subcat of data) {
        if (subcat.products) products.push(...subcat.products);
      }
    } else if (data.categories) {
      for (const subcat of data.categories) {
        if (subcat.products) products.push(...subcat.products);
      }
    } else if (data.products) {
      products.push(...data.products);
    }
    return products;
  } catch (e) {
    console.warn(`  ⚠ Error en subcategoría ${subcatId}: ${e.message}`);
    return [];
  }
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('🔄 Iniciando sincronización de Mercadona...\n');

    // 1. Obtener todas las categorías principales
    const topCategories = await getAllCategories();
    console.log(`📦 Categorías principales encontradas: ${topCategories.length}`);

    // 2. Limpiar tabla existente
    console.log('\n🗑  Limpiando tabla mercadona_products...');
    await client.query('TRUNCATE TABLE mercadona_products RESTART IDENTITY CASCADE');
    console.log('✅ Tabla limpiada\n');

    let totalInserted = 0;
    const seen = new Set(); // evitar duplicados por id de producto

    // 3. Iterar por cada categoría principal y sus subcategorías
    for (const topCat of topCategories) {
      console.log(`\n📂 Categoría: ${topCat.name} (id=${topCat.id})`);
      const subcats = topCat.categories || [];

      for (const subcat of subcats) {
        if (!subcat.published && subcat.published !== undefined) continue;
        await sleep(300); // respetar rate limit

        const products = await getSubcategoryProducts(subcat.id);
        if (!products.length) {
          console.log(`  └─ ${subcat.name}: 0 productos`);
          continue;
        }

        const toInsert = [];
        for (const p of products) {
          if (!p.id || seen.has(String(p.id))) continue;
          seen.add(String(p.id));

          const pi = p.price_instructions || {};
          toInsert.push({
            id: parseInt(p.id, 10),
            slug: p.slug || String(p.id),
            name: p.display_name || p.name || '',
            packaging: p.packaging || null,
            thumbnail: p.thumbnail || null,
            share_url: p.share_url || null,
            category_id: topCat.id,
            category_name: topCat.name,
            subcategory_id: subcat.id,
            subcategory_name: subcat.name,
            bulk_price: pi.bulk_price ? String(pi.bulk_price) : null,
            unit_price: pi.unit_price ? String(pi.unit_price) : null,
            unit_size: pi.unit_size ? parseFloat(pi.unit_size) : null,
            size_format: pi.size_format || null,
            reference_price: pi.reference_price ? String(pi.reference_price) : null,
            reference_format: pi.reference_format || null,
          });
        }

        if (!toInsert.length) {
          console.log(`  └─ ${subcat.name}: sin productos nuevos`);
          continue;
        }

        // Insertar en lotes de 100 (deduplicar dentro del batch)
        const BATCH = 100;
        for (let i = 0; i < toInsert.length; i += BATCH) {
          const rawBatch = toInsert.slice(i, i + BATCH);
          const batchSeen = new Set();
          const batch = rawBatch.filter(r => {
            if (batchSeen.has(r.id)) return false;
            batchSeen.add(r.id);
            return true;
          });
          const values = batch.map((_, idx) => {
            const base = idx * 16;
            return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12},$${base+13},$${base+14},$${base+15},$${base+16})`;
          }).join(',');
          const params = batch.flatMap(r => [
            r.id, r.slug, r.name, r.packaging, r.thumbnail, r.share_url,
            r.category_id, r.category_name, r.subcategory_id, r.subcategory_name,
            r.bulk_price, r.unit_price, r.unit_size, r.size_format,
            r.reference_price, r.reference_format,
          ]);
          await client.query(
            `INSERT INTO mercadona_products
              (id, slug, name, packaging, thumbnail, share_url,
               category_id, category_name, subcategory_id, subcategory_name,
               bulk_price, unit_price, unit_size, size_format,
               reference_price, reference_format)
             VALUES ${values}
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               thumbnail = EXCLUDED.thumbnail,
               share_url = EXCLUDED.share_url,
               bulk_price = EXCLUDED.bulk_price,
               unit_price = EXCLUDED.unit_price,
               unit_size = EXCLUDED.unit_size,
               size_format = EXCLUDED.size_format,
               reference_price = EXCLUDED.reference_price,
               reference_format = EXCLUDED.reference_format,
               "updatedAt" = NOW()`,
            params
          );
          totalInserted += batch.length;
        }

        console.log(`  └─ ${subcat.name}: ${toInsert.length} productos ✅`);
      }
    }

    // 4. Resumen final
    const { rows } = await client.query('SELECT COUNT(*) FROM mercadona_products');
    const { rows: noPhoto } = await client.query("SELECT COUNT(*) FROM mercadona_products WHERE thumbnail IS NULL OR thumbnail = ''");
    const { rows: cats } = await client.query('SELECT category_name, COUNT(*) as cnt FROM mercadona_products GROUP BY category_name ORDER BY cnt DESC');

    console.log('\n\n========================================');
    console.log(`✅ SINCRONIZACIÓN COMPLETADA`);
    console.log(`   Total productos en BD: ${rows[0].count}`);
    console.log(`   Sin foto: ${noPhoto[0].count}`);
    console.log('\n   Productos por categoría:');
    for (const c of cats) {
      console.log(`   - ${c.category_name}: ${c.cnt}`);
    }
    console.log('========================================\n');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
