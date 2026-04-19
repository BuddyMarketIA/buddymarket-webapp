/**
 * Script: regenerate-all-images.mjs
 * Regenera TODAS las imágenes de recetas pendientes con máxima concurrencia.
 * Usa Promise.allSettled en lotes de CONCURRENCY recetas simultáneas.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const CONCURRENCY = 5; // 5 imágenes en paralelo
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3000;

const pool = new Pool({ connectionString: DATABASE_URL });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function generateAndUpload(recipe, attempt = 1) {
  const ingredients = recipe.ingredientsJson
    ? (() => {
        try {
          return JSON.parse(recipe.ingredientsJson)
            .slice(0, 5)
            .map(i => i.name || i.ingredient || (typeof i === 'string' ? i : ''))
            .filter(Boolean)
            .join(', ');
        } catch { return ''; }
      })()
    : '';

  const cuisineLabel = recipe.cuisineType || 'Mediterranean';
  const descPart = recipe.description ? recipe.description.substring(0, 80) : '';

  const prompt = `Professional food photography of "${recipe.name}", a ${cuisineLabel} dish. ${
    ingredients ? `Key ingredients: ${ingredients}.` : ''
  } ${descPart}
  Overhead shot on a clean white ceramic plate, natural soft lighting, restaurant quality, appetizing, high resolution 4K. No text, no people, no hands.`;

  const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : `${FORGE_API_URL}/`;

  // Generate
  const genRes = await fetch(new URL('images.v1.ImageService/GenerateImage', baseUrl).toString(), {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'connect-protocol-version': '1',
      'authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({ prompt, original_images: [] }),
  });

  if (!genRes.ok) {
    const detail = await genRes.text().catch(() => '');
    if (genRes.status >= 500 && attempt < RETRY_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS * attempt);
      return generateAndUpload(recipe, attempt + 1);
    }
    throw new Error(`Gen API ${genRes.status}: ${detail.substring(0, 80)}`);
  }

  const genResult = await genRes.json();
  const b64Json = genResult.image?.b64Json;
  const mimeType = genResult.image?.mimeType || 'image/png';
  if (!b64Json) throw new Error('No image data in response');

  // Upload to S3
  const buffer = Buffer.from(b64Json, 'base64');
  const relKey = `recipes/recipe-${recipe.id}-${Date.now()}.png`;
  const uploadUrl = new URL('v1/storage/upload', baseUrl);
  uploadUrl.searchParams.set('path', relKey);

  const blob = new Blob([buffer], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, `recipe-${recipe.id}.png`);

  const upRes = await fetch(uploadUrl.toString(), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FORGE_API_KEY}` },
    body: formData,
  });

  if (!upRes.ok) {
    const detail = await upRes.text().catch(() => '');
    if (upRes.status >= 500 && attempt < RETRY_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS * attempt);
      return generateAndUpload(recipe, attempt + 1);
    }
    throw new Error(`Upload ${upRes.status}: ${detail.substring(0, 80)}`);
  }

  const upResult = await upRes.json();
  if (!upResult.url) throw new Error('No URL in upload response');

  // Update DB
  await pool.query(
    `UPDATE recipes SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2`,
    [upResult.url, recipe.id]
  );

  return upResult.url;
}

async function processBatch(batch, globalSuccess, globalFailed) {
  const results = await Promise.allSettled(
    batch.map(recipe => generateAndUpload(recipe))
  );

  for (let i = 0; i < batch.length; i++) {
    const recipe = batch[i];
    const result = results[i];
    const nameDisplay = recipe.name.substring(0, 40).padEnd(40);

    if (result.status === 'fulfilled') {
      const shortUrl = result.value.length > 50 ? result.value.substring(0, 47) + '...' : result.value;
      console.log(`  ✅ [${String(recipe.id).padStart(3)}] ${nameDisplay} → ${shortUrl}`);
      globalSuccess.count++;
    } else {
      console.log(`  ❌ [${String(recipe.id).padStart(3)}] ${nameDisplay} → ${result.reason?.message?.substring(0, 50)}`);
      globalFailed.ids.push(recipe.id);
    }
  }
}

async function main() {
  const startTime = Date.now();
  console.log(`\n🍽️  BuddyMarket — Regeneración MASIVA de imágenes de recetas`);
  console.log(`⚡ Concurrencia: ${CONCURRENCY} imágenes simultáneas | Reintentos: ${RETRY_ATTEMPTS}\n`);

  // Obtener TODAS las recetas pendientes
  const { rows: recipes } = await pool.query(`
    SELECT id, name, description, "cuisineType", "ingredientsJson"
    FROM recipes
    WHERE "deletedAt" IS NULL 
      AND ("imageUrl" IS NULL OR "imageUrl" = '' OR "imageUrl" LIKE '%unsplash%')
    ORDER BY id ASC
  `);

  const total = recipes.length;
  console.log(`📊 Total recetas a procesar: ${total}\n`);

  if (total === 0) {
    console.log('✅ ¡Todas las recetas ya tienen imagen correcta!');
    await pool.end();
    return;
  }

  const globalSuccess = { count: 0 };
  const globalFailed = { ids: [] };

  // Procesar en lotes de CONCURRENCY
  for (let i = 0; i < recipes.length; i += CONCURRENCY) {
    const batch = recipes.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(recipes.length / CONCURRENCY);
    
    console.log(`\n📦 Lote ${batchNum}/${totalBatches} (recetas ${i + 1}–${Math.min(i + CONCURRENCY, total)} de ${total})`);
    
    await processBatch(batch, globalSuccess, globalFailed);

    // Progreso
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const pct = ((globalSuccess.count + globalFailed.ids.length) / total * 100).toFixed(0);
    console.log(`  ⏱️  ${elapsed}s | Progreso: ${pct}% | ✅ ${globalSuccess.count} | ❌ ${globalFailed.ids.length}`);

    // Pausa entre lotes para no saturar la API
    if (i + CONCURRENCY < recipes.length) {
      await sleep(1500);
    }
  }

  // Reintentar los fallidos una vez más
  if (globalFailed.ids.length > 0) {
    console.log(`\n🔄 Reintentando ${globalFailed.ids.length} recetas fallidas...`);
    const { rows: failedRecipes } = await pool.query(
      `SELECT id, name, description, "cuisineType", "ingredientsJson" FROM recipes WHERE id = ANY($1)`,
      [globalFailed.ids]
    );
    
    const retrySuccess = { count: 0 };
    const retryFailed = { ids: [] };
    
    for (let i = 0; i < failedRecipes.length; i += CONCURRENCY) {
      const batch = failedRecipes.slice(i, i + CONCURRENCY);
      await processBatch(batch, retrySuccess, retryFailed);
      if (i + CONCURRENCY < failedRecipes.length) await sleep(2000);
    }
    
    globalSuccess.count += retrySuccess.count;
    globalFailed.ids = retryFailed.ids;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏁 COMPLETADO en ${elapsed}s`);
  console.log(`   ✅ Éxito:    ${globalSuccess.count}/${total}`);
  console.log(`   ❌ Fallidos: ${globalFailed.ids.length}/${total}`);
  if (globalFailed.ids.length > 0) {
    console.log(`   IDs fallidos: ${globalFailed.ids.join(', ')}`);
  }
  console.log(`${'='.repeat(60)}\n`);

  await pool.end();
}

main().catch(e => {
  console.error('Error fatal:', e.message);
  process.exit(1);
});
