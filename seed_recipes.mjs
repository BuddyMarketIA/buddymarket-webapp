import { createConnection } from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

// Map difficulty strings to enum values
function mapDifficulty(d) {
  if (!d) return 'medium';
  const lower = d.toLowerCase();
  if (lower.includes('fácil') || lower.includes('facil') || lower.includes('easy')) return 'easy';
  if (lower.includes('difícil') || lower.includes('dificil') || lower.includes('hard')) return 'hard';
  return 'medium';
}

// Map mealTime strings to enum values
function mapMealTime(m) {
  const valid = ['desayuno', 'media_manana', 'comida', 'merienda', 'cena', 'cualquiera'];
  if (valid.includes(m)) return m;
  return 'cualquiera';
}

async function main() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const conn = await createConnection(DATABASE_URL);
  console.log('Connected to database');

  // Check existing seeded count
  const [countResult] = await conn.execute('SELECT COUNT(*) as count FROM recipes WHERE isSeeded = 1');
  const existingCount = countResult[0].count;
  console.log(`Existing seeded recipes: ${existingCount}`);

  if (existingCount >= 400) {
    console.log('Already have enough seeded recipes, skipping...');
    await conn.end();
    return;
  }

  // Get or create a system user for seeded recipes
  let systemUserId = 1;
  const [users] = await conn.execute('SELECT id FROM users LIMIT 1');
  if (users.length > 0) {
    systemUserId = users[0].id;
    console.log(`Using userId: ${systemUserId}`);
  } else {
    console.log('No users found, using userId=1 (will fail if user doesn\'t exist)');
  }

  // Load generated recipes
  const allRecipes = JSON.parse(fs.readFileSync('/home/ubuntu/all_recipes.json', 'utf8'));
  
  let total = 0;
  const allFlat = [];
  for (const [mealTime, recipes] of Object.entries(allRecipes)) {
    console.log(`${mealTime}: ${recipes.length} recipes`);
    for (const r of recipes) {
      allFlat.push({ ...r, mealTime: mapMealTime(r.mealTime || mealTime) });
    }
    total += recipes.length;
  }
  console.log(`Total to insert: ${total}`);

  let inserted = 0;
  let errors = 0;

  for (const recipe of allFlat) {
    try {
      const ingredients = JSON.stringify(recipe.ingredients || []);
      const instructions = JSON.stringify(recipe.instructions || []);
      const allergens = JSON.stringify(recipe.allergens || []);
      const tags = JSON.stringify(recipe.tags || []);
      const difficulty = mapDifficulty(recipe.difficulty);

      await conn.execute(
        `INSERT INTO recipes (
          userId, name, description, mealTime, category, 
          preparationTime, cookTime, servings, difficulty,
          caloriesPerServing, proteinsPerServing, carbsPerServing, fatsPerServing, fiberPerServing,
          allergens, tags,
          isPublic, isSeeded, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [
          systemUserId,
          recipe.name || 'Receta sin nombre',
          recipe.description || '',
          recipe.mealTime,
          recipe.category || 'general',
          recipe.prepTime || 10,
          recipe.cookTime || 15,
          recipe.servings || 2,
          difficulty,
          recipe.calories || 300,
          recipe.protein || 15,
          recipe.carbohydrates || 35,
          recipe.fat || 10,
          recipe.fiber || 3,
          allergens,
          tags,
        ]
      );
      inserted++;
      if (inserted % 50 === 0) {
        console.log(`Inserted ${inserted}/${total} recipes...`);
      }
    } catch (e) {
      errors++;
      if (errors <= 5) console.error(`Error inserting "${recipe.name}": ${e.message}`);
    }
  }

  console.log(`\n✓ Done! Inserted: ${inserted}, Errors: ${errors}`);
  
  // Verify final count
  const [finalCount] = await conn.execute('SELECT COUNT(*) as count FROM recipes WHERE isSeeded = 1');
  console.log(`Total seeded recipes in DB: ${finalCount[0].count}`);
  
  // Show breakdown by mealTime
  const [breakdown] = await conn.execute('SELECT mealTime, COUNT(*) as count FROM recipes WHERE isSeeded = 1 GROUP BY mealTime');
  for (const row of breakdown) {
    console.log(`  ${row.mealTime}: ${row.count}`);
  }
  
  await conn.end();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
