/**
 * Batch Recipe Image Search
 * 
 * Strategy:
 * 1. Use LLM to extract a short, searchable dish name from each recipe name
 * 2. Search Pexels API for that dish name (food category)
 * 3. If found, download the image, upload to S3, update DB
 * 4. If not found, skip (leave for AI generation later)
 * 
 * Processes in batches of 50 recipes, using LLM to classify 50 at a time.
 */
import pg from 'pg';

const ENV = {
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || '',
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
};

const BATCH_SIZE = 50;

// --- LLM Call ---
async function invokeLLM(messages, responseFormat) {
  const apiUrl = ENV.forgeApiUrl.replace(/\/$/, '') + '/v1/chat/completions';
  
  const payload = {
    model: 'gemini-2.5-flash',
    messages,
    max_tokens: 8192,
    thinking: { budget_tokens: 128 },
  };
  if (responseFormat) payload.response_format = responseFormat;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM failed (${response.status}): ${err.substring(0, 200)}`);
  }
  
  const result = await response.json();
  return result.choices[0].message.content;
}

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

// --- Pexels Search ---
// Pexels is free, 200 req/hour, no API key needed for basic search
// Actually Pexels needs an API key. Let's use a different approach:
// We'll use the built-in data_api from forge to search for images

async function searchFoodImage(query) {
  // Use the built-in forge search for images
  const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, '');
  
  // Try searching via the forge data API
  const searchUrl = `${baseUrl}/v1/data_api/search`;
  
  try {
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        query: `${query} food dish plated`,
        search_type: 'image',
        max_results: 3,
      }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    if (result.results && result.results.length > 0) {
      return result.results[0].url || result.results[0].image_url;
    }
    return null;
  } catch {
    return null;
  }
}

// --- Download image and upload to S3 ---
async function downloadAndUpload(imageUrl, recipeId) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const key = `recipe-dishes/${recipeId}-${Date.now()}.${ext}`;
    
    const { url } = await storagePut(key, buffer, contentType);
    return url;
  } catch {
    return null;
  }
}

// --- Use LLM to extract searchable dish names ---
async function extractSearchTerms(recipes) {
  const recipeList = recipes.map((r, i) => `${i+1}. ${r.name}`).join('\n');
  
  const content = await invokeLLM([
    {
      role: 'system',
      content: `You are a food expert. Given a list of Spanish recipe names, extract a SHORT searchable English term for each that describes the FINISHED DISH (not ingredients). 
The term should be something you'd search on Google Images to find a photo of the plated dish.
Examples:
- "Ensalada tibia integral de pavo, espinacas y arándanos" → "warm turkey spinach salad"
- "Filete de salmón al horno con puré cremoso de brócoli" → "baked salmon fillet broccoli puree"
- "Tostadas Crujientes de Almendra con Aguacate y Huevo Poché" → "avocado toast poached egg"
- "Mousse Cremosa de Aguacate y Lentejas Rojas" → "avocado lentil mousse"
- "Paella Valenciana" → "paella valenciana"

Return ONLY a JSON array of objects with "index" (1-based) and "term" (the English search term, max 5 words).
If a recipe is too unique/specific to find a real photo, set term to "SKIP".`
    },
    {
      role: 'user',
      content: recipeList
    }
  ], {
    type: 'json_schema',
    json_schema: {
      name: 'search_terms',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          terms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                index: { type: 'integer' },
                term: { type: 'string' }
              },
              required: ['index', 'term'],
              additionalProperties: false
            }
          }
        },
        required: ['terms'],
        additionalProperties: false
      }
    }
  });
  
  try {
    const parsed = JSON.parse(content);
    return parsed.terms;
  } catch {
    console.log('  Failed to parse LLM response');
    return [];
  }
}

// --- Main ---
async function main() {
  const pool = new pg.Pool({ connectionString: ENV.databaseUrl, ssl: { rejectUnauthorized: false }, max: 5 });
  
  // First, let's test if the data_api search works
  console.log('Testing image search API...');
  const testResult = await searchFoodImage('paella valenciana');
  console.log('Test result:', testResult ? 'Found image!' : 'No result - trying alternative approach');
  
  if (!testResult) {
    // Try alternative: use forge image search endpoint
    console.log('\nTrying alternative search endpoints...');
    
    const baseUrl = ENV.forgeApiUrl.replace(/\/+$/, '');
    
    // List available endpoints
    const endpoints = [
      '/v1/data_api/search',
      '/v1/search',
      '/v1/images/search',
    ];
    
    for (const ep of endpoints) {
      try {
        const r = await fetch(`${baseUrl}${ep}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${ENV.forgeApiKey}`,
          },
          body: JSON.stringify({ query: 'paella', search_type: 'image', max_results: 1 }),
        });
        console.log(`  ${ep}: ${r.status} ${r.statusText}`);
        if (r.ok) {
          const data = await r.json();
          console.log(`  Response:`, JSON.stringify(data).substring(0, 300));
        }
      } catch (err) {
        console.log(`  ${ep}: Error - ${err.message}`);
      }
    }
  }
  
  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
