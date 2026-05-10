/**
 * Script de limpieza y normalización de la BD de ingredientes
 * - Normaliza categorías duplicadas/inconsistentes
 * - Elimina duplicados (mantiene el registro con más datos nutricionales)
 * - Rellena calorías nulas con valores por defecto razonables
 * 
 * Uso: node scripts/fix-ingredients-db.mjs
 */

import pkg from '../node_modules/pg/lib/index.js';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log('🔧 Iniciando limpieza y normalización de ingredientes...\n');

// ─── 1. Mapa de normalización de categorías ───────────────────────────────────
const CATEGORY_MAP = {
  // Verduras / vegetales
  'vegetales': 'verduras',
  'vegetables': 'verduras',
  'verdura': 'verduras',
  'verduras_hoja': 'verduras',
  'verduras_raiz': 'verduras',
  'verduras_cocidas': 'verduras',
  // Frutas
  'fruta': 'frutas',
  'fruits': 'frutas',
  'frutas_baya': 'frutas',
  'frutas_tropicales': 'frutas',
  'frutas_secas': 'frutas_secas_y_deshidratadas',
  // Carnes
  'meat': 'carnes',
  'carnes_aves': 'carnes',
  'carnes_procesadas': 'embutidos_y_fiambres',
  'embutidos': 'embutidos_y_fiambres',
  // Pescados
  'fish': 'pescados',
  'pescados_mariscos': 'pescados',
  'mariscos': 'pescados',
  'pescados_conservas': 'conservas',
  // Lácteos
  'lacteo': 'lacteos',
  'dairy': 'lacteos',
  'lácteos': 'lacteos',
  'lacteos_quesos': 'lacteos',
  'lacteos_huevos': 'lacteos',
  'lácteos_y_huevos': 'lacteos',
  // Huevos
  'eggs': 'huevos',
  // Cereales y granos
  'cereal': 'cereales',
  'cereals': 'cereales',
  'granos': 'cereales',
  'cereales_integrales': 'cereales',
  'pan_bolleria': 'panaderia',
  'pan': 'panaderia',
  'panadería': 'panaderia',
  'pan_y_cereales': 'panaderia',
  'pasta_arroces': 'cereales',
  'pastas': 'cereales',
  'pasta': 'cereales',
  'carbohidratos': 'cereales',
  'harinas_levaduras': 'panaderia',
  'leudantes': 'panaderia',
  'levadura': 'panaderia',
  // Legumbres
  'legumbre': 'legumbres',
  'legumes': 'legumbres',
  'legumbres_variedades': 'legumbres',
  // Frutos secos y semillas
  'fruto_seco': 'frutos_secos',
  'nuts_seeds': 'frutos_secos',
  'frutos secos': 'frutos_secos',
  'semillas': 'semillas',
  'semilla': 'semillas',
  'semillas_frutos_secos': 'frutos_secos',
  'frutos_secos_semillas': 'frutos_secos',
  // Aceites y grasas
  'aceite': 'aceites',
  'oils_fats': 'aceites',
  'aceites_grasas': 'aceites',
  'grasa': 'aceites',
  // Condimentos y salsas
  'salsas': 'condimentos',
  'condimentos_salsas': 'condimentos',
  'salsas_condimentos_cocina': 'condimentos',
  'condimento': 'condimentos',
  'sauces': 'condimentos',
  // Especias y hierbas
  'hierbas': 'especias',
  'especias_hierbas': 'especias',
  'hierba': 'especias',
  // Bebidas
  'bebidas_saludables': 'bebidas',
  'bebidas_no_alcoholicas': 'bebidas',
  'bebidas_alcoholicas': 'bebidas',
  'liquidos': 'bebidas',
  'caldos': 'bebidas',
  // Lácteos alternativos
  'dairy_alternatives': 'lacteos_alternativos',
  'lácteos_alternativos': 'lacteos_alternativos',
  // Proteínas vegetales
  'proteina': 'proteinas_vegetales',
  'proteinas': 'proteinas_vegetales',
  'proteina vegetal': 'proteinas_vegetales',
  // Endulzantes
  'endulzantes': 'edulcorantes',
  'sweeteners': 'edulcorantes',
  // Snacks
  'snacks_aperitivos': 'snacks',
  // Otros
  'comida_internacional': 'preparados',
  'alimentos_fermentados': 'preparados',
  'suplemento': 'suplementos',
  'supplements': 'suplementos',
  'superalimentos': 'suplementos',
  'dulces_postres': 'dulces',
  'sweets': 'dulces',
  'aditivos': 'otros',
  'espesantes': 'otros',
  'otro': 'otros',
  'otros': 'otros',
};

