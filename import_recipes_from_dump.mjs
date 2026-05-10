/**
 * import_recipes_from_dump.mjs
 * Importa las 2035 recetas del dump MySQL al esquema PostgreSQL de BuddyMarket.
 * Lee el JSON del Pasted_content_04.txt (array de recetas) y las inserta.
 * Evita duplicados por nombre (case-insensitive).
 */
import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Leer el JSON con las 2035 recetas
const jsonPath = '/home/ubuntu/upload/Pasted_content_04.txt';
const rawData = fs.readFileSync(jsonPath, 'utf8');
const sourceRecipes = JSON.parse(rawData);
console.log(`Recetas en el archivo: ${sourceRecipes.length}`);

// Mapeo de mealType (fuente) → mealTime (destino enum)
function mapMealTime(mealType) {
  if (!mealType) return 'cualquiera';
  const mt = mealType.toLowerCase();
  if (mt === 'desayuno') return 'desayuno';
  if (mt === 'almuerzo' || mt === 'comida') return 'comida';
  if (mt === 'cena') return 'cena';
  if (mt === 'merienda') return 'merienda';
  if (mt === 'snack' || mt === 'media mañana' || mt === 'media_manana') return 'media_manana';
  if (mt === 'postre') return 'cualquiera'; // postres pueden ser en cualquier momento
  return 'cualquiera';
}

// Mapeo de difficulty
function mapDifficulty(d) {
  if (!d) return 'medium';
  const lower = d.toLowerCase();
  if (lower === 'fácil' || lower === 'facil' || lower === 'easy') return 'easy';
  if (lower === 'difícil' || lower === 'dificil' || lower === 'hard') return 'hard';
  return 'medium';
}

// Parsear nutritionPerServing JSON
function parseNutrition(nutritionStr) {
  if (!nutritionStr) return { calories: null, protein: null, carbs: null, fat: null, fiber: null };
  try {
    const n = typeof nutritionStr === 'string' ? JSON.parse(nutritionStr) : nutritionStr;
    return {
      calories: n.calories ?? null,
      protein: n.protein ?? null,
      carbs: n.carbs ?? null,
      fat: n.fat ?? null,
      fiber: n.fiber ?? null,
    };
  } catch {
    return { calories: null, protein: null, carbs: null, fat: null, fiber: null };
  }
}

// Parsear tags (puede ser string JSON o array)
function parseTags(tagsStr) {
  if (!tagsStr) return null;
  try {
    const arr = typeof tagsStr === 'string' ? JSON.parse(tagsStr) : tagsStr;
    return JSON.stringify(arr);
  } catch {
    return null;
  }
}

// Parsear allergens
function parseAllergens(allergensStr) {
  if (!allergensStr) return null;
  try {
    const arr = typeof allergensStr === 'string' ? JSON.parse(allergensStr) : allergensStr;
    return JSON.stringify(arr);
  } catch {
    return null;
  }
}

// Parsear ingredients → ingredientsJson
function parseIngredients(ingredientsStr) {
  if (!ingredientsStr) return null;
  try {
    const arr = typeof ingredientsStr === 'string' ? JSON.parse(ingredientsStr) : ingredientsStr;
    // Normalizar al formato {name, amount, unit, category}
    const normalized = arr.map(ing => ({
      name: ing.name || '',
      amount: ing.quantity ?? ing.amount ?? '',
      unit: ing.unit || '',
      category: ing.category || '',
    }));
    return JSON.stringify(normalized);
  } catch {
    return null;
  }
}

// Parsear instructions → instructionsJson
function parseInstructions(instructionsStr) {
  if (!instructionsStr) return null;
  try {
    const arr = typeof instructionsStr === 'string' ? JSON.parse(instructionsStr) : instructionsStr;
    const normalized = arr.map((step, i) => ({
      step: i + 1,
      text: typeof step === 'string' ? step : (step.text || step.description || String(step)),
    }));
    return JSON.stringify(normalized);
  } catch {
    return null;
  }
}

// Determinar categoría a partir de mealType y dietType
function mapCategory(recipe) {
  if (recipe.dietType && recipe.dietType !== 'null') return recipe.dietType;
  if (recipe.mealType) return recipe.mealType;
  return null;
}

async function main() {
  // Obtener nombres existentes en la BD para evitar duplicados
  const existingResult = await pool.query('SELECT LOWER(name) as name FROM recipes WHERE "isSeeded" = true');
  const existingNames = new Set(existingResult.rows.map(r => r.name.trim()));
  console.log(`Recetas ya en BD: ${existingNames.size}`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const BATCH_SIZE = 50;

  // Filtrar las que no existen aún
  const toInsert = sourceRecipes.filter(r => {
    const name = (r.name || '').toLowerCase().trim();
    return name && !existingNames.has(name);
  });
  console.log(`Recetas a insertar (nuevas): ${toInsert.length}`);
  console.log(`Recetas a omitir (ya existen): ${sourceRecipes.length - toInsert.length}`);
  skipped = sourceRecipes.length - toInsert.length;

  // Insertar en batches
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    
    for (const recipe of batch) {
      try {
        const nutrition = parseNutrition(recipe.nutritionPerServing);
        const mealTime = mapMealTime(recipe.mealType);
        const difficulty = mapDifficulty(recipe.difficulty);
        const category = mapCategory(recipe);
        
        await pool.query(`
          INSERT INTO recipes (
            "userId", name, "imageUrl", description,
            "preparationTime", "cookTime", servings, difficulty,
            "isPublic", active, "mealTime", category,
            allergens, tags,
            "caloriesPerServing", "proteinsPerServing", "carbsPerServing", "fatsPerServing", "fiberPerServing",
            "ingredientsJson", "instructionsJson",
            "isKidFriendly", "isBabyFriendly", "isFingerFood", "noAddedSugar",
            "isSeeded", "createdAt", "updatedAt"
          ) VALUES (
            NULL, $1, $2, $3,
            $4, $5, $6, $7,
            true, true, $8, $9,
            $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18,
            false, false, false, false,
            true, NOW(), NOW()
          )
        `, [
          recipe.name,
          recipe.imageUrl || null,
          recipe.description || null,
          recipe.prepTimeMinutes || 0,
          recipe.cookTimeMinutes || 0,
          recipe.servings || 1,
          difficulty,
          mealTime,
          category,
          parseAllergens(recipe.allergens),
          parseTags(recipe.tags),
          nutrition.calories,
          nutrition.protein,
          nutrition.carbs,
          nutrition.fat,
          nutrition.fiber,
          parseIngredients(recipe.ingredients),
          parseInstructions(recipe.instructions),
        ]);
        inserted++;
      } catch (err) {
        errors++;
        if (errors <= 3) console.error(`Error inserting "${recipe.name}":`, err.message);
      }
    }
    
    if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= toInsert.length) {
      console.log(`Progreso: ${Math.min(i + BATCH_SIZE, toInsert.length)}/${toInsert.length} procesadas, ${inserted} insertadas`);
    }
  }

  // Resultado final
  const finalCount = await pool.query('SELECT COUNT(*) as cnt FROM recipes WHERE "isSeeded" = true');
  console.log('\n=== RESULTADO FINAL ===');
  console.log(`Recetas insertadas: ${inserted}`);
  console.log(`Recetas omitidas (duplicados): ${skipped}`);
  console.log(`Errores: ${errors}`);
  console.log(`Total recetas en BD ahora: ${finalCount.rows[0].cnt}`);

  await pool.end();
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
