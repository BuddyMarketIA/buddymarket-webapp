import { readFileSync, writeFileSync, existsSync } from 'fs';

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
      max_tokens: 8000,
      temperature: 0.8,
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
  // Find the JSON array
  const start = content.indexOf('[');
  const end = content.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    content = content.slice(start, end + 1);
  }
  return content.trim();
}

const MEAL_CONFIGS = {
  desayuno: {
    desc: 'breakfast (7-9am): tostadas, porridge, batidos, yogur con frutas, huevos revueltos, tortilla francesa, cereales, zumos, muesli, smoothie bowls, pan con tomate, bizcocho casero, crepes, granola. NEVER heavy meat dishes.',
    target: 100,
  },
  media_manana: {
    desc: 'mid-morning snack (11am): fruta, frutos secos, yogur, pequeño sándwich, barrita energética, galletas, zumo, batido ligero, tostada pequeña',
    target: 50,
  },
  comida: {
    desc: 'lunch (2-3pm): complete meals, cocido, paella, pasta, arroz, lentejas, pollo asado, merluza, ensaladas completas, gazpacho, fabada, pisto, estofados, guisos',
    target: 150,
  },
  merienda: {
    desc: 'afternoon snack (5-6pm): fruta, batidos, pequeños sándwiches, galletas, yogur, tostadas con mermelada, frutos secos, smoothies',
    target: 50,
  },
  cena: {
    desc: 'dinner (9-10pm): lighter meals, crema de verduras, tortilla española, ensalada, salmón a la plancha, pollo a la plancha, revuelto de champiñones, sopa, verduras al horno, merluza al vapor, huevos',
    target: 150,
  },
};

function buildPrompt(mealTime, desc, count, batchNum) {
  const themes = [
    'Spanish traditional recipes',
    'Mediterranean diet recipes',
    'fitness and high-protein recipes',
    'quick and easy recipes under 20 minutes',
    'vegetarian and vegan recipes',
    'low-calorie healthy recipes',
    'international cuisine adapted to Spanish taste',
    'family-friendly recipes',
  ];
  const theme = themes[batchNum % themes.length];
  
  return `Generate exactly ${count} UNIQUE Spanish recipes for meal time: ${mealTime} (${desc})
Focus this batch on: ${theme}

Output a valid JSON array of exactly ${count} recipe objects. Each object must have ALL these exact fields:
{
  "name": "Recipe name in Spanish",
  "description": "Brief 1-2 sentence description in Spanish",
  "mealTime": "${mealTime}",
  "category": one of ["desayuno","ensalada","sopa","pasta","arroz","carne","pescado","vegetariano","vegano","snack","postre","batido","huevos","legumbres","sandwich"],
  "prepTime": number (minutes 5-60),
  "cookTime": number (minutes 0-90),
  "servings": number (1-4),
  "difficulty": one of ["facil","medio","dificil"],
  "calories": number (realistic kcal per serving),
  "protein": number (grams per serving),
  "carbohydrates": number (grams per serving),
  "fat": number (grams per serving),
  "fiber": number (grams per serving),
  "allergens": array from ["gluten","lacteos","huevos","frutos_secos","pescado","mariscos","soja","sesamo"] - only if present,
  "tags": array of 2-4 strings from ["rapida","fitness","vegetariana","vegana","mediterranea","sin_gluten","alto_proteina","bajo_calorias","familiar","economica","tradicional","internacional"],
  "ingredients": array of 4-10 objects: [{"name":"ingredient in Spanish","amount":number,"unit":"g/ml/ud/cucharada/taza/pizca"}],
  "instructions": array of 4-7 step strings in Spanish,
  "imageUrl": ""
}

IMPORTANT: Output ONLY the JSON array starting with [ and ending with ]. No markdown, no explanations.`;
}

// Load existing progress
let allRecipes = {};
if (existsSync('/home/ubuntu/all_recipes.json')) {
  const raw = readFileSync('/home/ubuntu/all_recipes.json', 'utf-8');
  allRecipes = JSON.parse(raw);
  for (const [meal, recipes] of Object.entries(allRecipes)) {
    console.log(`Loaded: ${meal} - ${recipes.length} recipes`);
  }
}

// Generate batches of 25 for each meal time
const BATCH_SIZE = 25;

for (const [meal, config] of Object.entries(MEAL_CONFIGS)) {
  const have = allRecipes[meal]?.length || 0;
  const need = config.target - have;
  
  if (need <= 0) {
    console.log(`\n✓ ${meal}: already have ${have}/${config.target}`);
    continue;
  }
  
  console.log(`\n→ ${meal}: have ${have}, need ${need} more`);
  if (!allRecipes[meal]) allRecipes[meal] = [];
  
  let batchNum = Math.floor(have / BATCH_SIZE);
  let remaining = need;
  
  while (remaining > 0) {
    const batchSize = Math.min(BATCH_SIZE, remaining);
    console.log(`  Batch ${batchNum + 1}: generating ${batchSize} recipes...`);
    
    try {
      const prompt = buildPrompt(meal, config.desc, batchSize, batchNum);
      const content = await callLLM(prompt);
      const cleaned = cleanJSON(content);
      const recipes = JSON.parse(cleaned);
      
      if (recipes.length > 0) {
        allRecipes[meal].push(...recipes);
        remaining -= recipes.length;
        console.log(`  ✓ Got ${recipes.length} recipes. Total ${meal}: ${allRecipes[meal].length}`);
        
        // Save progress after each batch
        writeFileSync('/home/ubuntu/all_recipes.json', JSON.stringify(allRecipes, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error(`  ✗ Batch ${batchNum + 1} failed: ${e.message}`);
    }
    
    batchNum++;
    await new Promise(r => setTimeout(r, 500));
  }
}

// Final summary
const total = Object.values(allRecipes).reduce((sum, arr) => sum + arr.length, 0);
console.log(`\n=== FINAL SUMMARY ===`);
for (const [meal, recipes] of Object.entries(allRecipes)) {
  console.log(`  ${meal}: ${recipes.length} recipes`);
}
console.log(`  TOTAL: ${total} recipes`);

writeFileSync('/home/ubuntu/all_recipes.json', JSON.stringify(allRecipes, null, 2), 'utf-8');
console.log('\nSaved to /home/ubuntu/all_recipes.json ✓');