// ─── 2. Normalizar categorías ─────────────────────────────────────────────────
console.log('📂 Normalizando categorías...');
let catFixed = 0;
for (const [oldCat, newCat] of Object.entries(CATEGORY_MAP)) {
  const r = await client.query(
    'UPDATE ingredients SET category = $1, "updatedAt" = NOW() WHERE category = $2',
    [newCat, oldCat]
  );
  if (r.rowCount > 0) {
    console.log(`  ${oldCat} → ${newCat} (${r.rowCount} registros)`);
    catFixed += r.rowCount;
  }
}
console.log(`✅ Categorías normalizadas: ${catFixed} ingredientes actualizados\n`);

// ─── 3. Eliminar duplicados (mantener el que tiene más datos nutricionales) ───
console.log('🗑️  Eliminando duplicados...');
const dups = await client.query(`
  SELECT "nameEs", array_agg(id ORDER BY 
    (CASE WHEN calories IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN proteins IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN carbohydrates IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN fats IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN fiber IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN potassium IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN "vitaminC" IS NOT NULL THEN 1 ELSE 0 END) DESC, id ASC
  ) as ids
  FROM ingredients
  GROUP BY "nameEs"
  HAVING COUNT(*) > 1
`);

let dupCount = 0;
for (const row of dups.rows) {
  const [keepId, ...deleteIds] = row.ids;
  if (deleteIds.length > 0) {
    // Primero eliminar referencias en ingredient_allergies
    await client.query('DELETE FROM ingredient_allergies WHERE "ingredientId" = ANY($1)', [deleteIds]);
    // Luego eliminar el ingrediente duplicado
    const r = await client.query('DELETE FROM ingredients WHERE id = ANY($1)', [deleteIds]);
    dupCount += r.rowCount;
    console.log(`  Duplicado "${row.nameEs}": mantenido id=${keepId}, eliminados ids=${deleteIds.join(',')}`);
  }
}
console.log(`✅ Duplicados eliminados: ${dupCount}\n`);

// ─── 4. Rellenar calorías nulas con estimación por categoría ─────────────────
console.log('🔢 Rellenando valores nutricionales nulos...');
const DEFAULT_CALORIES = {
  frutas: 60, verduras: 35, carnes: 200, pescados: 130, lacteos: 120,
  cereales: 340, legumbres: 330, frutos_secos: 580, aceites: 880,
  condimentos: 50, especias: 280, bebidas: 40, huevos: 155,
  panaderia: 280, preparados: 150, dulces: 400, suplementos: 350,
  semillas: 550, edulcorantes: 380, snacks: 450, conservas: 120,
  embutidos_y_fiambres: 280, proteinas_vegetales: 120, lacteos_alternativos: 45,
  otros: 100,
};

for (const [cat, cal] of Object.entries(DEFAULT_CALORIES)) {
  const r = await client.query(
    'UPDATE ingredients SET calories = $1, "updatedAt" = NOW() WHERE category = $2 AND (calories IS NULL OR calories = 0)',
    [cal, cat]
  );
  if (r.rowCount > 0) console.log(`  ${cat}: ${r.rowCount} ingredientes con calorías=${cal}`);
}
console.log('✅ Valores nutricionales completados\n');

// ─── 5. Estado final ──────────────────────────────────────────────────────────
const final = await client.query('SELECT COUNT(*) FROM ingredients');
const finalCats = await client.query('SELECT category, COUNT(*) as cnt FROM ingredients GROUP BY category ORDER BY cnt DESC');
console.log(`📊 ESTADO FINAL: ${final.rows[0].count} ingredientes`);
console.log('Categorías:');
finalCats.rows.forEach(r => console.log(`  ${r.category}: ${r.cnt}`));

await client.end();
console.log('\n✅ Limpieza completada con éxito');
