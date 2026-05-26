/**
 * Generate 200+ MORE fitness/low-cal recipes using LLM (batch 2)
 * New categories to complement the first 139 recipes
 */
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DATABASE_URL || !FORGE_API_URL || !FORGE_API_KEY) {
  console.error("Missing env vars. Run from project root with dotenv loaded.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function invokeLLM(messages, responseFormat) {
  const body = {
    model: "gemini-2.5-flash",
    messages,
    max_tokens: 32768,
    ...(responseFormat && { response_format: responseFormat }),
  };
  const res = await fetch(`${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error ${res.status}: ${text}`);
  }
  return res.json();
}

const CATEGORIES = [
  { name: "Pizzas y flatbreads fitness", count: 15, examples: "pizza de base de coliflor, flatbread de avena con pavo y rúcula, pizza proteica de claras, naan integral con pollo tikka" },
  { name: "Pasta fitness y alternativas", count: 15, examples: "pasta de lentejas con boloñesa de pavo, espaguetis de calabacín con gambas, mac&cheese proteico con cottage, pasta integral con pesto de espinacas" },
  { name: "Arroces y granos fitness", count: 15, examples: "arroz de coliflor con pollo teriyaki, risotto de avena con champiñones, arroz integral con curry de garbanzos, quinoa salteada con verduras y huevo" },
  { name: "Hamburguesas y sándwiches fit", count: 15, examples: "smash burger de pavo con pan de avena, sándwich de pollo a la plancha con hummus, burger de salmón y aguacate, club sándwich fit con pan integral" },
  { name: "Sopas y cremas proteicas", count: 12, examples: "crema de boniato con pollo desmenuzado, sopa thai de coco y gambas, crema de brócoli con queso cottage, sopa de lentejas rojas con curry" },
  { name: "Platos con huevo creativos", count: 15, examples: "shakshuka fitness, huevos turcos con yogur, cloud eggs con jamón, tortilla soufflé de claras, huevos benedictinos fit" },
  { name: "Tacos y comida mexicana fit", count: 12, examples: "tacos de lechuga con pollo, burrito bowl de pavo, quesadilla de tortilla integral con queso fresco, nachos de boniato con guacamole" },
  { name: "Comida asiática fitness", count: 15, examples: "pad thai de calabacín con pollo, ramen ligero con huevo y verduras, gyozas al vapor de pollo, bibimbap fit con arroz de coliflor" },
  { name: "Postres y dulces fitness", count: 15, examples: "brownie de boniato sin azúcar, cheesecake proteico, helado de plátano y proteína, galletas de avena y chocolate, mousse de chocolate con aguacate" },
  { name: "Snacks salados fitness", count: 12, examples: "chips de kale al horno, palitos de calabacín empanados airfryer, hummus casero con crudités, edamames con sal marina, rollitos de pavo con queso" },
  { name: "Platos de pescado fitness", count: 15, examples: "salmón glaseado con miso, bacalao en papillote con verduras, atún sellado con sésamo, merluza al horno con pisto, ceviche de lubina" },
  { name: "Meal prep containers", count: 15, examples: "pollo teriyaki con arroz y brócoli, ternera con boniato y espárragos, garbanzos al curry con arroz, pavo con quinoa y verduras asadas" },
  { name: "Smoothies y batidos proteicos", count: 12, examples: "smoothie de frutos rojos y proteína, batido verde de espinacas y plátano, smoothie de mango y yogur griego, batido de chocolate y avena" },
  { name: "Recetas con legumbres fitness", count: 12, examples: "hummus de remolacha, curry de garbanzos y espinacas, ensalada de lentejas con feta, hamburguesa de alubias negras, dhal de lentejas rojas" },
  { name: "Platos de temporada verano", count: 10, examples: "gazpacho proteico con jamón, ensalada de sandía y feta, ceviche de mango, carpaccio de calabacín con burrata light" },
  { name: "Platos de temporada invierno", count: 10, examples: "estofado de ternera light, crema de calabaza con semillas, guiso de lentejas con verduras, pollo al horno con boniato y romero" },
];

const TOTAL = CATEGORIES.reduce((sum, c) => sum + c.count, 0);
console.log(`Generating ${TOTAL} fitness recipes across ${CATEGORIES.length} categories...`);

