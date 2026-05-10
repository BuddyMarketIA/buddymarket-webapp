/**
 * Script para importar el catálogo completo de Mercadona en la BD local.
 * Estructura API: categorías padre → subcategorías nivel 1 → subcategorías nivel 2 → productos
 * Upsert por slug para evitar duplicados.
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const MERC_BASE = "https://tienda.mercadona.es/api";
const HEADERS = {
  "Accept": "application/json",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "es-ES,es;q=0.9",
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Extraer todos los productos de una respuesta de categoría (recursivo)
function extractProducts(catData, parentName, subName) {
  const results = [];
  const cats = catData.categories ?? [];
  const directProds = catData.products ?? [];
  
  for (const p of directProds) {
    results.push({ product: p, categoryName: parentName, subcategoryName: subName });
  }
  
  for (const subCat of cats) {
    const subProds = subCat.products ?? [];
    const subSubCats = subCat.categories ?? [];
    const effectiveSub = subName || subCat.name;
    
    for (const p of subProds) {
      results.push({ product: p, categoryName: parentName, subcategoryName: effectiveSub });
    }
    
    for (const subSubCat of subSubCats) {
      const subSubProds = subSubCat.products ?? [];
      for (const p of subSubProds) {
        results.push({ product: p, categoryName: parentName, subcategoryName: effectiveSub });
      }
    }
  }
  
  return results;
}

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  console.log("✅ Conectado a la BD");

  // 1. Obtener todas las categorías padre con sus subcategorías
  const topData = await fetchJson(`${MERC_BASE}/categories/?lang=es`);
  const topCategories = topData.results ?? [];
  console.log(`📋 Categorías padre disponibles: ${topCategories.length}`);

  // Filtrar solo las categorías de alimentación
  const FOOD_CATEGORIES = [
    "Fruta y verdura", "Carne", "Marisco y pescado", "Charcutería y quesos",
    "Huevos, leche y mantequilla", "Panadería y pastelería", "Postres y yogures",
    "Arroz, legumbres y pasta", "Aceite, especias y salsas", "Conservas, caldos y cremas",
    "Cereales y galletas", "Cacao, café e infusiones", "Azúcar, caramelos y chocolate",
    "Congelados", "Aperitivos", "Pizzas y platos preparados", "Agua y refrescos",
    "Bodega", "Zumos",
  ];

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const topCat of topCategories) {
    if (!FOOD_CATEGORIES.includes(topCat.name)) {
      console.log(`  ⏭️  Saltando: ${topCat.name}`);
      continue;
    }
    
    const subCatIds = (topCat.categories ?? []).map(s => s.id);
    console.log(`\n📦 ${topCat.name} (${subCatIds.length} subcategorías)`);

    for (const subId of subCatIds) {
      try {
        const subData = await fetchJson(`${MERC_BASE}/categories/${subId}/?lang=es`);
        await sleep(150);
        
        const allProducts = extractProducts(subData, topCat.name, subData.name);
        console.log(`  📁 ${subData.name}: ${allProducts.length} productos`);

        for (const { product: p, categoryName, subcategoryName } of allProducts) {
          const productId = parseInt(String(p.id).replace(/\..*/,""), 10);
          const slug = p.slug ?? "";
          const name = p.display_name ?? p.name ?? "";
          const price = p.price_instructions?.unit_price ?? null;
          const bulkPrice = p.price_instructions?.bulk_price ?? null;
          const unitSize = p.price_instructions?.unit_size ?? null;
          const referenceFormat = p.price_instructions?.reference_format ?? null;
          const packaging = p.packaging ?? null;
          const thumbnail = p.thumbnail ?? null;
          const shareUrl = p.share_url ?? null;

          if (!slug || !name || isNaN(productId)) continue;

          try {
            await conn.execute(
              `INSERT INTO mercadona_products 
                (id, slug, name, category_name, subcategory_name, unit_price, bulk_price, unit_size, reference_format, packaging, thumbnail, share_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                 name = VALUES(name),
                 category_name = VALUES(category_name),
                 subcategory_name = VALUES(subcategory_name),
                 unit_price = VALUES(unit_price),
                 bulk_price = VALUES(bulk_price),
                 unit_size = VALUES(unit_size),
                 reference_format = VALUES(reference_format),
                 packaging = VALUES(packaging),
                 thumbnail = VALUES(thumbnail),
                 share_url = VALUES(share_url)`,
              [productId, slug, name, categoryName, subcategoryName, price, bulkPrice, unitSize, referenceFormat, packaging, thumbnail, shareUrl]
            );
            totalInserted++;
          } catch (err) {
            console.error(`    ❌ Error insertando ${slug}:`, err.message);
            totalSkipped++;
          }
        }
      } catch (err) {
        console.error(`  ❌ Error en subcategoría ${subId}:`, err.message);
      }
    }
    await sleep(300);
  }

  const [[countRow]] = await conn.execute("SELECT COUNT(*) as total FROM mercadona_products");
  console.log(`\n✅ Importación completada:`);
  console.log(`   Procesados/actualizados: ${totalInserted}`);
  console.log(`   Errores: ${totalSkipped}`);
  console.log(`   Total en BD: ${countRow.total}`);
  await conn.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
