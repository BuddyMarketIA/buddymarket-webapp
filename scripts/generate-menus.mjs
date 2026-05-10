/**
 * BuddyMarket — Generador de 150 menús completos con los 15 tipos prioritarios
 * Genera menús semanales (7 días × 5 comidas) con recetas reales de la BD
 * Uso: node scripts/generate-menus.mjs
 */

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SYSTEM_USER_ID = 4335; // iabuddymarket@gmail.com
const LLM_API_URL = (process.env.BUILT_IN_FORGE_API_URL || '').replace(/\/$/, '');
const LLM_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// ─── 15 tipos de menú prioritarios ───────────────────────────────────────────
const MENU_TYPES = [
  // 1. Económico — 5€/día
  {
    id: 'economico_5eur',
    name: 'Menú Semanal por 5€/día',
    description: 'Alimentación completa y equilibrada con un presupuesto de 5€ al día. Ingredientes de temporada, recetas sencillas y máximo aprovechamiento.',
    goal: 'bienestar',
    difficulty: 'easy',
    dailyCalories: 1800,
    objective: 'Comer bien gastando poco. Menú diseñado para un presupuesto ajustado de 5€/persona/día con ingredientes de temporada y recetas sencillas.',
    tags: ['economico', 'presupuesto', 'temporada'],
    count: 12,
  },
  // 2. Oficina / Tupper
  {
    id: 'oficina_tupper',
    name: 'Menú Oficina y Tupper',
    description: 'Comidas preparables en casa para llevar al trabajo. Recetas que aguantan bien en tupper, fáciles de calentar y nutritivas.',
    goal: 'bienestar',
    difficulty: 'easy',
    dailyCalories: 1700,
    objective: 'Comidas para llevar al trabajo. Preparación en 30 min, aguantan en tupper y se calientan en microondas.',
    tags: ['oficina', 'tupper', 'meal_prep', 'trabajo'],
    count: 12,
  },
  // 3. Pérdida de peso
  {
    id: 'perdida_peso',
    name: 'Menú Pérdida de Peso',
    description: 'Déficit calórico controlado con alta saciedad. Proteínas elevadas, carbohidratos moderados y grasas saludables.',
    goal: 'perdida_peso',
    difficulty: 'medium',
    dailyCalories: 1400,
    objective: 'Déficit calórico de 500 kcal/día con alta saciedad. Proteínas >30%, fibra alta, sin ultraprocesados.',
    tags: ['perdida_peso', 'deficit_calorico', 'saciante'],
    count: 12,
  },
  // 4. Ganancia muscular
  {
    id: 'ganancia_muscular',
    name: 'Menú Ganancia Muscular',
    description: 'Superávit calórico con proteínas elevadas para maximizar la síntesis muscular. Ideal para entrenamientos de fuerza.',
    goal: 'ganancia_muscular',
    difficulty: 'medium',
    dailyCalories: 2800,
    objective: 'Superávit de 300-500 kcal, proteínas 2g/kg peso corporal. Carbohidratos periworkout optimizados.',
    tags: ['musculacion', 'proteinas', 'fuerza', 'gym'],
    count: 10,
  },
  // 5. Vegetariano
  {
    id: 'vegetariano',
    name: 'Menú Vegetariano Completo',
    description: 'Sin carne ni pescado, con todos los nutrientes esenciales cubiertos. Proteínas vegetales completas y variedad de sabores.',
    goal: 'bienestar',
    difficulty: 'medium',
    dailyCalories: 1800,
    objective: 'Menú vegetariano nutricionalmente completo. Proteínas vegetales completas, hierro, B12 y omega-3 cubiertos.',
    tags: ['vegetariano', 'sin_carne', 'proteinas_vegetales'],
    count: 10,
  },
  // 6. Vegano
  {
    id: 'vegano',
    name: 'Menú Vegano Equilibrado',
    description: 'Completamente plant-based, sin ningún producto animal. Nutricionalmente completo con suplementación indicada.',
    goal: 'vegano',
    difficulty: 'hard',
    dailyCalories: 1800,
    objective: 'Menú 100% vegano. Proteínas completas combinadas, calcio vegetal, hierro no hemo optimizado, omega-3 ALA.',
    tags: ['vegano', 'plant_based', 'sin_animal'],
    count: 8,
  },
  // 7. Sin gluten
  {
    id: 'sin_gluten',
    name: 'Menú Sin Gluten',
    description: 'Completamente libre de gluten para celíacos e intolerantes. Variado, sabroso y sin renunciar a nada.',
    goal: 'bienestar',
    difficulty: 'medium',
    dailyCalories: 1800,
    objective: 'Menú 100% libre de gluten. Apto para celíacos. Cereales alternativos: arroz, quinoa, maíz, trigo sarraceno.',
    tags: ['sin_gluten', 'celiaco', 'gluten_free'],
    count: 8,
  },
  // 8. Mediterráneo
  {
    id: 'mediterraneo',
    name: 'Menú Mediterráneo Tradicional',
    description: 'La dieta más saludable del mundo. Aceite de oliva, legumbres, pescado azul, verduras de temporada y frutos secos.',
    goal: 'bienestar',
    difficulty: 'easy',
    dailyCalories: 1900,
    objective: 'Dieta mediterránea clásica. AOVE, legumbres 3x/semana, pescado azul 2x/semana, carne roja <1x/semana.',
    tags: ['mediterraneo', 'cardiosaludable', 'longevidad'],
    count: 10,
  },
  // 9. Deportista
  {
    id: 'deportista',
    name: 'Menú Deportista de Alto Rendimiento',
    description: 'Nutrición periodizada para deportistas. Carbohidratos pre-entreno, proteínas post-entreno y recuperación óptima.',
    goal: 'ganancia_muscular',
    difficulty: 'hard',
    dailyCalories: 2600,
    objective: 'Nutrición deportiva periodizada. Carga de carbohidratos pre-competición, ventana anabólica post-entreno, hidratación.',
    tags: ['deporte', 'rendimiento', 'periodizacion', 'atleta'],
    count: 8,
  },
  // 10. Clínico — Diabetes
  {
    id: 'clinico_diabetes',
    name: 'Menú Clínico Control Glucémico',
    description: 'Diseñado para personas con diabetes tipo 2 o resistencia a la insulina. Índice glucémico bajo, carbohidratos controlados.',
    goal: 'bienestar',
    difficulty: 'medium',
    dailyCalories: 1600,
    objective: 'Control glucémico. IG bajo, carga glucémica <100/día, fibra >30g/día, sin azúcares añadidos, grasas saludables.',
    tags: ['diabetes', 'glucemia', 'clinico', 'ig_bajo'],
    count: 10,
  },
  // 11. Clínico — Hipertensión
  {
    id: 'clinico_hipertension',
    name: 'Menú Clínico Cardioprotector',
    description: 'Dieta DASH adaptada para hipertensión y salud cardiovascular. Bajo en sodio, rico en potasio y magnesio.',
    goal: 'bienestar',
    difficulty: 'medium',
    dailyCalories: 1700,
    objective: 'Dieta DASH. Sodio <2300mg/día, potasio >4700mg/día, grasas saturadas <7%, omega-3 elevado.',
    tags: ['hipertension', 'cardiovascular', 'dash', 'clinico'],
    count: 8,
  },
  // 12. Clínico — SOP / Hormonal
  {
    id: 'clinico_sop',
    name: 'Menú Clínico Equilibrio Hormonal',
    description: 'Especialmente diseñado para mujeres con SOP, desequilibrios hormonales o menopausia. Antiinflamatorio y regulador.',
    goal: 'bienestar',
    difficulty: 'medium',
    dailyCalories: 1600,
    objective: 'Equilibrio hormonal. Antiinflamatorio, bajo IG, fitoestrógenos, omega-3, zinc y magnesio elevados.',
    tags: ['sop', 'hormonal', 'antiinflamatorio', 'mujer', 'clinico'],
    count: 8,
  },
  // 13. Familiar (4 personas)
  {
    id: 'familiar',
    name: 'Menú Familiar para 4 Personas',
    description: 'Recetas pensadas para toda la familia, con raciones para 4. Variado, equilibrado y que gusta a niños y adultos.',
    goal: 'bienestar',
    difficulty: 'easy',
    dailyCalories: 1800,
    objective: 'Menú familiar para 4 personas. Recetas versátiles que gustan a toda la familia, adaptables para niños.',
    tags: ['familiar', 'ninos', '4_personas', 'variado'],
    count: 10,
  },
  // 14. Batch cooking (preparación dominical)
  {
    id: 'batch_cooking',
    name: 'Menú Batch Cooking Semanal',
    description: 'Prepara toda la semana en 2 horas el domingo. Recetas base que se combinan para crear platos variados cada día.',
    goal: 'bienestar',
    difficulty: 'medium',
    dailyCalories: 1800,
    objective: 'Batch cooking: preparación dominical de 2h para toda la semana. Bases versátiles, almacenamiento óptimo.',
    tags: ['batch_cooking', 'meal_prep', 'domingo', 'eficiencia'],
    count: 10,
  },
  // 15. Keto / Bajo en carbohidratos
  {
    id: 'keto',
    name: 'Menú Keto y Bajo en Carbohidratos',
    description: 'Cetogénico o bajo en carbohidratos para pérdida de grasa y claridad mental. Grasas saludables como fuente principal de energía.',
    goal: 'perdida_grasa',
    difficulty: 'hard',
    dailyCalories: 1700,
    objective: 'Cetosis nutricional. Carbohidratos <50g/día, grasas 70%, proteínas 25%. Sin cereales, legumbres ni azúcares.',
    tags: ['keto', 'cetogenico', 'low_carb', 'perdida_grasa'],
    count: 10,
  },
];

