/**
 * Script de regeneración masiva de imágenes ultra-realistas para recetas
 * Uso: node scripts/regenerate-images.mjs [offset] [limit]
 * - offset: desde qué receta empezar (default: 0)
 * - limit: cuántas recetas procesar (default: 100)
 */

import pkg from '../node_modules/pg/lib/index.js';
const { Client } = pkg;

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const offset = parseInt(process.argv[2] || '0');
const limit = parseInt(process.argv[3] || '100');

console.log(`🎨 Iniciando regeneración de imágenes — offset: ${offset}, limit: ${limit}`);
console.log(`📡 Forge API: ${FORGE_API_URL ? 'OK' : 'FALTA'}`);

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// Obtener recetas que necesitan imagen (sin imagen o con placeholder)
const result = await client.query(`
  SELECT id, name, description, category, "cuisineType", "cookingMethod", "mealTime",
         "caloriesPerServing", "difficulty", "imageUrl"
  FROM recipes 
  WHERE active = true 
    AND (
      "imageUrl" IS NULL 
      OR "imageUrl" = ''
      OR "imageUrl" LIKE '%placeholder%'
      OR "imageUrl" LIKE '%unsplash%'
      OR "imageUrl" LIKE '%picsum%'
      OR "imageUrl" LIKE '%via.placeholder%'
    )
  ORDER BY id ASC
  LIMIT $1 OFFSET $2
`, [limit, offset]);

const recipes = result.rows;
console.log(`📋 Recetas a procesar: ${recipes.length}`);

let success = 0;
let failed = 0;

/**
 * Genera un prompt ultra-realista para fotografía de comida
 */
function buildImagePrompt(recipe) {
  const name = recipe.name;
  const category = recipe.category || '';
  const cuisine = recipe.cuisineType || '';
  const method = recipe.cookingMethod || '';
  const mealTime = recipe.mealTime || '';
  const calories = recipe.caloriesPerServing;
  
  // Contexto visual según tipo de plato
  let platingContext = '';
  if (category?.toLowerCase().includes('ensalada') || name?.toLowerCase().includes('ensalada')) {
    platingContext = 'in a wide ceramic bowl, fresh and colorful, with visible textures and dressing drizzle';
  } else if (category?.toLowerCase().includes('sopa') || name?.toLowerCase().includes('sopa') || name?.toLowerCase().includes('crema')) {
    platingContext = 'in a deep ceramic bowl with steam rising, garnished with fresh herbs and a drizzle of olive oil';
  } else if (name?.toLowerCase().includes('smoothie') || name?.toLowerCase().includes('batido') || name?.toLowerCase().includes('zumo')) {
    platingContext = 'in a tall glass with ice, garnished with fresh fruit slices and a straw';
  } else if (mealTime === 'breakfast' || name?.toLowerCase().includes('desayuno') || name?.toLowerCase().includes('avena') || name?.toLowerCase().includes('tostada')) {
    platingContext = 'on a white ceramic plate with morning light, rustic wooden table background';
  } else if (name?.toLowerCase().includes('pizza') || name?.toLowerCase().includes('pasta') || name?.toLowerCase().includes('risotto')) {
    platingContext = 'on a round ceramic plate, Italian restaurant style, with fresh basil and parmesan';
  } else if (name?.toLowerCase().includes('salmón') || name?.toLowerCase().includes('atún') || name?.toLowerCase().includes('merluza') || name?.toLowerCase().includes('bacalao')) {
    platingContext = 'on a white plate with elegant plating, lemon slice and fresh herbs, fine dining style';
  } else if (name?.toLowerCase().includes('pollo') || name?.toLowerCase().includes('pechuga') || name?.toLowerCase().includes('muslo')) {
    platingContext = 'on a rustic wooden board or ceramic plate, with roasted vegetables and herbs';
  } else if (name?.toLowerCase().includes('hamburguesa') || name?.toLowerCase().includes('sandwich') || name?.toLowerCase().includes('bocadillo')) {
    platingContext = 'on a wooden board, cross-section visible showing layers, with fresh lettuce and tomato';
  } else if (name?.toLowerCase().includes('tarta') || name?.toLowerCase().includes('bizcocho') || name?.toLowerCase().includes('brownie') || name?.toLowerCase().includes('galleta')) {
    platingContext = 'on a white cake stand or plate, with a slice cut to show the interior texture';
  } else if (name?.toLowerCase().includes('arroz') || name?.toLowerCase().includes('quinoa')) {
    platingContext = 'in a bowl or plate, perfectly portioned, with colorful toppings and herbs';
  } else {
    platingContext = 'on a white ceramic plate, beautifully plated with garnish, professional food photography';
  }
  
  // Estilo fotográfico
  const photoStyle = 'professional food photography, 85mm lens, f/2.8 aperture, natural side lighting from window, shallow depth of field, ultra-sharp focus on food, bokeh background';
  
  // Contexto de fondo según cocina
  let background = 'clean white marble surface';
  if (cuisine === 'mediterranean' || cuisine === 'italian') {
    background = 'rustic stone or marble surface with Mediterranean herbs';
  } else if (cuisine === 'asian' || cuisine === 'japanese') {
    background = 'dark slate surface with minimalist Japanese aesthetic';
  } else if (cuisine === 'mexican') {
    background = 'colorful ceramic tiles or wooden surface with Mexican spices';
  } else if (cuisine === 'spanish') {
    background = 'terracotta or wooden rustic Spanish kitchen surface';
  }
  
  return `${name}, ${platingContext}, ${background}, ${photoStyle}, 4K ultra-realistic, appetizing, vibrant colors, no text, no people, food only`;
}

