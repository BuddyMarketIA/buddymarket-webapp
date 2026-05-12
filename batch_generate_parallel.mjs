/**
 * Parallel Batch Recipe Image Generator
 * Processes 5 images concurrently to speed up generation.
 * ~5x faster than sequential processing.
 */
import pg from 'pg';

const ENV = {
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || '',
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
};

const BATCH_SIZE = 100;
const CONCURRENCY = 5; // Process 5 images at a time
const DELAY_BETWEEN_BATCHES_MS = 1000;
const MAX_RETRIES = 2;

// --- S3 Upload ---
async function storagePut(relKey, data, contentType) {
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, '');
  const url = new URL('v1/storage/upload', baseUrl + '/');
  url.searchParams.set('path', relKey.replace(/^\/+/, ''));
  
  const blob = new Blob([data], { type: contentType });
  const form = new FormData();
  form.append('file', blob, relKey.split('/').pop());
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    body: form,
  });
  
  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`Upload failed (${response.status}): ${msg.substring(0, 100)}`);
  }
  return (await response.json());
}

// --- Image Generation ---
async function generateImage(prompt) {
  const baseUrl = ENV.forgeApiUrl.endsWith('/') ? ENV.forgeApiUrl : ENV.forgeApiUrl + '/';
  const fullUrl = new URL('images.v1.ImageService/GenerateImage', baseUrl).toString();
  
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'connect-protocol-version': '1',
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({ prompt, original_images: [] }),
  });
  
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Image gen failed (${response.status}): ${detail.substring(0, 150)}`);
  }
  
  const result = await response.json();
  const buffer = Buffer.from(result.image.b64Json, 'base64');
  
  const key = `recipe-dishes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const { url } = await storagePut(key, buffer, result.image.mimeType);
  return url;
}

// --- Build Prompt ---
function buildDishPrompt(name, mealTime, cuisineType) {
  const cleanName = name.replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜàèìòùâêîôûäëïöü:,\-()]/g, '').trim();
  
  let prompt = `Professional food photography of "${cleanName}" as a finished plated dish. `;
  prompt += `Complete prepared meal served on a plate, ready to eat. `;
  prompt += `Top-down or 45-degree angle, restaurant quality. `;
  prompt += `Natural lighting, clean background. `;
  
  if (cuisineType) prompt += `${cuisineType} cuisine. `;
  
  const mealContext = {
    desayuno: 'Breakfast.',
    media_manana: 'Snack.',
    comida: 'Main course.',
    merienda: 'Light bite.',
    cena: 'Dinner.',
  };
  if (mealTime && mealContext[mealTime]) prompt += mealContext[mealTime];
  
  prompt += ` Appetizing, food magazine quality.`;
  return prompt;
}

// --- Process a single recipe with retries ---
async function processRecipe(pool, recipe) {
  const prompt = buildDishPrompt(recipe.name, recipe.mealTime, recipe.cuisineType);
  
  for (let retry = 0; retry <= MAX_RETRIES; retry++) {
    try {
      const newUrl = await generateImage(prompt);
      await pool.query(`UPDATE recipes SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2`, [newUrl, recipe.id]);
      return { success: true };
    } catch (err) {
      if (retry < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
      } else {
        return { success: false, error: err.message?.substring(0, 80) };
      }
    }
  }
}

// --- Process chunk of recipes concurrently ---
async function processChunk(pool, recipes) {
  const results = await Promise.all(recipes.map(r => processRecipe(pool, r)));
  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  return { success, failed, errors: results.filter(r => !r.success) };
}

// --- Main ---
async function main() {
  const pool = new pg.Pool({ connectionString: ENV.databaseUrl, ssl: { rejectUnauthorized: false }, max: 10 });
  
  const countResult = await pool.query(`
    SELECT COUNT(*) as pending FROM recipes 
    WHERE "isSeeded" = true AND "deletedAt" IS NULL AND "imageUrl" LIKE '%unsplash%'
  `);
  const totalPending = Number(countResult.rows[0].pending);
  
  console.log(`\n========================================`);
  console.log(`  PARALLEL BATCH RECIPE IMAGE GENERATOR`);
  console.log(`  Total pending: ${totalPending}`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log(`  Concurrency: ${CONCURRENCY} parallel`);
  console.log(`  Est. time per batch: ~${Math.ceil(BATCH_SIZE/CONCURRENCY * 8)}s`);
  console.log(`========================================\n`);
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let batchNum = 0;
  const startTime = Date.now();
  
  while (true) {
    batchNum++;
    
    const { rows: recipes } = await pool.query(`
      SELECT id, name, "mealTime", "cuisineType", "cookingMethod"
      FROM recipes
      WHERE "isSeeded" = true AND "deletedAt" IS NULL AND "imageUrl" LIKE '%unsplash%'
      ORDER BY id ASC
      LIMIT ${BATCH_SIZE}
    `);
    
    if (recipes.length === 0) {
      console.log(`\n✅ ALL DONE! No more recipes pending.`);
      break;
    }
    
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const rate = totalSuccess > 0 ? (totalSuccess / ((Date.now() - startTime) / 1000 / 60)).toFixed(1) : '0';
    console.log(`\n--- Batch #${batchNum} (${recipes.length} recipes) | Done: ${totalSuccess}/${totalPending} (${Math.round(totalSuccess/totalPending*100)}%) | Rate: ${rate}/min | Elapsed: ${elapsed}min ---`);
    
    let batchSuccess = 0;
    let batchFailed = 0;
    
    // Process in chunks of CONCURRENCY
    for (let i = 0; i < recipes.length; i += CONCURRENCY) {
      const chunk = recipes.slice(i, i + CONCURRENCY);
      const result = await processChunk(pool, chunk);
      batchSuccess += result.success;
      batchFailed += result.failed;
      totalSuccess += result.success;
      totalFailed += result.failed;
      
      process.stdout.write(`  [${Math.min(i + CONCURRENCY, recipes.length)}/${recipes.length}] ✓${batchSuccess} ✗${batchFailed} | Total: ${totalSuccess}/${totalPending} (${Math.round(totalSuccess/totalPending*100)}%)\r`);
    }
    
    console.log(`\n  Batch #${batchNum}: ✓${batchSuccess} ✗${batchFailed} | TOTAL: ✓${totalSuccess} ✗${totalFailed} (${Math.round((totalSuccess+totalFailed)/totalPending*100)}%)`);
    
    await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
  }
  
  const totalElapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n========================================`);
  console.log(`  FINAL RESULTS`);
  console.log(`  Success: ${totalSuccess}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`  Total time: ${totalElapsed} minutes`);
  console.log(`  Avg rate: ${(totalSuccess / (totalElapsed || 1)).toFixed(1)} imgs/min`);
  console.log(`========================================\n`);
  
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
