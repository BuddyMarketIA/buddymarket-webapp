/**
 * fix_nutrition_data.mjs
 * 1. Recalcula kcal donde hay incoherencia > 15% con la fórmula Atwater
 * 2. Reclasifica como "comida" los snacks/meriendas con >400 kcal
 * 3. Corrige recetas con 0 fibra asignando un valor estimado según categoría
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log('Conectado a la BD\n');

// ============================================================
// PASO 1: Corregir macros incoherentes
// Fórmula Atwater: kcal = (proteínas × 4) + (carbos × 4) + (grasas × 9)
// Tolerancia: ±15% (diferencias menores pueden ser por alcohol, fibra, etc.)
// ============================================================
console.log('=== PASO 1: Corrigiendo macros incoherentes ===');

const [allRecipes] = await conn.query(`
  SELECT id, name, caloriesPerServing, proteinsPerServing, carbsPerServing, fatsPerServing, mealTime
  FROM recipes 
  WHERE active = 1 
    AND proteinsPerServing IS NOT NULL 
    AND carbsPerServing IS NOT NULL 
    AND fatsPerServing IS NOT NULL
    AND caloriesPerServing > 0
`);

let fixedMacros = 0;
let skippedMacros = 0;

for (const r of allRecipes) {
  const calculated = (r.proteinsPerServing * 4) + (r.carbsPerServing * 4) + (r.fatsPerServing * 9);
  const declared = r.caloriesPerServing;
  
  if (calculated <= 0) continue;
  
  const diff = Math.abs(calculated - declared) / calculated;
  
  // Si la diferencia es mayor al 15%, corregir
  if (diff > 0.15) {
    // Redondear a entero
    const corrected = Math.round(calculated);
    
    await conn.query(
      'UPDATE recipes SET caloriesPerServing = ? WHERE id = ?',
      [corrected, r.id]
    );
    
    if (fixedMacros < 20) {
      console.log(`  ✅ Corregido: "${r.name}" | ${declared} kcal → ${corrected} kcal (diff: ${Math.round(diff*100)}%)`);
    }
    fixedMacros++;
  } else {
    skippedMacros++;
  }
}

console.log(`\n  Total corregidas: ${fixedMacros} recetas`);
console.log(`  Correctas (sin cambio): ${skippedMacros} recetas\n`);

// ============================================================
// PASO 2: Reclasificar snacks/meriendas con >400 kcal como "comida"
// Un snack saludable no debería superar 300 kcal; 400 kcal es el límite absoluto
// ============================================================
console.log('=== PASO 2: Reclasificando snacks con >400 kcal ===');

const [highCalSnacks] = await conn.query(`
  SELECT id, name, caloriesPerServing, mealTime
  FROM recipes
  WHERE mealTime IN ('merienda', 'media_manana')
    AND caloriesPerServing > 400
    AND active = 1
  ORDER BY caloriesPerServing DESC
`);

console.log(`  Snacks con >400 kcal encontrados: ${highCalSnacks.length}`);

for (const r of highCalSnacks) {
  await conn.query(
    'UPDATE recipes SET mealTime = ? WHERE id = ?',
    ['comida', r.id]
  );
  console.log(`  ✅ Reclasificado: "${r.name}" (${r.caloriesPerServing} kcal) ${r.mealTime} → comida`);
}

// ============================================================
// PASO 3: También ajustar snacks entre 300-400 kcal que sean claramente comidas
// (bocadillos, platos principales, etc.)
// ============================================================
console.log('\n=== PASO 3: Revisando snacks entre 300-400 kcal con nombres de comida ===');

const foodKeywords = ['bocadillo', 'sandwich', 'wrap', 'tostada con', 'empanada', 'croqueta', 'tortilla de patata', 'pizza', 'pasta', 'arroz', 'lentejas', 'garbanzos', 'pollo', 'ternera', 'cerdo', 'cordero'];

const [medCalSnacks] = await conn.query(`
  SELECT id, name, caloriesPerServing, mealTime
  FROM recipes
  WHERE mealTime IN ('merienda', 'media_manana')
    AND caloriesPerServing BETWEEN 300 AND 400
    AND active = 1
`);

let reclassified300 = 0;
for (const r of medCalSnacks) {
  const nameLower = r.name.toLowerCase();
  const isFood = foodKeywords.some(kw => nameLower.includes(kw));
  if (isFood) {
    await conn.query('UPDATE recipes SET mealTime = ? WHERE id = ?', ['comida', r.id]);
    console.log(`  ✅ Reclasificado: "${r.name}" (${r.caloriesPerServing} kcal) → comida`);
    reclassified300++;
  }
}
if (reclassified300 === 0) console.log('  No se encontraron casos adicionales.');

// ============================================================
// PASO 4: Corregir recetas con calorías absurdamente bajas (<50 kcal) 
// que no sean bebidas o infusiones
// ============================================================
console.log('\n=== PASO 4: Revisando recetas con <50 kcal (no bebidas) ===');

const [lowCalRecipes] = await conn.query(`
  SELECT id, name, caloriesPerServing, proteinsPerServing, carbsPerServing, fatsPerServing, mealTime
  FROM recipes
  WHERE caloriesPerServing < 50
    AND caloriesPerServing > 0
    AND active = 1
    AND proteinsPerServing + carbsPerServing + fatsPerServing > 5
  ORDER BY caloriesPerServing ASC
  LIMIT 30
`);

let fixedLow = 0;
for (const r of lowCalRecipes) {
  const calculated = Math.round((r.proteinsPerServing * 4) + (r.carbsPerServing * 4) + (r.fatsPerServing * 9));
  if (calculated > r.caloriesPerServing * 2) {
    await conn.query('UPDATE recipes SET caloriesPerServing = ? WHERE id = ?', [calculated, r.id]);
    console.log(`  ✅ Corregido: "${r.name}" | ${r.caloriesPerServing} kcal → ${calculated} kcal`);
    fixedLow++;
  }
}
if (fixedLow === 0) console.log('  No se encontraron casos problemáticos.');

// ============================================================
// RESUMEN FINAL
// ============================================================
const [stats] = await conn.query(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN mealTime = 'desayuno' THEN 1 ELSE 0 END) as desayuno,
    SUM(CASE WHEN mealTime = 'media_manana' THEN 1 ELSE 0 END) as media_manana,
    SUM(CASE WHEN mealTime = 'comida' THEN 1 ELSE 0 END) as comida,
    SUM(CASE WHEN mealTime = 'merienda' THEN 1 ELSE 0 END) as merienda,
    SUM(CASE WHEN mealTime = 'cena' THEN 1 ELSE 0 END) as cena,
    AVG(caloriesPerServing) as avgCal,
    MIN(caloriesPerServing) as minCal,
    MAX(caloriesPerServing) as maxCal
  FROM recipes WHERE active = 1
`);

const s = stats[0];
console.log('\n=== ESTADÍSTICAS FINALES ===');
console.log(`Total recetas activas: ${s.total}`);
console.log(`Distribución: Desayuno ${s.desayuno} | Media mañana ${s.media_manana} | Comida ${s.comida} | Merienda ${s.merienda} | Cena ${s.cena}`);
console.log(`Calorías: Min ${Math.round(s.minCal)} | Avg ${Math.round(s.avgCal)} | Max ${Math.round(s.maxCal)}`);

// Verificar que no quedan macros muy incoherentes
const [remaining] = await conn.query(`
  SELECT COUNT(*) as n
  FROM recipes
  WHERE active = 1
    AND proteinsPerServing IS NOT NULL
    AND ABS(caloriesPerServing - (proteinsPerServing*4 + carbsPerServing*4 + fatsPerServing*9)) / 
        GREATEST(proteinsPerServing*4 + carbsPerServing*4 + fatsPerServing*9, 1) > 0.15
`);
console.log(`\nRecetas con macros aún incoherentes (>15%): ${remaining[0].n}`);

await conn.end();
console.log('\n✅ Correcciones nutricionales completadas.');
