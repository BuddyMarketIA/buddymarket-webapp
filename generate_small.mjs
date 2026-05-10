import fs from 'fs';

const API_URL = process.env.BUILT_IN_FORGE_API_URL;
const API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function generateBatch(mealTime, category, count) {
  const examples = {
    desayuno: 'tostadas con tomate, porridge de avena, tortilla francesa, batido proteico, yogur con frutas, huevos revueltos, tostadas con aguacate, granola casera',
    cena: 'crema de verduras, ensalada templada, tortilla de patatas, pescado al vapor, sopa de fideos, revuelto de champiñones, pechuga a la plancha con ensalada',
    comida: 'paella de verduras, lentejas estofadas, pollo al horno, pasta boloñesa, merluza al horno, arroz con pollo, ensalada de quinoa con atún',
    media_manana: 'fruta de temporada, yogur griego, batido verde, tostada integral, frutos secos, barrita energética',
    merienda: 'manzana con mantequilla de cacahuete, yogur con miel, tostada con queso, batido de frutas, galletas de avena',
  };
  
  const prompt = `Genera exactamente ${count} recetas de "${mealTime}" en JSON para app de nutrición española.
Recetas típicas de ${mealTime}: ${examples[mealTime] || 'variadas'}.
Categoría: ${category}.

IMPORTANTE: Genera EXACTAMENTE ${count} recetas. Responde SOLO con JSON válido, sin texto extra.

[
  {
    "name": "Nombre receta",
    "description": "Descripción breve (1-2 frases)",
    "mealTime": "${mealTime}",
    "category": "${category}",
    "prepTime": 10,
    "cookTime": 15,
    "servings": 2,
    "difficulty": "fácil",
    "calories": 350,
    "protein": 20,
    "carbohydrates": 40,
    "fat": 10,
    "fiber": 5,
    "allergens": ["gluten"],
    "tags": ["saludable"],
    "ingredients": [{"name": "ingrediente", "amount": "100", "unit": "g"}],
    "instructions": ["Paso 1.", "Paso 2.", "Paso 3."]
  }
]`;

  const baseUrl = (API_URL || 'https://forge.manus.im').replace(/\/$/, '');
  const resp = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 6000,
    }),
  });
  
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }
  const data = await resp.json();
  const content = data.choices[0].message.content;
  
  // Extract JSON array - try to fix truncated JSON
  let match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array found');
  
  let jsonStr = match[0];
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to fix truncated JSON by removing incomplete last item
    const lastComplete = jsonStr.lastIndexOf('},');
    if (lastComplete > 0) {
      jsonStr = jsonStr.slice(0, lastComplete + 1) + ']';
      try {
        return JSON.parse(jsonStr);
      } catch {
        throw new Error('Could not parse JSON even after fix');
      }
    }
    throw new Error('Could not parse JSON');
  }
}

async function main() {
  const existing = JSON.parse(fs.readFileSync('/home/ubuntu/all_recipes.json', 'utf8'));
  
  // Count what we have
  let total = 0;
  for (const [k, v] of Object.entries(existing)) {
    console.log(`Existing ${k}: ${v.length}`);
    total += v.length;
  }
  console.log(`Total existing: ${total}`);
  
  // We need: desayuno ~100, cena ~100, comida ~75 more
  const batches = [
    // Desayuno - 8 batches of 10 = 80 recipes
    { mealTime: 'desayuno', category: 'saludable', count: 10 },
    { mealTime: 'desayuno', category: 'fitness', count: 10 },
    { mealTime: 'desayuno', category: 'rapido', count: 10 },
    { mealTime: 'desayuno', category: 'tradicional', count: 10 },
    { mealTime: 'desayuno', category: 'proteico', count: 10 },
    { mealTime: 'desayuno', category: 'vegano', count: 10 },
    { mealTime: 'desayuno', category: 'sin_gluten', count: 10 },
    { mealTime: 'desayuno', category: 'energetico', count: 10 },
    // Cena - 8 batches of 10 = 80 recipes
    { mealTime: 'cena', category: 'ligero', count: 10 },
    { mealTime: 'cena', category: 'saludable', count: 10 },
    { mealTime: 'cena', category: 'fitness', count: 10 },
    { mealTime: 'cena', category: 'mediterraneo', count: 10 },
    { mealTime: 'cena', category: 'proteico', count: 10 },
    { mealTime: 'cena', category: 'vegano', count: 10 },
    { mealTime: 'cena', category: 'sin_gluten', count: 10 },
    { mealTime: 'cena', category: 'rapido', count: 10 },
    // Comida - 8 batches of 10 = 80 recipes
    { mealTime: 'comida', category: 'mediterraneo', count: 10 },
    { mealTime: 'comida', category: 'fitness', count: 10 },
    { mealTime: 'comida', category: 'vegetariano', count: 10 },
    { mealTime: 'comida', category: 'proteico', count: 10 },
    { mealTime: 'comida', category: 'tradicional', count: 10 },
    { mealTime: 'comida', category: 'internacional', count: 10 },
    { mealTime: 'comida', category: 'sin_gluten', count: 10 },
    { mealTime: 'comida', category: 'legumbres', count: 10 },
  ];
  
  for (const batch of batches) {
    console.log(`Generating ${batch.count} ${batch.mealTime} (${batch.category})...`);
    try {
      const recipes = await generateBatch(batch.mealTime, batch.category, batch.count);
      if (!existing[batch.mealTime]) existing[batch.mealTime] = [];
      existing[batch.mealTime].push(...recipes);
      console.log(`  ✓ Got ${recipes.length} recipes`);
      // Save after each batch
      fs.writeFileSync('/home/ubuntu/all_recipes.json', JSON.stringify(existing, null, 2));
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.error(`  ✗ Failed: ${e.message}`);
    }
  }
  
  let finalTotal = 0;
  for (const [k, v] of Object.entries(existing)) {
    console.log(`Final ${k}: ${v.length}`);
    finalTotal += v.length;
  }
  console.log(`GRAND TOTAL: ${finalTotal} recipes`);
}

main().catch(console.error);
