#!/usr/bin/env node
/**
 * Test script: Generate AI images for 5 sample recipes to verify quality
 */
import 'dotenv/config';
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const pool = new pg.Pool({ 
  connectionString: DATABASE_URL, 
  ssl: { rejectUnauthorized: false },
  max: 5
});

async function storagePut(relKey, data, contentType) {
  const baseUrl = FORGE_API_URL.replace(/\/+$/, '');
  const key = relKey.replace(/^\/+/, '');
  const url = new URL('v1/storage/upload', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  url.searchParams.set('path', key);
  const blob = new Blob([data], { type: contentType });
  const form = new FormData();
  form.append('file', blob, key.split('/').pop() ?? key);
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${FORGE_API_KEY}` },
    body: form,
  });
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  return { url: (await response.json()).url };
}

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
    body: JSON.stringify({ prompt, original_images: [] }),
  });
  if (!response.ok) throw new Error(`Gen failed: ${response.status} ${await response.text()}`);
  const result = await response.json();
  return { buffer: Buffer.from(result.image.b64Json, 'base64'), mimeType: result.image.mimeType || 'image/png' };
}

function buildPrompt(recipe) {
  const mealContext = {
    desayuno: 'breakfast setting, morning light',
    media_manana: 'mid-morning snack, bright natural light',
    comida: 'lunch plating, warm afternoon light',
    merienda: 'afternoon snack, soft light',
    cena: 'dinner setting, warm ambient lighting',
  };
  const timeContext = mealContext[recipe.mealTime] || 'natural lighting';
  let prompt = `Professional food photography of "${recipe.name}".`;
  if (recipe.cuisineType) prompt += ` ${recipe.cuisineType} cuisine style.`;
  prompt += ` Beautifully plated, ${timeContext}, top-down or 45-degree angle shot, vibrant natural colors, appetizing, restaurant quality presentation. Clean background, shallow depth of field. No text, no watermarks, no people, no hands.`;
  return prompt;
}

async function main() {
  // Get 5 diverse recipes with Pexels images
  const { rows: recipes } = await pool.query(`
    SELECT id, name, "cuisineType", "mealTime", "imageUrl"
    FROM recipes 
    WHERE "imageUrl" LIKE 'https://images.pexels%'
    ORDER BY id ASC
    LIMIT 5
  `);

  console.log(`Testing with ${recipes.length} recipes:\n`);
  
  for (const recipe of recipes) {
    console.log(`Processing: ${recipe.id} | ${recipe.name} | ${recipe.cuisineType || 'N/A'} | ${recipe.mealTime || 'N/A'}`);
    const prompt = buildPrompt(recipe);
    console.log(`  Prompt: ${prompt.substring(0, 120)}...`);
    
    try {
      const start = Date.now();
      const { buffer, mimeType } = await generateImage(prompt);
      const genTime = Date.now() - start;
      
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileKey = `recipe-dishes/${recipe.id}-${Date.now()}-${randomSuffix}.${ext}`;
      const { url: s3Url } = await storagePut(fileKey, buffer, mimeType);
      
      // Update DB
      await pool.query('UPDATE recipes SET "imageUrl" = $1 WHERE id = $2', [s3Url, recipe.id]);
      
      console.log(`  ✓ Generated in ${genTime}ms | Size: ${(buffer.length / 1024).toFixed(0)}KB | URL: ${s3Url}`);
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
    }
    console.log('');
  }

  await pool.end();
  console.log('Test complete!');
}

main().catch(err => { console.error(err); pool.end(); });
