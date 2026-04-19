/**
 * Script: daily-recipe-generator.mjs
 * 
 * Genera 50-80 recetas nuevas completas cada día usando IA:
 * - Nombre único y atractivo
 * - Descripción apetecible
 * - Ingredientes con cantidades precisas
 * - Instrucciones paso a paso
 * - Valores nutricionales calculados
 * - Imagen ultra realista generada con IA
 * 
 * Uso: node scripts/daily-recipe-generator.mjs [--count=60]
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const args = process.argv.slice(2);
const countArg = args.find(a => a.startsWith('--count='));
const TARGET_COUNT = countArg ? parseInt(countArg.split('=')[1]) : 60;
const CONCURRENCY = 4; // 4 recetas en paralelo (cada una hace 2 llamadas a la API)
const ADMIN_USER_ID = 1; // Luis Maria - owner

const pool = new Pool({ connectionString: DATABASE_URL });

// ============================================================
// CATÁLOGOS DE VARIEDAD
// ============================================================

const CUISINE_TYPES = [
  'mediterránea', 'española', 'italiana', 'asiática', 'japonesa', 'mexicana',
  'francesa', 'griega', 'marroquí', 'peruana', 'americana', 'árabe',
  'india', 'tailandesa', 'vietnamita', 'turca', 'libanesa', 'brasileña'
];

const MEAL_TIMES = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena', 'cualquiera'];
const MEAL_TIMES_WEIGHTS = [0.15, 0.10, 0.30, 0.10, 0.30, 0.05]; // probabilidades

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const COOKING_METHODS = [
  'horno', 'plancha', 'olla', 'airfryer', 'sin_coccion', 'microondas', 'wok', 'vaporizador'
];

const CATEGORIES = [
  'carnes', 'pescados', 'vegetariano', 'vegano', 'pasta', 'arroces',
  'ensaladas', 'sopas', 'legumbres', 'huevos', 'postres', 'snacks',
  'batidos', 'desayunos', 'bocadillos', 'mariscos'
];

const ALLERGENS_LIST = [
  'gluten', 'lacteos', 'huevos', 'frutos_secos', 'soja', 'pescado',
  'marisco', 'sesamo', 'mostaza', 'apio'
];

// Temas de recetas para asegurar variedad
const RECIPE_THEMES = [
  // Proteínas
  'pollo a la plancha con verduras de temporada',
  'salmón al horno con costra de hierbas',
  'ternera estofada con patatas',
  'atún a la plancha con salsa de soja y jengibre',
  'merluza al vapor con salsa verde',
  'pavo al curry con arroz basmati',
  'gambas al ajillo con pan tostado',
  'lubina a la sal con patatas',
  'costillas de cerdo al horno con miel',
  'pechuga de pollo rellena de espinacas y queso',
  'bacalao con tomate y aceitunas',
  'pulpo a la gallega con pimentón',
  'sepia a la plancha con alioli',
  'cordero asado con romero y ajo',
  'rape con almejas en salsa marinera',
  // Vegetarianos
  'risotto de setas y parmesano',
  'curry de garbanzos con espinacas',
  'lasaña de verduras con bechamel',
  'tortilla española con cebolla caramelizada',
  'quiche de puerros y queso gruyère',
  'bowl de quinoa con aguacate y edamame',
  'burger vegetal de lentejas y champiñones',
  'pad thai vegetariano con tofu',
  'shakshuka con pimientos y especias',
  'frittata de espárragos y queso de cabra',
  'tacos de coliflor asada con guacamole',
  'pizza de masa integral con verduras asadas',
  'cous cous con verduras y garbanzos',
  'wok de verduras con salsa teriyaki',
  'crema de calabaza con jengibre y coco',
  // Pasta y arroces
  'pasta carbonara con panceta crujiente',
  'arroz negro con calamares',
  'paella valenciana tradicional',
  'pasta puttanesca con aceitunas y anchoas',
  'risotto de langostinos y azafrán',
  'fideuà de mariscos',
  'pasta al pesto con piñones tostados',
  'arroz con leche cremoso',
  'pasta con salsa boloñesa casera',
  'arroz tres delicias',
  // Ensaladas y bowls
  'ensalada césar con pollo crujiente',
  'bowl de açaí con frutas tropicales',
  'ensalada griega con feta y aceitunas kalamata',
  'poke bowl de atún con mango',
  'ensalada de lentejas con vinagreta de mostaza',
  'bowl de buddha con tahini',
  'ensalada nicoise con atún fresco',
  'ensalada de remolacha con queso de cabra',
  // Desayunos
  'pancakes de avena con arándanos',
  'granola casera con frutos secos y miel',
  'tostadas francesas con canela',
  'smoothie bowl de mango y coco',
  'porridge de avena con manzana y canela',
  'huevos benedictinos con salsa holandesa',
  'crepes con nutella y fresas',
  'muffins de arándanos y limón',
  // Sopas y cremas
  'gazpacho andaluz tradicional',
  'sopa de cebolla gratinada',
  'crema de guisantes con menta',
  'ramen japonés con huevo marinado',
  'sopa de tomate asado con albahaca',
  'crema de brócoli con almendras tostadas',
  'sopa minestrone italiana',
  'consomé de pollo con fideos',
  // Postres saludables
  'mousse de chocolate negro sin azúcar',
  'tarta de queso con frutos rojos',
  'panna cotta de vainilla con coulis de frambuesa',
  'brownie de boniato y cacao',
  'helado de plátano con mantequilla de cacahuete',
  'tiramisú ligero con café',
  'flan de huevo casero',
  'bizcocho de zanahoria con glaseado de queso crema',
  // Snacks y aperitivos
  'hummus casero con pimentón ahumado',
  'guacamole fresco con chips de maíz',
  'croquetas de jamón ibérico',
  'patatas bravas con salsa picante',
  'bruschetta de tomate y albahaca',
  'rollitos de primavera con salsa agridulce',
  'edamame al vapor con sal marina',
  'nachos con queso fundido y jalapeños',
];

function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return items[i];
  }
  return items[items.length - 1];
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// GENERACIÓN DE CONTENIDO CON LLM
// ============================================================

async function generateRecipeContent(theme) {
  const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : `${FORGE_API_URL}/`;
  const llmUrl = `${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`;

  const mealTime = weightedRandom(MEAL_TIMES, MEAL_TIMES_WEIGHTS);
  const cuisine = randomFrom(CUISINE_TYPES);
  const difficulty = randomFrom(DIFFICULTIES);
  const cookingMethod = randomFrom(COOKING_METHODS);
  const category = randomFrom(CATEGORIES);

  const systemPrompt = `Eres un chef profesional y nutricionista experto. Creas recetas detalladas, sabrosas y con valores nutricionales precisos. Siempre respondes en JSON válido exactamente con el schema indicado, sin texto adicional.`;

  const userPrompt = `Crea una receta completa y detallada basada en: "${theme}"
  
Contexto:
- Tipo de cocina: ${cuisine}
- Momento del día: ${mealTime}
- Dificultad: ${difficulty}
- Método de cocción: ${cookingMethod}
- Categoría: ${category}

Responde ÚNICAMENTE con este JSON (sin markdown, sin explicaciones):
{
  "name": "nombre atractivo y específico de la receta en español",
  "description": "descripción apetecible de 2-3 frases que haga agua la boca",
  "preparationTime": número_en_minutos,
  "cookTime": número_en_minutos,
  "servings": número_de_raciones,
  "difficulty": "${difficulty}",
  "mealTime": "${mealTime}",
  "cuisineType": "${cuisine}",
  "cookingMethod": "${cookingMethod}",
  "category": "${category}",
  "allergens": ["lista", "de", "alérgenos", "presentes"],
  "tags": ["tag1", "tag2", "tag3"],
  "caloriesPerServing": número_entero,
  "proteinsPerServing": número_decimal,
  "carbsPerServing": número_decimal,
  "fatsPerServing": número_decimal,
  "fiberPerServing": número_decimal,
  "isKidFriendly": true_o_false,
  "noAddedSugar": true_o_false,
  "ingredients": [
    {"name": "ingrediente", "amount": "cantidad", "unit": "unidad", "category": "proteína|carbohidrato|vegetal|lácteo|grasa|condimento|otro"}
  ],
  "instructions": [
    {"step": 1, "text": "instrucción detallada paso a paso"},
    {"step": 2, "text": "..."}
  ]
}

Requisitos:
- Mínimo 6 ingredientes con cantidades exactas
- Mínimo 5 pasos de instrucciones detallados
- Valores nutricionales realistas y precisos
- El nombre debe ser único y diferente a recetas comunes
- Tags útiles: fitness, rapida, economica, proteica, sin_gluten, vegana, etc.`;

  const response = await fetch(llmUrl, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`LLM API ${response.status}: ${detail.substring(0, 100)}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM no devolvió contenido');

  const recipe = JSON.parse(content);
  if (!recipe.name || !recipe.ingredients || !recipe.instructions) {
    throw new Error('JSON de receta incompleto');
  }

  return recipe;
}

// ============================================================
// GENERACIÓN DE IMAGEN ULTRA REALISTA
// ============================================================

async function generateRecipeImage(recipe) {
  const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : `${FORGE_API_URL}/`;

  const topIngredients = recipe.ingredients
    .slice(0, 4)
    .map(i => i.name)
    .join(', ');

  const prompt = `Ultra-realistic professional food photography of "${recipe.name}". 
${recipe.description}
Key ingredients visible: ${topIngredients}.
${recipe.cuisineType} cuisine style. 
Shot from 45-degree angle on a beautiful ceramic plate with elegant plating, 
garnished with fresh herbs, natural window light, shallow depth of field, 
bokeh background, restaurant quality presentation, Michelin star plating, 
8K resolution, photorealistic, no text, no people, no hands, no watermarks.`;

  const genRes = await fetch(new URL('images.v1.ImageService/GenerateImage', baseUrl).toString(), {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'connect-protocol-version': '1',
      'authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({ prompt, original_images: [] }),
  });

  if (!genRes.ok) {
    const detail = await genRes.text().catch(() => '');
    throw new Error(`Image API ${genRes.status}: ${detail.substring(0, 80)}`);
  }

  const genResult = await genRes.json();
  const b64Json = genResult.image?.b64Json;
  const mimeType = genResult.image?.mimeType || 'image/png';
  if (!b64Json) throw new Error('No image data');

  // Upload to S3
  const buffer = Buffer.from(b64Json, 'base64');
  const relKey = `recipes/ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;
  const uploadUrl = new URL('v1/storage/upload', baseUrl);
  uploadUrl.searchParams.set('path', relKey);

  const blob = new Blob([buffer], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, relKey.split('/').pop());

  const upRes = await fetch(uploadUrl.toString(), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FORGE_API_KEY}` },
    body: formData,
  });

  if (!upRes.ok) {
    const detail = await upRes.text().catch(() => '');
    throw new Error(`Upload ${upRes.status}: ${detail.substring(0, 80)}`);
  }

  const upResult = await upRes.json();
  if (!upResult.url) throw new Error('No URL in upload response');
  return upResult.url;
}

// ============================================================
// INSERTAR RECETA EN BD
// ============================================================

async function insertRecipe(recipe, imageUrl) {
  const allergens = Array.isArray(recipe.allergens) ? JSON.stringify(recipe.allergens) : '[]';
  const tags = Array.isArray(recipe.tags) ? JSON.stringify(recipe.tags) : '[]';
  const ingredientsJson = JSON.stringify(recipe.ingredients || []);
  const instructionsJson = JSON.stringify(recipe.instructions || []);

  // Map difficulty
  const difficultyMap = { easy: 'easy', medium: 'medium', hard: 'hard', fácil: 'easy', medio: 'medium', difícil: 'hard' };
  const difficulty = difficultyMap[recipe.difficulty?.toLowerCase()] || 'medium';

  // Map mealTime - use text column directly
  const mealTimeMap = {
    desayuno: 'desayuno', almuerzo: 'almuerzo', comida: 'comida',
    merienda: 'merienda', cena: 'cena', cualquiera: 'cualquiera'
  };
  const mealTime = mealTimeMap[recipe.mealTime?.toLowerCase()] || 'cualquiera';

  const result = await pool.query(`
    INSERT INTO recipes (
      "userId", name, "imageUrl", description,
      "preparationTime", "cookTime", servings, difficulty,
      "isPublic", active, "mealTime", category,
      "cuisineType", "cookingMethod", allergens, tags,
      "caloriesPerServing", "proteinsPerServing", "carbsPerServing",
      "fatsPerServing", "fiberPerServing",
      "ingredientsJson", "instructionsJson",
      "isKidFriendly", "noAddedSugar", "isSeeded",
      "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8,
      true, true, $9, $10,
      $11, $12, $13, $14,
      $15, $16, $17,
      $18, $19,
      $20, $21,
      $22, $23, true,
      NOW(), NOW()
    ) RETURNING id
  `, [
    ADMIN_USER_ID, recipe.name, imageUrl, recipe.description || '',
    recipe.preparationTime || 15, recipe.cookTime || 20,
    recipe.servings || 2, difficulty,
    mealTime, recipe.category || 'otros',
    recipe.cuisineType || 'mediterránea', recipe.cookingMethod || 'plancha',
    allergens, tags,
    recipe.caloriesPerServing || 300,
    recipe.proteinsPerServing || 20,
    recipe.carbsPerServing || 30,
    recipe.fatsPerServing || 10,
    recipe.fiberPerServing || 5,
    ingredientsJson, instructionsJson,
    recipe.isKidFriendly || false,
    recipe.noAddedSugar || false,
  ]);

  return result.rows[0].id;
}

// ============================================================
// PROCESAMIENTO DE UNA RECETA COMPLETA
// ============================================================

async function generateFullRecipe(theme, index) {
  // 1. Generar contenido con LLM
  const recipeData = await generateRecipeContent(theme);
  
  // 2. Generar imagen ultra realista
  const imageUrl = await generateRecipeImage(recipeData);
  
  // 3. Insertar en BD
  const id = await insertRecipe(recipeData, imageUrl);
  
  return { id, name: recipeData.name, imageUrl };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const startTime = Date.now();
  const actualCount = TARGET_COUNT + Math.floor(Math.random() * 31); // 50-80 aleatorio
  
  console.log(`\n🍳 BuddyMarket — Generador Diario de Recetas`);
  console.log(`🎯 Objetivo: ${actualCount} recetas nuevas con imagen ultra realista`);
  console.log(`⚡ Concurrencia: ${CONCURRENCY} recetas simultáneas\n`);

  // Seleccionar temas aleatorios sin repetir
  const shuffledThemes = [...RECIPE_THEMES].sort(() => Math.random() - 0.5);
  const selectedThemes = [];
  
  // Si necesitamos más que los temas disponibles, repetir con variaciones
  for (let i = 0; i < actualCount; i++) {
    selectedThemes.push(shuffledThemes[i % shuffledThemes.length]);
  }

  let success = 0;
  let failed = 0;
  const failedThemes = [];

  // Procesar en lotes de CONCURRENCY
  for (let i = 0; i < selectedThemes.length; i += CONCURRENCY) {
    const batch = selectedThemes.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(selectedThemes.length / CONCURRENCY);

    console.log(`\n📦 Lote ${batchNum}/${totalBatches}`);

    const results = await Promise.allSettled(
      batch.map((theme, idx) => generateFullRecipe(theme, i + idx))
    );

    for (let j = 0; j < batch.length; j++) {
      const result = results[j];
      if (result.status === 'fulfilled') {
        const { id, name } = result.value;
        console.log(`  ✅ [ID:${id}] ${name.substring(0, 50)}`);
        success++;
      } else {
        console.log(`  ❌ "${batch[j].substring(0, 40)}" → ${result.reason?.message?.substring(0, 60)}`);
        failed++;
        failedThemes.push(batch[j]);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const pct = ((success + failed) / actualCount * 100).toFixed(0);
    console.log(`  ⏱️  ${elapsed}s | ${pct}% | ✅ ${success} | ❌ ${failed}`);

    if (i + CONCURRENCY < selectedThemes.length) {
      await sleep(1000);
    }
  }

  // Reintentar fallidos
  if (failedThemes.length > 0) {
    console.log(`\n🔄 Reintentando ${failedThemes.length} recetas fallidas...`);
    await sleep(3000);
    
    for (let i = 0; i < failedThemes.length; i += CONCURRENCY) {
      const batch = failedThemes.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((theme, idx) => generateFullRecipe(theme, i + idx))
      );
      for (let j = 0; j < batch.length; j++) {
        if (results[j].status === 'fulfilled') {
          console.log(`  ✅ Reintento OK: ${results[j].value.name.substring(0, 50)}`);
          success++;
          failed--;
        }
      }
      if (i + CONCURRENCY < failedThemes.length) await sleep(2000);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const totalRecipes = await pool.query("SELECT COUNT(*) as total FROM recipes WHERE \"deletedAt\" IS NULL");

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏁 COMPLETADO en ${elapsed} minutos`);
  console.log(`   ✅ Recetas creadas hoy: ${success}`);
  console.log(`   ❌ Fallidas: ${failed}`);
  console.log(`   📚 Total recetas en BD: ${totalRecipes.rows[0].total}`);
  console.log(`${'='.repeat(60)}\n`);

  await pool.end();
}

main().catch(e => {
  console.error('Error fatal:', e.message);
  process.exit(1);
});
