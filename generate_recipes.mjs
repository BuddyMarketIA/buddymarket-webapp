import { readFileSync, writeFileSync } from 'fs';

const API_URL = process.env.BUILT_IN_FORGE_API_URL;
const API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function callLLM(prompt) {
  const resp = await fetch(`${API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 16000,
      temperature: 0.7,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error ${resp.status}: ${text.slice(0, 200)}`);
  }
  const data = await resp.json();
  return data.choices[0].message.content;
}

function cleanJSON(content) {
  content = content.trim();
  if (content.startsWith('```json')) content = content.slice(7);
  if (content.startsWith('```')) content = content.slice(3);
  if (content.endsWith('```')) content = content.slice(0, -3);
  return content.trim();
}

const MEAL_CONFIGS = {
  desayuno: {
    desc: 'breakfast (7-9am): tostadas, porridge, batidos, yogur con frutas, huevos revueltos, tortilla francesa, cereales, zumos, muesli, smoothie bowls, pan con tomate, bizcocho casero, crepes. NEVER heavy meat dishes or stews.',
    count: 100,
  },
  media_manana: {
    desc: 'mid-morning snack (11am): fruta, frutos secos, yogur, pequeño sándwich, barrita energética, galletas, zumo, batido ligero',
    count: 50,
  },
  comida: {
    desc: 'lunch (2-3pm): complete meals, cocido, paella, pasta, arroz, lentejas, pollo asado, merluza, ensaladas completas, gazpacho, fabada, pisto',
    count: 150,
  },
  merienda: {
    desc: 'afternoon snack (5-6pm): fruta, batidos, pequeños sándwiches, galletas, yogur, tostadas con mermelada, frutos secos',
    count: 50,
  },
  cena: {
    desc: 'dinner (9-10pm): lighter meals, crema de verduras, tortilla española, ensalada, salmón a la plancha, pollo a la plancha, revuelto de champiñones, sopa, verduras al horno',
    count: 150,
  },
};

function buildPrompt(mealTime, desc, count) {
  return `Generate exactly ${count} Spanish recipes for meal time: ${mealTime} (${desc})

Output a valid JSON array of ${count} recipe objects. Each object must have ALL these exact fields:
{
  "name": "Recipe name in Spanish",
  "description": "Brief 1-2 sentence description in Spanish",
  "mealTime": "${mealTime}",
  "category": one of ["desayuno","ensalada","sopa","pasta","arroz","carne","pescado","vegetariano","vegano","snack","postre","batido","huevos","legumbres","sandwich"],
  "prepTime": number (minutes 5-60),
  "cookTime": number (minutes 0-90),
  "servings": number (1-6),
  "difficulty": one of ["facil","medio","dificil"],
  "calories": number (realistic kcal per serving),
  "protein": number (grams per serving),
  "carbohydrates": number (grams per serving),
  "fat": number (grams per serving),
  "fiber": number (grams per serving),
  "allergens": array of strings from ["gluten","lacteos","huevos","frutos_secos","pescado","mariscos","soja","sesamo"] - only include if recipe contains them,
  "tags": array of 2-4 strings from ["rapida","fitness","vegetariana","vegana","mediterranea","sin_gluten","alto_proteina","bajo_calorias","familiar","economica","tradicional","internacional"],
  "ingredients": array of 4-12 objects: [{"name":"ingredient name in Spanish","amount":number,"unit":"g/ml/ud/cucharada/taza/pizca"}],
  "instructions": array of 4-8 step strings in Spanish (clear, actionable steps),
  "imageUrl": ""
}

Make recipes diverse, realistic and appropriate ONLY for ${mealTime}. Include Spanish, Mediterranean and some international cuisines.
Output ONLY the JSON array, no markdown, no explanations, no other text.`;
}

// Load existing results
let existing = {};
try {
  const raw = readFileSync('/home/ubuntu/generate_recipes.json', 'utf-8');
  const data = JSON.parse(raw);
  for (const r of data.results) {
    if (!r.error) {
      try {
        const recipes = JSON.parse(r.output.recipes_json);
        existing[r.input] = recipes;
        console.log(`Loaded existing: ${r.input} - ${recipes.length} recipes`);
      } catch {}
    }
  }
} catch (e) {
  console.log('No existing results found');
}

const allRecipes = { ...existing };

// Generate missing/incomplete batches
const toGenerate = [];
for (const [meal, config] of Object.entries(MEAL_CONFIGS)) {
  const have = allRecipes[meal]?.length || 0;
  if (have < config.count * 0.8) {
    toGenerate.push({ meal, config, have });
  }
}

console.log(`\nNeed to generate: ${toGenerate.map(x => `${x.meal}(have ${x.have})`).join(', ')}`);

for (const { meal, config } of toGenerate) {
  console.log(`\nGenerating ${config.count} recipes for ${meal}...`);
  try {
    const prompt = buildPrompt(meal, config.desc, config.count);
    const content = await callLLM(prompt);
    const cleaned = cleanJSON(content);
    const recipes = JSON.parse(cleaned);
    allRecipes[meal] = recipes;
    console.log(`  ✓ Generated ${recipes.length} recipes for ${meal}`);
  } catch (e) {
    console.error(`  ✗ Failed ${meal}: ${e.message}`);
  }
  // Small delay between requests
  await new Promise(r => setTimeout(r, 1000));
}

// Summary
const total = Object.values(allRecipes).reduce((sum, arr) => sum + arr.length, 0);
console.log(`\n=== Summary ===`);
for (const [meal, recipes] of Object.entries(allRecipes)) {
  console.log(`  ${meal}: ${recipes.length} recipes`);
}
console.log(`  TOTAL: ${total} recipes`);

// Save
writeFileSync('/home/ubuntu/all_recipes.json', JSON.stringify(allRecipes, null, 2), 'utf-8');
console.log('\nSaved to /home/ubuntu/all_recipes.json');
