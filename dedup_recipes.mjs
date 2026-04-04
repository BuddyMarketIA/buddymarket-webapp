import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const conn = await mysql.createConnection(DATABASE_URL);
  console.log('Connected to database');

  // 1. Obtener todos los grupos de duplicados
  const [dupGroups] = await conn.execute(`
    SELECT LOWER(TRIM(name)) as name_lower,
           COUNT(*) as cnt,
           MIN(name) as name,
           MIN(id) as min_id,
           MAX(id) as max_id,
           GROUP_CONCAT(id ORDER BY id) as all_ids
    FROM recipes
    GROUP BY LOWER(TRIM(name))
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);

  console.log(`Found ${dupGroups.length} duplicate groups`);

  let totalDeleted = 0;
  let errors = 0;

  for (const group of dupGroups) {
    const allIds = group.all_ids.split(',').map(Number);
    
    try {
      // Estrategia: conservar el que tiene imagen y más datos (mayor ID suele ser más completo)
      // Primero buscar el que tiene imagen
      const idsStr = allIds.join(',');
      
      const [withImage] = await conn.query(
        `SELECT id FROM recipes WHERE id IN (${idsStr}) AND imageUrl IS NOT NULL AND imageUrl != '' ORDER BY id DESC LIMIT 1`
      );
      
      // Si hay uno con imagen, conservarlo; si no, conservar el de ID más alto (más completo)
      let keepId;
      if (withImage.length > 0) {
        keepId = withImage[0].id;
      } else {
        // Conservar el que tiene ingredientes, preferiblemente el más reciente
        const [withIngredients] = await conn.query(
          `SELECT id FROM recipes WHERE id IN (${idsStr}) AND ingredientsJson IS NOT NULL AND ingredientsJson != '[]' ORDER BY id DESC LIMIT 1`
        );
        keepId = withIngredients.length > 0 ? withIngredients[0].id : group.min_id;
      }

      const toDelete = allIds.filter(id => id !== keepId);

      if (toDelete.length > 0) {
        const deleteStr = toDelete.join(',');
        
        // Actualizar referencias en tablas relacionadas
        await conn.query(`UPDATE IGNORE menu_recipes SET recipeId = ${keepId} WHERE recipeId IN (${deleteStr})`).catch(() => {});
        await conn.query(`UPDATE IGNORE meal_logs SET recipeId = ${keepId} WHERE recipeId IN (${deleteStr})`).catch(() => {});
        await conn.query(`UPDATE IGNORE recipe_favorites SET recipeId = ${keepId} WHERE recipeId IN (${deleteStr})`).catch(() => {});

        // Eliminar duplicados
        const [result] = await conn.query(`DELETE FROM recipes WHERE id IN (${deleteStr})`);
        totalDeleted += result.affectedRows;
        
        if (dupGroups.indexOf(group) < 25) {
          console.log(`✓ "${group.name}" [${group.cnt}x] → kept ID ${keepId}, deleted ${toDelete.length}`);
        }
      }
    } catch (e) {
      errors++;
      console.error(`✗ Error processing "${group.name}": ${e.message}`);
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`Duplicados eliminados: ${totalDeleted}`);
  console.log(`Errores: ${errors}`);

  // Verificación final
  const [finalCount] = await conn.query('SELECT COUNT(*) as cnt FROM recipes');
  console.log(`Total recetas en BD: ${finalCount[0].cnt}`);

  // Verificar que no quedan duplicados
  const [remainingDups] = await conn.query(`
    SELECT COUNT(*) as cnt FROM (
      SELECT LOWER(TRIM(name)) as name_lower
      FROM recipes
      GROUP BY LOWER(TRIM(name))
      HAVING COUNT(*) > 1
    ) as dups
  `);
  console.log(`Grupos duplicados restantes: ${remainingDups[0].cnt}`);

  // Breakdown por mealTime
  const [breakdown] = await conn.query(
    'SELECT mealTime, COUNT(*) as count FROM recipes GROUP BY mealTime ORDER BY count DESC'
  );
  console.log('\nDistribución por momento del día:');
  for (const row of breakdown) {
    console.log(`  ${row.mealTime}: ${row.count}`);
  }

  await conn.end();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
