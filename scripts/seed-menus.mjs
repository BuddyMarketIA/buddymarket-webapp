/**
 * Script para poblar la biblioteca de menús con menús de ejemplo (isSeeded=true)
 * Ejecutar con: node scripts/seed-menus.mjs
 */
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not found"); process.exit(1); }

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Menús de ejemplo con sus recetas
const MENUS = [
  {
    name: "Menú Pérdida de Peso - 7 días",
    objective: "Déficit calórico moderado para perder peso de forma sostenible sin pasar hambre",
    goal: "perdida_peso",
    dailyCalories: 1600,
    difficulty: "easy",
    dailyMealsCount: 5,
    persons: 1,
    type: "weekly",
  },
  {
    name: "Menú Ganancia Muscular - 7 días",
    objective: "Superávit calórico con alto contenido proteico para maximizar la ganancia de masa muscular",
    goal: "ganancia_muscular",
    dailyCalories: 2800,
    difficulty: "medium",
    dailyMealsCount: 5,
    persons: 1,
    type: "weekly",
  },
  {
    name: "Menú Mediterráneo Equilibrado",
    objective: "Dieta mediterránea tradicional, rica en vegetales, legumbres, pescado y aceite de oliva",
    goal: "bienestar",
    dailyCalories: 2000,
    difficulty: "easy",
    dailyMealsCount: 4,
    persons: 2,
    type: "weekly",
  },
  {
    name: "Menú Vegano Completo",
    objective: "Plan vegano 100% de origen vegetal, nutricionalmente completo con todas las proteínas y micronutrientes",
    goal: "vegano",
    dailyCalories: 1900,
    difficulty: "medium",
    dailyMealsCount: 4,
    persons: 1,
    type: "weekly",
  },
  {
    name: "Menú Definición Muscular",
    objective: "Reducir grasa corporal manteniendo la masa muscular con alto contenido proteico y bajo en carbohidratos",
    goal: "tonificacion",
    dailyCalories: 1800,
    difficulty: "hard",
    dailyMealsCount: 5,
    persons: 1,
    type: "weekly",
  },
  {
    name: "Menú Mantenimiento Saludable",
    objective: "Mantener el peso actual con una alimentación variada, equilibrada y fácil de seguir",
    goal: "mantenimiento",
    dailyCalories: 2200,
    difficulty: "easy",
    dailyMealsCount: 3,
    persons: 2,
    type: "weekly",
  },
  {
    name: "Menú Pérdida de Grasa Avanzado",
    objective: "Plan avanzado de pérdida de grasa con ciclado de carbohidratos y ayuno intermitente 16/8",
    goal: "perdida_grasa",
    dailyCalories: 1500,
    difficulty: "hard",
    dailyMealsCount: 3,
    persons: 1,
    type: "weekly",
  },
  {
    name: "Menú Familiar Equilibrado",
    objective: "Menú semanal completo para toda la familia, variado, nutritivo y fácil de preparar",
    goal: "bienestar",
    dailyCalories: 2100,
    difficulty: "easy",
    dailyMealsCount: 4,
    persons: 4,
    type: "weekly",
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Connected to DB. Seeding menus...");

    // Get day parts IDs
    const dpResult = await client.query('SELECT id, "apiParam" FROM day_parts ORDER BY "order"');
    const dayParts = dpResult.rows;
    console.log(`Found ${dayParts.length} day parts:`, dayParts.map(d => d.apiParam));

    if (dayParts.length === 0) {
      console.error("No day parts found. Run seed-catalogs.mjs first.");
      process.exit(1);
    }

    // Use a system user id = 1 (admin) for seeded menus
    const SYSTEM_USER_ID = 1;
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let insertedCount = 0;

    for (const menu of MENUS) {
      // Check if menu already exists
      const existing = await client.query(
        'SELECT id FROM menu_organizers WHERE name = $1 AND "isSeeded" = true',
        [menu.name]
      );
      if (existing.rows.length > 0) {
        console.log(`  Skipping "${menu.name}" (already exists)`);
        continue;
      }

      // Insert menu
      const menuResult = await client.query(
        `INSERT INTO menu_organizers 
          ("userId", name, "startDate", "endDate", type, "isPublic", objective, goal, 
           "dailyCalories", persons, difficulty, "isSeeded", "dailyMealsCount", 
           "generatedByAI", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
         RETURNING id`,
        [
          SYSTEM_USER_ID, menu.name, startDate, endDate, menu.type,
          true, menu.objective, menu.goal, menu.dailyCalories, menu.persons,
          menu.difficulty, true, menu.dailyMealsCount, false, false,
        ]
      );
      const menuId = menuResult.rows[0].id;

      // Determine which day parts to use based on dailyMealsCount
      let selectedDayParts;
      if (menu.dailyMealsCount >= 5) {
        selectedDayParts = dayParts; // all 5
      } else if (menu.dailyMealsCount === 4) {
        selectedDayParts = dayParts.filter(d => d.apiParam !== 'mid_morning'); // skip mid_morning
      } else {
        selectedDayParts = dayParts.filter(d => ['breakfast', 'lunch', 'dinner'].includes(d.apiParam));
      }

      // Insert day parts for 7 days
      for (let day = 1; day <= 7; day++) {
        for (let mealIdx = 0; mealIdx < selectedDayParts.length; mealIdx++) {
          const dp = selectedDayParts[mealIdx];
          const dayDate = new Date(today.getTime() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          await client.query(
            `INSERT INTO menu_organizer_day_parts 
              ("menuOrganizerId", "dayPartId", date, "dayNumber", "mealNumber", name, completed, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())`,
            [menuId, dp.id, dayDate, day, mealIdx + 1, dp.apiParam]
          );
        }
      }

      insertedCount++;
      console.log(`  ✓ Created menu "${menu.name}" (id: ${menuId}) with ${selectedDayParts.length * 7} day-part slots`);
    }

    console.log(`\n✅ Seeded ${insertedCount} menus successfully!`);

    // Verify
    const count = await client.query('SELECT COUNT(*) as total FROM menu_organizers WHERE "isSeeded" = true');
    console.log(`Total seeded menus in DB: ${count.rows[0].total}`);

  } catch (err) {
    console.error("Error seeding menus:", err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
