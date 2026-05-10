/**
 * gen-recipes-v3.mjs
 * Generates remaining recipes one at a time to avoid JSON truncation.
 * Uses compact format with short instructions.
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
        { role: "system", content: "Eres un chef. Responde SOLO con JSON válido y compacto, sin markdown ni saltos de línea innecesarios." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const data = await res.json();
  let raw = data.choices[0].message.content.trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(raw);
}

function mapDifficulty(d) {
  if (!d) return "medium";
  const l = String(d).toLowerCase();
  if (l.includes("fácil") || l.includes("facil") || l.includes("easy")) return "easy";
  if (l.includes("difícil") || l.includes("dificil") || l.includes("hard")) return "hard";
  return "medium";
}

// 110 individual recipes to generate (to reach ~150 new total)
const RECIPES_TO_GENERATE = [
  // DESAYUNOS AMERICANOS/FRANCESES (10)
  { name: "Pancakes proteicos de avena y plátano", mealTime: "desayuno", cuisine: "americana", method: "plancha" },
  { name: "French toast con canela y fresas", mealTime: "desayuno", cuisine: "francesa", method: "plancha" },
  { name: "Muffins de arándanos y limón", mealTime: "desayuno", cuisine: "americana", method: "horno" },
  { name: "Waffles de vainilla con sirope de arce", mealTime: "desayuno", cuisine: "americana", method: "plancha" },
  { name: "Granola casera con frutos secos y miel", mealTime: "desayuno", cuisine: "americana", method: "horno" },
  { name: "Croissant de jamón y queso gruyère", mealTime: "desayuno", cuisine: "francesa", method: "horno" },
  { name: "Quiche de espinacas y brie", mealTime: "desayuno", cuisine: "francesa", method: "horno" },
  { name: "Pain perdu con canela y azúcar", mealTime: "desayuno", cuisine: "francesa", method: "plancha" },
  { name: "Avocado toast con huevo pochado", mealTime: "desayuno", cuisine: "americana", method: "plancha" },
  { name: "Smoothie bowl de fresas y plátano", mealTime: "desayuno", cuisine: "americana", method: "sin_coccion" },
  // DESAYUNOS MEDITERRÁNEOS (5)
  { name: "Labneh con aceite de oliva y za'atar", mealTime: "desayuno", cuisine: "arabe", method: "sin_coccion" },
  { name: "Bowl de kéfir con semillas de chía y mango", mealTime: "desayuno", cuisine: "mediterranea", method: "sin_coccion" },
  { name: "Porridge de quinoa con canela y manzana", mealTime: "desayuno", cuisine: "mediterranea", method: "olla" },
  { name: "Tostada de hummus con pepino y tomate cherry", mealTime: "desayuno", cuisine: "arabe", method: "sin_coccion" },
  { name: "Overnight oats con frutos rojos", mealTime: "desayuno", cuisine: "americana", method: "sin_coccion" },
  // MEDIA MAÑANA (5)
  { name: "Energy balls de dátiles y cacao", mealTime: "media_manana", cuisine: "americana", method: "sin_coccion" },
  { name: "Barritas de granola caseras con avena", mealTime: "media_manana", cuisine: "americana", method: "horno" },
  { name: "Batido de proteínas de vainilla y plátano", mealTime: "media_manana", cuisine: "americana", method: "sin_coccion" },
  { name: "Frutos secos tostados con arándanos secos", mealTime: "media_manana", cuisine: "española", method: "horno" },
  { name: "Yogur griego con pepitas de calabaza y miel", mealTime: "media_manana", cuisine: "mediterranea", method: "sin_coccion" },
  // COMIDAS ESPAÑOLAS (15)
  { name: "Cocido madrileño tradicional", mealTime: "comida", cuisine: "española", method: "olla" },
  { name: "Fabada asturiana con compango", mealTime: "comida", cuisine: "española", method: "olla" },
  { name: "Caldo gallego con grelos y lacón", mealTime: "comida", cuisine: "española", method: "olla" },
  { name: "Merluza al horno con patatas y pimientos", mealTime: "comida", cuisine: "española", method: "horno" },
  { name: "Bacalao a la vizcaína con pimientos choriceros", mealTime: "comida", cuisine: "española", method: "olla" },
  { name: "Pimientos del piquillo rellenos de bacalao", mealTime: "comida", cuisine: "española", method: "horno" },
  { name: "Cordero al horno con ajo y romero", mealTime: "comida", cuisine: "española", method: "horno" },
  { name: "Dorada a la sal con alioli", mealTime: "comida", cuisine: "española", method: "horno" },
  { name: "Gambas al ajillo con pan tostado", mealTime: "comida", cuisine: "española", method: "plancha" },
  { name: "Pulpo a la gallega con pimentón de la Vera", mealTime: "comida", cuisine: "española", method: "olla" },
  { name: "Pollo al chilindrón con pimientos", mealTime: "comida", cuisine: "española", method: "olla" },
  { name: "Berberechos al vapor con limón", mealTime: "comida", cuisine: "española", method: "vaporizador" },
  { name: "Carrilleras de cerdo al vino tinto", mealTime: "comida", cuisine: "española", method: "olla" },
  { name: "Arroz con bogavante al estilo levantino", mealTime: "comida", cuisine: "española", method: "olla" },
  { name: "Fideuà de marisco valenciana", mealTime: "comida", cuisine: "española", method: "plancha" },
  // COMIDAS MEDITERRÁNEAS (10)
  { name: "Musaka griega de berenjena y carne", mealTime: "comida", cuisine: "mediterranea", method: "horno" },
  { name: "Spanakopita de espinacas y feta", mealTime: "comida", cuisine: "mediterranea", method: "horno" },
  { name: "Pollo al limón con aceitunas y alcaparras", mealTime: "comida", cuisine: "mediterranea", method: "horno" },
  { name: "Berenjenas rellenas al horno con tomate", mealTime: "comida", cuisine: "mediterranea", method: "horno" },
  { name: "Ensalada griega con feta y aceitunas kalamata", mealTime: "comida", cuisine: "mediterranea", method: "sin_coccion" },
  { name: "Tabbouleh de bulgur con hierbas frescas", mealTime: "comida", cuisine: "arabe", method: "sin_coccion" },
  { name: "Ensalada de garbanzos con pepino y menta", mealTime: "comida", cuisine: "mediterranea", method: "sin_coccion" },
  { name: "Fattoush con pan pita crujiente y sumac", mealTime: "comida", cuisine: "arabe", method: "sin_coccion" },
  { name: "Lubina al horno con tomates cherry y hierbas", mealTime: "comida", cuisine: "mediterranea", method: "horno" },
  { name: "Souvlaki de pollo con tzatziki", mealTime: "comida", cuisine: "mediterranea", method: "plancha" },
  // COMIDAS ITALIANAS (10)
  { name: "Risotto de setas porcini con parmesano", mealTime: "comida", cuisine: "italiana", method: "olla" },
  { name: "Minestrone de verduras de temporada", mealTime: "comida", cuisine: "italiana", method: "olla" },
  { name: "Lasaña de verduras y ricotta", mealTime: "comida", cuisine: "italiana", method: "horno" },
  { name: "Pizza napolitana de mozzarella y albahaca", mealTime: "comida", cuisine: "italiana", method: "horno" },
  { name: "Pasta carbonara cremosa con guanciale", mealTime: "comida", cuisine: "italiana", method: "plancha" },
  { name: "Gnocchi al pesto genovés con piñones", mealTime: "comida", cuisine: "italiana", method: "olla" },
  { name: "Ossobuco milanés con gremolata", mealTime: "comida", cuisine: "italiana", method: "olla" },
  { name: "Parmigiana di melanzane al horno", mealTime: "comida", cuisine: "italiana", method: "horno" },
  { name: "Tagliatelle con ragù boloñés tradicional", mealTime: "comida", cuisine: "italiana", method: "olla" },
  { name: "Risotto negro de sepia con tinta", mealTime: "comida", cuisine: "italiana", method: "olla" },
  // COMIDAS ASIÁTICAS (10)
  { name: "Pad thai con gambas y cacahuetes", mealTime: "comida", cuisine: "asiatica", method: "wok" },
  { name: "Ramen de pollo con huevo marinado", mealTime: "comida", cuisine: "asiatica", method: "olla" },
  { name: "Curry verde tailandés con leche de coco", mealTime: "comida", cuisine: "asiatica", method: "olla" },
  { name: "Bibimbap coreano con verduras y huevo", mealTime: "comida", cuisine: "asiatica", method: "plancha" },
  { name: "Gyoza al vapor con salsa ponzu", mealTime: "comida", cuisine: "asiatica", method: "vaporizador" },
  { name: "Pollo kung pao con pimientos y cacahuetes", mealTime: "comida", cuisine: "asiatica", method: "wok" },
  { name: "Noodles salteados con ternera y brócoli", mealTime: "comida", cuisine: "asiatica", method: "wok" },
  { name: "Pho vietnamita de ternera con hierbas", mealTime: "comida", cuisine: "asiatica", method: "olla" },
  { name: "Salmón teriyaki con arroz jazmín", mealTime: "comida", cuisine: "asiatica", method: "plancha" },
  { name: "Tofu mapo con salsa picante de Sichuan", mealTime: "comida", cuisine: "asiatica", method: "wok" },
  // COMIDAS MEXICANAS/ÁRABES/FRANCESAS (10)
  { name: "Tacos de pollo asado con salsa verde", mealTime: "comida", cuisine: "mexicana", method: "plancha" },
  { name: "Enchiladas verdes con pollo y crema", mealTime: "comida", cuisine: "mexicana", method: "horno" },
  { name: "Ceviche peruano de corvina con leche de tigre", mealTime: "comida", cuisine: "latinoamericana", method: "sin_coccion" },
  { name: "Chili con carne texano con frijoles", mealTime: "comida", cuisine: "latinoamericana", method: "olla" },
  { name: "Tagine de cordero con ciruelas y almendras", mealTime: "comida", cuisine: "arabe", method: "olla" },
  { name: "Shawarma de pollo con pita y tahini", mealTime: "comida", cuisine: "arabe", method: "horno" },
  { name: "Kofta de ternera al horno con especias", mealTime: "comida", cuisine: "arabe", method: "horno" },
  { name: "Quiche lorraine con bacon y gruyère", mealTime: "comida", cuisine: "francesa", method: "horno" },
  { name: "Ratatouille provenzal con hierbas", mealTime: "comida", cuisine: "francesa", method: "horno" },
  { name: "Bouillabaisse marsellesa de pescados", mealTime: "comida", cuisine: "francesa", method: "olla" },
  // CENAS (15)
  { name: "Tofu con brócoli y salsa de soja al wok", mealTime: "cena", cuisine: "asiatica", method: "wok" },
  { name: "Gambas salteadas con jengibre y ajo", mealTime: "cena", cuisine: "asiatica", method: "wok" },
  { name: "Ensalada de fideos soba fríos con sésamo", mealTime: "cena", cuisine: "asiatica", method: "sin_coccion" },
  { name: "Hummus casero con crudités de verduras", mealTime: "cena", cuisine: "arabe", method: "sin_coccion" },
  { name: "Baba ganoush con pan pita tostado", mealTime: "cena", cuisine: "arabe", method: "horno" },
  { name: "Ensalada niçoise con atún y huevo", mealTime: "cena", cuisine: "francesa", method: "sin_coccion" },
  { name: "Crema de calabaza con semillas de calabaza", mealTime: "cena", cuisine: "española", method: "olla" },
  { name: "Sopa de lentejas rojas con cúrcuma", mealTime: "cena", cuisine: "arabe", method: "olla" },
  { name: "Mejillones al vapor con vino blanco", mealTime: "cena", cuisine: "española", method: "vaporizador" },
  { name: "Ensalada de quinoa con aguacate y mango", mealTime: "cena", cuisine: "americana", method: "sin_coccion" },
  { name: "Pechuga de pavo a la plancha con espárragos", mealTime: "cena", cuisine: "española", method: "plancha" },
  { name: "Salmón al vapor con eneldo y limón", mealTime: "cena", cuisine: "española", method: "vaporizador" },
  { name: "Crema de guisantes con menta fresca", mealTime: "cena", cuisine: "española", method: "olla" },
  { name: "Ensalada de rúcula con parmesano y pera", mealTime: "cena", cuisine: "italiana", method: "sin_coccion" },
  { name: "Tortilla de claras con espinacas y feta", mealTime: "cena", cuisine: "española", method: "plancha" },
  // MERIENDAS (5)
  { name: "Brownies de chocolate negro sin harina", mealTime: "merienda", cuisine: "americana", method: "horno" },
  { name: "Muffins de plátano y nueces de macadamia", mealTime: "merienda", cuisine: "americana", method: "horno" },
  { name: "Galletas de avena y pasas sin azúcar", mealTime: "merienda", cuisine: "americana", method: "horno" },
  { name: "Bizcocho de limón y semillas de amapola", mealTime: "merienda", cuisine: "francesa", method: "horno" },
  { name: "Donuts de avena con glaseado de fresa", mealTime: "merienda", cuisine: "americana", method: "horno" },
  // AIR FRYER (15)
  { name: "Croquetas de jamón ibérico crujientes", mealTime: "cualquiera", cuisine: "española", method: "airfryer" },
  { name: "Patatas gajo con pimentón y ajo al air fryer", mealTime: "cualquiera", cuisine: "española", method: "airfryer" },
  { name: "Alitas de pollo con miel y mostaza al air fryer", mealTime: "cualquiera", cuisine: "americana", method: "airfryer" },
  { name: "Calamares rebozados crujientes al air fryer", mealTime: "cualquiera", cuisine: "española", method: "airfryer" },
  { name: "Empanadas de atún y pimiento al air fryer", mealTime: "cualquiera", cuisine: "española", method: "airfryer" },
  { name: "Nuggets de pollo caseros al air fryer", mealTime: "cualquiera", cuisine: "americana", method: "airfryer" },
  { name: "Aros de cebolla crujientes al air fryer", mealTime: "cualquiera", cuisine: "americana", method: "airfryer" },
  { name: "Palitos de mozzarella rebozados al air fryer", mealTime: "cualquiera", cuisine: "italiana", method: "airfryer" },
  { name: "Costillas BBQ al air fryer con salsa", mealTime: "cualquiera", cuisine: "americana", method: "airfryer" },
  { name: "Pizza personal de pepperoni al air fryer", mealTime: "cualquiera", cuisine: "italiana", method: "airfryer" },
  { name: "Gambas rebozadas al air fryer con limón", mealTime: "cualquiera", cuisine: "española", method: "airfryer" },
  { name: "Rollitos de primavera al air fryer", mealTime: "cualquiera", cuisine: "asiatica", method: "airfryer" },
  { name: "Chips de kale con sal y limón al air fryer", mealTime: "merienda", cuisine: "americana", method: "airfryer" },
  { name: "Salmón con costra de hierbas al air fryer", mealTime: "cena", cuisine: "española", method: "airfryer" },
  { name: "Berenjenas rebozadas con parmesano al air fryer", mealTime: "comida", cuisine: "italiana", method: "airfryer" },
];

async function generateSingleRecipe(recipe) {
  const prompt = `Genera la receta "${recipe.name}" en español.
Cocina: ${recipe.cuisine}, Método: ${recipe.method}, Momento: ${recipe.mealTime}

Devuelve UN objeto JSON con esta estructura exacta (sin saltos de línea en los strings):
{"name":"${recipe.name}","description":"descripción breve","mealTime":"${recipe.mealTime}","cuisineType":"${recipe.cuisine}","cookingMethod":"${recipe.method}","preparationTime":10,"cookTime":20,"servings":2,"difficulty":"easy","calories":350,"protein":25,"carbs":30,"fat":12,"fiber":4,"allergens":["gluten"],"tags":["rapida","saludable"],"ingredients":[{"name":"ingrediente","amount":"100","unit":"g"}],"instructions":[{"step":1,"text":"Paso 1"},{"step":2,"text":"Paso 2"},{"step":3,"text":"Paso 3"},{"step":4,"text":"Paso 4"}]}

SOLO el objeto JSON, sin texto adicional.`;

  return await invokeLLM(prompt);
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
  console.log(`Generating ${RECIPES_TO_GENERATE.length} new recipes...\n`);

  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < RECIPES_TO_GENERATE.length; i++) {
    const recipeSpec = RECIPES_TO_GENERATE[i];
    process.stdout.write(`[${i + 1}/${RECIPES_TO_GENERATE.length}] "${recipeSpec.name}"... `);

    try {
      const recipe = await generateSingleRecipe(recipeSpec);
      const mealTimeValid = ["desayuno", "media_manana", "comida", "merienda", "cena", "cualquiera"];
      const mealTime = mealTimeValid.includes(recipe.mealTime) ? recipe.mealTime : recipeSpec.mealTime;

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
          String(recipe.name || recipeSpec.name).substring(0, 255),
          String(recipe.description || "").substring(0, 1000),
          mealTime,
          "general",
          recipe.cuisineType || recipeSpec.cuisine,
          recipe.cookingMethod || recipeSpec.method,
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
      totalInserted++;
      console.log(`✓ (total: ${totalInserted})`);
    } catch (e) {
      totalErrors++;
      console.log(`✗ ${e.message.substring(0, 60)}`);
    }

    // Small delay
    await new Promise(r => setTimeout(r, 200));
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
