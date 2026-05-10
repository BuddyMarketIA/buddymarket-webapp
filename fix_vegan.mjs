import pg from '/home/ubuntu/buddymarket-webapp/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js';
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// CORRECCIÓN 1: Ingredientes realmente NO veganos y NO vegetarianos
// (gelatinas animales, productos de pescado/anchoas, hidromiel)
const nonVeganNonVegIds = [2673, 2677, 2678, 2258, 2703, 2259, 2708, 2578, 2602, 1730, 1732, 2564];
const r1 = await client.query(
  `UPDATE ingredients SET "isVegan" = false, "isVegetarian" = false WHERE id = ANY($1::int[])`,
  [nonVeganNonVegIds]
);
console.log('Corregidos como NO veganos y NO vegetarianos:', r1.rowCount, '→ IDs:', nonVeganNonVegIds.join(', '));

// CORRECCIÓN 2: Panadería con lácteos reales (bollos de leche, pan de leche, pan de queso)
// Son vegetarianos pero NO veganos
const nonVeganButVegIds = [1166, 1429, 1421];
const r2 = await client.query(
  `UPDATE ingredients SET "isVegan" = false, "isVegetarian" = true WHERE id = ANY($1::int[])`,
  [nonVeganButVegIds]
);
console.log('Panadería con lácteos (isVegan=false, isVegetarian=true):', r2.rowCount, '→ IDs:', nonVeganButVegIds.join(', '));

// VERIFICACIÓN: Confirmar los cambios
const r3 = await client.query(
  `SELECT id, "nameEs", "isVegan", "isVegetarian" FROM ingredients WHERE id = ANY($1::int[]) ORDER BY id`,
  [[...nonVeganNonVegIds, ...nonVeganButVegIds]]
);
console.log('\nEstado final de los ingredientes corregidos:');
r3.rows.forEach(i => console.log(`  [${i.id}] ${i.nameEs} → isVegan:${i.isVegan} isVeg:${i.isVegetarian}`));

// AUDITORÍA: Recetas veganas con ingredientes de carne/pescado en ingredientsJson
const r4 = await client.query(`
  SELECT id, name, tags
  FROM recipes
  WHERE (tags::text ILIKE '%vegano%' OR tags::text ILIKE '%vegan%')
  AND (
    "ingredientsJson"::text ILIKE '%pollo%' OR
    "ingredientsJson"::text ILIKE '%ternera%' OR
    "ingredientsJson"::text ILIKE '%cerdo%' OR
    "ingredientsJson"::text ILIKE '%jamón%' OR
    "ingredientsJson"::text ILIKE '%bacon%' OR
    "ingredientsJson"::text ILIKE '%salmón%' OR
    "ingredientsJson"::text ILIKE '%atún%' OR
    "ingredientsJson"::text ILIKE '%gambas%' OR
    "ingredientsJson"::text ILIKE '%anchoa%' OR
    "ingredientsJson"::text ILIKE '%marisco%' OR
    "ingredientsJson"::text ILIKE '%chorizo%' OR
    "ingredientsJson"::text ILIKE '%merluza%' OR
    "ingredientsJson"::text ILIKE '%bacalao%'
  )
  LIMIT 30
`);
console.log('\nRecetas VEGANAS con carne/pescado en ingredientsJson:', r4.rows.length);
r4.rows.forEach(r => console.log(`  [${r.id}] ${r.name}`));

// AUDITORÍA: Recetas vegetarianas con carne/pescado
const r5 = await client.query(`
  SELECT id, name, tags
  FROM recipes
  WHERE (tags::text ILIKE '%vegetariana%' OR tags::text ILIKE '%vegetariano%')
  AND (
    "ingredientsJson"::text ILIKE '%pollo%' OR
    "ingredientsJson"::text ILIKE '%ternera%' OR
    "ingredientsJson"::text ILIKE '%cerdo%' OR
    "ingredientsJson"::text ILIKE '%jamón%' OR
    "ingredientsJson"::text ILIKE '%bacon%' OR
    "ingredientsJson"::text ILIKE '%salmón%' OR
    "ingredientsJson"::text ILIKE '%atún%' OR
    "ingredientsJson"::text ILIKE '%gambas%' OR
    "ingredientsJson"::text ILIKE '%anchoa%' OR
    "ingredientsJson"::text ILIKE '%marisco%' OR
    "ingredientsJson"::text ILIKE '%chorizo%' OR
    "ingredientsJson"::text ILIKE '%merluza%' OR
    "ingredientsJson"::text ILIKE '%bacalao%'
  )
  LIMIT 30
`);
console.log('\nRecetas VEGETARIANAS con carne/pescado en ingredientsJson:', r5.rows.length);
r5.rows.forEach(r => console.log(`  [${r.id}] ${r.name} → ${r.tags}`));

await client.end();
console.log('\nScript completado.');