/**
 * Genera imagen usando el ImageService de Manus (Connect Protocol)
 */
async function generateImage(prompt) {
  const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : `${FORGE_API_URL}/`;
  const fullUrl = new URL('images.v1.ImageService/GenerateImage', baseUrl).toString();
  
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'connect-protocol-version': '1',
      'authorization': `Bearer ${FORGE_API_KEY}`
    },
    body: JSON.stringify({ prompt, original_images: [] })
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ImageService error ${response.status}: ${err.substring(0, 200)}`);
  }
  
  const result = await response.json();
  // Devuelve { image: { b64Json, mimeType } }
  const base64Data = result.image?.b64Json;
  if (!base64Data) throw new Error('No se recibió imagen en la respuesta');
  
  return { buffer: Buffer.from(base64Data, 'base64'), mimeType: result.image.mimeType || 'image/png' };
}

/**
 * Sube imagen desde URL a S3 via storagePut
 */
async function uploadImageToS3(imageUrl, recipeId, recipeName) {
  // Descargar la imagen
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) throw new Error(`No se pudo descargar la imagen: ${imgResponse.status}`);
  
  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  const contentType = imgResponse.headers.get('content-type') || 'image/png';
  const ext = contentType.includes('jpeg') ? 'jpg' : 'png';
  
  // Subir a S3 via API del servidor
  const formData = new FormData();
  const blob = new Blob([buffer], { type: contentType });
  const safeName = recipeName.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30).toLowerCase();
  formData.append('file', blob, `recipe-${recipeId}-${safeName}.${ext}`);
  formData.append('key', `recipes/recipe-${recipeId}-${safeName}-${Date.now()}.${ext}`);
  
  const uploadResponse = await fetch(`${process.env.PUBLIC_APP_URL || 'http://localhost:3000'}/api/storage/upload`, {
    method: 'POST',
    body: formData
  });
  
  if (!uploadResponse.ok) {
    // Si falla el upload, usar la URL directa de la imagen generada
    console.log(`    ⚠️  Upload S3 falló, usando URL directa`);
    return imageUrl;
  }
  
  const uploadData = await uploadResponse.json();
  return uploadData.url || imageUrl;
}

// Procesar cada receta
for (let i = 0; i < recipes.length; i++) {
  const recipe = recipes[i];
  const progress = `[${offset + i + 1}/${offset + recipes.length}]`;
  
  try {
    console.log(`\n${progress} 🍽️  ${recipe.name}`);
    
    // Generar prompt ultra-realista
    const prompt = buildImagePrompt(recipe);
    console.log(`    📝 Prompt: ${prompt.substring(0, 100)}...`);
    
    // Generar imagen con IA (devuelve buffer + mimeType)
    const { buffer, mimeType } = await generateImage(prompt);
    console.log(`    🖼️  Imagen generada (${buffer.length} bytes, ${mimeType})`);
    
    // Subir a S3 directamente via Forge storage API (mismo patrón que server/storage.ts)
    const safeName = recipe.name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30).toLowerCase();
    const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
    const fileKey = `recipes/recipe-${recipe.id}-${safeName}-${Date.now()}.${ext}`;
    
    const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : `${FORGE_API_URL}/`;
    const uploadUrl = new URL('v1/storage/upload', baseUrl);
    uploadUrl.searchParams.set('path', fileKey);
    
    const blob = new Blob([buffer], { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, fileKey.split('/').pop());
    
    const uploadResponse = await fetch(uploadUrl.toString(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${FORGE_API_KEY}` },
      body: formData
    });
    
    let finalUrl;
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      finalUrl = uploadData.url;
      console.log(`    ☁️  Subida a S3: ${finalUrl?.substring(0, 60)}...`);
    } else {
      const errText = await uploadResponse.text();
      throw new Error(`Upload S3 falló ${uploadResponse.status}: ${errText.substring(0, 200)}`);
    }
    
    // Actualizar en BD
    await client.query(
      'UPDATE recipes SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2',
      [finalUrl, recipe.id]
    );
    
    success++;
    console.log(`    ✅ Guardada en BD`);
    
    // Pausa entre generaciones para no saturar la API
    if (i < recipes.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
    
  } catch (err) {
    failed++;
    console.error(`    ❌ Error: ${err.message.substring(0, 100)}`);
    // Pausa más larga en caso de error (rate limit)
    await new Promise(r => setTimeout(r, 3000));
  }
}

await client.end();

console.log(`\n🎉 COMPLETADO — Éxito: ${success} | Fallos: ${failed} | Total: ${recipes.length}`);
console.log(`📊 Próximo offset para continuar: ${offset + recipes.length}`);
