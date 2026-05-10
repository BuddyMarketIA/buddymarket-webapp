/**
 * Script para generar 50 menús predefinidos semanales por objetivo nutricional
 * y guardarlos en la base de datos usando raw SQL (sin imports de drizzle).
 */

import { createConnection } from "mysql2/promise";
import fs from "fs";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await createConnection(DB_URL);
console.log("Connected to database");

// ─── Step 1: Get available seeded recipes grouped by mealTime ────────────────
const [allRecipes] = await conn.execute(
  "SELECT id, name, mealTime, caloriesPerServing as calories FROM recipes WHERE isSeeded = 1 LIMIT 500"
);
console.log(`Found ${allRecipes.length} seeded recipes`);

const byMealTime = {
  desayuno: allRecipes.filter(r => r.mealTime === "desayuno"),
  media_manana: allRecipes.filter(r => r.mealTime === "media_manana"),
  comida: allRecipes.filter(r => r.mealTime === "comida"),
  merienda: allRecipes.filter(r => r.mealTime === "merienda"),
  cena: allRecipes.filter(r => r.mealTime === "cena"),
};

console.log("Recipes by meal time:", Object.fromEntries(
  Object.entries(byMealTime).map(([k, v]) => [k, v.length])
));

// ─── Step 2: Get dayParts ─────────────────────────────────────────────────────
const [dayParts] = await conn.execute("SELECT id, apiParam FROM day_parts");
console.log("Day parts:", dayParts.map(d => `${d.apiParam}(${d.id})`).join(", "));

const dayPartMap = {};
for (const dp of dayParts) {
  dayPartMap[dp.apiParam] = dp.id;
}

// ─── Step 3: Get system user ──────────────────────────────────────────────────
const [users] = await conn.execute("SELECT id FROM users LIMIT 1");
const SYSTEM_USER_ID = users[0]?.id ?? 1;
console.log(`Using user ID ${SYSTEM_USER_ID} for seeded menus`);

// ─── Step 4: Check if menus already seeded ───────────────────────────────────
const [existingCount] = await conn.execute(
  "SELECT COUNT(*) as count FROM menu_organizers WHERE isSeeded = 1"
);
if (existingCount[0].count >= 50) {
  console.log(`Already have ${existingCount[0].count} seeded menus, skipping...`);
  await conn.end();
  process.exit(0);
}

