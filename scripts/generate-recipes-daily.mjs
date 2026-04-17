/**
 * BuddyMarket — Generador diario de 80 recetas con IA
 * Genera recetas completas: ingredientes, instrucciones, macros e imagen IA ultra-realista
 * Uso: node scripts/generate-recipes-daily.mjs [--batch=80]
 */

import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SYSTEM_USER_ID = 4335; // iabuddymarket@gmail.com
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '80');
const LLM_API_URL = (process.env.BUILT_IN_FORGE_API_URL || '').replace(/\/$/, '');
const LLM_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// ─── Distribución de categorías para variedad ─────────────────────────────────
const RECIPE_THEMES = [
  { mealTime: 'desayuno', weight: 15 },
  { mealTime: 'media_manana', weight: 8 },
  { mealTime: 'comida', weight: 20 },
  { mealTime: 'merienda', weight: 8 },
  { mealTime: 'cena', weight: 15 },
  { mealTime: 'cualquiera', weight: 14 },
];

const CUISINE_TYPES = [
  'española', 'italiana', 'mediterranea', 'asiatica', 'mexicana',
  'americana', 'francesa', 'arabe', 'griega', 'japonesa',
  'peruana', 'india', 'marroqui', 'turca', 'nordica'
];

const COOKING_METHODS = [
  'horno', 'plancha', 'olla', 'airfryer', 'sin_coccion',
  'microondas', 'wok', 'vaporizador', 'barbacoa', 'freidora'
];

const DIETARY_PROFILES = [
  'normal', 'vegano', 'vegetariano', 'sin_gluten', 'sin_lactosa',
  'alto_proteico', 'bajo_calorico', 'keto', 'mediterraneo', 'deportista',
  'antiinflamatorio', 'diabetico', 'cardiosaludable', 'infantil', 'batch_cooking'
];

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom(themes) {
  const total = themes.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of themes) {
    r -= t.weight;
    if (r <= 0) return t.mealTime;
  }
  return themes[themes.length - 1].mealTime;
}

// Parser JSON robusto que extrae el primer objeto JSON válido del texto
function extractJSON(text) {
  // Intentar parsear directamente
  try { return JSON.parse(text.trim()); } catch {}
  
  // Limpiar bloques markdown
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  
  // Buscar el primer { y encontrar su cierre balanceado
  const start = text.indexOf('{');
  if (start === -1) throw new Error('No se encontró JSON en la respuesta');
  
  let depth = 0;
  let inString = false;
  let escape = false;
  
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch {}
      }
    }
  }
  throw new Error('JSON incompleto en la respuesta');
}

async function callLLM(messages) {
  const res = await fetch(`${LLM_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({ messages, model: 'gpt-4o-mini', max_tokens: 3000 }),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM error ${res.status}: ${err.slice(0, 200)}`);
  }
  
  const data = await res.json();
  return data.choices[0].message.content;
}

