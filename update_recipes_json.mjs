import { createConnection } from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
  const conn = await createConnection(DATABASE_URL);
  console.log('Connected to database');

  // Load all recipes JSON
  const allRecipes = JSON.parse(fs.readFileSync('/home/ubuntu/all_recipes.json', 'utf8'));
  
  // Also load the missing recipes if they exist
  let missingRecipes = {};
  try {
    missingRecipes = JSON.parse(fs.readFileSync('/home/ubuntu/missing_recipes.json', 'utf8'));
  } catch {}

  // Build a name -> recipe map
  const recipeMap = new Map();
  for (const [mealTime, recipes] of Object.entries({...allRecipes, ...missingRecipes})) {
    for (const r of (recipes || [])) {
      if (r.name) recipeMap.set(r.name.toLowerCase().trim(), r);
    }
  }

  console.log(`Loaded ${recipeMap.size} recipes from JSON`);

  // Get all seeded recipes from DB
  const [dbRecipes] = await conn.execute('SELECT id, name FROM recipes WHERE isSeeded = 1');
  console.log(`Found ${dbRecipes.length} seeded recipes in DB`);

  let updated = 0;
  let notFound = 0;

  for (const dbRecipe of dbRecipes) {
    const key = dbRecipe.name.toLowerCase().trim();
    const jsonRecipe = recipeMap.get(key);
    
    if (!jsonRecipe) {
      notFound++;
      continue;
    }

    const ingredientsJson = JSON.stringify(jsonRecipe.ingredients || []);
    const instructionsJson = JSON.stringify(
      (jsonRecipe.instructions || []).map((inst, i) => 
        typeof inst === 'string' ? { step: i + 1, text: inst } : inst
      )
    );

    await conn.execute(
      'UPDATE recipes SET ingredientsJson = ?, instructionsJson = ? WHERE id = ?',
      [ingredientsJson, instructionsJson, dbRecipe.id]
    );
    updated++;
  }

  console.log(`Updated: ${updated}, Not found in JSON: ${notFound}`);
  await conn.end();
}

main().catch(console.error);
