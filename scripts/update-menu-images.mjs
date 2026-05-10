/**
 * Script para actualizar los menús seeded con sus imágenes de portada desde CDN
 * Ejecutar con: node scripts/update-menu-images.mjs
 */
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not found"); process.exit(1); }

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Mapeo de nombre de menú → URL de imagen CDN
const MENU_IMAGES = {
  "Menú Pérdida de Peso - 7 días": "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/perdida-peso_fc448d8e.jpg",
  "Menú Ganancia Muscular - 7 días": "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ganancia-muscular_34529480.jpg",
  "Menú Mediterráneo Equilibrado": "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mediterraneo_302bfcb5.jpg",
  "Menú Vegano Completo": "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/vegano_2aac20d3.jpg",
  "Menú Definición Muscular": "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/definicion_9729d51a.jpg",
  "Menú Mantenimiento Saludable": "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mantenimiento_1070987f.jpg",
  "Menú Pérdida de Grasa Avanzado": "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/perdida-grasa_6d7bf7fe.jpg",
  "Menú Familiar Equilibrado": "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/familiar_83207b83.jpg",
};

async function updateImages() {
  const client = await pool.connect();
  try {
    console.log("Updating menu cover images...");
    let updated = 0;

    for (const [name, imageUrl] of Object.entries(MENU_IMAGES)) {
      const result = await client.query(
        'UPDATE menu_organizers SET "coverImage" = $1, "updatedAt" = NOW() WHERE name = $2 AND "isSeeded" = true RETURNING id',
        [imageUrl, name]
      );
      if (result.rows.length > 0) {
        console.log(`  ✓ Updated "${name}" (id: ${result.rows[0].id})`);
        updated++;
      } else {
        console.log(`  ⚠ Not found: "${name}"`);
      }
    }

    console.log(`\n✅ Updated ${updated}/${Object.keys(MENU_IMAGES).length} menus with cover images`);

    // Verify
    const verify = await client.query(
      'SELECT id, name, "coverImage" FROM menu_organizers WHERE "isSeeded" = true ORDER BY id'
    );
    console.log("\nVerification:");
    verify.rows.forEach(r => console.log(`  [${r.id}] ${r.name}: ${r.coverImage ? '✓ has image' : '✗ no image'}`));

  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

updateImages();
