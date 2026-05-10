import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const jsonRecipes = JSON.parse(fs.readFileSync('/home/ubuntu/recipes_list.json', 'utf8'));
const jsonNames = new Set(jsonRecipes.map(r => r.name.toLowerCase().trim()));

const r = await pool.query('SELECT id, name, "imageUrl", "mealTime", category FROM recipes WHERE "isSeeded" = true ORDER BY id');
const dbNames = new Set(r.rows.map(x => x.name.toLowerCase().trim()));

// Find recipes in JSON but not in DB
const missing = jsonRecipes.filter(r => !dbNames.has(r.name.toLowerCase().trim()));
console.log('Recipes in JSON:', jsonRecipes.length);
console.log('Recipes in DB (seeded):', dbNames.size);
console.log('Missing from DB:', missing.length);
if (missing.length > 0) {
  console.log('First 5 missing:', missing.slice(0, 5).map(r => r.name));
}

// Find recipes in DB but not in JSON
const extra = r.rows.filter(x => !jsonNames.has(x.name.toLowerCase().trim()));
console.log('Extra in DB (not in JSON):', extra.length);
if (extra.length > 0) {
  console.log('First 5 extra:', extra.slice(0, 5).map(r => r.name));
}

// Check imageUrl status
const withImg = r.rows.filter(x => x.imageUrl && x.imageUrl.length > 0);
console.log('DB recipes with imageUrl:', withImg.length);

await pool.end();
