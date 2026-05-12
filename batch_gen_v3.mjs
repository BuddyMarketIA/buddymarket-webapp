/**
 * Batch Recipe Image Generator v3
 * Concurrency: 3 (balanced for rate limits)
 * With exponential backoff on failures
 */
import pg from 'pg';

const ENV = {
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || '',
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
};

const BATCH_SIZE = 100;
const CONCURRENCY = 3;
const MAX_RETRIES = 3;

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

// --- Image Generation with retry ---
async function generateImageWithRetry(prompt, retries = MAX_RETRIES) {
  const baseUrl = ENV.forgeApiUrl.endsWith('/') ? ENV.forgeApiUrl : ENV.forgeApiUrl + '/';
  const fullUrl = new URL('images.v1.ImageService/GenerateImage', baseUrl).toString();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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
      
      if (response.status === 429 || response.status >= 500) {
        // Rate limited or server error - wait and retry
        const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s, 16s
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`(${response.status}): ${detail.substring(0, 100)}`);
      }
      
      const result = await response.json();
      const buffer = Buffer.from(result.image.b64Json, 'base64');
      
      const key = `recipe-dishes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const { url } = await storagePut(key, buffer, result.image.mimeType);
      return url;
    } catch (err) {
      if (attempt === retries) throw err;
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
}

// --- Build Prompt ---
function buildDishPrompt(name, mealTime, cuisineType) {
  const cleanName = name.replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜàèìòùâêîôûäëïöü:,\-()]/g, '').trim();
  let prompt = `Professional food photography of "${cleanName}" as a finished plated dish, ready to eat. Restaurant quality, natural lighting, appetizing.`;
  if (cuisineType) prompt += ` ${cuisineType} cuisine.`;
  return prompt;
}

// --- Semaphore for concurrency control ---
class Semaphore {
  constructor(max) { this.max = max; this.current = 0; this.queue = []; }
  async acquire() {
    if (this.current < this.max) { this.current++; return; }
    await new Promise(resolve => this.queue.push(resolve));
    this.current++;
  }
  release() {
    this.current--;
    if (this.queue.length > 0) this.queue.shift()();
  }
}

// --- Main ---
async function main() {
  const pool = new pg.Pool({ connectionString: ENV.databaseUrl, ssl: { rejectUnauthorized: false }, max: 10 });
  const sem = new Semaphore(CONCURRENCY);
  
  const countResult = await pool.query(`
    SELECT COUNT(*) as pending FROM recipes 
    WHERE "isSeeded" = true AND "deletedAt" IS NULL AND "imageUrl" LIKE '%unsplash%'
  `);
  const totalPending = Number(countResult.rows[0].pending);
  
  console.log(`\n========================================`);
  console.log(`  BATCH IMAGE GENERATOR v3`);
  console.log(`  Pending: ${totalPending} | Concurrency: ${CONCURRENCY}`);
  console.log(`========================================\n`);
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let batchNum = 0;
  const startTime = Date.now();
  
  while (true) {
    batchNum++;
    
    const { rows: recipes } = await pool.query(`
      SELECT id, name, "mealTime", "cuisineType"
      FROM recipes
      WHERE "isSeeded" = true AND "deletedAt" IS NULL AND "imageUrl" LIKE '%unsplash%'
      ORDER BY id ASC
      LIMIT ${BATCH_SIZE}
    `);
    
    if (recipes.length === 0) {
      console.log(`\n✅ ALL DONE!`);
      break;
    }
    
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const rate = totalSuccess > 0 ? (totalSuccess / ((Date.now() - startTime) / 1000 / 60)).toFixed(1) : '0';
    const eta = totalSuccess > 0 ? ((totalPending - totalSuccess - totalFailed) / (totalSuccess / ((Date.now() - startTime) / 1000 / 60)) / 60).toFixed(1) : '?';
    console.log(`\nBatch #${batchNum} | Done: ${totalSuccess}/${totalPending} (${Math.round(totalSuccess/totalPending*100)}%) | Rate: ${rate}/min | ETA: ${eta}h | Elapsed: ${elapsed}min`);
    
    let batchSuccess = 0;
    let batchFailed = 0;
    
    // Process all recipes in batch with semaphore-controlled concurrency
    const promises = recipes.map(async (recipe) => {
      await sem.acquire();
      try {
        const prompt = buildDishPrompt(recipe.name, recipe.mealTime, recipe.cuisineType);
        const newUrl = await generateImageWithRetry(prompt);
        await pool.query(`UPDATE recipes SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2`, [newUrl, recipe.id]);
        batchSuccess++;
        totalSuccess++;
      } catch (err) {
        batchFailed++;
        totalFailed++;
        // Don't log every error to keep output clean
      } finally {
        sem.release();
      }
    });
    
    await Promise.all(promises);
    
    console.log(`  ✓${batchSuccess} ✗${batchFailed} | TOTAL: ✓${totalSuccess} ✗${totalFailed}`);
    
    // If too many failures in a batch, slow down
    if (batchFailed > 50) {
      console.log(`  ⚠️ High failure rate, waiting 30s...`);
      await new Promise(r => setTimeout(r, 30000));
    } else if (batchFailed > 20) {
      console.log(`  ⚠️ Some failures, waiting 10s...`);
      await new Promise(r => setTimeout(r, 10000));
    } else {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  const totalElapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n========================================`);
  console.log(`  FINAL: ✓${totalSuccess} ✗${totalFailed} in ${totalElapsed}min`);
  console.log(`  Rate: ${(totalSuccess / (totalElapsed || 1)).toFixed(1)} imgs/min`);
  console.log(`========================================\n`);
  
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
