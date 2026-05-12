/**
 * Fix Recipe Images Script
 * 
 * Uses the built-in Forge Image Generation API to generate proper dish photos
 * for all recipes with Pexels URLs (which are wrong/mismatched).
 * 
 * Processes in batches with delays to avoid rate limiting.
 */
import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }
if (!FORGE_API_URL) { console.error('Missing BUILT_IN_FORGE_API_URL'); process.exit(1); }
if (!FORGE_API_KEY) { console.error('Missing BUILT_IN_FORGE_API_KEY'); process.exit(1); }

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : FORGE_API_URL + '/';

// Storage upload using the correct v1/storage/upload endpoint
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
    body: JSON.stringify({
      prompt,
      original_images: [],
    }),
  });
  
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Image generation failed (${response.status}): ${detail.substring(0, 100)}`);
  }
  
  const result = await response.json();
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Upload to S3 using correct endpoint
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
  // Clean the recipe name (remove emojis, special chars)
  const cleanName = name.replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜàèìòùâêîôûäëïöü:,\-()\/]/g, '').trim();
  
  let prompt = `Professional food photography of the finished dish "${cleanName}". `;
  prompt += `The image shows the complete prepared meal beautifully plated on a white or ceramic plate, ready to eat. `;
  prompt += `Shot from a 45-degree angle, restaurant quality presentation. `;
  prompt += `Natural lighting, shallow depth of field, clean background. `;
  prompt += `High resolution, appetizing, food magazine quality. No text, no watermarks.`;
  return prompt;
}

// Parse command line args
const args = process.argv.slice(2);
const BATCH_SIZE = parseInt(args[0]) || 50;
const OFFSET = parseInt(args[1]) || 0;

async function main() {
  console.log(`\n🍽️  Fixing recipe images (batch size: ${BATCH_SIZE}, offset: ${OFFSET})`);
  console.log('📊 Fetching recipes with Pexels images...\n');
  
  // Get recipes that have Pexels images (which are wrong)
  const result = await pool.query(`
    SELECT id, name
    FROM recipes 
    WHERE "deletedAt" IS NULL
      AND "imageUrl" LIKE '%pexels%'
    ORDER BY id ASC
    LIMIT $1 OFFSET $2
  `, [BATCH_SIZE, OFFSET]);
  
  const recipes = result.rows;
  console.log(`📋 Processing ${recipes.length} recipes (offset ${OFFSET})\n`);
  
  if (recipes.length === 0) {
    console.log('✅ No more recipes to process!');
    await pool.end();
    return;
  }
  
  let success = 0;
  let failed = 0;
  const DELAY_BETWEEN = 1500; // 1.5 seconds between each image
  
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const progress = `[${OFFSET + i + 1}] (${i + 1}/${recipes.length})`;
    
    try {
      const prompt = buildPrompt(recipe.name);
      process.stdout.write(`${progress} 🎨 ${recipe.name}... `);
      
      const imageUrl = await generateImage(prompt);
      
      // Update DB
      await pool.query(
        `UPDATE recipes SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [imageUrl, recipe.id]
      );
      
      success++;
      console.log('✅');
    } catch (err) {
      failed++;
      console.log(`❌ ${err.message.substring(0, 80)}`);
    }
    
    // Delay between requests
    if (i < recipes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN));
    }
    
    // Progress report every 25
    if ((i + 1) % 25 === 0) {
      console.log(`\n📊 Progress: ${success} success, ${failed} failed, ${recipes.length - i - 1} remaining\n`);
    }
  }
  
  console.log(`\n🏁 BATCH COMPLETE: ${success} success, ${failed} failed out of ${recipes.length} total`);
  console.log(`📌 Next offset: ${OFFSET + recipes.length}`);
  
  // Check remaining
  const remaining = await pool.query(`SELECT COUNT(*) as cnt FROM recipes WHERE "deletedAt" IS NULL AND "imageUrl" LIKE '%pexels%'`);
  console.log(`📊 Remaining recipes with Pexels images: ${remaining.rows[0].cnt}`);
  
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
