import 'dotenv/config';
import pg from 'pg';

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const VALID_CUISINES = [
  "Española", "Mexicana", "Italiana", "Japonesa", "China", "India",
  "Francesa", "Tailandesa", "Griega", "Marroquí", "Turca", "Peruana",
  "Argentina", "Colombiana", "Brasileña", "Coreana", "Vietnamita",
  "Libanesa", "Americana", "Británica", "Alemana", "Portuguesa",
  "Cubana", "Filipina", "Indonesa", "Mediterránea", "Nórdica",
  "Caribeña", "Africana", "Árabe", "Internacional", "Fusión"
];

async function invokeLLM(messages) {
  const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_KEY}`
    },
    body: JSON.stringify({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cuisine_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    cuisine: { type: "string" }
                  },
                  required: ["id", "cuisine"],
                  additionalProperties: false
                }
              }
            },
            required: ["results"],
            additionalProperties: false
          }
        }
      }
    })
  });
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function classifyBatch(recipes) {
  const recipeList = recipes.map(r => `${r.id}: ${r.name}`).join('\n');
  const prompt = `Clasifica cada receta por su cocina/país de origen. Responde SOLO con el JSON.

Cocinas válidas: ${VALID_CUISINES.join(', ')}

Si una receta es claramente de una cocina específica, asígnala. Si es genérica o no se puede determinar, usa "Española" si tiene ingredientes típicos españoles (tortilla, gazpacho, paella, croquetas, etc.), "Mediterránea" si es genérica mediterránea, o "Internacional" si es muy genérica.

Prioriza "Española" para recetas con nombres en español que usen ingredientes típicos de España.

Recetas:
${recipeList}`;

  const result = await invokeLLM([
    { role: "system", content: "Eres un experto en gastronomía mundial. Clasificas recetas por su cocina/país de origen." },
    { role: "user", content: prompt }
  ]);
  return result.results;
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  // Get all recipes without cuisine
  const { rows: recipes } = await pool.query(
    `SELECT id, name FROM recipes WHERE "cuisineType" IS NULL OR "cuisineType" = '' ORDER BY id`
  );
  console.log(`Total recipes to classify: ${recipes.length}`);
  
  const BATCH_SIZE = 50;
  let classified = 0;
  let errors = 0;
  
  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(recipes.length / BATCH_SIZE);
    
    try {
      const results = await classifyBatch(batch);
      
      // Update in DB
      for (const r of results) {
        const cuisine = VALID_CUISINES.includes(r.cuisine) ? r.cuisine : "Internacional";
        await pool.query(
          `UPDATE recipes SET "cuisineType" = $1 WHERE id = $2`,
          [cuisine, r.id]
        );
      }
      
      classified += results.length;
      console.log(`Batch ${batchNum}/${totalBatches}: classified ${results.length} recipes (total: ${classified}/${recipes.length})`);
      
      // Small delay to avoid rate limiting
      if (i + BATCH_SIZE < recipes.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      errors++;
      console.error(`Batch ${batchNum} failed:`, err.message);
      // On error, mark all as Española (safe default for Spanish app)
      for (const r of batch) {
        await pool.query(
          `UPDATE recipes SET "cuisineType" = 'Española' WHERE id = $1 AND ("cuisineType" IS NULL OR "cuisineType" = '')`,
          [r.id]
        );
      }
      classified += batch.length;
      console.log(`Batch ${batchNum}: fallback to Española for ${batch.length} recipes`);
    }
  }
  
  // Print final distribution
  const { rows: dist } = await pool.query(
    `SELECT "cuisineType", COUNT(*) as cnt FROM recipes WHERE "cuisineType" IS NOT NULL GROUP BY "cuisineType" ORDER BY cnt DESC`
  );
  console.log('\n=== Final cuisine distribution ===');
  for (const r of dist) {
    console.log(`  ${r.cuisineType}: ${r.cnt}`);
  }
  console.log(`\nDone! Classified: ${classified}, Errors: ${errors}`);
  
  await pool.end();
}

main().catch(console.error);
