/**
 * Script para generar más recetas en categorías escasas con IA + imágenes
 * Categorías objetivo: Sushi, Pizzas, Mariscos, Guisos, Smoothie bowls, Parrilla, Bocadillos, Postres
 */
import { Client } from 'pg';
import { execSync } from 'child_process';

const DB = process.env.DATABASE_URL;
const LLM_URL = process.env.BUILT_IN_FORGE_API_URL + '/v1/chat/completions';
const LLM_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const IMG_URL = process.env.BUILT_IN_FORGE_API_URL + '/v1/images/generations';

const client = new Client({ connectionString: DB });
await client.connect();

// Categorías con objetivo de recetas
const TARGETS = [
  { category: 'Sushi', target: 9, mealTime: 'comida', difficulty: 'medium' },
  { category: 'Pizzas', target: 7, mealTime: 'cena', difficulty: 'medium' },
  { category: 'Mariscos', target: 8, mealTime: 'comida', difficulty: 'medium' },
  { category: 'Guisos', target: 7, mealTime: 'comida', difficulty: 'easy' },
  { category: 'Smoothie bowls', target: 5, mealTime: 'desayuno', difficulty: 'easy' },
  { category: 'Parrilla', target: 6, mealTime: 'comida', difficulty: 'medium' },
  { category: 'Bocadillos', target: 4, mealTime: 'merienda', difficulty: 'easy' },
  { category: 'Postres', target: 6, mealTime: 'merienda', difficulty: 'medium' },
];

async function invokeLLM(messages) {
  const body = {
    model: 'gpt-4o-mini',
    messages,
    response_format: { type: 'json_object' },
    max_tokens: 4096,
  };
  const res = await fetch(LLM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM_KEY}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function generateImage(prompt) {
  try {
    const res = await fetch(IMG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM_KEY}` },
      body: JSON.stringify({ prompt, n: 1, size: '512x512' }),
    });
    const data = await res.json();
    return data.data?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

async function uploadImageToS3(imageUrl, recipeName) {
  try {
    // Download image
    const res = await fetch(imageUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    const tmpFile = `/tmp/recipe_img_${Date.now()}.jpg`;
    const { writeFileSync } = await import('fs');
    writeFileSync(tmpFile, buffer);
    // Upload to S3 via manus-upload-file --webdev
    const output = execSync(`manus-upload-file --webdev ${tmpFile}`, { encoding: 'utf8' });
    const url = output.trim().split('\n').find(l => l.startsWith('http')) || output.trim();
    return url || null;
  } catch (e) {
    console.error('Error uploading image:', e.message);
    return null;
  }
}

// Get existing recipe names to avoid duplicates
const existingNames = new Set(
  (await client.query('SELECT name FROM recipes WHERE "isSeeded" = true AND "deletedAt" IS NULL')).rows.map(r => r.name.toLowerCase())
);

let totalCreated = 0;

for (const { category, target, mealTime, difficulty } of TARGETS) {
  const existing = (await client.query('SELECT COUNT(*) as c FROM recipes WHERE category = $1 AND "isSeeded" = true AND "deletedAt" IS NULL', [category])).rows[0].c;
  const needed = target - parseInt(existing);
  if (needed <= 0) {
    console.log(`✓ ${category}: ya tiene ${existing} recetas (objetivo ${target})`);
    continue;
  }
  console.log(`\n→ Generando ${needed} recetas para "${category}" (tiene ${existing}, objetivo ${target})...`);

  const systemPrompt = `Eres un chef español. Genera recetas cotidianas españolas reales. Responde SOLO con JSON válido y completo.`;

  const userPrompt = `Genera exactamente ${needed} recetas de la categoría "${category}" para ${mealTime}. Dificultad: ${difficulty}.
Evita: ${Array.from(existingNames).slice(0, 10).join(', ')}.
Devuelve JSON: {"recipes":[{"name":"...","description":"...","calories":350,"proteins":20,"carbs":30,"fats":12,"fiber":3,"prepTime":15,"cookTime":20,"servings":2,"ingredients":["200g ingrediente"],"instructions":["Paso 1","Paso 2","Paso 3"],"allergens":"","tags":"${category.toLowerCase()}"}]}
IMPORTANTE: Máximo 3 ingredientes y 3 pasos por receta para mantener el JSON corto.`;

  // Generar de 2 en 2 para evitar truncamiento
  let recipesData = [];
  const batchSize = 2;
  for (let i = 0; i < needed; i += batchSize) {
    const batchNeeded = Math.min(batchSize, needed - i);
    const batchPrompt = userPrompt.replace(`exactamente ${needed} recetas`, `exactamente ${batchNeeded} recetas`);
    try {
      const raw = await invokeLLM([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: batchPrompt },
      ]);
      const parsed = JSON.parse(raw);
      recipesData.push(...(parsed.recipes ?? []));
    } catch (e) {
      console.error(`  ✗ Error en lote ${i}-${i+batchSize} para ${category}:`, e.message);
    }
  }

  for (const recipe of recipesData) {
    if (existingNames.has(recipe.name.toLowerCase())) {
      console.log(`  ⚠ Saltando duplicado: ${recipe.name}`);
      continue;
    }

    // Generate image
    console.log(`  📸 Generando imagen para: ${recipe.name}`);
    const imgPrompt = `Professional food photography of "${recipe.name}", Spanish cuisine, appetizing, natural lighting, restaurant quality, white plate, high resolution`;
    let imageUrl = null;
    try {
      const genUrl = await generateImage(imgPrompt);
      if (genUrl) {
        imageUrl = await uploadImageToS3(genUrl, recipe.name);
      }
    } catch (e) {
      console.error(`  ⚠ Error imagen:`, e.message);
    }

    // Insert into DB
    try {
      await client.query(`
        INSERT INTO recipes (
          "userId", name, "imageUrl", description, "preparationTime", "cookTime", servings,
          difficulty, "isPublic", active, "mealTime", category, allergens, tags,
          "caloriesPerServing", "proteinsPerServing", "carbsPerServing", "fatsPerServing", "fiberPerServing",
          "ingredientsJson", "instructionsJson", "isSeeded", "createdAt", "updatedAt"
        ) VALUES (
          1, $1, $2, $3, $4, $5, $6,
          $7, true, true, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, true, NOW(), NOW()
        )
      `, [
        recipe.name,
        imageUrl || 'https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg',
        recipe.description,
        recipe.prepTime ?? 15,
        recipe.cookTime ?? 20,
        recipe.servings ?? 2,
        difficulty,
        mealTime,
        category,
        recipe.allergens || '',
        recipe.tags || category.toLowerCase(),
        recipe.calories ?? 400,
        recipe.proteins ?? 20,
        recipe.carbs ?? 40,
        recipe.fats ?? 15,
        recipe.fiber ?? 3,
        JSON.stringify(recipe.ingredients ?? []),
        JSON.stringify(recipe.instructions ?? []),
      ]);
      existingNames.add(recipe.name.toLowerCase());
      totalCreated++;
      console.log(`  ✓ Creada: ${recipe.name} (${recipe.calories} kcal)`);
    } catch (e) {
      console.error(`  ✗ Error insertando ${recipe.name}:`, e.message);
    }
  }
}

await client.end();
console.log(`\n✅ Total recetas creadas: ${totalCreated}`);