// ─── Step 5: Define 50 menu templates ────────────────────────────────────────
const MENU_TEMPLATES = [
  // PÉRDIDA DE PESO (10 menús)
  { name: "Plan Pérdida de Peso - Semana 1", goal: "perdida_peso", calories: 1400, description: "Menú hipocalórico para empezar a perder peso de forma saludable. Basado en proteínas magras y verduras.", difficulty: "facil" },
  { name: "Plan Pérdida de Peso - Semana 2", goal: "perdida_peso", calories: 1350, description: "Segunda semana del plan de pérdida de peso con mayor déficit calórico.", difficulty: "facil" },
  { name: "Plan Pérdida de Peso Acelerado", goal: "perdida_peso", calories: 1200, description: "Plan intensivo de pérdida de peso para resultados rápidos bajo supervisión.", difficulty: "medio" },
  { name: "Plan Pérdida de Peso Sostenible", goal: "perdida_peso", calories: 1500, description: "Pérdida de peso gradual y sostenible sin pasar hambre. Ideal para mantener a largo plazo.", difficulty: "facil" },
  { name: "Dieta Mediterránea Hipocalórica", goal: "perdida_peso", calories: 1450, description: "Pérdida de peso con los beneficios de la dieta mediterránea.", difficulty: "facil" },
  { name: "Plan Bajo en Carbohidratos", goal: "perdida_peso", calories: 1400, description: "Reducción de carbohidratos para activar la quema de grasa.", difficulty: "medio" },
  { name: "Plan Detox Semanal", goal: "perdida_peso", calories: 1300, description: "Semana de limpieza y reinicio metabólico con alimentos depurativos.", difficulty: "medio" },
  { name: "Plan Pérdida de Peso - Mujer Activa", goal: "perdida_peso", calories: 1500, description: "Diseñado para mujeres con actividad física moderada que quieren perder peso.", difficulty: "facil" },
  { name: "Plan Pérdida de Peso - Hombre Activo", goal: "perdida_peso", calories: 1700, description: "Para hombres con actividad física moderada en proceso de pérdida de peso.", difficulty: "facil" },
  { name: "Plan Pérdida de Peso Post-Vacaciones", goal: "perdida_peso", calories: 1400, description: "Recupera tu peso ideal tras las vacaciones con este plan reconectante.", difficulty: "facil" },

  // GANANCIA MUSCULAR (10 menús)
  { name: "Plan Volumen Limpio - Semana 1", goal: "ganancia_muscular", calories: 2800, description: "Superávit calórico controlado para ganar masa muscular sin exceso de grasa.", difficulty: "medio" },
  { name: "Plan Volumen Limpio - Semana 2", goal: "ganancia_muscular", calories: 2900, description: "Continuación del plan de volumen con progresión calórica.", difficulty: "medio" },
  { name: "Plan Ganancia Muscular Alta Proteína", goal: "ganancia_muscular", calories: 3000, description: "Alto contenido proteico para maximizar la síntesis muscular.", difficulty: "medio" },
  { name: "Plan Volumen para Principiantes", goal: "ganancia_muscular", calories: 2600, description: "Introducción a la nutrición para ganar músculo, ideal para principiantes.", difficulty: "facil" },
  { name: "Plan Volumen Avanzado", goal: "ganancia_muscular", calories: 3200, description: "Para atletas avanzados que buscan maximizar la ganancia de masa muscular.", difficulty: "dificil" },
  { name: "Plan Ganancia Muscular Vegano", goal: "ganancia_muscular", calories: 2800, description: "Gana músculo con fuentes proteicas 100% vegetales.", difficulty: "medio" },
  { name: "Plan Volumen Económico", goal: "ganancia_muscular", calories: 2700, description: "Gana músculo sin gastar mucho con alimentos accesibles y nutritivos.", difficulty: "facil" },
  { name: "Plan Ganancia Muscular Rápida", goal: "ganancia_muscular", calories: 3100, description: "Máximo superávit calórico para ganancia muscular acelerada.", difficulty: "dificil" },
  { name: "Plan Volumen Limpio - Mujer", goal: "ganancia_muscular", calories: 2200, description: "Adaptado para mujeres que quieren ganar músculo sin exceso de grasa.", difficulty: "medio" },
  { name: "Plan Post-Entreno Optimizado", goal: "ganancia_muscular", calories: 2900, description: "Nutrición periworkout optimizada para máxima recuperación y crecimiento.", difficulty: "medio" },

  // TONIFICACIÓN (8 menús)
  { name: "Plan Tonificación - Semana 1", goal: "tonificacion", calories: 1800, description: "Equilibrio entre déficit calórico moderado y alta proteína para tonificar.", difficulty: "facil" },
  { name: "Plan Tonificación - Semana 2", goal: "tonificacion", calories: 1750, description: "Segunda semana del plan de tonificación con ajuste calórico.", difficulty: "facil" },
  { name: "Plan Cuerpo Atlético", goal: "tonificacion", calories: 1900, description: "Nutrición para conseguir un cuerpo atlético y definido.", difficulty: "medio" },
  { name: "Plan Tonificación Mujer", goal: "tonificacion", calories: 1600, description: "Específico para mujeres que buscan tonificar sin ganar volumen.", difficulty: "facil" },
  { name: "Plan Tonificación Hombre", goal: "tonificacion", calories: 2000, description: "Para hombres que buscan definición muscular y tonificación.", difficulty: "medio" },
  { name: "Plan Recomposición Corporal", goal: "tonificacion", calories: 1850, description: "Perder grasa y ganar músculo simultáneamente con nutrición precisa.", difficulty: "dificil" },
  { name: "Plan Tonificación Verano", goal: "tonificacion", calories: 1700, description: "Prepárate para el verano con este plan de tonificación intensivo.", difficulty: "medio" },
  { name: "Plan Fitness Total", goal: "tonificacion", calories: 1950, description: "Combinación de cardio y fuerza con nutrición optimizada para resultados totales.", difficulty: "medio" },

  // PÉRDIDA DE GRASA (6 menús)
  { name: "Plan Quema Grasa - Semana 1", goal: "perdida_grasa", calories: 1500, description: "Déficit calórico estratégico para quemar grasa preservando músculo.", difficulty: "medio" },
  { name: "Plan Quema Grasa Avanzado", goal: "perdida_grasa", calories: 1400, description: "Para personas con experiencia en dieta que buscan resultados rápidos.", difficulty: "dificil" },
  { name: "Plan Definición Muscular", goal: "perdida_grasa", calories: 1600, description: "Mantén el músculo mientras eliminas la grasa corporal.", difficulty: "dificil" },
  { name: "Plan Cutting Profesional", goal: "perdida_grasa", calories: 1450, description: "Plan de cutting usado por atletas para competición.", difficulty: "dificil" },
  { name: "Plan Quema Grasa Abdominal", goal: "perdida_grasa", calories: 1500, description: "Enfocado en reducir la grasa abdominal con alimentos antiinflamatorios.", difficulty: "medio" },
  { name: "Plan Quema Grasa Sin Cardio", goal: "perdida_grasa", calories: 1400, description: "Pierde grasa solo con nutrición, sin necesidad de cardio intenso.", difficulty: "medio" },

  // MANTENIMIENTO (4 menús)
  { name: "Plan Mantenimiento Saludable", goal: "mantenimiento", calories: 2000, description: "Mantén tu peso actual con una alimentación equilibrada y saludable.", difficulty: "facil" },
  { name: "Plan Mantenimiento Activo", goal: "mantenimiento", calories: 2200, description: "Para personas activas que quieren mantener su composición corporal.", difficulty: "facil" },
  { name: "Plan Mantenimiento Mediterráneo", goal: "mantenimiento", calories: 2100, description: "Mantén tu peso con los principios de la dieta mediterránea.", difficulty: "facil" },
  { name: "Plan Equilibrio Nutricional", goal: "mantenimiento", calories: 2000, description: "Nutrición equilibrada para mantener la salud y el bienestar general.", difficulty: "facil" },

  // SALUD Y BIENESTAR (6 menús)
  { name: "Plan Antiinflamatorio", goal: "bienestar", calories: 1800, description: "Alimentos antiinflamatorios para reducir la inflamación crónica y mejorar la salud.", difficulty: "medio" },
  { name: "Plan Salud Cardiovascular", goal: "bienestar", calories: 1900, description: "Nutrición cardioprotectora con omega-3, fibra y antioxidantes.", difficulty: "facil" },
  { name: "Plan Energía y Vitalidad", goal: "bienestar", calories: 2000, description: "Maximiza tu energía diaria con alimentos de alta densidad nutricional.", difficulty: "facil" },
  { name: "Plan Digestivo Saludable", goal: "bienestar", calories: 1800, description: "Mejora tu digestión y microbiota intestinal con alimentos probióticos y fibra.", difficulty: "facil" },
  { name: "Plan Longevidad", goal: "bienestar", calories: 1900, description: "Basado en los principios de las zonas azules para una vida más larga y saludable.", difficulty: "medio" },
  { name: "Plan Inmunidad Reforzada", goal: "bienestar", calories: 1900, description: "Fortalece tu sistema inmune con vitaminas, minerales y antioxidantes.", difficulty: "facil" },

  // VEGANO/VEGETARIANO (6 menús)
  { name: "Plan Vegano Completo", goal: "vegano", calories: 1900, description: "Plan 100% vegano con todos los nutrientes esenciales cubiertos.", difficulty: "medio" },
  { name: "Plan Vegetariano Equilibrado", goal: "vegano", calories: 1900, description: "Vegetariano completo con proteínas de calidad y sin deficiencias.", difficulty: "facil" },
  { name: "Plan Vegano Deportista", goal: "vegano", calories: 2400, description: "Para deportistas veganos que necesitan alta proteína de fuentes vegetales.", difficulty: "dificil" },
  { name: "Plan Plant-Based Pérdida de Peso", goal: "vegano", calories: 1400, description: "Pierde peso con una alimentación 100% vegetal.", difficulty: "medio" },
  { name: "Plan Flexitariano", goal: "vegano", calories: 1800, description: "Principalmente vegetal con pequeñas cantidades de proteína animal.", difficulty: "facil" },
  { name: "Plan Vegano Ganancia Muscular", goal: "vegano", calories: 2800, description: "Gana músculo con proteínas vegetales de alta calidad.", difficulty: "dificil" },
];