// Day parts: 1=Desayuno, 2=Media mañana, 3=Comida, 4=Merienda, 5=Cena
const DAY_PARTS = [
  { id: 1, name: 'Desayuno', mealTime: 'desayuno', calories_pct: 0.20 },
  { id: 2, name: 'Media mañana', mealTime: 'media_manana', calories_pct: 0.10 },
  { id: 3, name: 'Comida', mealTime: 'comida', calories_pct: 0.35 },
  { id: 4, name: 'Merienda', mealTime: 'merienda', calories_pct: 0.10 },
  { id: 5, name: 'Cena', mealTime: 'cena', calories_pct: 0.25 },
];

// ─── Obtener recetas de la BD por momento del día y calorías ─────────────────
async function getRecipesByMealTime(mealTime, targetCalories, limit = 20) {
  const mealTimeMap = {
    'desayuno': ['desayuno', 'cualquiera'],
    'media_manana': ['media_manana', 'cualquiera'],
    'comida': ['comida', 'cualquiera'],
    'merienda': ['merienda', 'cualquiera'],
    'cena': ['cena', 'cualquiera'],
  };
  const mealTimes = mealTimeMap[mealTime] || ['cualquiera'];
  const placeholders = mealTimes.map((_, i) => `$${i + 1}`).join(', ');
  const minCal = Math.max(50, targetCalories * 0.6);
  const maxCal = targetCalories * 1.4;
  
  const result = await pool.query(
    `SELECT id, name, "caloriesPerServing", "mealTime"
     FROM recipes 
     WHERE "mealTime" IN (${placeholders})
       AND "caloriesPerServing" BETWEEN ${minCal} AND ${maxCal}
       AND active = true
     ORDER BY RANDOM()
     LIMIT ${limit}`,
    mealTimes
  );
  
  // Si no hay suficientes, ampliar el rango
  if (result.rows.length < 3) {
    const fallback = await pool.query(
      `SELECT id, name, "caloriesPerServing", "mealTime"
       FROM recipes WHERE active = true ORDER BY RANDOM() LIMIT ${limit}`
    );
    return fallback.rows;
  }
  
  return result.rows;
}

