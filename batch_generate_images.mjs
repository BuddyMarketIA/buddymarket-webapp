/**
 * Batch Recipe Image Generator
 * Processes recipes in batches of 100, generating AI images of finished dishes
 * and uploading to S3/CloudFront.
 */
import pg from 'pg';

const ENV = {
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || '',
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
};

const BATCH_SIZE = 100;
const DELAY_BETWEEN_IMAGES_MS = 300; // 300ms between images
const DELAY_BETWEEN_BATCHES_MS = 2000; // 2s between batches
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
  
  // Upload to S3
  const key = `recipe-dishes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const { url } = await storagePut(key, buffer, result.image.mimeType);
  return url;
}

// --- Build Prompt ---
function buildDishPrompt(name, mealTime, cuisineType, cookingMethod) {
  const cleanName = name.replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜàèìòùâêîôûäëïöü:,\-()]/g, '').trim();
  
  let prompt = `Professional food photography of "${cleanName}" as a finished plated dish. `;
  prompt += `The image shows the complete prepared meal served on a plate, ready to eat. `;
  prompt += `Top-down or 45-degree angle, restaurant quality presentation. `;
  prompt += `Natural lighting, shallow depth of field, clean background. `;
  
  if (cuisineType) {
    prompt += `${cuisineType} cuisine style plating. `;
  }
  
  if (mealTime) {
    const mealContext = {
      desayuno: 'Breakfast presentation with morning light.',
      media_manana: 'Light mid-morning snack presentation.',
      comida: 'Lunch/dinner main course presentation.',
      merienda: 'Afternoon snack or light bite presentation.',
      cena: 'Elegant dinner presentation with warm lighting.',
      cualquiera: '',
    };
    prompt += mealContext[mealTime] || '';
  }
  
  prompt += `High resolution, appetizing, food magazine quality.`;
  return prompt;
}

// --- Main ---
async function main() {
  const pool = new pg.Pool({ connectionString: ENV.databaseUrl, ssl: { rejectUnauthorized: false } });
  
  // Get total pending count
  const countResult = await pool.query(`
    SELECT COUNT(*) as pending FROM recipes 
    WHERE "isSeeded" = true AND "deletedAt" IS NULL AND "imageUrl" LIKE '%unsplash%'
  `);
  const totalPending = Number(countResult.rows[0].pending);
  const totalBatches = Math.ceil(totalPending / BATCH_SIZE);
  
  console.log(`\n========================================`);
  console.log(`  BATCH RECIPE IMAGE GENERATOR`);
  console.log(`  Total pending: ${totalPending}`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log(`  Total batches: ${totalBatches}`);
  console.log(`========================================\n`);
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let batchNum = 0;
  
  while (true) {
    batchNum++;
    
    // Always fetch from offset 0 since we update as we go
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
    
    const remaining = totalPending - totalSuccess - totalFailed;
    console.log(`\n--- Batch #${batchNum} (${recipes.length} recipes) | Progress: ${totalSuccess}/${totalPending} (${Math.round(totalSuccess/totalPending*100)}%) | Remaining: ~${remaining} ---`);
    
    let batchSuccess = 0;
    let batchFailed = 0;
    
    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const prompt = buildDishPrompt(recipe.name, recipe.mealTime, recipe.cuisineType, recipe.cookingMethod);
      
      let success = false;
      for (let retry = 0; retry <= MAX_RETRIES; retry++) {
        try {
          const newUrl = await generateImage(prompt);
          await pool.query(`UPDATE recipes SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2`, [newUrl, recipe.id]);
          batchSuccess++;
          totalSuccess++;
          success = true;
          
          if ((i + 1) % 10 === 0 || i === recipes.length - 1) {
            process.stdout.write(`  [${i+1}/${recipes.length}] ✓${batchSuccess} ✗${batchFailed} | Total: ${totalSuccess}/${totalPending}\r`);
          }
          break;
        } catch (err) {
          if (retry < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 2000)); // wait before retry
          } else {
            batchFailed++;
            totalFailed++;
            console.log(`  ❌ ID:${recipe.id} "${recipe.name.substring(0, 30)}..." - ${err.message.substring(0, 60)}`);
          }
        }
      }
      
      // Delay between images
      if (success) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_IMAGES_MS));
      }
    }
    
    console.log(`\n  Batch #${batchNum} complete: ✓${batchSuccess} ✗${batchFailed}`);
    console.log(`  TOTAL: ✓${totalSuccess} ✗${totalFailed} of ${totalPending} (${Math.round((totalSuccess+totalFailed)/totalPending*100)}%)`);
    
    // Delay between batches
    await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
  }
  
  console.log(`\n========================================`);
  console.log(`  FINAL RESULTS`);
  console.log(`  Success: ${totalSuccess}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`  Total: ${totalSuccess + totalFailed}`);
  console.log(`========================================\n`);
  
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
