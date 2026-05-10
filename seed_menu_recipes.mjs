/**
 * seed_menu_recipes.mjs
 * Inserta recetas en los day_parts de los menús de biblioteca (isSeeded=true)
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log('Conectado a la BD');

// Obtener todos los day_parts de los menús de biblioteca
const [dayParts] = await conn.query(`
  SELECT modp.id, modp.menuOrganizerId, modp.dayPartId, modp.dayNumber, modp.name,
         mo.goal, mo.difficulty, dp.nameEs
  FROM menu_organizer_day_parts modp
  JOIN menu_organizers mo ON mo.id = modp.menuOrganizerId
  JOIN day_parts dp ON dp.id = modp.dayPartId
  WHERE mo.isSeeded = 1
  ORDER BY modp.menuOrganizerId, modp.dayNumber, modp.dayPartId
`);

console.log(`Day parts a poblar: ${dayParts.length}`);

// Obtener recetas por mealTime
async function getRecipes(mealTime, limit = 14) {
  const [rows] = await conn.query(
    `SELECT id FROM recipes WHERE mealTime = ? AND active = 1 AND caloriesPerServing > 0 ORDER BY RAND() LIMIT ?`,
    [mealTime, limit]
  );
  return rows.map(r => r.id);
}

// Mapa de dayPart nameEs a mealTime en recetas
const dpToMealTime = {
  'desayuno': 'desayuno',
  'media mañana': 'media_manana',
  'almuerzo': 'comida',
  'merienda': 'merienda',
  'cena': 'cena',
};

// Precargar recetas para cada mealTime
const recipePool = {};
for (const [dpName, mealTime] of Object.entries(dpToMealTime)) {
  recipePool[dpName] = await getRecipes(mealTime, 14);
  console.log(`  ${dpName}: ${recipePool[dpName].length} recetas disponibles`);
}

// Para cada menú, agrupar day_parts por menú y asignar recetas rotando
let inserted = 0;
let errors = 0;

// Agrupar por menuId
const menuGroups = {};
for (const dp of dayParts) {
  if (!menuGroups[dp.menuOrganizerId]) menuGroups[dp.menuOrganizerId] = [];
  menuGroups[dp.menuOrganizerId].push(dp);
}

for (const [menuId, dps] of Object.entries(menuGroups)) {
  // Usar un offset diferente por menú para variar las recetas
  const menuOffset = parseInt(menuId) % 7;
  
  for (const dp of dps) {
    const dpNameLower = dp.nameEs?.toLowerCase() || dp.name?.toLowerCase() || 'almuerzo';
    const pool = recipePool[dpNameLower] || recipePool['almuerzo'];
    
    if (!pool || pool.length === 0) {
      console.log(`  ⚠️ Sin recetas para "${dpNameLower}"`);
      continue;
    }
    
    // Rotar receta según día + offset de menú
    const recipeIdx = (dp.dayNumber - 1 + menuOffset) % pool.length;
    const recipeId = pool[recipeIdx];
    
    try {
      await conn.query(
        `INSERT IGNORE INTO menu_dp_recipes (menuOrganizerDayPartId, recipeId, servings, completed, createdAt)
         VALUES (?, ?, 1, 0, NOW())`,
        [dp.id, recipeId]
      );
      inserted++;
    } catch (e) {
      errors++;
      if (errors <= 3) console.error(`  ❌ Error en dp ${dp.id}: ${e.message}`);
    }
  }
}

// Verificar resultado
const [result] = await conn.query(`
  SELECT mo.id, mo.name, mo.goal, mo.difficulty,
         COUNT(DISTINCT mdr.id) as totalRecipes
  FROM menu_organizers mo
  LEFT JOIN menu_organizer_day_parts modp ON modp.menuOrganizerId = mo.id
  LEFT JOIN menu_dp_recipes mdr ON mdr.menuOrganizerDayPartId = modp.id
  WHERE mo.isSeeded = 1
  GROUP BY mo.id
  ORDER BY mo.id
`);

console.log(`\n=== RESULTADO ===`);
console.log(`Recetas insertadas: ${inserted}, Errores: ${errors}`);
console.log('\nEstado final de menús de biblioteca:');
result.forEach(m => console.log(`  ID:${m.id} | ${m.goal} | ${m.difficulty} | ${m.totalRecipes} recetas | ${m.name}`));

await conn.end();
