/**
 * Importación masiva de 16.985 recetas desde all-recipes.json
 * Deduplicación por nombre (name) para evitar duplicados
 */
import pg from "pg";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Mapeo de mealType del JSON → enum mealTime de la BD
const MEAL_TYPE_MAP = {
  "Desayuno": "desayuno",
  "Almuerzo": "comida",
  "Cena": "cena",
  "Snack": "media_manana",
  "Merienda": "merienda",
  "Postre": "cualquiera",
};

// Mapeo de difficulty del JSON → enum difficulty de la BD
const DIFFICULTY_MAP = {
  "Fácil": "easy",
  "Media": "medium",
  "Difícil": "hard",
};

async function importRecipes() {
  console.log("📂 Cargando all-recipes.json...");
  const raw = fs.readFileSync("/home/ubuntu/recipes-import/all-recipes.json", "utf8");
  const recipes = JSON.parse(raw);
  console.log(`✅ ${recipes.length} recetas cargadas`);

  // Obtener nombres ya existentes en la BD para evitar duplicados
  console.log("🔍 Obteniendo nombres existentes en la BD...");
  const existingRes = await pool.query("SELECT LOWER(name) as lname FROM recipes WHERE \"isSeeded\" = true OR \"userId\" IS NULL");
  const existingNames = new Set(existingRes.rows.map(r => r.lname));
  console.log(`📊 ${existingNames.size} recetas seeded ya en BD`);

  // Filtrar solo las nuevas (por nombre, case-insensitive)
  const toInsert = recipes.filter(r => r.name && !existingNames.has(r.name.toLowerCase()));
  console.log(`🆕 ${toInsert.length} recetas nuevas a importar`);

  if (toInsert.length === 0) {
    console.log("✅ No hay recetas nuevas que importar.");
    const finalCount = await pool.query("SELECT COUNT(*) as total FROM recipes");
    console.log(`   Total en BD: ${finalCount.rows[0].total}`);
    await pool.end();
    return;
  }

  // Insertar en lotes de 100
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);

    try {
      const values = [];
      const params = [];
      let paramIdx = 1;

      for (const r of batch) {
        const mealTime = MEAL_TYPE_MAP[r.mealType] || "cualquiera";
        const difficulty = DIFFICULTY_MAP[r.difficulty] || "medium";

        // Normalizar ingredients
        let ingredients = null;
        if (r.ingredients && Array.isArray(r.ingredients)) {
          ingredients = JSON.stringify(
            r.ingredients.map(ing => ({
              name: ing.name || ing.ingredient || "",
              amount: ing.quantity ?? ing.amount ?? 0,
              unit: ing.unit || "g",
            }))
          );
        }

        // Normalizar instructions
        let instructions = null;
        if (r.instructions && Array.isArray(r.instructions)) {
          instructions = JSON.stringify(
            r.instructions.map((s, idx) =>
              typeof s === "string"
                ? { step: idx + 1, text: s.replace(/^Paso \d+:\s*/i, "").trim() }
                : s
            )
          );
        }

        const allergens = r.allergens ? JSON.stringify(r.allergens) : null;
        const tags = r.tags ? JSON.stringify(r.tags) : null;
        const calories = r.nutritionPerServing?.calories ?? null;
        const protein = r.nutritionPerServing?.protein ?? null;
        const carbs = r.nutritionPerServing?.carbs ?? null;
        const fat = r.nutritionPerServing?.fat ?? null;
        const fiber = r.nutritionPerServing?.fiber ?? null;

        // Determinar categoría a partir del dietType o tags
        let category = null;
        if (r.dietType) category = r.dietType;
        else if (r.isVegan) category = "Vegano";
        else if (r.isVegetarian) category = "Vegetariano";
        else if (r.isKeto) category = "Keto";
        else if (r.isPaleo) category = "Paleo";
        else if (r.isGlutenFree) category = "Sin Gluten";

        values.push(`(
          NULL, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
          $${paramIdx++}::difficulty, $${paramIdx++}::"mealTime",
          $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
          $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
          $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++},
          $${paramIdx++}, $${paramIdx++},
          true, true,
          NOW(), NOW()
        )`);

        params.push(
          r.name || "Sin nombre",        // name
          r.imageUrl || null,            // imageUrl
          r.description || null,         // description
          difficulty,                    // difficulty
          mealTime,                      // mealTime
          r.prepTimeMinutes || 0,        // preparationTime
          r.cookTimeMinutes || 0,        // cookTime
          r.servings || 1,               // servings
          allergens,                     // allergens
          tags,                          // tags
          category,                      // category
          calories,                      // caloriesPerServing
          protein,                       // proteinsPerServing
          carbs,                         // carbsPerServing
          fat,                           // fatsPerServing
          fiber,                         // fiberPerServing
          ingredients,                   // ingredientsJson
          instructions,                  // instructionsJson
        );
      }

      const query = `
        INSERT INTO recipes (
          "userId", name, "imageUrl", description,
          difficulty, "mealTime",
          "preparationTime", "cookTime", servings,
          allergens, tags, category,
          "caloriesPerServing", "proteinsPerServing", "carbsPerServing", "fatsPerServing", "fiberPerServing",
          "ingredientsJson", "instructionsJson",
          "isPublic", "isSeeded",
          "createdAt", "updatedAt"
        ) VALUES ${values.join(",")}
      `;

      await pool.query(query, params);
      inserted += batch.length;

      if (inserted % 2000 === 0 || i + BATCH_SIZE >= toInsert.length) {
        const pct = Math.round((inserted / toInsert.length) * 100);
        console.log(`  ⏳ ${inserted}/${toInsert.length} (${pct}%) insertadas...`);
      }
    } catch (err) {
      errors++;
      console.error(`  ❌ Error en lote ${i}-${i + BATCH_SIZE}:`, err.message.slice(0, 120));
    }
  }

  // Contar total final
  const finalCount = await pool.query("SELECT COUNT(*) as total FROM recipes");
  console.log(`\n✅ Importación completada:`);
  console.log(`   - Recetas procesadas: ${toInsert.length}`);
  console.log(`   - Lotes con error: ${errors}`);
  console.log(`   - Total en BD ahora: ${finalCount.rows[0].total}`);

  await pool.end();
}

importRecipes().catch(err => {
  console.error("❌ Error fatal:", err.message);
  process.exit(1);
});
