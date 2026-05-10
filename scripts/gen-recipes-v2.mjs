/**
 * gen-recipes-v2.mjs
 * Generates 150 new varied recipes in small batches of 5 to avoid LLM JSON truncation.
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
  return { user: match[1], password: match[2], host: match[3], port: parseInt(match[4]), database: match[5].split("?")[0], ssl: { rejectUnauthorized: false } };
}

async function invokeLLM(prompt) {
  const res = await fetch(`${LLM_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
    body: JSON.stringify({
      model: "claude-3-5-haiku",
      messages: [
        { role: "system", content: "Eres un chef nutricionista. Responde SOLO con JSON válido, sin markdown." },
        { role: "user", content: prompt },
      ],
      max_tokens: 3000,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const data = await res.json();
  let raw = data.choices[0].message.content.trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(raw);
}

function mapDifficulty(d) {
  if (!d) return "medium";
  const l = String(d).toLowerCase();
  if (l.includes("fácil") || l.includes("facil") || l.includes("easy") || l.includes("sencill")) return "easy";
  if (l.includes("difícil") || l.includes("dificil") || l.includes("hard") || l.includes("avanzad")) return "hard";
  return "medium";
}

// 30 groups of 5 recipes = 150 total
const RECIPE_GROUPS = [
  // DESAYUNOS (30)
  { mealTime: "desayuno", cuisine: "americana", method: "horno", recipes: ["Pancakes de avena y plátano", "French toast con fresas", "Muffins de arándanos y limón", "Waffles proteicos de vainilla", "Granola casera con frutos secos"] },
  { mealTime: "desayuno", cuisine: "francesa", method: "horno", recipes: ["Croissant de jamón y queso", "Quiche de espinacas y brie", "Crepes de mantequilla y miel", "Pain perdu con canela", "Brioche tostado con mermelada"] },
  { mealTime: "desayuno", cuisine: "española", method: "plancha", recipes: ["Tostadas con tomate y aceite de oliva", "Bocadillo de jamón serrano", "Pan con mantequilla y anchoas", "Tostada de aguacate con huevo poché", "Molletes con aceite y tomate"] },
  { mealTime: "desayuno", cuisine: "italiana", method: "sin_coccion", recipes: ["Yogur con granola y miel", "Bowl de açaí con frutas tropicales", "Smoothie verde de espinacas y mango", "Overnight oats con frutos rojos", "Parfait de yogur griego con nueces"] },
  { mealTime: "desayuno", cuisine: "mediterranea", method: "sin_coccion", recipes: ["Labneh con aceite de oliva y za'atar", "Ensalada de frutas con menta fresca", "Porridge de quinoa con canela y manzana", "Bowl de kéfir con semillas de chía", "Tostada de hummus con pepino y tomate cherry"] },
  { mealTime: "desayuno", cuisine: "americana", method: "plancha", recipes: ["Huevos revueltos con salmón ahumado", "Tortilla americana de queso cheddar", "Bagel con queso crema y pepino", "Avocado toast con huevo frito", "Smoothie bowl de fresas y plátano"] },
  // MEDIA MAÑANA (10)
  { mealTime: "media_manana", cuisine: "española", method: "sin_coccion", recipes: ["Fruta de temporada con yogur", "Tostada de mantequilla de almendras", "Plátano con nueces y miel", "Manzana con queso fresco", "Zumo de naranja natural con galletas de avena"] },
  { mealTime: "media_manana", cuisine: "americana", method: "sin_coccion", recipes: ["Energy balls de dátiles y cacao", "Barritas de granola caseras", "Batido de proteínas de vainilla", "Frutos secos tostados con arándanos secos", "Yogur griego con pepitas de calabaza"] },
  // COMIDAS MEDITERRÁNEAS Y ESPAÑOLAS (25)
  { mealTime: "comida", cuisine: "española", method: "olla", recipes: ["Cocido madrileño tradicional", "Fabada asturiana con compango", "Caldo gallego con grelos", "Lentejas estofadas con chorizo", "Potaje de garbanzos con espinacas"] },
  { mealTime: "comida", cuisine: "española", method: "horno", recipes: ["Merluza al horno con patatas", "Pollo asado con verduras de temporada", "Bacalao a la vizcaína", "Pimientos del piquillo rellenos de bacalao", "Cordero al horno con ajo y romero"] },
  { mealTime: "comida", cuisine: "española", method: "plancha", recipes: ["Filete de ternera con pimientos asados", "Pechuga de pollo al ajillo", "Dorada a la plancha con limón", "Gambas al ajillo con pan tostado", "Pulpo a la gallega con pimentón"] },
  { mealTime: "comida", cuisine: "mediterranea", method: "horno", recipes: ["Musaka griega de berenjena", "Spanakopita de espinacas y feta", "Pollo al limón con aceitunas y alcaparras", "Berenjenas rellenas al horno", "Lubina al horno con tomates cherry"] },
  { mealTime: "comida", cuisine: "mediterranea", method: "sin_coccion", recipes: ["Ensalada griega con feta y aceitunas", "Tabbouleh de bulgur con hierbas frescas", "Ensalada de garbanzos con pepino y menta", "Fattoush con pan pita crujiente", "Ensalada de quinoa mediterránea"] },
  // COMIDAS ITALIANAS (15)
  { mealTime: "comida", cuisine: "italiana", method: "olla", recipes: ["Risotto de setas porcini", "Minestrone de verduras de temporada", "Pasta e fagioli tradicional", "Ribollita toscana", "Zuppa di pesce italiana"] },
  { mealTime: "comida", cuisine: "italiana", method: "horno", recipes: ["Lasaña de verduras y ricotta", "Pizza napolitana de mozzarella y albahaca", "Pollo alla parmigiana", "Focaccia con romero y aceite de oliva", "Parmigiana di melanzane"] },
  { mealTime: "comida", cuisine: "italiana", method: "plancha", recipes: ["Pasta carbonara cremosa", "Gnocchi al pesto genovés", "Tagliatelle con ragù boloñés", "Pasta al limone con gambas", "Risotto nero de sepia"] },
  // COMIDAS ASIÁTICAS (15)
  { mealTime: "comida", cuisine: "asiatica", method: "wok", recipes: ["Pad thai con gambas y cacahuetes", "Arroz frito con verduras y huevo", "Noodles salteados con ternera y brócoli", "Pollo kung pao con pimientos", "Tofu salteado con salsa de ostras"] },
  { mealTime: "comida", cuisine: "asiatica", method: "vaporizador", recipes: ["Dim sum de cerdo y gambas", "Gyoza al vapor con salsa ponzu", "Bao de cerdo asado", "Salmón al vapor con jengibre y soja", "Verduras al vapor con salsa teriyaki"] },
  { mealTime: "comida", cuisine: "asiatica", method: "olla", recipes: ["Ramen de pollo con huevo marinado", "Curry verde tailandés con leche de coco", "Sopa de miso con tofu y wakame", "Bibimbap coreano con verduras", "Pho vietnamita de ternera"] },
  // COMIDAS MEXICANAS Y LATINOAMERICANAS (10)
  { mealTime: "comida", cuisine: "mexicana", method: "plancha", recipes: ["Tacos de pollo asado con salsa verde", "Fajitas de ternera con pimientos", "Quesadillas de queso y frijoles", "Enchiladas verdes con pollo", "Tostadas de ceviche de camarón"] },
  { mealTime: "comida", cuisine: "latinoamericana", method: "olla", recipes: ["Ceviche peruano de corvina", "Causa limeña de atún", "Sopa de tortilla mexicana", "Chili con carne texano", "Arroz con pollo colombiano"] },
  // COMIDAS ÁRABES Y FRANCESAS (10)
  { mealTime: "comida", cuisine: "arabe", method: "horno", recipes: ["Shawarma de pollo con pita", "Tagine de cordero con ciruelas", "Kofta de ternera al horno", "Pollo marroquí con limón en conserva", "Berenjenas rellenas al estilo árabe"] },
  { mealTime: "comida", cuisine: "francesa", method: "horno", recipes: ["Quiche lorraine con bacon y gruyère", "Ratatouille provenzal", "Poulet rôti con hierbas de Provenza", "Gratin dauphinois de patatas", "Bouillabaisse marsellesa"] },
  // CENAS LIGERAS (20)
  { mealTime: "cena", cuisine: "española", method: "plancha", recipes: ["Salmón a la plancha con ensalada verde", "Pechuga de pavo con espárragos", "Tortilla de claras con espinacas y tomate", "Dorada a la plancha con limón", "Sepia a la plancha con ajo y perejil"] },
  { mealTime: "cena", cuisine: "mediterranea", method: "vaporizador", recipes: ["Merluza al vapor con verduras", "Pollo al vapor con hierbas aromáticas", "Brócoli al vapor con aceite de oliva", "Salmón al vapor con limón y eneldo", "Mejillones al vapor con vino blanco"] },
  { mealTime: "cena", cuisine: "asiatica", method: "wok", recipes: ["Tofu con brócoli y salsa de soja", "Gambas salteadas con jengibre y ajo", "Ensalada de fideos soba fríos", "Pollo con anacardos al wok", "Bok choy salteado con ajo"] },
  { mealTime: "cena", cuisine: "arabe", method: "sin_coccion", recipes: ["Hummus casero con crudités", "Ensalada de tabbouleh fresco", "Baba ganoush con pan pita", "Fattoush de verano", "Ensalada de pepino con yogur y menta"] },
  // MERIENDAS (10)
  { mealTime: "merienda", cuisine: "americana", method: "horno", recipes: ["Brownies de chocolate negro", "Muffins de plátano y nueces", "Galletas de avena y pasas", "Bizcocho de limón y amapola", "Donuts de avena al horno"] },
  { mealTime: "merienda", cuisine: "española", method: "sin_coccion", recipes: ["Fruta con yogur y miel", "Tostada de mantequilla de cacahuete", "Batido de frutas del bosque", "Palomitas de maíz con especias", "Tortitas de arroz con aguacate"] },
  // AIR FRYER (15)
  { mealTime: "cualquiera", cuisine: "española", method: "airfryer", recipes: ["Croquetas de jamón ibérico crujientes", "Patatas gajo con pimentón y ajo", "Alitas de pollo con miel y mostaza", "Calamares rebozados crujientes", "Empanadas de atún y pimiento"] },
  { mealTime: "cualquiera", cuisine: "americana", method: "airfryer", recipes: ["Nuggets de pollo caseros crujientes", "Aros de cebolla con salsa ranch", "Palitos de mozzarella rebozados", "Costillas BBQ al air fryer", "Pizza personal de pepperoni"] },
];

async function generateRecipeGroup(group, conn, systemUserId) {
  const recipeNames = group.recipes.join(", ");
  const prompt = `Genera exactamente 5 recetas en español para estas recetas: ${recipeNames}

Devuelve un array JSON de exactamente 5 objetos con esta estructura:
[{
  "name": "nombre exacto de la receta",
  "description": "descripción apetitosa en 1-2 frases",
  "mealTime": "${group.mealTime}",
  "cuisineType": "${group.cuisine}",
  "cookingMethod": "${group.method}",
  "preparationTime": número_minutos,
  "cookTime": número_minutos,
  "servings": número,
  "difficulty": "easy|medium|hard",
  "calories": número_kcal,
  "protein": gramos,
  "carbs": gramos,
  "fat": gramos,
  "fiber": gramos,
  "allergens": ["gluten","lacteos","huevos","pescado","mariscos","frutos_secos","soja"],
  "tags": ["tag1","tag2"],
  "ingredients": [{"name":"ingrediente","amount":"cantidad","unit":"unidad"}],
  "instructions": [{"step":1,"text":"instrucción"}]
}]

SOLO devuelve el array JSON, sin texto adicional.`;

  const recipes = await invokeLLM(prompt);
  if (!Array.isArray(recipes)) throw new Error("Not an array");

  let inserted = 0;
  for (const recipe of recipes) {
    try {
      const mealTimeValid = ["desayuno", "media_manana", "comida", "merienda", "cena", "cualquiera"];
      const mealTime = mealTimeValid.includes(recipe.mealTime) ? recipe.mealTime : group.mealTime;
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
          String(recipe.name || "Receta sin nombre").substring(0, 255),
          String(recipe.description || "").substring(0, 1000),
          mealTime,
          "general",
          recipe.cuisineType || group.cuisine,
          recipe.cookingMethod || group.method,
          Math.max(1, parseInt(recipe.preparationTime) || 10),
          Math.max(0, parseInt(recipe.cookTime) || 15),
          Math.max(1, parseInt(recipe.servings) || 2),
          mapDifficulty(recipe.difficulty),
          Math.max(50, parseInt(recipe.calories) || 300),
          Math.max(0, parseFloat(recipe.protein) || 15),
          Math.max(0, parseFloat(recipe.carbs) || 35),
          Math.max(0, parseFloat(recipe.fat) || 10),
          Math.max(0, parseFloat(recipe.fiber) || 3),
          JSON.stringify(Array.isArray(recipe.allergens) ? recipe.allergens : []),
          JSON.stringify(Array.isArray(recipe.tags) ? recipe.tags : []),
          JSON.stringify(Array.isArray(recipe.ingredients) ? recipe.ingredients : []),
          JSON.stringify(Array.isArray(recipe.instructions) ? recipe.instructions : []),
        ]
      );
      inserted++;
    } catch (e) {
      console.error(`  ✗ Insert error for "${recipe.name}": ${e.message}`);
    }
  }
  return inserted;
}

async function main() {
  if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
  if (!LLM_URL || !LLM_KEY) { console.error("LLM env vars not set"); process.exit(1); }

  const conn = await createConnection(parseDbUrl(DB_URL));
  console.log("✓ Connected to database");

  const [users] = await conn.execute("SELECT id FROM users LIMIT 1");
  const systemUserId = users.length > 0 ? users[0].id : 1;
  console.log(`Using userId: ${systemUserId}`);

  const [countRes] = await conn.execute("SELECT COUNT(*) as count FROM recipes WHERE isSeeded = 1");
  console.log(`Current seeded recipes: ${countRes[0].count}`);

  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < RECIPE_GROUPS.length; i++) {
    const group = RECIPE_GROUPS[i];
    const names = group.recipes.join(", ").substring(0, 60) + "...";
    process.stdout.write(`[${i + 1}/${RECIPE_GROUPS.length}] ${group.mealTime}/${group.cuisine}/${group.method}... `);
    
    try {
      const inserted = await generateRecipeGroup(group, conn, systemUserId);
      totalInserted += inserted;
      console.log(`✓ ${inserted}/5 inserted (total: ${totalInserted})`);
    } catch (e) {
      totalErrors += 5;
      console.log(`✗ Error: ${e.message}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  const [finalCount] = await conn.execute("SELECT COUNT(*) as count FROM recipes WHERE isSeeded = 1");
  console.log(`\n${"=".repeat(50)}`);
  console.log(`✓ DONE! Inserted: ${totalInserted} | Errors: ${totalErrors}`);
  console.log(`Total seeded recipes in DB: ${finalCount[0].count}`);

  const [byType] = await conn.execute("SELECT cuisineType, COUNT(*) as c FROM recipes WHERE isSeeded=1 GROUP BY cuisineType ORDER BY c DESC");
  console.log("\nBy cuisine type:");
  byType.forEach(r => console.log(`  ${r.cuisineType || "null"}: ${r.c}`));

  const [byMethod] = await conn.execute("SELECT cookingMethod, COUNT(*) as c FROM recipes WHERE isSeeded=1 GROUP BY cookingMethod ORDER BY c DESC");
  console.log("\nBy cooking method:");
  byMethod.forEach(r => console.log(`  ${r.cookingMethod || "null"}: ${r.c}`));

  await conn.end();
}

main().catch(e => { console.error("Fatal error:", e); process.exit(1); });
