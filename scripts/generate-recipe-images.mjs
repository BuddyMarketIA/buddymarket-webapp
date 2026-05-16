#!/usr/bin/env node
/**
 * Batch AI Image Generation for ALL Recipes
 * 
 * Generates professional food photography images using AI for every recipe
 * whose imageUrl is NOT already a CDN-generated image.
 * 
 * Features:
 * - Processes recipes in batches of 5 (parallel within batch)
 * - Retry logic with exponential backoff (3 retries per recipe)
 * - Progress logging to /tmp/recipe-images.log
 * - Resume support: skips recipes that already have CDN images
 * - Saves generated images to S3 via storagePut
 * - Updates the database with the new image URL
 */

import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DATABASE_URL || !FORGE_API_URL || !FORGE_API_KEY) {
  console.error('Missing required env vars: DATABASE_URL, BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

const LOG_FILE = '/tmp/recipe-images.log';
const BATCH_SIZE = 5;       // parallel requests per batch
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;
const DELAY_BETWEEN_BATCHES_MS = 1000; // 1s between batches to avoid rate limiting

// CDN prefix for already-generated images
const CDN_PREFIX = 'https://d2xsxph8kpxj0f.cloudfront.net';

const pool = new pg.Pool({ 
  connectionString: DATABASE_URL, 
  ssl: { rejectUnauthorized: false },
  max: 10
});

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ─── Storage helpers (same as server/storage.ts) ───────────────────────────
async function storagePut(relKey, data, contentType = 'application/octet-stream') {
  const baseUrl = FORGE_API_URL.replace(/\/+$/, '');
  const apiKey = FORGE_API_KEY;
  const key = relKey.replace(/^\/+/, '');
  const url = new URL('v1/storage/upload', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  url.searchParams.set('path', key);
  
  const blob = new Blob([data], { type: contentType });
  const form = new FormData();
  form.append('file', blob, key.split('/').pop() ?? key);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status}): ${message}`);
  }
  
  const result = await response.json();
  return { key, url: result.url };
}

// ─── Image generation ──────────────────────────────────────────────────────
async function generateImage(prompt) {
  const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : `${FORGE_API_URL}/`;
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
      prompt: prompt,
      original_images: [],
    }),
  });
  
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Image generation failed (${response.status}): ${detail}`);
  }
  
  const result = await response.json();
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, 'base64');
  const mimeType = result.image.mimeType || 'image/png';
  
  return { buffer, mimeType };
}

// ─── Build optimized prompt for food photography ───────────────────────────
function buildPrompt(recipe) {
  const name = recipe.name;
  const cuisine = recipe.cuisineType || '';
  const mealTime = recipe.mealTime || '';
  
  // Map meal times to context
  const mealContext = {
    desayuno: 'breakfast setting, morning light',
    media_manana: 'mid-morning snack, bright natural light',
    comida: 'lunch plating, warm afternoon light',
    merienda: 'afternoon snack, soft light',
    cena: 'dinner setting, warm ambient lighting',
  };
  
  const timeContext = mealContext[mealTime] || 'natural lighting';
  
  // Build a detailed prompt
  let prompt = `Professional food photography of "${name}".`;
  
  if (cuisine) {
    prompt += ` ${cuisine} cuisine style.`;
  }
  
  prompt += ` Beautifully plated, ${timeContext}, top-down or 45-degree angle shot, vibrant natural colors, appetizing, restaurant quality presentation. Clean background, shallow depth of field. No text, no watermarks, no people, no hands.`;
  
  return prompt;
}

// ─── Process a single recipe ───────────────────────────────────────────────
async function processRecipe(recipe) {
  const prompt = buildPrompt(recipe);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Generate the image
      const { buffer, mimeType } = await generateImage(prompt);
      
      // Upload to S3
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileKey = `recipe-dishes/${recipe.id}-${Date.now()}-${randomSuffix}.${ext}`;
      const { url: s3Url } = await storagePut(fileKey, buffer, mimeType);
      
      // Update the database
      await pool.query('UPDATE recipes SET "imageUrl" = $1 WHERE id = $2', [s3Url, recipe.id]);
      
      return { success: true, id: recipe.id, name: recipe.name, url: s3Url };
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        log(`  ⚠ Recipe ${recipe.id} "${recipe.name}" attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        log(`  ✗ Recipe ${recipe.id} "${recipe.name}" FAILED after ${MAX_RETRIES} attempts: ${err.message}`);
        return { success: false, id: recipe.id, name: recipe.name, error: err.message };
      }
    }
  }
}

// ─── Main execution ────────────────────────────────────────────────────────
async function main() {
  log('=== Recipe Image Generation Script Started ===');
  
  // Get all recipes that need new images (NOT CDN images = Pexels or other)
  const { rows: recipes } = await pool.query(`
    SELECT id, name, "cuisineType", "mealTime", description, "imageUrl"
    FROM recipes 
    WHERE "imageUrl" NOT LIKE $1
       OR "imageUrl" IS NULL
    ORDER BY id ASC
  `, [`${CDN_PREFIX}%`]);
  
  const totalRecipes = recipes.length;
  log(`Found ${totalRecipes} recipes needing AI-generated images`);
  
  if (totalRecipes === 0) {
    log('No recipes to process. Exiting.');
    await pool.end();
    return;
  }
  
  const totalBatches = Math.ceil(totalRecipes / BATCH_SIZE);
  let successCount = 0;
  let failCount = 0;
  const failures = [];
  
  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const start = batchIdx * BATCH_SIZE;
    const batch = recipes.slice(start, start + BATCH_SIZE);
    
    log(`Batch ${batchIdx + 1}/${totalBatches}: processing ${batch.length} recipes (${start + 1}-${start + batch.length} of ${totalRecipes})`);
    
    // Process batch in parallel
    const results = await Promise.all(batch.map(r => processRecipe(r)));
    
    for (const result of results) {
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        failures.push(result);
      }
    }
    
    log(`  ✓ Batch ${batchIdx + 1} done. Running total: ${successCount} success, ${failCount} failed (${successCount + failCount}/${totalRecipes})`);
    
    // Delay between batches to avoid rate limiting
    if (batchIdx < totalBatches - 1) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }
  }
  
  log('');
  log('=== FINAL SUMMARY ===');
  log(`Total recipes processed: ${successCount + failCount}`);
  log(`Successful: ${successCount}`);
  log(`Failed: ${failCount}`);
  
  if (failures.length > 0) {
    log('');
    log('Failed recipes:');
    for (const f of failures) {
      log(`  ID ${f.id}: "${f.name}" — ${f.error}`);
    }
    
    // Save failures to a file for potential retry
    fs.writeFileSync('/tmp/recipe-images-failures.json', JSON.stringify(failures, null, 2));
    log('Failure details saved to /tmp/recipe-images-failures.json');
  }
  
  log('=== Script Complete ===');
  await pool.end();
}

main().catch(err => {
  log(`FATAL ERROR: ${err.message}`);
  console.error(err);
  pool.end();
  process.exit(1);
});