// ─── Step 6: Helper to pick random recipes ───────────────────────────────────
function pickRecipe(mealTimeKey, usedIds = new Set()) {
  const pool = byMealTime[mealTimeKey] || [];
  if (pool.length === 0) return null;
  const available = pool.filter(r => !usedIds.has(r.id));
  const source = available.length > 0 ? available : pool;
  return source[Math.floor(Math.random() * source.length)];
}

const MEAL_SLOTS = [
  { mealTimeKey: "desayuno", label: "Desayuno" },
  { mealTimeKey: "media_manana", label: "Media Mañana" },
  { mealTimeKey: "comida", label: "Comida" },
  { mealTimeKey: "merienda", label: "Merienda" },
  { mealTimeKey: "cena", label: "Cena" },
];

// ─── Step 7: Insert menus ─────────────────────────────────────────────────────
let insertedMenus = 0;
const menuResults = [];

for (const template of MENU_TEMPLATES) {
  try {
    // Insert menu organizer
    const [menuResult] = await conn.execute(
      `INSERT INTO menu_organizers (userId, name, objective, goal, dailyCalories, difficulty, isSeeded, isPublic, persons, startDate, endDate, type, dailyMealsCount, generatedByAI, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, '2026-01-06', '2026-01-12', 'weekly', 5, 0, NOW(), NOW())`,
      [SYSTEM_USER_ID, template.name, template.description, template.goal, template.calories, template.difficulty]
    );

    const menuId = menuResult.insertId;
    let totalRecipes = 0;
    const usedIds = new Set();

    // For each day of the week
    for (let dayNum = 1; dayNum <= 7; dayNum++) {
      const dayDate = new Date("2026-01-06");
      dayDate.setDate(dayDate.getDate() + (dayNum - 1));
      const dateStr = dayDate.toISOString().split("T")[0];

      // For each meal slot
      for (let slotIdx = 0; slotIdx < MEAL_SLOTS.length; slotIdx++) {
        const slot = MEAL_SLOTS[slotIdx];
        const dayPartId = dayPartMap[slot.mealTimeKey];
        if (!dayPartId) continue;

        const recipe = pickRecipe(slot.mealTimeKey, usedIds);
        if (!recipe) continue;

        usedIds.add(recipe.id);

        // Insert day part
        const [dpResult] = await conn.execute(
          `INSERT INTO menu_organizer_day_parts (menuOrganizerId, dayPartId, date, dayNumber, mealNumber, name, completed, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
          [menuId, dayPartId, dateStr, dayNum, slotIdx + 1, `${slot.label} - Día ${dayNum}`]
        );

        const dayPartRecordId = dpResult.insertId;

        // Insert recipe for this day part
        await conn.execute(
          `INSERT INTO menu_dp_recipes (menuOrganizerDayPartId, recipeId, servings, createdAt)
           VALUES (?, ?, 1, NOW())`,
          [dayPartRecordId, recipe.id]
        );

        totalRecipes++;
      }
    }

    insertedMenus++;
    menuResults.push({ id: menuId, name: template.name, goal: template.goal, recipes: totalRecipes });
    console.log(`✓ [${insertedMenus}/${MENU_TEMPLATES.length}] ${template.name} (${totalRecipes} recetas)`);

  } catch (err) {
    console.error(`✗ Error inserting menu "${template.name}":`, err.message);
  }
}

fs.writeFileSync("/home/ubuntu/menu_results.json", JSON.stringify(menuResults, null, 2));
console.log(`\n✅ Done! Inserted ${insertedMenus}/50 menus`);

await conn.end();
