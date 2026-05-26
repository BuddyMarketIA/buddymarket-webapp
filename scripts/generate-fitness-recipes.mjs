/**
 * Generate 100 fitness/low-cal recipes using LLM
 * Style: Instagram fitness creators (300-550 kcal, high protein, easy to make)
 */
import { drizzle } from "drizzle-orm/node-postgres";
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
  { name: "Bowls proteicos", count: 12, examples: "bowl de boniato con carne, bowl de quinoa con pollo, poke bowl de salmón" },
  { name: "Quiches y tortillas fitness", count: 12, examples: "quiche de tortilla integral en airfryer, tortilla de claras con verduras, frittata de espinacas" },
  { name: "Wraps y burritos ligeros", count: 12, examples: "wrap de pollo cajún, burrito de pavo con verduras, wrap de atún con aguacate" },
  { name: "Ensaladas completas", count: 12, examples: "ensalada de pasta de garbanzos con pollo, ensalada César ligera, ensalada thai de mango y gambas" },
  { name: "Platos de sartén rápidos", count: 12, examples: "salteado de pollo con verduras, gambas al ajillo con espinacas, pavo a la plancha con boniato" },
  { name: "Airfryer fitness", count: 12, examples: "nuggets de pollo caseros, patatas especiadas, falafel de garbanzos, croquetas de atún" },
  { name: "Snacks y meriendas proteicas", count: 10, examples: "tortitas de avena y plátano, mug cake proteico, barritas energéticas caseras" },
  { name: "Desayunos fitness", count: 10, examples: "overnight oats con proteína, tostada de aguacate y huevo, smoothie bowl" },
  { name: "Cenas ligeras", count: 10, examples: "crema de calabacín con queso, sopa de pollo y verduras, espinacas cremosas al curry" },
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
- Técnicas: airfryer, sartén, horno, sin cocción
- Estilo: fitness, pérdida de grasa, saciante
- Nombres creativos y atractivos en español

Para cada receta devuelve un JSON con esta estructura exacta.`;

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
  "category": "${category.name}",
  "cuisineType": "Internacional" o "Española" o "Mediterránea" o "Americana" o "Asiática",
  "cookingMethod": "airfryer" | "sarten" | "horno" | "sin_coccion" | "plancha" | "wok",
  "allergens": ["gluten", "lacteos", "huevos", ...] (solo los que apliquen),
  "tags": ["fitness", "alta-proteina", "low-cal", "rapida", ...],
  "caloriesPerServing": número (300-550),
  "proteinsPerServing": número (25-50),
  "carbsPerServing": número (15-60),
  "fatsPerServing": número (5-20),
  "fiberPerServing": número (3-15),
  "ingredients": [{"name": "ingrediente", "amount": "cantidad", "unit": "g/ml/unidad", "category": "proteina/carbohidrato/verdura/grasa/condimento"}],
  "instructions": [{"step": 1, "text": "Instrucción clara y concisa"}]
}

IMPORTANTE: Devuelve SOLO el JSON array, sin texto adicional.`;

  const response = await invokeLLM(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      type: "json_schema",
      json_schema: {
        name: "fitness_recipes",
        strict: true,
        schema: {
          type: "object",
          properties: {
            recipes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  preparationTime: { type: "integer" },
                  cookTime: { type: "integer" },
                  servings: { type: "integer" },
                  difficulty: { type: "string" },
                  mealTime: { type: "string" },
                  category: { type: "string" },
                  cuisineType: { type: "string" },
                  cookingMethod: { type: "string" },
                  allergens: { type: "array", items: { type: "string" } },
                  tags: { type: "array", items: { type: "string" } },
                  caloriesPerServing: { type: "integer" },
                  proteinsPerServing: { type: "number" },
                  carbsPerServing: { type: "number" },
                  fatsPerServing: { type: "number" },
                  fiberPerServing: { type: "number" },
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        amount: { type: "string" },
                        unit: { type: "string" },
                        category: { type: "string" },
                      },
                      required: ["name", "amount", "unit", "category"],
                      additionalProperties: false,
                    },
                  },
                  instructions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        step: { type: "integer" },
                        text: { type: "string" },
                      },
                      required: ["step", "text"],
                      additionalProperties: false,
                    },
                  },
                },
                required: [
                  "name", "description", "preparationTime", "cookTime", "servings",
                  "difficulty", "mealTime", "category", "cuisineType", "cookingMethod",
                  "allergens", "tags", "caloriesPerServing", "proteinsPerServing",
                  "carbsPerServing", "fatsPerServing", "fiberPerServing",
                  "ingredients", "instructions"
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["recipes"],
          additionalProperties: false,
        },
      },
    }
  );

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);
  return parsed.recipes;
}

async function insertRecipes(recipes) {
  const client = await pool.connect();
  let inserted = 0;
  try {
    for (const r of recipes) {
      await client.query(
        `INSERT INTO recipes (
          name, description, "preparationTime", "cookTime", servings, difficulty,
          "isPublic", active, "mealTime", category, "cuisineType", "cookingMethod",
          allergens, tags, "caloriesPerServing", "proteinsPerServing",
          "carbsPerServing", "fatsPerServing", "fiberPerServing",
          "ingredientsJson", "instructionsJson", "isSeeded", "imageUrl", "createdAt", "updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NOW(),NOW())`,
        [
          r.name,
          r.description,
          r.preparationTime,
          r.cookTime,
          r.servings,
          r.difficulty,
          true,
          true,
          r.mealTime,
          r.category,
          r.cuisineType,
          r.cookingMethod,
          JSON.stringify(r.allergens),
          JSON.stringify([...r.tags, "fitness", "low-cal", "alta-proteina"]),
          r.caloriesPerServing,
          r.proteinsPerServing,
          r.carbsPerServing,
          r.fatsPerServing,
          r.fiberPerServing,
          JSON.stringify(r.ingredients),
          JSON.stringify(r.instructions),
          true,
          "imageUrl", // placeholder, will be updated later
        ]
      );
      inserted++;
    }
  } finally {
    client.release();
  }
  return inserted;
}

async function main() {
  let totalInserted = 0;
  
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    console.log(`\n[${i + 1}/${CATEGORIES.length}] Generating ${cat.count} recipes for "${cat.name}"...`);
    
    try {
      const recipes = await generateBatch(cat);
      console.log(`  → Generated ${recipes.length} recipes`);
      
      const inserted = await insertRecipes(recipes);
      totalInserted += inserted;
      console.log(`  → Inserted ${inserted} recipes (total: ${totalInserted})`);
    } catch (err) {
      console.error(`  ✗ Error in category "${cat.name}":`, err.message);
      // Continue with next category
    }
    
    // Small delay between batches
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n✓ DONE! Total recipes inserted: ${totalInserted}`);
  await pool.end();
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
