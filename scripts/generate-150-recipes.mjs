/**
 * generate-150-recipes.mjs
 * Generates 150 new varied recipes using the built-in LLM API and inserts them into the DB.
 * Distributed across: cuisineType, cookingMethod, mealTime
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
const LLM_URL = process.env.BUILT_IN_FORGE_API_URL;
const LLM_KEY = process.env.BUILT_IN_FORGE_API_KEY;

function parseDbUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error("Invalid DATABASE_URL");
  return {
    user: match[1], password: match[2], host: match[3],
    port: parseInt(match[4]), database: match[5].split("?")[0],
    ssl: { rejectUnauthorized: false },
  };
}

async function invokeLLM(prompt) {
  const res = await fetch(`${LLM_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
    body: JSON.stringify({
      model: "claude-3-5-haiku",
      messages: [
        { role: "system", content: "Eres un chef nutricionista experto. Responde SOLO con JSON válido, sin markdown ni explicaciones." },
        { role: "user", content: prompt },
      ],
      max_tokens: 4000,
    }),
  });
  if (!res.ok) throw new Error(`LLM error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// Distribution plan: 150 recipes across 10 batches of 15
const BATCHES = [
  {
    label: "Desayunos americanos y europeos",
    mealTime: "desayuno",
    cuisineTypes: ["americana", "francesa", "italiana"],
    cookingMethods: ["horno", "plancha", "sin_coccion"],
    count: 15,
    examples: "pancakes proteicos, french toast, granola bowl, avocado toast, crepes, muffins de avena, bagel con salmón, smoothie bowl, tostadas francesas, porridge, waffles, huevos benedict, quiche de verduras, croissant relleno, bowl de açaí",
  },
  {
    label: "Desayunos mediterráneos y españoles",
    mealTime: "desayuno",
    cuisineTypes: ["española", "mediterranea"],
    cookingMethods: ["plancha", "sin_coccion", "horno"],
    count: 15,
    examples: "tostadas con tomate y aceite, tortilla española mini, pan con jamón, bocadillo de atún, gazpacho de frutas, zumo verde, pan de pueblo con queso manchego, huevos revueltos con champiñones, tostada de aguacate con anchoas, pan de centeno con hummus, crema de almendras, porridge mediterráneo, pan tostado con sobrasada, ensalada de frutas con menta, yogur griego con miel y nueces",
  },
  {
    label: "Comidas asiáticas",
    mealTime: "comida",
    cuisineTypes: ["asiatica"],
    cookingMethods: ["wok", "vaporizador", "plancha"],
    count: 15,
    examples: "ramen de pollo, pad thai con gambas, curry verde tailandés, sushi bowl, bibimbap coreano, gyoza al vapor, yakitori de pollo, noodles salteados con verduras, curry japonés, poke bowl de atún, miso ramen, dumplings de cerdo, arroz frito con huevo, teriyaki de salmón, soup de miso con tofu",
  },
  {
    label: "Comidas mediterráneas y españolas",
    mealTime: "comida",
    cuisineTypes: ["española", "mediterranea"],
    cookingMethods: ["olla", "horno", "plancha"],
    count: 15,
    examples: "paella de marisco, gazpacho andaluz, cocido madrileño, fabada asturiana, fideuà, pisto manchego con huevo, merluza al horno, pollo al ajillo, lentejas con chorizo, arroz con bogavante, bacalao a la vizcaína, pimientos rellenos, tortilla de patatas, caldo gallego, pulpo a la gallega",
  },
  {
    label: "Comidas italianas y francesas",
    mealTime: "comida",
    cuisineTypes: ["italiana", "francesa"],
    cookingMethods: ["horno", "plancha", "olla"],
    count: 15,
    examples: "risotto de setas, pasta carbonara, lasaña de verduras, pizza margherita, gnocchi al pesto, ossobuco milanés, quiche lorraine, ratatouille provenzal, bouillabaisse, crêpes de espinacas, pasta al pesto, minestrone, tiramisu salado, polenta con ragù, soufflé de queso",
  },
  {
    label: "Comidas mexicanas y latinoamericanas",
    mealTime: "comida",
    cuisineTypes: ["mexicana", "latinoamericana"],
    cookingMethods: ["plancha", "horno", "olla"],
    count: 15,
    examples: "tacos de pollo asado, burrito bowl, ceviche peruano, enchiladas verdes, chili con carne, fajitas de ternera, guacamole con nachos, quesadillas de queso, pozole rojo, tamales de cerdo, chimichurri con asado, causa limeña, sopa de tortilla, mole negro, arroz con leche mexicano",
  },
  {
    label: "Cenas ligeras y saludables",
    mealTime: "cena",
    cuisineTypes: ["mediterranea", "americana", "española"],
    cookingMethods: ["plancha", "horno", "sin_coccion", "vaporizador"],
    count: 15,
    examples: "salmón al vapor con quinoa, ensalada caprese, pechuga de pollo a la plancha con espárragos, sopa de verduras, tortilla de claras con espinacas, gazpacho frío, ensalada de garbanzos, lubina al horno, tofu salteado con brócoli, crema de calabaza, bowl de lechuga con atún, pavo con verduras asadas, sopa de lentejas rojas, ensalada niçoise, merluza al vapor con limón",
  },
  {
    label: "Cenas asiáticas y árabes",
    mealTime: "cena",
    cuisineTypes: ["asiatica", "arabe"],
    cookingMethods: ["wok", "horno", "vaporizador", "plancha"],
    count: 15,
    examples: "sopa de miso con wakame, shawarma de pollo, falafel con tzatziki, hummus con crudités, curry de lentejas, kebab de cordero, tagine de pollo con aceitunas, arroz basmati con especias, ensalada tabbouleh, sopa tom kha, rollitos de primavera al vapor, baba ganoush con pita, pollo tikka masala, dal de lentejas, ensalada de pepino con yogur",
  },
  {
    label: "Meriendas y snacks",
    mealTime: "merienda",
    cuisineTypes: ["americana", "española", "italiana"],
    cookingMethods: ["horno", "sin_coccion", "airfryer"],
    count: 15,
    examples: "brownie proteico, energy balls de avena, muffins de plátano, tostadas de mantequilla de cacahuete, fruta con yogur, palomitas de maíz caseras, chips de kale al horno, hummus con zanahoria, galletas de avena, batido de proteínas, bizcocho de limón, tortitas de arroz con aguacate, frutos secos tostados, smoothie de fresas, barritas de granola caseras",
  },
  {
    label: "Recetas para Air Fryer",
    mealTime: "cualquiera",
    cuisineTypes: ["española", "americana", "italiana", "asiatica"],
    cookingMethods: ["airfryer"],
    count: 15,
    examples: "alitas de pollo crujientes, patatas gajo con especias, nuggets de pollo caseros, calamares rebozados, croquetas de jamón, empanadas de atún, rollitos de primavera, aros de cebolla, palitos de mozzarella, salmón con costra de hierbas, gambas al ajillo, pizza personal, patatas bravas, costillas BBQ, donuts de avena",
  },
];

function mapDifficulty(d) {
  if (!d) return "medium";
  const l = d.toLowerCase();
  if (l.includes("fácil") || l.includes("facil") || l.includes("easy") || l.includes("sencill")) return "easy";
  if (l.includes("difícil") || l.includes("dificil") || l.includes("hard") || l.includes("avanzad")) return "hard";
  return "medium";
}

async function generateBatch(batch) {
  const cuisineStr = batch.cuisineTypes.join(", ");
  const methodStr = batch.cookingMethods.join(", ");

  const prompt = `Genera exactamente ${batch.count} recetas de "${batch.label}" en español.
Tipos de cocina: ${cuisineStr}
Métodos de cocción: ${methodStr}
Momento del día: ${batch.mealTime}
Ejemplos de recetas (no copies exactamente, inspírate): ${batch.examples}

Devuelve un array JSON con exactamente ${batch.count} objetos. Cada objeto DEBE tener:
{
  "name": "nombre de la receta",
  "description": "descripción apetitosa de 1-2 frases",
  "mealTime": "${batch.mealTime}",
  "cuisineType": "una de: española|italiana|asiatica|mexicana|americana|arabe|francesa|mediterranea|latinoamericana",
  "cookingMethod": "uno de: airfryer|horno|plancha|olla|sin_coccion|microondas|vaporizador|wok",
  "preparationTime": número en minutos (5-30),
  "cookTime": número en minutos (0-60),
  "servings": número (1-4),
  "difficulty": "easy|medium|hard",
  "calories": número (150-800),
  "protein": número en gramos (5-60),
  "carbs": número en gramos (5-100),
  "fat": número en gramos (3-50),
  "fiber": número en gramos (1-20),
  "allergens": array de strings (puede incluir: "gluten", "lacteos", "huevos", "pescado", "mariscos", "frutos_secos", "soja", "apio"),
  "tags": array de 2-4 strings descriptivos como ["fitness", "rapida", "vegana", "sin_gluten", "proteica", "baja_calorias"],
  "ingredients": [{"name": "ingrediente", "amount": "cantidad", "unit": "unidad"}],
  "instructions": [{"step": 1, "text": "instrucción detallada"}]
}

IMPORTANTE: 
- Varía los tipos de cocina y métodos entre las recetas del batch
- Las instrucciones deben ser claras y detalladas (mínimo 4 pasos)
- Los ingredientes deben ser realistas con cantidades precisas
- Devuelve SOLO el array JSON, sin texto adicional`;

  const raw = await invokeLLM(prompt);
  
  // Clean up potential markdown code blocks
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  
  const recipes = JSON.parse(cleaned);
  if (!Array.isArray(recipes)) throw new Error("LLM did not return an array");
  return recipes;
}

async function main() {
  if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
  if (!LLM_URL || !LLM_KEY) { console.error("LLM env vars not set"); process.exit(1); }

  const conn = await createConnection(parseDbUrl(DB_URL));
  console.log("✓ Connected to database");

  // Get system user ID
  const [users] = await conn.execute("SELECT id FROM users LIMIT 1");
  const systemUserId = users.length > 0 ? users[0].id : 1;
  console.log(`Using userId: ${systemUserId}`);

  // Check current count
  const [countRes] = await conn.execute("SELECT COUNT(*) as count FROM recipes WHERE isSeeded = 1");
  console.log(`Current seeded recipes: ${countRes[0].count}`);

  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < BATCHES.length; i++) {
    const batch = BATCHES[i];
    console.log(`\n[${i + 1}/${BATCHES.length}] Generating batch: "${batch.label}" (${batch.count} recipes)...`);

    let recipes;
    try {
      recipes = await generateBatch(batch);
      console.log(`  ✓ LLM returned ${recipes.length} recipes`);
    } catch (e) {
      console.error(`  ✗ LLM error for batch "${batch.label}": ${e.message}`);
      totalErrors += batch.count;
      continue;
    }

    for (const recipe of recipes) {
      try {
        const ingredients = JSON.stringify(recipe.ingredients || []);
        const instructions = JSON.stringify(recipe.instructions || []);
        const allergens = JSON.stringify(recipe.allergens || []);
        const tags = JSON.stringify(recipe.tags || []);
        const difficulty = mapDifficulty(recipe.difficulty);
        const mealTimeValid = ["desayuno", "media_manana", "comida", "merienda", "cena", "cualquiera"];
        const mealTime = mealTimeValid.includes(recipe.mealTime) ? recipe.mealTime : batch.mealTime;

        await conn.execute(
          `INSERT INTO recipes (
            userId, name, description, mealTime, category, cuisineType, cookingMethod,
            preparationTime, cookTime, servings, difficulty,
            caloriesPerServing, proteinsPerServing, carbsPerServing, fatsPerServing, fiberPerServing,
            allergens, tags, ingredientsJson, instructionsJson,
            isPublic, isSeeded, active, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, NOW(), NOW())`,
          [
            systemUserId,
            (recipe.name || "Receta sin nombre").substring(0, 255),
            (recipe.description || "").substring(0, 1000),
            mealTime,
            "general",
            recipe.cuisineType || batch.cuisineTypes[0],
            recipe.cookingMethod || batch.cookingMethods[0],
            Math.max(1, parseInt(recipe.preparationTime) || 10),
            Math.max(0, parseInt(recipe.cookTime) || 15),
            Math.max(1, parseInt(recipe.servings) || 2),
            difficulty,
            Math.max(50, parseInt(recipe.calories) || 300),
            Math.max(0, parseFloat(recipe.protein) || 15),
            Math.max(0, parseFloat(recipe.carbs) || 35),
            Math.max(0, parseFloat(recipe.fat) || 10),
            Math.max(0, parseFloat(recipe.fiber) || 3),
            allergens,
            tags,
            ingredients,
            instructions,
          ]
        );
        totalInserted++;
      } catch (e) {
        totalErrors++;
        if (totalErrors <= 10) console.error(`  ✗ Insert error for "${recipe.name}": ${e.message}`);
      }
    }
    console.log(`  ✓ Batch done. Inserted so far: ${totalInserted}`);
  }

  // Final count
  const [finalCount] = await conn.execute("SELECT COUNT(*) as count FROM recipes WHERE isSeeded = 1");
  console.log(`\n${"=".repeat(50)}`);
  console.log(`✓ DONE! Inserted: ${totalInserted} | Errors: ${totalErrors}`);
  console.log(`Total seeded recipes in DB: ${finalCount[0].count}`);

  // Breakdown by cuisineType
  const [byType] = await conn.execute(
    "SELECT cuisineType, COUNT(*) as count FROM recipes WHERE isSeeded = 1 GROUP BY cuisineType ORDER BY count DESC"
  );
  console.log("\nBy cuisine type:");
  byType.forEach(r => console.log(`  ${r.cuisineType || "null"}: ${r.count}`));

  // Breakdown by cookingMethod
  const [byMethod] = await conn.execute(
    "SELECT cookingMethod, COUNT(*) as count FROM recipes WHERE isSeeded = 1 GROUP BY cookingMethod ORDER BY count DESC"
  );
  console.log("\nBy cooking method:");
  byMethod.forEach(r => console.log(`  ${r.cookingMethod || "null"}: ${r.count}`));

  await conn.end();
}

main().catch(e => { console.error("Fatal error:", e); process.exit(1); });
