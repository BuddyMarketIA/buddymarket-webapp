import fs from 'fs';
import { fileURLToPath } from 'url';

const API_URL = process.env.BUILT_IN_FORGE_API_URL;
const API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function generateBatch(mealTime, category, count, batchNum) {
  const prompt = `Genera exactamente ${count} recetas de ${mealTime} en formato JSON para una app de nutrición española.
Cada receta debe ser REALISTA y adecuada para el momento del día "${mealTime}".
Para "${mealTime}" incluye recetas típicas de ese momento (${mealTime === 'desayuno' ? 'tostadas, cereales, tortillas, zumos, batidos, porridge, huevos, yogures, frutas' : mealTime === 'cena' ? 'sopas, cremas, ensaladas, tortillas, pescados ligeros, verduras, purés, revueltos' : 'platos principales, arroces, pastas, carnes, pescados, legumbres, ensaladas completas'}).
Categoría principal: ${category}.

Responde SOLO con un array JSON válido, sin texto adicional:
[
  {
    "name": "Nombre de la receta en español",
    "description": "Descripción breve apetitosa (2 frases)",
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
    "allergens": ["gluten", "lacteos"],
    "tags": ["rapida", "saludable"],
    "ingredients": [
      {"name": "ingrediente 1", "amount": "100", "unit": "g"},
      {"name": "ingrediente 2", "amount": "2", "unit": "unidades"}
    ],
    "instructions": [
      "Paso 1: descripción detallada",
      "Paso 2: descripción detallada",
      "Paso 3: descripción detallada"
    ],
    "imageUrl": null
  }
]`;

  const baseUrl = (API_URL || 'https://forge.manus.im').replace(/\/$/, '');
  const resp = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
    }),
  });
  
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  const content = data.choices[0].message.content;
  
  // Extract JSON array
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array found');
  return JSON.parse(match[0]);
}

async function main() {
  const existing = JSON.parse(fs.readFileSync('/home/ubuntu/all_recipes.json', 'utf8'));
  
  const batches = [
    // Desayuno - 100 recipes in 4 batches of 25
    { mealTime: 'desayuno', category: 'saludable', count: 25, key: 'd1' },
    { mealTime: 'desayuno', category: 'fitness', count: 25, key: 'd2' },
    { mealTime: 'desayuno', category: 'rapido', count: 25, key: 'd3' },
    { mealTime: 'desayuno', category: 'tradicional', count: 25, key: 'd4' },
    // Cena - 100 recipes in 4 batches of 25
    { mealTime: 'cena', category: 'ligero', count: 25, key: 'c1' },
    { mealTime: 'cena', category: 'saludable', count: 25, key: 'c2' },
    { mealTime: 'cena', category: 'fitness', count: 25, key: 'c3' },
    { mealTime: 'cena', category: 'mediterraneo', count: 25, key: 'c4' },
    // Comida - 75 more recipes (already have 25)
    { mealTime: 'comida', category: 'mediterraneo', count: 25, key: 'co1' },
    { mealTime: 'comida', category: 'fitness', count: 25, key: 'co2' },
    { mealTime: 'comida', category: 'vegetariano', count: 25, key: 'co3' },
  ];
  
  const allNew = {};
  
  for (const batch of batches) {
    console.log(`Generating ${batch.count} ${batch.mealTime} (${batch.category}) recipes...`);
    try {
      const recipes = await generateBatch(batch.mealTime, batch.category, batch.count, batch.key);
      if (!allNew[batch.mealTime]) allNew[batch.mealTime] = [];
      allNew[batch.mealTime].push(...recipes);
      console.log(`  ✓ Got ${recipes.length} recipes for ${batch.mealTime}/${batch.category}`);
      // Save progress after each batch
      const merged = { ...existing };
      for (const [k, v] of Object.entries(allNew)) {
        merged[k] = [...(merged[k] || []), ...v];
      }
      fs.writeFileSync('/home/ubuntu/all_recipes.json', JSON.stringify(merged, null, 2));
      await new Promise(r => setTimeout(r, 2000)); // Rate limit
    } catch (e) {
      console.error(`  ✗ Failed ${batch.mealTime}/${batch.category}: ${e.message}`);
    }
  }
  
  // Final merge
  const merged = { ...existing };
  for (const [k, v] of Object.entries(allNew)) {
    merged[k] = [...(merged[k] || []), ...v];
  }
  fs.writeFileSync('/home/ubuntu/all_recipes.json', JSON.stringify(merged, null, 2));
  
  let total = 0;
  for (const [k, v] of Object.entries(merged)) {
    console.log(`${k}: ${v.length} recipes`);
    total += v.length;
  }
  console.log(`TOTAL: ${total} recipes`);
}

main().catch(console.error);
