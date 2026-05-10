/**
 * Script: regenerate-recipe-images.mjs
 * 
 * Regenera las imágenes de recetas en la BD usando la IA de generación de imágenes.
 * Procesa en lotes de 10 recetas por ejecución para no saturar la API.
 * 
 * Uso: node scripts/regenerate-recipe-images.mjs [--batch-size=10] [--all]
 * 
 * Flags:
 *   --batch-size=N  Número de recetas a procesar por ejecución (default: 10)
 *   --all           Regenerar TODAS las imágenes (incluyendo las que ya tienen)
 *   --missing-only  Solo las que no tienen imagen (default: incluye Unsplash)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Parse args
const args = process.argv.slice(2);
const batchSizeArg = args.find(a => a.startsWith('--batch-size='));
const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10;
const REGENERATE_ALL = args.includes('--all');

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error('❌ Faltan variables de entorno: BUILT_IN_FORGE_API_URL y BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

/**
 * Genera una imagen para una receta usando la API de Forge y la sube a S3
 */
async function generateAndUploadRecipeImage(recipe) {
  const ingredients = recipe.ingredientsJson 
    ? (() => {
        try {
          return JSON.parse(recipe.ingredientsJson).slice(0, 5).map(i => i.name || i.ingredient || i).join(', ');
        } catch { return ''; }
      })()
    : '';
  
  const cuisineLabel = recipe.cuisineType ? `${recipe.cuisineType} cuisine` : 'Mediterranean';
  const descPart = recipe.description ? recipe.description.substring(0, 80) : '';
  
  const prompt = `Professional food photography of "${recipe.name}", a ${cuisineLabel} dish. ${
    ingredients ? `Ingredients visible: ${ingredients}.` : ''
  } ${descPart}
  Overhead shot on a clean white ceramic plate, natural soft lighting, restaurant quality presentation, appetizing colors, high resolution 4K food photography. No text, no people.`;

  // 1. Generar imagen
  const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : `${FORGE_API_URL}/`;
  const generateUrl = new URL('images.v1.ImageService/GenerateImage', baseUrl).toString();

  const genResponse = await fetch(generateUrl, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'connect-protocol-version': '1',
      'authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({ prompt, original_images: [] }),
  });

  if (!genResponse.ok) {
    const detail = await genResponse.text().catch(() => '');
    throw new Error(`Image API error ${genResponse.status}: ${detail.substring(0, 100)}`);
  }

  const genResult = await genResponse.json();
  const b64Json = genResult.image?.b64Json;
  const mimeType = genResult.image?.mimeType || 'image/png';

  if (!b64Json) {
    throw new Error('API no devolvió imagen');
  }

  // 2. Subir a S3 via storage API
  const buffer = Buffer.from(b64Json, 'base64');
  const relKey = `recipes/recipe-${recipe.id}-${Date.now()}.png`;
  
  const uploadUrl = new URL('v1/storage/upload', baseUrl);
  uploadUrl.searchParams.set('path', relKey);
  
  const blob = new Blob([buffer], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, `recipe-${recipe.id}.png`);

  const uploadResponse = await fetch(uploadUrl.toString(), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FORGE_API_KEY}` },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => '');
    throw new Error(`Storage upload error ${uploadResponse.status}: ${detail.substring(0, 100)}`);
  }

  const uploadResult = await uploadResponse.json();
  const imageUrl = uploadResult.url;

  if (!imageUrl) {
    throw new Error('Storage no devolvió URL');
  }

  return imageUrl;
}

async function main() {
  console.log(`\n🍽️  BuddyMarket — Regenerador de imágenes de recetas`);
  console.log(`📦 Lote: ${BATCH_SIZE} recetas | Modo: ${REGENERATE_ALL ? 'TODAS' : 'sin imagen + Unsplash'}\n`);

  // Obtener recetas a procesar
  const whereClause = REGENERATE_ALL 
    ? `WHERE "deletedAt" IS NULL`
    : `WHERE "deletedAt" IS NULL AND ("imageUrl" IS NULL OR "imageUrl" = '' OR "imageUrl" LIKE '%unsplash%')`;

  const countResult = await pool.query(`SELECT COUNT(*) as total FROM recipes ${whereClause}`);
  const totalPending = parseInt(countResult.rows[0].total);
  
  console.log(`📊 Recetas pendientes de imagen: ${totalPending}`);
  
  if (totalPending === 0) {
    console.log('✅ ¡Todas las recetas ya tienen imagen correcta!');
    await pool.end();
    return { success: 0, failed: 0, remaining: 0 };
  }

  const recipes = await pool.query(`
    SELECT id, name, description, "cuisineType", "ingredientsJson"
    FROM recipes 
    ${whereClause}
    ORDER BY id ASC
    LIMIT $1
  `, [BATCH_SIZE]);

  console.log(`🔄 Procesando ${recipes.rows.length} recetas en este lote...\n`);

  let success = 0;
  let failed = 0;

  for (const recipe of recipes.rows) {
    const nameDisplay = recipe.name.substring(0, 42).padEnd(42);
    process.stdout.write(`  [${String(recipe.id).padStart(3)}] ${nameDisplay} → `);
    
    try {
      const imageUrl = await generateAndUploadRecipeImage(recipe);

      // Actualizar en BD
      await pool.query(
        `UPDATE recipes SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [imageUrl, recipe.id]
      );

      const shortUrl = imageUrl.length > 55 ? imageUrl.substring(0, 52) + '...' : imageUrl;
      console.log(`✅ ${shortUrl}`);
      success++;

      // Esperar 2s entre generaciones para no saturar la API
      await new Promise(r => setTimeout(r, 2000));

    } catch(e) {
      const errMsg = e.message.substring(0, 65);
      console.log(`❌ ${errMsg}`);
      failed++;
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const remaining = totalPending - success;
  
  console.log(`\n📈 Resultado del lote:`);
  console.log(`   ✅ Éxito:    ${success}`);
  console.log(`   ❌ Fallidos: ${failed}`);
  console.log(`   📊 Pendientes restantes: ${remaining}`);
  
  if (remaining > 0) {
    console.log(`\n⏳ Quedan ${remaining} recetas. El job diario continuará mañana.`);
  } else {
    console.log(`\n🎉 ¡Todas las recetas tienen imagen! Tarea completada.`);
  }

  await pool.end();
  return { success, failed, remaining };
}

main().catch(e => {
  console.error('Error fatal:', e.message);
  process.exit(1);
});
