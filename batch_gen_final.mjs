/**
 * Batch Recipe Image Generator - Final Version
 * Concurrency: 2 (safe for rate limits)
 * With proper retry and backoff
 */
import pg from 'pg';

const ENV = {
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || '',
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
};

const BATCH_SIZE = 50;
const CONCURRENCY = 2;
const MAX_RETRIES = 3;
const DELAY_BETWEEN_PAIRS_MS = 500; // 500ms between each pair

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
    throw new Error(`Upload (${response.status}): ${msg.substring(0, 80)}`);
  }
  return (await response.json());
}

// --- Image Generation ---
async function generateAndUpload(prompt) {
  const baseUrl = ENV.forgeApiUrl.endsWith('/') ? ENV.forgeApiUrl : ENV.forgeApiUrl + '/';
  const fullUrl = new URL('images.v1.ImageService/GenerateImage', baseUrl).toString();
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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
        const wait = Math.pow(2, attempt + 1) * 2000;
        console.log(`    Rate limited (${response.status}), waiting ${wait/1000}s...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      
      if (!response.ok) {
        const detail = await response.text();
        if (attempt === MAX_RETRIES) throw new Error(`(${response.status})`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      
      const result = await response.json();
      const buffer = Buffer.from(result.image.b64Json, 'base64');
      const key = `recipe-dishes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const { url } = await storagePut(key, buffer, result.image.mimeType);
      return url;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}

// --- Build Prompt ---
function buildPrompt(name, mealTime, cuisineType) {
  const clean = name.replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜàèìòùâêîôûäëïöü:,\-()]/g, '').trim();
  return `Professional food photography of "${clean}" as a finished plated dish, ready to eat. Restaurant quality, natural lighting, appetizing, food magazine style.${cuisineType ? ` ${cuisineType} cuisine.` : ''}`;
}

// --- Main ---
async function main() {
  const pool = new pg.Pool({ connectionString: ENV.databaseUrl, ssl: { rejectUnauthorized: false }, max: 5 });
  
  const { rows: [{ pending: totalPendingStr }] } = await pool.query(`
    SELECT COUNT(*) as pending FROM recipes 
    WHERE "isSeeded" = true AND "deletedAt" IS NULL AND "imageUrl" LIKE '%unsplash%'
  `);
  const totalPending = Number(totalPendingStr);
  
  console.log(`\n=== BATCH IMAGE GEN v4 | Pending: ${totalPending} | Concurrency: ${CONCURRENCY} ===\n`);
  
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
    const rate = totalSuccess > 0 ? (totalSuccess / ((Date.now() - startTime) / 1000 / 60)).toFixed(1) : '-';
    const remaining = totalPending - totalSuccess - totalFailed;
    const etaMin = totalSuccess > 0 ? (remaining / (totalSuccess / ((Date.now() - startTime) / 1000 / 60))).toFixed(0) : '?';
    
    console.log(`Batch #${batchNum} | ✓${totalSuccess} ✗${totalFailed} of ${totalPending} (${Math.round(totalSuccess/totalPending*100)}%) | ${rate}/min | ETA: ${etaMin}min | ${elapsed}min elapsed`);
    
    let batchS = 0, batchF = 0;
    
    // Process in pairs
    for (let i = 0; i < recipes.length; i += CONCURRENCY) {
      const chunk = recipes.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(async (recipe) => {
          const prompt = buildPrompt(recipe.name, recipe.mealTime, recipe.cuisineType);
          const url = await generateAndUpload(prompt);
          await pool.query(`UPDATE recipes SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2`, [url, recipe.id]);
          return url;
        })
      );
      
      for (const r of results) {
        if (r.status === 'fulfilled') { batchS++; totalSuccess++; }
        else { batchF++; totalFailed++; }
      }
      
      // Delay between pairs
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_PAIRS_MS));
    }
    
    console.log(`  → ✓${batchS} ✗${batchF}`);
  }
  
  const totalElapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== DONE: ✓${totalSuccess} ✗${totalFailed} in ${totalElapsed}min (${(totalSuccess/(totalElapsed||1)).toFixed(1)}/min) ===\n`);
  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
