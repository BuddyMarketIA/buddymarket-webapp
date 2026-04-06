/**
 * sync-carrefour.mjs
 * Descarga TODOS los productos de Carrefour España desde Open Food Facts
 * y los inserta en la tabla carrefour_products de Supabase.
 * Uso: node scripts/sync-carrefour.mjs
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

// Mapa de categorías Open Food Facts → categorías en español para Carrefour
const CATEGORY_MAP = {
  'beverages': 'Bebidas',
  'drinks': 'Bebidas',
  'waters': 'Bebidas',
  'juices': 'Bebidas',
  'sodas': 'Bebidas',
  'beers': 'Bebidas',
  'wines': 'Bebidas',
  'dairy': 'Lácteos',
  'milks': 'Lácteos',
  'yogurts': 'Lácteos',
  'cheeses': 'Lácteos',
  'butters': 'Lácteos',
  'breads': 'Panadería',
  'cereals': 'Cereales y Galletas',
  'biscuits': 'Cereales y Galletas',
  'cookies': 'Cereales y Galletas',
  'chocolates': 'Dulces y Chocolates',
  'candies': 'Dulces y Chocolates',
  'sugars': 'Dulces y Chocolates',
  'jams': 'Dulces y Chocolates',
  'meats': 'Carnes',
  'fish': 'Pescados y Mariscos',
  'seafood': 'Pescados y Mariscos',
  'fruits': 'Frutas y Verduras',
  'vegetables': 'Frutas y Verduras',
  'frozen': 'Congelados',
  'pasta': 'Pasta, Arroz y Legumbres',
  'rice': 'Pasta, Arroz y Legumbres',
  'legumes': 'Pasta, Arroz y Legumbres',
  'sauces': 'Salsas y Condimentos',
  'oils': 'Aceites y Vinagres',
  'vinegars': 'Aceites y Vinagres',
  'snacks': 'Aperitivos',
  'chips': 'Aperitivos',
  'nuts': 'Aperitivos',
  'coffee': 'Café, Té e Infusiones',
  'teas': 'Café, Té e Infusiones',
  'baby': 'Bebé',
  'hygiene': 'Higiene y Cuidado Personal',
  'cleaning': 'Limpieza del Hogar',
  'pet': 'Mascotas',
  'prepared': 'Platos Preparados',
  'soups': 'Conservas y Sopas',
  'canned': 'Conservas y Sopas',
  'eggs': 'Huevos',
  'desserts': 'Postres',
  'ice-creams': 'Postres',
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
  // Tomar la última categoría más específica en español si existe
  const parts = categoriesStr.split(',').map(s => s.trim());
  // Buscar una categoría en español
  const esCategory = parts.find(p => /^es:/i.test(p));
  if (esCategory) return esCategory.replace(/^es:/i, '').replace(/-/g, ' ');
  // Si no, tomar la última categoría
  const last = parts[parts.length - 1];
  return last ? last.replace(/^[a-z]{2}:/i, '').replace(/-/g, ' ') : null;
}

async function fetchPage(page) {
  const params = new URLSearchParams({
    action: 'process',
    tagtype_0: 'stores',
    tag_contains_0: 'contains',
    tag_0: 'Carrefour',
    countries_tags: 'es',
    json: '1',
    page_size: String(PAGE_SIZE),
    page: String(page),
    fields: 'id,product_name,brands,image_url,image_front_url,categories,quantity,stores,nutriments,ecoscore_grade,nutriscore_grade',
    sort_by: 'unique_scans_n',
  });
  const url = `${OFF_BASE}?${params}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('🔄 Iniciando sincronización de Carrefour España desde Open Food Facts...\n');

    // 1. Obtener el total de productos
    const first = await fetchPage(1);
    const total = first.count || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    console.log(`📦 Total productos encontrados: ${total}`);
    console.log(`📄 Total páginas: ${totalPages}\n`);

    // 2. Limpiar tabla existente
    console.log('🗑  Limpiando tabla carrefour_products...');
    await client.query('TRUNCATE TABLE carrefour_products RESTART IDENTITY CASCADE');
    console.log('✅ Tabla limpiada\n');

    let totalInserted = 0;
    const seen = new Set();

    // 3. Procesar primera página (ya descargada)
    const allPages = [first];

    // 4. Descargar el resto de páginas
    for (let page = 2; page <= totalPages; page++) {
      await sleep(500); // respetar rate limit
      try {
        const data = await fetchPage(page);
        allPages.push(data);
        process.stdout.write(`\r  Descargando página ${page}/${totalPages}...`);
      } catch (e) {
        console.warn(`\n  ⚠ Error en página ${page}: ${e.message}, reintentando...`);
        await sleep(2000);
        try {
          const data = await fetchPage(page);
          allPages.push(data);
        } catch (e2) {
          console.warn(`  ⚠ Error definitivo en página ${page}: ${e2.message}`);
        }
      }
    }
    console.log('\n');

    // 5. Insertar todos los productos
    for (const pageData of allPages) {
      const products = pageData.products || [];
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

        toInsert.push({
          id: productId,
          name: p.product_name,
          brand: brand,
          price: null,
          price_per_unit: null,
          image: imageUrl,
          category: category,
          subcategory: subcategory,
          packaging: p.quantity || null,
          product_url: productUrl,
        });
      }

      if (!toInsert.length) continue;

      // Insertar en lotes de 100
      const BATCH = 100;
      for (let i = 0; i < toInsert.length; i += BATCH) {
        const rawBatch = toInsert.slice(i, i + BATCH);
        // Deduplicar dentro del batch
        const batchSeen = new Set();
        const batch = rawBatch.filter(r => {
          if (batchSeen.has(r.id)) return false;
          batchSeen.add(r.id);
          return true;
        });
        if (!batch.length) continue;

        const values = batch.map((_, idx) => {
          const base = idx * 10;
          return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10})`;
        }).join(',');
        const params = batch.flatMap(r => [
          r.id, r.name, r.brand, r.price, r.price_per_unit,
          r.image, r.category, r.subcategory, r.packaging, r.product_url,
        ]);
        await client.query(
          `INSERT INTO carrefour_products
            (id, name, brand, price, price_per_unit, image, category, subcategory, packaging, product_url)
           VALUES ${values}
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             brand = EXCLUDED.brand,
             image = EXCLUDED.image,
             category = EXCLUDED.category,
             subcategory = EXCLUDED.subcategory,
             packaging = EXCLUDED.packaging,
             product_url = EXCLUDED.product_url,
             "updatedAt" = NOW()`,
          params
        );
        totalInserted += batch.length;
      }
    }

    // 6. Resumen final
    const { rows: totalRows } = await client.query('SELECT COUNT(*) FROM carrefour_products');
    const { rows: withPhoto } = await client.query("SELECT COUNT(*) FROM carrefour_products WHERE image IS NOT NULL AND image != ''");
    const { rows: noPhoto } = await client.query("SELECT COUNT(*) FROM carrefour_products WHERE image IS NULL OR image = ''");
    const { rows: cats } = await client.query('SELECT category, COUNT(*) as cnt FROM carrefour_products GROUP BY category ORDER BY cnt DESC');

    console.log('\n========================================');
    console.log('✅ SINCRONIZACIÓN COMPLETADA');
    console.log(`   Total productos en BD: ${totalRows[0].count}`);
    console.log(`   Con foto: ${withPhoto[0].count}`);
    console.log(`   Sin foto: ${noPhoto[0].count}`);
    console.log('\n   Productos por categoría:');
    for (const c of cats) {
      console.log(`   - ${c.category}: ${c.cnt}`);
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
