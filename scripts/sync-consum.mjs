/**
 * sync-consum.mjs
 * Descarga el catálogo completo de Consum desde su API oficial
 * y lo inserta en la tabla consum_products de Supabase.
 */
import pg from "pg";
import { fileURLToPath } from "url";
import { dirname } from "path";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

const BASE_URL = "https://tienda.consum.es/api/rest/V1.0/catalog/product";
const HEADERS = {
  "Accept": "application/json",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "es-ES,es;q=0.9",
};

// Mapa de categorías de Consum a categorías legibles
const CATEGORY_MAP = {
  1: "Frutas y Verduras",
  2: "Carnes y Aves",
  3: "Pescados y Mariscos",
  4: "Charcutería y Quesos",
  5: "Lácteos y Huevos",
  6: "Panadería y Bollería",
  7: "Congelados",
  8: "Conservas y Enlatados",
  9: "Pasta, Arroz y Legumbres",
  10: "Cereales y Desayunos",
  11: "Aceites y Condimentos",
  12: "Salsas y Especias",
  13: "Bebidas",
  14: "Vinos y Licores",
  15: "Snacks y Aperitivos",
  16: "Dulces y Chocolates",
  17: "Dietética y Nutrición",
  18: "Higiene y Cuidado Personal",
  19: "Limpieza del Hogar",
  20: "Bebés y Niños",
  21: "Mascotas",
  22: "Otros",
};

async function fetchPage(offset, limit = 50) {
  const url = `${BASE_URL}?limit=${limit}&offset=${offset}&lang=es`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} at offset ${offset}`);
  return res.json();
}

function mapProduct(p) {
  const pd = p.productData || {};
  const priceData = p.priceData || {};
  const prices = priceData.prices || [];
  const price = prices[0]?.value?.centAmount ?? null;
  const pricePerUnit = priceData.unitPriceUnitType
    ? `${prices[0]?.value?.centUnitAmount?.toFixed(2) ?? ""} €/${priceData.unitPriceUnitType}`
    : null;

  // Obtener imagen de mayor calidad
  const media = p.media || [];
  const image = media[0]?.url || pd.imageURL || null;

  // Categoría
  const cats = p.categories || [];
  const catName = cats[0]?.name || "Otros";
  const subCatName = cats[1]?.name || null;

  // URL del producto
  const productUrl = pd.url || `https://tienda.consum.es/es/p/${pd.seo || p.code}/${p.code}`;

  return {
    id: String(p.code || p.id),
    name: pd.name || "",
    brand: pd.brand?.name || null,
    price: price ? parseFloat(price.toFixed(2)) : null,
    pricePerUnit: pricePerUnit,
    image: image,
    category: catName,
    subcategory: subCatName,
    packaging: pd.description || null,
    productUrl: productUrl,
    ean: p.ean || null,
  };
}

async function upsertBatch(products) {
  if (products.length === 0) return;
  const client = await pool.connect();
  try {
    // Deduplicar por id
    const seen = new Set();
    const unique = products.filter(p => {
      if (!p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    const placeholders = unique.map((_, i) => {
      const base = i * 11;
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11})`;
    }).join(",");

    const values = unique.flatMap(p => [
      p.id, p.name, p.brand, p.price, p.pricePerUnit,
      p.image, p.category, p.subcategory, p.packaging, p.productUrl, p.ean
    ]);

    await client.query(`
      INSERT INTO consum_products (id, name, brand, price, price_per_unit, image, category, subcategory, packaging, product_url, ean)
      VALUES ${placeholders}
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        price = EXCLUDED.price,
        price_per_unit = EXCLUDED.price_per_unit,
        image = EXCLUDED.image,
        category = EXCLUDED.category,
        subcategory = EXCLUDED.subcategory,
        packaging = EXCLUDED.packaging,
        product_url = EXCLUDED.product_url,
        ean = EXCLUDED.ean,
        "updatedAt" = NOW()
    `, values);
  } finally {
    client.release();
  }
}

async function main() {
  console.log("🛒 Iniciando sincronización de Consum...");

  // Obtener el total de productos
  const firstPage = await fetchPage(0, 1);
  const total = firstPage.totalCount || 0;
  console.log(`📦 Total de productos en Consum: ${total}`);

  const LIMIT = 50;
  const pages = Math.ceil(total / LIMIT);
  let inserted = 0;
  let errors = 0;

  for (let page = 0; page < pages; page++) {
    const offset = page * LIMIT;
    try {
      const data = await fetchPage(offset, LIMIT);
      const products = (data.products || []).map(mapProduct).filter(p => p.name);
      await upsertBatch(products);
      inserted += products.length;
      if (page % 20 === 0) {
        console.log(`  ✅ Página ${page + 1}/${pages} — ${inserted} productos insertados`);
      }
      // Pausa para no sobrecargar la API
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      errors++;
      console.error(`  ❌ Error en página ${page + 1}: ${err.message}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Verificar resultado
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(image) as with_image,
        COUNT(DISTINCT category) as categories
      FROM consum_products
    `);
    const row = result.rows[0];
    console.log(`\n🎉 Sincronización completada:`);
    console.log(`   Total productos: ${row.total}`);
    console.log(`   Con imagen: ${row.with_image}`);
    console.log(`   Categorías: ${row.categories}`);
    console.log(`   Errores: ${errors}`);
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch(err => {
  console.error("Error fatal:", err);
  process.exit(1);
});
