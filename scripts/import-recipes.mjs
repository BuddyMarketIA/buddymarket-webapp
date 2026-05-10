import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function importRecipes() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Read recipes from JSON
    const recipesPath = '/home/ubuntu/upload/all-recipes.json';
    const recipesData = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));
    
    console.log(`📊 Total de recetas a importar: ${recipesData.length}`);

    // Get existing recipe names to avoid duplicates
    const existingResult = await client.query('SELECT name FROM recipes');
    const existingNames = new Set(existingResult.rows.map(r => r.name));
    console.log(`📋 Recetas existentes: ${existingNames.size}`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Process recipes in batches
    const batchSize = 100;
    for (let i = 0; i < recipesData.length; i += batchSize) {
      const batch = recipesData.slice(i, i + batchSize);
      
      for (const recipe of batch) {
        try {
          // Skip if recipe name already exists
          if (existingNames.has(recipe.name)) {
            skipped++;
            continue;
          }

          // Map difficulty
          const difficultyMap = {
            'Fácil': 'easy',
            'Medio': 'medium',
            'Difícil': 'hard',
            'Easy': 'easy',
            'Medium': 'medium',
            'Hard': 'hard',
          };
          const difficulty = difficultyMap[recipe.difficulty] || 'medium';

          // Map meal time
          const mealTypeMap = {
            'Desayuno': 'desayuno',
            'Media Mañana': 'media_manana',
            'Comida': 'comida',
            'Merienda': 'merienda',
            'Cena': 'cena',
            'Snack': 'merienda',
            'Breakfast': 'desayuno',
            'Lunch': 'comida',
            'Dinner': 'cena',
            'Snack': 'merienda',
          };
          const mealTime = mealTypeMap[recipe.mealType] || 'cualquiera';

          // Prepare allergens
          const allergens = recipe.allergens ? JSON.stringify(recipe.allergens) : null;

          // Prepare tags
          const tags = recipe.tags ? JSON.stringify(recipe.tags) : null;

          // Prepare ingredients JSON
          const ingredientsJson = JSON.stringify(recipe.ingredients || []);

          // Prepare instructions JSON
          const instructionsJson = JSON.stringify(
            (recipe.instructions || []).map((instruction, index) => ({
              step: index + 1,
              text: instruction,
            }))
          );

          // Prepare nutrition per serving
          const caloriesPerServing = recipe.nutritionPerServing?.calories || null;
          const proteinsPerServing = recipe.nutritionPerServing?.proteins || null;
          const carbsPerServing = recipe.nutritionPerServing?.carbs || null;
          const fatsPerServing = recipe.nutritionPerServing?.fats || null;
          const fiberPerServing = recipe.nutritionPerServing?.fiber || null;

          // Prepare diet flags
          const isVegan = recipe.isVegan ? true : false;
          const isVegetarian = recipe.isVegetarian ? true : false;
          const isGlutenFree = recipe.isGlutenFree ? true : false;
          const isLactoseFree = recipe.isLactoseFree ? true : false;
          const isKeto = recipe.isKeto ? true : false;
          const isPaleo = recipe.isPaleo ? true : false;

          // Insert recipe
          const query = `
            INSERT INTO recipes (
              name,
              description,
              "imageUrl",
              "preparationTime",
              "cookTime",
              servings,
              difficulty,
              "isPublic",
              active,
              "mealTime",
              allergens,
              tags,
              "caloriesPerServing",
              "proteinsPerServing",
              "carbsPerServing",
              "fatsPerServing",
              "fiberPerServing",
              "ingredientsJson",
              "instructionsJson",
              "isSeeded",
              "createdAt",
              "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
            )
          `;

          const values = [
            recipe.name,
            recipe.description || '',
            recipe.imageUrl || null,
            recipe.prepTimeMinutes || 0,
            recipe.cookTimeMinutes || 0,
            recipe.servings || 1,
            difficulty,
            recipe.isPublished ? true : true,
            true,
            mealTime,
            allergens,
            tags,
            caloriesPerServing,
            proteinsPerServing,
            carbsPerServing,
            fatsPerServing,
            fiberPerServing,
            ingredientsJson,
            instructionsJson,
            true, // isSeeded
            new Date(),
            new Date(),
          ];

          await client.query(query, values);
          imported++;

          if (imported % 500 === 0) {
            console.log(`  📥 Importadas: ${imported} recetas...`);
          }
        } catch (error) {
          errors++;
          if (errors <= 5) {
            console.error(`  ❌ Error importando receta: ${recipe.name}`, error.message);
          }
        }
      }

      console.log(`  ✅ Lote ${Math.floor(i / batchSize) + 1} completado`);
    }

    // Final verification
    const finalResult = await client.query('SELECT COUNT(*) as total FROM recipes');
    const totalRecipes = parseInt(finalResult.rows[0].total);

    console.log(`\n✅ IMPORTACIÓN COMPLETADA`);
    console.log(`  - Recetas importadas: ${imported}`);
    console.log(`  - Recetas saltadas (duplicadas): ${skipped}`);
    console.log(`  - Errores: ${errors}`);
    console.log(`  - Total en BD: ${totalRecipes}`);

    // Verify all have images
    const imageResult = await client.query(
      'SELECT COUNT(*) as with_image FROM recipes WHERE "imageUrl" IS NOT NULL AND "imageUrl" != \'\''
    );
    const withImage = parseInt(imageResult.rows[0].with_image);
    console.log(`  - Recetas con imagen: ${withImage}/${totalRecipes} (${((withImage/totalRecipes)*100).toFixed(2)}%)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

importRecipes();