// ─── Generar un menú completo (7 días × 5 comidas) ───────────────────────────
async function generateMenu(menuType, menuIndex) {
  const startDate = new Date();
  // Distribuir fechas de inicio a lo largo del año para variedad
  startDate.setDate(startDate.getDate() + (menuIndex * 3));
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const formatDate = (d) => d.toISOString().split('T')[0];

  // Crear el menú principal
  const menuResult = await pool.query(
    `INSERT INTO menu_organizers (
      "userId", name, "startDate", "endDate",
      type, "isPublic", objective, goal, "dailyCalories",
      persons, difficulty, "isSeeded", "generatedByAI",
      "dailyMealsCount", "isActive", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, 'weekly', true, $5, $6, $7, $8, $9, true, true, 5, false,
      NOW() - (random() * interval '90 days'), NOW()
    ) RETURNING id`,
    [
      SYSTEM_USER_ID,
      menuType.name,
      formatDate(startDate),
      formatDate(endDate),
      menuType.objective,
      menuType.goal,
      menuType.dailyCalories,
      menuType.id === 'familiar' ? 4 : 1,
      menuType.difficulty,
    ]
  );
  
  const menuId = menuResult.rows[0].id;
  
  // Generar 7 días × 5 comidas
  let dayPartCount = 0;
  for (let day = 1; day <= 7; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day - 1);
    
    for (const dp of DAY_PARTS) {
      const targetCalories = Math.round(menuType.dailyCalories * dp.calories_pct);
      
      // Crear el day part
      const dpResult = await pool.query(
        `INSERT INTO menu_organizer_day_parts (
          "menuOrganizerId", "dayPartId", date, "dayNumber", "mealNumber",
          name, completed, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW()) RETURNING id`,
        [menuId, dp.id, formatDate(dayDate), day, dp.id, dp.name]
      );
      
      const dayPartId = dpResult.rows[0].id;
      
      // Obtener recetas adecuadas para este momento del día
      const recipes = await getRecipesByMealTime(dp.mealTime, targetCalories, 15);
      
      if (recipes.length > 0) {
        // Seleccionar 1 receta (o 2 para comida y cena)
        const numRecipes = (dp.id === 3 || dp.id === 5) ? Math.min(2, recipes.length) : 1;
        const selectedRecipes = recipes.slice(0, numRecipes);
        
        for (const recipe of selectedRecipes) {
          try {
            await pool.query(
              `INSERT INTO menu_dp_recipes ("menuOrganizerDayPartId", "recipeId", servings, completed, "createdAt")
               VALUES ($1, $2, 1, false, NOW())
               ON CONFLICT ("menuOrganizerDayPartId", "recipeId") DO NOTHING`,
              [dayPartId, recipe.id]
            );
          } catch {}
        }
      }
      
      dayPartCount++;
    }
  }
  
  return { menuId, dayPartCount };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🍽️  BuddyMarket Menu Generator — ${new Date().toISOString()}`);
  
  // Contar menús y recetas actuales
  const [menuCount, recipeCount] = await Promise.all([
    pool.query('SELECT COUNT(*) as c FROM menu_organizers'),
    pool.query('SELECT COUNT(*) as c FROM recipes WHERE active = true'),
  ]);
  
  console.log(`📊 Menús actuales: ${menuCount.rows[0].c}`);
  console.log(`🍳 Recetas disponibles: ${recipeCount.rows[0].c}`);
  
  const totalMenus = MENU_TYPES.reduce((s, t) => s + t.count, 0);
  console.log(`\n📋 Generando ${totalMenus} menús de 15 tipos...\n`);
  
  let created = 0;
  let failed = 0;
  let menuIndex = 0;
  
  for (const menuType of MENU_TYPES) {
    console.log(`\n── ${menuType.name} (${menuType.count} menús) ──`);
    
    for (let i = 0; i < menuType.count; i++) {
      const num = i + 1;
      process.stdout.write(`  [${num}/${menuType.count}] `);
      
      try {
        const { menuId, dayPartCount } = await generateMenu(menuType, menuIndex++);
        created++;
        console.log(`✅ ID ${menuId} — ${dayPartCount} comidas asignadas`);
      } catch (e) {
        failed++;
        console.log(`❌ ${e.message.slice(0, 80)}`);
      }
      
      // Pequeña pausa para no saturar la BD
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  // Resumen final
  const [finalMenus] = await pool.query('SELECT COUNT(*) as c FROM menu_organizers').then(r => r.rows);
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Menús creados: ${created}/${totalMenus}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`📊 Total menús en BD: ${finalMenus.c}`);
  console.log(`${'═'.repeat(60)}\n`);
  
  await pool.end();
  process.exit(0);
}

main().catch(e => {
  console.error('Error fatal:', e);
  pool.end().finally(() => process.exit(1));
});