async function generateImageAndUpload(prompt) {
  try {
    const baseUrl = LLM_API_URL.endsWith('/') ? LLM_API_URL : `${LLM_API_URL}/`;
    const imageUrl = new URL('images.v1.ImageService/GenerateImage', baseUrl).toString();
    
    const res = await fetch(imageUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'connect-protocol-version': '1',
        'authorization': `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({ prompt, original_images: [] }),
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.warn(`  ⚠ Image API ${res.status}: ${err.slice(0, 100)}`);
      return null;
    }
    
    const result = await res.json();
    const base64Data = result.image?.b64Json;
    if (!base64Data) return null;
    
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = result.image?.mimeType || 'image/png';
    
    // Subir a S3 via storage proxy usando FormData (igual que storagePut)
    const fileKey = `recipes/ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const storageUploadUrl = new URL('v1/storage/upload', baseUrl);
    storageUploadUrl.searchParams.set('path', fileKey);
    
    const blob = new Blob([buffer], { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, fileKey.split('/').pop());
    
    const uploadRes = await fetch(storageUploadUrl.toString(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LLM_API_KEY}` },
      body: formData,
    });
    
    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => '');
      console.warn(`  ⚠ Upload failed: ${uploadRes.status} ${errText.slice(0, 80)}`);
      return null;
    }
    
    const uploadData = await uploadRes.json();
    return uploadData.url || null;
    
  } catch (e) {
    console.warn(`  ⚠ Image error: ${e.message}`);
    return null;
  }
}

// ─── Obtener o crear ingrediente en BD ───────────────────────────────────────
async function getOrCreateIngredient(ingredientData) {
  const { name, category, calories, proteins, carbs, fats, fiber, isVegan, isVegetarian, isGlutenFree } = ingredientData;
  
  const apiParam = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120);
  
  // Buscar existente por apiParam o nombre exacto
  const existing = await pool.query(
    'SELECT id FROM ingredients WHERE "apiParam" = $1 OR LOWER("nameEs") = LOWER($2) LIMIT 1',
    [apiParam, name]
  );
  
  if (existing.rows.length > 0) return existing.rows[0].id;
  
  // Crear nuevo ingrediente
  const result = await pool.query(
    `INSERT INTO ingredients ("apiParam", "nameEs", "nameEn", category, calories, proteins, carbohydrates, fats, fiber, "isVegan", "isVegetarian", "isGlutenFree", "isDairyFree")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false)
     ON CONFLICT ("apiParam") DO UPDATE SET "nameEs" = EXCLUDED."nameEs"
     RETURNING id`,
    [
      apiParam, name, ingredientData.nameEn || name,
      category || 'otros',
      Math.round(calories || 0), proteins || 0, carbs || 0, fats || 0, fiber || 0,
      isVegan || false, isVegetarian || false, isGlutenFree || false
    ]
  );
  
  return result.rows[0].id;
}

// ─── Generar una receta completa con IA ──────────────────────────────────────
async function generateRecipe(index, existingNames) {
  const mealTime = weightedRandom(RECIPE_THEMES);
  const cuisineType = pickRandom(CUISINE_TYPES);
  const cookingMethod = pickRandom(COOKING_METHODS);
  const dietProfile = pickRandom(DIETARY_PROFILES);
  const difficulty = pickRandom(DIFFICULTY_LEVELS);
  
  const mealTimeLabel = {
    desayuno: 'desayuno', media_manana: 'media mañana', comida: 'comida principal',
    merienda: 'merienda', cena: 'cena ligera', cualquiera: 'cualquier momento del día'
  }[mealTime] || 'cualquier momento';

  const avoidNames = existingNames.slice(-20).join(', ');

  const prompt = `Crea una receta española/internacional ÚNICA para ${mealTimeLabel}.
Perfil: ${dietProfile}. Cocina: ${cuisineType}. Método: ${cookingMethod}. Dificultad: ${difficulty}.
NO uses estos nombres: ${avoidNames}.

Responde SOLO con JSON válido (sin markdown, sin texto extra):
{
  "name": "Nombre atractivo y específico",
  "description": "Descripción apetitosa de 2-3 frases",
  "preparationTime": 15,
  "cookTime": 20,
  "servings": 2,
  "calories": 350,
  "proteins": 25.5,
  "carbs": 30.2,
  "fats": 12.1,
  "fiber": 4.5,
  "allergens": ["gluten"],
  "tags": ["rapida", "fitness"],
  "ingredients": [
    {"name": "Nombre en español", "nameEn": "English name", "amount": 200, "unit": "g", "category": "carnes", "calories": 165, "proteins": 31, "carbs": 0, "fats": 3.6, "fiber": 0, "isVegan": false, "isVegetarian": false, "isGlutenFree": true}
  ],
  "steps": [
    {"step": 1, "text": "Instrucción detallada"},
    {"step": 2, "text": "Instrucción detallada"}
  ],
  "imagePrompt": "Professional food photography of [dish name], restaurant quality, natural lighting, white ceramic plate, shallow depth of field, appetizing, 4K, food magazine style"
}

Requisitos: 4-8 ingredientes con cantidades exactas, 4-7 pasos detallados, macros correctos por ración.`;

  const content = await callLLM([
    { role: 'system', content: 'Eres un chef nutricionista experto. Generas recetas completas en JSON estricto. Nunca repites recetas. Responde SOLO con el JSON, sin texto adicional.' },
    { role: 'user', content: prompt }
  ]);

  const recipe = extractJSON(content);
  return { recipe, mealTime, cuisineType, cookingMethod, difficulty };
}

// ─── Insertar receta en BD ────────────────────────────────────────────────────
async function insertRecipe(data, imageUrl) {
  const { recipe, mealTime, cuisineType, cookingMethod, difficulty } = data;
  
  // Insertar ingredientes y obtener sus IDs
  const ingredientIds = [];
  for (const ing of recipe.ingredients || []) {
    try {
      const id = await getOrCreateIngredient(ing);
      ingredientIds.push({ id, amount: ing.amount, unit: ing.unit });
    } catch (e) {
      // Continuar si falla un ingrediente
    }
  }
  
  const ingredientsJson = JSON.stringify(
    (recipe.ingredients || []).map(ing => ({
      name: ing.name, amount: ing.amount, unit: ing.unit, category: ing.category,
    }))
  );
  
  const instructionsJson = JSON.stringify(
    (recipe.steps || []).map(s => ({ step: s.step, text: s.text }))
  );
  
  // Insertar receta principal
  const result = await pool.query(
    `INSERT INTO recipes (
      "userId", name, "imageUrl", description,
      "preparationTime", "cookTime", servings, difficulty,
      "isPublic", active, "mealTime", "cuisineType", "cookingMethod",
      allergens, tags,
      "caloriesPerServing", "proteinsPerServing", "carbsPerServing", "fatsPerServing", "fiberPerServing",
      "ingredientsJson", "instructionsJson", "isSeeded",
      "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      true, true, $9, $10, $11,
      $12, $13,
      $14, $15, $16, $17, $18,
      $19, $20, true,
      NOW() - (random() * interval '180 days'), NOW()
    ) RETURNING id`,
    [
      SYSTEM_USER_ID, recipe.name, imageUrl, recipe.description,
      recipe.preparationTime || 15, recipe.cookTime || 20,
      recipe.servings || 2, difficulty,
      mealTime, cuisineType, cookingMethod,
      JSON.stringify(recipe.allergens || []),
      JSON.stringify(recipe.tags || []),
      Math.round(recipe.calories || 0),
      recipe.proteins || 0, recipe.carbs || 0, recipe.fats || 0, recipe.fiber || 0,
      ingredientsJson, instructionsJson,
    ]
  );
  
  const recipeId = result.rows[0].id;
  
  // Insertar recipeIngredients
  for (let i = 0; i < ingredientIds.length; i++) {
    const ing = ingredientIds[i];
    try {
      await pool.query(
        `INSERT INTO recipe_ingredients ("recipeId", "ingredientId", amount, notes, "order")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT ("recipeId", "ingredientId") DO NOTHING`,
        [recipeId, ing.id, ing.amount, ing.unit, i]
      );
    } catch {}
  }
  
  // Insertar recipeSteps
  for (const step of recipe.steps || []) {
    try {
      await pool.query(
        `INSERT INTO recipe_steps ("recipeId", "stepNumber", instruction)
         VALUES ($1, $2, $3)
         ON CONFLICT ("recipeId", "stepNumber") DO NOTHING`,
        [recipeId, step.step, step.text]
      );
    } catch {}
  }
  
  return recipeId;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🍳 BuddyMarket Recipe Generator — ${new Date().toISOString()}`);
  console.log(`📊 Generando ${BATCH_SIZE} recetas nuevas...\n`);
  
  // Obtener nombres existentes para evitar duplicados
  const existingResult = await pool.query('SELECT name FROM recipes ORDER BY id DESC LIMIT 300');
  const existingNames = existingResult.rows.map(r => r.name);
  console.log(`📚 Recetas existentes: ${existingNames.length} cargadas para evitar duplicados\n`);
  
  let created = 0;
  let failed = 0;
  const newNames = [];
  
  for (let i = 0; i < BATCH_SIZE; i++) {
    const num = i + 1;
    process.stdout.write(`[${num}/${BATCH_SIZE}] `);
    
    try {
      // Generar receta con IA
      const data = await generateRecipe(num, [...existingNames, ...newNames]);
      const { recipe } = data;
      process.stdout.write(`"${recipe.name.slice(0, 45)}" | `);
      
      // Generar imagen ultra-realista
      process.stdout.write(`🎨 `);
      const imagePrompt = recipe.imagePrompt || 
        `Professional food photography of ${recipe.name}, restaurant quality, natural lighting, white ceramic plate, shallow depth of field, appetizing, 4K, food magazine style`;
      
      const imageUrl = await generateImageAndUpload(imagePrompt);
      process.stdout.write(imageUrl ? `📸 | ` : `🚫 | `);
      
      // Insertar en BD
      const recipeId = await insertRecipe(data, imageUrl);
      newNames.push(recipe.name);
      created++;
      
      console.log(`✅ ID ${recipeId} | ${recipe.calories}kcal`);
      
      // Pausa entre recetas para no saturar la API
      if (i < BATCH_SIZE - 1) {
        await new Promise(r => setTimeout(r, 1200));
      }
      
    } catch (e) {
      failed++;
      console.log(`❌ ${e.message.slice(0, 80)}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  // Resumen final
  const [totalR] = await pool.query('SELECT COUNT(*) as c FROM recipes WHERE active = true').then(r => r.rows);
  const [totalI] = await pool.query('SELECT COUNT(*) as c FROM ingredients').then(r => r.rows);
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Recetas creadas hoy: ${created}/${BATCH_SIZE}`);
  console.log(`❌ Fallidas: ${failed}`);
  console.log(`📊 Total recetas en BD: ${totalR.c}`);
  console.log(`🥕 Total ingredientes en BD: ${totalI.c}`);
  console.log(`${'═'.repeat(60)}\n`);
  
  await pool.end();
  process.exit(0);
}

main().catch(e => {
  console.error('Error fatal:', e);
  pool.end().finally(() => process.exit(1));
});