async function generateBatch(category) {
  const systemPrompt = `Eres un nutricionista deportivo y chef especializado en recetas fitness para Instagram. 
Genera recetas ORIGINALES (no copies de ningún creador) que cumplan:
- 300-550 kcal por ración
- Alta en proteína (25-50g por ración)
- Fáciles de hacer (máximo 30 minutos)
- Ingredientes accesibles en supermercados españoles
- Técnicas: airfryer, sartén, horno, sin cocción, al vapor
- Estilo: fitness, pérdida de grasa, saciante, visualmente atractivas
- Nombres creativos y atractivos en español
Para cada receta devuelve un JSON con la estructura exacta solicitada.`;

  const userPrompt = `Genera exactamente ${category.count} recetas de la categoría "${category.name}".
Ejemplos de estilo: ${category.examples}

Devuelve un JSON array con esta estructura para cada receta:
{
  "name": "Nombre creativo de la receta",
  "description": "Descripción breve atractiva (1-2 frases)",
  "preparationTime": número en minutos (5-15),
  "cookTime": número en minutos (0-20),
  "servings": número de raciones (1-2),
  "difficulty": "easy" o "medium",
  "mealTime": "desayuno" | "media_manana" | "comida" | "merienda" | "cena",
  "cuisineType": "Internacional" o "Española" o "Mexicana" o "Asiática" o "Italiana" o "Mediterránea",
  "calories": número (300-550),
  "protein": número en gramos (25-50),
  "carbs": número en gramos,
  "fat": número en gramos,
  "fiber": número en gramos,
  "tags": ["fitness", "alta-proteina", "baja-caloria", + tags específicos],
  "ingredients": [{"name": "ingrediente", "quantity": número, "unit": "g|ml|unidad|cucharada"}],
  "instructions": ["Paso 1...", "Paso 2...", "Paso 3..."]
}

IMPORTANTE: Devuelve SOLO el JSON array, sin texto adicional ni markdown.`;

  const result = await invokeLLM([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const content = result.choices[0].message.content;
  // Extract JSON from response
  let jsonStr = content;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) jsonStr = jsonMatch[0];
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error(`  Failed to parse JSON for ${category.name}:`, e.message);
    return [];
  }
}

async function insertRecipes(recipes) {
  let inserted = 0;
  for (const recipe of recipes) {
    try {
      const query = `
        INSERT INTO recipes (name, description, "preparationTime", "cookTime", servings, difficulty, 
          "mealTime", "cuisineType", "caloriesPerServing", "proteinsPerServing", "carbsPerServing", 
          "fatsPerServing", "fiberPerServing", tags, 
          "ingredientsJson", "instructionsJson", "imageUrl", "isSeeded", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, true, NOW(), NOW())
      `;
      const values = [
        recipe.name,
        recipe.description,
        recipe.preparationTime || 10,
        recipe.cookTime || 15,
        recipe.servings || 1,
        recipe.difficulty || "easy",
        recipe.mealTime || "comida",
        recipe.cuisineType || "Internacional",
        recipe.calories || 400,
        recipe.protein || 30,
        recipe.carbs || 35,
        recipe.fat || 12,
        recipe.fiber || 5,
        JSON.stringify(recipe.tags || ["fitness", "alta-proteina", "baja-caloria"]),
        JSON.stringify(recipe.ingredients || []),
        JSON.stringify(recipe.instructions || []),
        null, // imageUrl placeholder, will be generated later
      ];
      await pool.query(query, values);
      inserted++;
    } catch (e) {
      console.error(`  Error inserting "${recipe.name}":`, e.message);
    }
  }
  return inserted;
}

async function main() {
  let totalInserted = 0;
  
  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i];
    console.log(`\n[${i + 1}/${CATEGORIES.length}] Generating: ${category.name} (${category.count} recipes)...`);
    
    try {
      const recipes = await generateBatch(category);
      console.log(`  Generated ${recipes.length} recipes`);
      
      const inserted = await insertRecipes(recipes);
      totalInserted += inserted;
      console.log(`  Inserted ${inserted} recipes (running total: ${totalInserted})`);
    } catch (e) {
      console.error(`  ERROR in ${category.name}:`, e.message);
    }
    
    // Small delay between batches
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n✅ DONE! Total inserted: ${totalInserted} fitness recipes (batch 2)`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
