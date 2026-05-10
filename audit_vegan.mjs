import pg from '/home/ubuntu/buddymarket-webapp/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js';
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// Palabras clave de ingredientes NO veganos
const nonVeganKeywords = [
  'pollo','pechuga','muslo','ternera','cerdo','cordero','pavo','jamón','bacon',
  'chorizo','salchich','carne','buey','vaca','res','atún','salmón','merluza',
  'bacalao','gambas','langostino','mejillón','almeja','calamar','pulpo','pescado',
  'marisco','miel','gelatina','anchoa','boquerón','sardina','caballa','bonito',
  'lacón','panceta','embutido','mortadela','fuet','lomo'
];

// Palabras clave de ingredientes NO vegetarianos (carne/pescado)
const nonVegetarianKeywords = [
  'pollo','pechuga','muslo','ternera','cerdo','cordero','pavo','jamón','bacon',
  'chorizo','salchich','carne','buey','vaca','res','atún','salmón','merluza',
  'bacalao','gambas','langostino','mejillón','almeja','calamar','pulpo','pescado',
  'marisco','anchoa','boquerón','sardina','caballa','bonito','lacón','panceta',
  'embutido','mortadela','fuet','lomo'
];

const veganConditions = nonVeganKeywords.map(k => `ri.name ILIKE '%${k}%'`).join(' OR ');
const vegetarianConditions = nonVegetarianKeywords.map(k => `ri.name ILIKE '%${k}%'`).join(' OR ');

// 1. Recetas veganas con ingredientes no veganos
const veganResult = await client.query(`
  SELECT DISTINCT r.id, r.name, r.diet_type, 
    STRING_AGG(DISTINCT ri.name, ' | ' ORDER BY ri.name) as bad_ingredients
  FROM recipes r
  JOIN recipe_ingredients ri ON r.id = ri.recipe_id
  WHERE r.diet_type ILIKE 'vegan%'
  AND (${veganConditions})
  GROUP BY r.id, r.name, r.diet_type
  ORDER BY r.name
  LIMIT 100
`);

// 2. Recetas vegetarianas con carne/pescado
const vegResult = await client.query(`
  SELECT DISTINCT r.id, r.name, r.diet_type, 
    STRING_AGG(DISTINCT ri.name, ' | ' ORDER BY ri.name) as bad_ingredients
  FROM recipes r
  JOIN recipe_ingredients ri ON r.id = ri.recipe_id
  WHERE r.diet_type ILIKE 'vegetar%'
  AND (${vegetarianConditions})
  GROUP BY r.id, r.name, r.diet_type
  ORDER BY r.name
  LIMIT 100
`);

// 3. Ingredientes mal etiquetados como veganos
const ingredVeganResult = await client.query(`
  SELECT id, name, category, is_vegan, is_vegetarian
  FROM ingredients
  WHERE is_vegan = true AND (
    name ILIKE '%pollo%' OR name ILIKE '%ternera%' OR name ILIKE '%cerdo%' OR
    name ILIKE '%jamón%' OR name ILIKE '%bacon%' OR name ILIKE '%salmón%' OR
    name ILIKE '%atún%' OR name ILIKE '%gambas%' OR name ILIKE '%miel%' OR
    name ILIKE '%leche%' OR name ILIKE '%queso%' OR name ILIKE '%yogur%' OR
    name ILIKE '%huevo%' OR name ILIKE '%mantequilla%' OR name ILIKE '%nata%' OR
    name ILIKE '%gelatina%' OR name ILIKE '%anchoa%' OR name ILIKE '%pescado%' OR
    name ILIKE '%marisco%' OR name ILIKE '%chorizo%' OR name ILIKE '%salchich%' OR
    name ILIKE '%carne%' OR name ILIKE '%merluza%' OR name ILIKE '%bacalao%'
  )
  ORDER BY name
  LIMIT 100
`);

// 4. Ingredientes mal etiquetados como vegetarianos
const ingredVegResult = await client.query(`
  SELECT id, name, category, is_vegan, is_vegetarian
  FROM ingredients
  WHERE is_vegetarian = true AND (
    name ILIKE '%pollo%' OR name ILIKE '%ternera%' OR name ILIKE '%cerdo%' OR
    name ILIKE '%jamón%' OR name ILIKE '%bacon%' OR name ILIKE '%salmón%' OR
    name ILIKE '%atún%' OR name ILIKE '%gambas%' OR name ILIKE '%anchoa%' OR
    name ILIKE '%pescado%' OR name ILIKE '%marisco%' OR name ILIKE '%chorizo%' OR
    name ILIKE '%salchich%' OR name ILIKE '%carne%' OR name ILIKE '%merluza%' OR
    name ILIKE '%bacalao%' OR name ILIKE '%langostino%' OR name ILIKE '%mejillón%'
  )
  ORDER BY name
  LIMIT 100
`);

// 5. Contar totales de recetas por diet_type
const countResult = await client.query(`
  SELECT diet_type, COUNT(*) as total
  FROM recipes
  WHERE diet_type IS NOT NULL
  GROUP BY diet_type
  ORDER BY total DESC
`);

console.log('\n=== DISTRIBUCIÓN DE RECETAS POR TIPO DE DIETA ===');
countResult.rows.forEach(r => console.log(`  ${r.diet_type}: ${r.total}`));

console.log('\n=== RECETAS VEGANAS CON INGREDIENTES NO VEGANOS ===');
console.log('Total:', veganResult.rows.length);
veganResult.rows.forEach(r => console.log(`  [${r.id}] ${r.name} → ${r.bad_ingredients}`));

console.log('\n=== RECETAS VEGETARIANAS CON CARNE/PESCADO ===');
console.log('Total:', vegResult.rows.length);
vegResult.rows.forEach(r => console.log(`  [${r.id}] ${r.name} → ${r.bad_ingredients}`));

console.log('\n=== INGREDIENTES MAL ETIQUETADOS COMO VEGANOS ===');
console.log('Total:', ingredVeganResult.rows.length);
ingredVeganResult.rows.forEach(i => console.log(`  [${i.id}] ${i.name} (${i.category})`));

console.log('\n=== INGREDIENTES MAL ETIQUETADOS COMO VEGETARIANOS ===');
console.log('Total:', ingredVegResult.rows.length);
ingredVegResult.rows.forEach(i => console.log(`  [${i.id}] ${i.name} (${i.category}) vegan:${i.is_vegan}`));

await client.end();
