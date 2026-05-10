/**
 * seed_menu_library.mjs
 * Crea menús de biblioteca (isSeeded=true) con recetas reales de la BD
 * para poblar la Biblioteca de Menús de BuddyMarket
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log('Conectado a la BD');

// Obtener recetas reales por mealTime
async function getRecipesByMealTime(mealTime, limit = 7) {
  const [rows] = await conn.query(
    `SELECT id, name, caloriesPerServing, proteinsPerServing, carbsPerServing, fatsPerServing 
     FROM recipes WHERE mealTime = ? AND active = 1 AND caloriesPerServing > 0 
     ORDER BY RAND() LIMIT ?`,
    [mealTime, limit]
  );
  return rows;
}

async function getRecipesByCategory(category, mealTime, limit = 7) {
  const [rows] = await conn.query(
    `SELECT id, name, caloriesPerServing, proteinsPerServing, carbsPerServing, fatsPerServing 
     FROM recipes WHERE category = ? AND mealTime = ? AND active = 1 AND caloriesPerServing > 0 
     ORDER BY RAND() LIMIT ?`,
    [category, mealTime, limit]
  );
  return rows;
}

async function getRecipesByTag(tag, mealTime, limit = 7) {
  const [rows] = await conn.query(
    `SELECT id, name, caloriesPerServing, proteinsPerServing, carbsPerServing, fatsPerServing 
     FROM recipes WHERE tags LIKE ? AND mealTime = ? AND active = 1 AND caloriesPerServing > 0 
     ORDER BY RAND() LIMIT ?`,
    [`%${tag}%`, mealTime, limit]
  );
  if (rows.length < 3) {
    // fallback sin tag
    return getRecipesByMealTime(mealTime, limit);
  }
  return rows;
}

// Obtener dayParts
const [dayParts] = await conn.query('SELECT * FROM day_parts');
const dpMap = {};
dayParts.forEach(dp => {
  dpMap[dp.api_param || dp.nameEs?.toLowerCase()] = dp.id;
  if (dp.nameEs) dpMap[dp.nameEs.toLowerCase()] = dp.id;
});
console.log('DayParts disponibles:', Object.keys(dpMap));

// Función para crear un menú completo de 7 días
async function createSeededMenu({ name, objective, goal, difficulty, dailyCalories, dailyMealsCount, mealTimeConfig }) {
  // Insertar menú
  const today = new Date();
  const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const [menuResult] = await conn.query(
    `INSERT INTO menu_organizers (userId, name, startDate, endDate, type, isPublic, objective, dailyMealsCount, generatedByAI, goal, dailyCalories, difficulty, isSeeded, isActive, persons, createdAt, updatedAt)
     VALUES (1, ?, ?, ?, 'weekly', 1, ?, ?, 0, ?, ?, ?, 1, 0, 1, NOW(), NOW())`,
    [name, today.toISOString().split('T')[0], endDate.toISOString().split('T')[0], objective, dailyMealsCount, goal, dailyCalories, difficulty]
  );
  const menuId = menuResult.insertId;
  
  // Para cada día de la semana
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    // Para cada momento del día configurado
    for (const [mealTimeName, recipes] of Object.entries(mealTimeConfig)) {
      // Buscar el dayPart correspondiente
      const dpId = dpMap[mealTimeName.toLowerCase()] || dpMap['comida'];
      if (!dpId) continue;
      
      // Insertar dayPart del menú
      const [dpResult] = await conn.query(
        `INSERT INTO menu_organizer_day_parts (menuOrganizerId, dayPartId, dayNumber, name, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [menuId, dpId, dayNum, mealTimeName]
      );
      const dpId2 = dpResult.insertId;
      
      // Asignar receta del día (rotar por día)
      const recipe = recipes[(dayNum - 1) % recipes.length];
      if (recipe) {
        try {
          await conn.query(
            `INSERT INTO menu_organizer_day_part_recipes (menuOrganizerDayPartId, recipeId, servings, createdAt, updatedAt)
             VALUES (?, ?, 1, NOW(), NOW())`,
            [dpId2, recipe.id]
          );
        } catch (e) {
          // ignore duplicate
        }
      }
    }
  }
  
  return menuId;
}

// Obtener recetas para cada tipo de menú
console.log('\nObteniendo recetas para los menús...');

// === MENÚ 1: PÉRDIDA DE PESO (FÁCIL) ===
const pp_desayuno = await getRecipesByMealTime('desayuno', 7);
const pp_comida = await getRecipesByTag('saludable', 'comida', 7);
const pp_cena = await getRecipesByTag('saludable', 'cena', 7);
const pp_merienda = await getRecipesByMealTime('merienda', 7);

// === MENÚ 2: PÉRDIDA DE PESO (MEDIO) ===
const pp2_desayuno = await getRecipesByMealTime('desayuno', 7);
const pp2_comida = await getRecipesByCategory('ensalada', 'comida', 7);
const pp2_cena = await getRecipesByCategory('pescado', 'cena', 7);
const pp2_merienda = await getRecipesByMealTime('media_manana', 7);

// === MENÚ 3: GANANCIA MUSCULAR ===
const gm_desayuno = await getRecipesByCategory('proteico', 'desayuno', 7);
const gm_comida = await getRecipesByCategory('carne', 'comida', 7);
const gm_cena = await getRecipesByCategory('proteico', 'cena', 7);
const gm_media = await getRecipesByCategory('batido', 'media_manana', 7);

// === MENÚ 4: MANTENIMIENTO EQUILIBRADO ===
const mt_desayuno = await getRecipesByMealTime('desayuno', 7);
const mt_comida = await getRecipesByMealTime('comida', 7);
const mt_cena = await getRecipesByMealTime('cena', 7);
const mt_merienda = await getRecipesByMealTime('merienda', 7);

// === MENÚ 5: VEGANO ===
const vg_desayuno = await getRecipesByCategory('vegano', 'desayuno', 7);
const vg_comida = await getRecipesByCategory('vegano', 'comida', 7);
const vg_cena = await getRecipesByCategory('vegano', 'cena', 7);
const vg_merienda = await getRecipesByCategory('vegano', 'merienda', 7);

// === MENÚ 6: TONIFICACIÓN ===
const ton_desayuno = await getRecipesByMealTime('desayuno', 7);
const ton_comida = await getRecipesByCategory('fitness', 'comida', 7);
const ton_cena = await getRecipesByCategory('fitness', 'cena', 7);
const ton_media = await getRecipesByMealTime('media_manana', 7);

// === MENÚ 7: BIENESTAR DIGESTIVO ===
const bw_desayuno = await getRecipesByCategory('saludable', 'desayuno', 7);
const bw_comida = await getRecipesByCategory('sopa', 'comida', 7);
const bw_cena = await getRecipesByCategory('vegetariano', 'cena', 7);
const bw_merienda = await getRecipesByMealTime('merienda', 7);

// === MENÚ 8: PÉRDIDA DE GRASA (DIFÍCIL) ===
const pg_desayuno = await getRecipesByMealTime('desayuno', 7);
const pg_media = await getRecipesByMealTime('media_manana', 7);
const pg_comida = await getRecipesByCategory('ensalada', 'comida', 7);
const pg_merienda = await getRecipesByMealTime('merienda', 7);
const pg_cena = await getRecipesByCategory('pescado', 'cena', 7);

// === MENÚ 9: MEDITERRÁNEO ===
const med_desayuno = await getRecipesByMealTime('desayuno', 7);
const med_comida = await getRecipesByCategory('pasta', 'comida', 7);
const med_cena = await getRecipesByCategory('pescado', 'cena', 7);
const med_merienda = await getRecipesByMealTime('merienda', 7);

// === MENÚ 10: BAJO EN CARBOS ===
const lc_desayuno = await getRecipesByCategory('huevos', 'desayuno', 7);
const lc_comida = await getRecipesByCategory('carne', 'comida', 7);
const lc_cena = await getRecipesByCategory('pescado', 'cena', 7);
const lc_media = await getRecipesByMealTime('media_manana', 7);

console.log('Recetas obtenidas. Creando menús de biblioteca...\n');

const menus = [
  {
    name: 'Plan Pérdida de Peso — Semana Básica',
    objective: 'Menú semanal equilibrado con déficit calórico moderado para perder peso de forma saludable. Rico en proteínas y verduras, bajo en grasas saturadas.',
    goal: 'perdida_peso',
    difficulty: 'facil',
    dailyCalories: 1500,
    dailyMealsCount: 4,
    mealTimeConfig: {
      'desayuno': pp_desayuno,
      'comida': pp_comida,
      'merienda': pp_merienda,
      'cena': pp_cena,
    }
  },
  {
    name: 'Plan Pérdida de Peso — Semana Avanzada',
    objective: 'Menú con mayor déficit calórico y mayor variedad. Incluye ensaladas proteicas, pescados y cenas ligeras para acelerar la pérdida de peso.',
    goal: 'perdida_peso',
    difficulty: 'medio',
    dailyCalories: 1400,
    dailyMealsCount: 4,
    mealTimeConfig: {
      'desayuno': pp2_desayuno,
      'media_manana': pp2_merienda,
      'comida': pp2_comida,
      'cena': pp2_cena,
    }
  },
  {
    name: 'Plan Ganancia Muscular — Semana Proteica',
    objective: 'Menú hipercalórico con alto contenido proteico para favorecer la síntesis muscular. Incluye batidos, carnes magras y carbohidratos de calidad.',
    goal: 'ganancia_muscular',
    difficulty: 'medio',
    dailyCalories: 2800,
    dailyMealsCount: 5,
    mealTimeConfig: {
      'desayuno': gm_desayuno,
      'media_manana': gm_media,
      'comida': gm_comida,
      'merienda': gm_media,
      'cena': gm_cena,
    }
  },
  {
    name: 'Plan Mantenimiento — Dieta Equilibrada',
    objective: 'Menú completo y variado para mantener el peso actual. Equilibrio perfecto entre proteínas, carbohidratos y grasas saludables.',
    goal: 'mantenimiento',
    difficulty: 'facil',
    dailyCalories: 2000,
    dailyMealsCount: 4,
    mealTimeConfig: {
      'desayuno': mt_desayuno,
      'comida': mt_comida,
      'merienda': mt_merienda,
      'cena': mt_cena,
    }
  },
  {
    name: 'Plan Vegano — Semana Plant-Based',
    objective: 'Menú 100% vegetal con todos los nutrientes esenciales. Rico en legumbres, cereales integrales, frutos secos y verduras de temporada.',
    goal: 'vegano',
    difficulty: 'medio',
    dailyCalories: 1800,
    dailyMealsCount: 4,
    mealTimeConfig: {
      'desayuno': vg_desayuno.length >= 3 ? vg_desayuno : mt_desayuno,
      'comida': vg_comida.length >= 3 ? vg_comida : mt_comida,
      'merienda': vg_merienda.length >= 3 ? vg_merienda : mt_merienda,
      'cena': vg_cena.length >= 3 ? vg_cena : mt_cena,
    }
  },
  {
    name: 'Plan Tonificación — Fitness Semanal',
    objective: 'Menú diseñado para tonificar el cuerpo combinando proteínas de calidad con carbohidratos complejos. Ideal para personas que entrenan 3-5 días por semana.',
    goal: 'tonificacion',
    difficulty: 'medio',
    dailyCalories: 2200,
    dailyMealsCount: 5,
    mealTimeConfig: {
      'desayuno': ton_desayuno,
      'media_manana': ton_media,
      'comida': ton_comida.length >= 3 ? ton_comida : mt_comida,
      'merienda': ton_media,
      'cena': ton_cena.length >= 3 ? ton_cena : mt_cena,
    }
  },
  {
    name: 'Plan Bienestar Digestivo — Semana Saludable',
    objective: 'Menú antiinflamatorio y de fácil digestión. Incluye sopas, cremas, verduras cocidas y alimentos probióticos para mejorar la salud intestinal.',
    goal: 'bienestar',
    difficulty: 'facil',
    dailyCalories: 1700,
    dailyMealsCount: 4,
    mealTimeConfig: {
      'desayuno': bw_desayuno.length >= 3 ? bw_desayuno : mt_desayuno,
      'comida': bw_comida.length >= 3 ? bw_comida : mt_comida,
      'merienda': bw_merienda,
      'cena': bw_cena.length >= 3 ? bw_cena : mt_cena,
    }
  },
  {
    name: 'Plan Pérdida de Grasa — 5 Comidas',
    objective: 'Menú avanzado con 5 tomas al día para mantener el metabolismo activo. Bajo en calorías pero alto en saciedad gracias a la fibra y las proteínas.',
    goal: 'perdida_grasa',
    difficulty: 'dificil',
    dailyCalories: 1350,
    dailyMealsCount: 5,
    mealTimeConfig: {
      'desayuno': pg_desayuno,
      'media_manana': pg_media,
      'comida': pg_comida.length >= 3 ? pg_comida : mt_comida,
      'merienda': pg_merienda,
      'cena': pg_cena.length >= 3 ? pg_cena : mt_cena,
    }
  },
  {
    name: 'Plan Mediterráneo — Dieta Tradicional',
    objective: 'Menú basado en la dieta mediterránea: aceite de oliva, pescado, legumbres, pasta integral y frutas de temporada. Avalado por la ciencia como una de las dietas más saludables del mundo.',
    goal: 'bienestar',
    difficulty: 'facil',
    dailyCalories: 1900,
    dailyMealsCount: 4,
    mealTimeConfig: {
      'desayuno': med_desayuno,
      'comida': med_comida.length >= 3 ? med_comida : mt_comida,
      'merienda': med_merienda,
      'cena': med_cena.length >= 3 ? med_cena : mt_cena,
    }
  },
  {
    name: 'Plan Bajo en Carbohidratos — Semana Keto-Friendly',
    objective: 'Menú reducido en carbohidratos con alto contenido en proteínas y grasas saludables. Ideal para mejorar la sensibilidad a la insulina y la composición corporal.',
    goal: 'perdida_grasa',
    difficulty: 'dificil',
    dailyCalories: 1600,
    dailyMealsCount: 4,
    mealTimeConfig: {
      'desayuno': lc_desayuno.length >= 3 ? lc_desayuno : mt_desayuno,
      'media_manana': lc_media,
      'comida': lc_comida.length >= 3 ? lc_comida : mt_comida,
      'cena': lc_cena.length >= 3 ? lc_cena : mt_cena,
    }
  },
];

let created = 0;
let errors = 0;

for (const menuDef of menus) {
  try {
    const menuId = await createSeededMenu(menuDef);
    console.log(`✅ Creado: "${menuDef.name}" (ID: ${menuId}, ${menuDef.goal}, ${menuDef.difficulty}, ${menuDef.dailyCalories}kcal)`);
    created++;
  } catch (e) {
    console.error(`❌ Error creando "${menuDef.name}":`, e.message);
    errors++;
  }
}

// Verificar resultado
const [total] = await conn.query('SELECT COUNT(*) as n FROM menu_organizers WHERE isSeeded = 1');
console.log(`\n=== RESULTADO ===`);
console.log(`Menús creados: ${created}`);
console.log(`Errores: ${errors}`);
console.log(`Total menús en biblioteca: ${total[0].n}`);

await conn.end();
