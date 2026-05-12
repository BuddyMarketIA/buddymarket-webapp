/**
 * Fix Recipe Images - Parallel Version
 * 
 * Processes recipes with 5 concurrent image generations to speed things up.
 * Each image takes ~8s, so 5 parallel = ~40 images/minute instead of 7/minute.
 */
import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }
if (!FORGE_API_URL) { console.error('Missing BUILT_IN_FORGE_API_URL'); process.exit(1); }
if (!FORGE_API_KEY) { console.error('Missing BUILT_IN_FORGE_API_KEY'); process.exit(1); }

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 10 });
const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : FORGE_API_URL + '/';

async function storagePut(relKey, data, contentType) {
  const cleanKey = relKey.replace(/^\/+/, '');
  const url = new URL('v1/storage/upload', baseUrl);
  url.searchParams.set('path', cleanKey);
  
  const blob = new Blob([data], { type: contentType });
  const form = new FormData();
  form.append('file', blob, cleanKey.split('/').pop());
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FORGE_API_KEY}` },
    body: form,
  });
  
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Storage upload failed (${response.status}): ${detail.substring(0, 100)}`);
  }
  
  const result = await response.json();
  return { url: result.url, key: cleanKey };
}

async function generateImage(prompt) {
  const fullUrl = new URL('images.v1.ImageService/GenerateImage', baseUrl).toString();
  
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'connect-protocol-version': '1',
      'authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({ prompt, original_images: [] }),
  });
  
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Image gen failed (${response.status}): ${detail}`);
  }
  
  const result = await response.json();
  const buffer = Buffer.from(result.image.b64Json, 'base64');
  
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const { url } = await storagePut(
    `recipe-images/${timestamp}-${randomSuffix}.png`,
    buffer,
    result.image.mimeType || 'image/png'
  );
  
  return url;
}

function buildPrompt(name) {
  const cleanName = name.replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜàèìòùâêîôûäëïöü:,\-()\/]/g, '').trim();
  return `Professional food photography of the finished dish "${cleanName}". The complete prepared meal beautifully plated on a ceramic plate, ready to eat. 45-degree angle, restaurant quality. Natural lighting, clean background. Food magazine quality, no text, no watermarks.`;
}

async function processRecipe(recipe) {
  try {
    const prompt = buildPrompt(recipe.name);
    const imageUrl = await generateImage(prompt);
    await pool.query(
      `UPDATE recipes SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [imageUrl, recipe.id]
    );
    return { id: recipe.id, success: true };
  } catch (err) {
    return { id: recipe.id, success: false, error: err.message };
  }
}

// Process items in chunks of CONCURRENCY
async function processInParallel(items, concurrency) {
  let success = 0;
  let failed = 0;
  let processed = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const results = await Promise.all(chunk.map(processRecipe));
    
    for (const r of results) {
      processed++;
      if (r.success) success++;
      else {
        failed++;
        if (failed <= 10) console.log(`  ❌ ID ${r.id}: ${r.error}`);
      }
    }
    
    // Progress every chunk
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processed / elapsed * 60;
    const remaining = items.length - processed;
    const eta = remaining / (rate || 1);
    console.log(`📊 ${processed}/${items.length} done (${success}✅ ${failed}❌) | ${rate.toFixed(0)}/min | ETA: ${eta.toFixed(1)} min`);
    
    // Small delay between chunks to avoid overwhelming the API
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return { success, failed, processed };
}

// Parse args
const BATCH_SIZE = parseInt(process.argv[2]) || 500;
const CONCURRENCY = parseInt(process.argv[3]) || 5;

async function main() {
  console.log(`\n🍽️  Fixing recipe images (batch: ${BATCH_SIZE}, concurrency: ${CONCURRENCY})`);
  
  const result = await pool.query(`
    SELECT id, name
    FROM recipes 
    WHERE "deletedAt" IS NULL
      AND "imageUrl" LIKE '%pexels%'
    ORDER BY id ASC
    LIMIT $1
  `, [BATCH_SIZE]);
  
  const recipes = result.rows;
  console.log(`📋 Processing ${recipes.length} recipes\n`);
  
  if (recipes.length === 0) {
    console.log('✅ No more recipes to process!');
    await pool.end();
    return;
  }
  
  const { success, failed, processed } = await processInParallel(recipes, CONCURRENCY);
  
  console.log(`\n🏁 COMPLETE: ${success}✅ ${failed}❌ out of ${processed} total`);
  
  const remaining = await pool.query(`SELECT COUNT(*) as cnt FROM recipes WHERE "deletedAt" IS NULL AND "imageUrl" LIKE '%pexels%'`);
  console.log(`📊 Remaining with Pexels: ${remaining.rows[0].cnt}`);
  
  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
