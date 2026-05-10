/**
 * Script para poblar los catálogos de alergias, restricciones dietéticas, etc.
 * Ejecutar con: node scripts/seed-catalogs.mjs
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { readFileSync } from "fs";

// Use environment variable directly
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Connected to DB. Seeding catalogs...");

    // Allergies
    const allergyData = [
      { api_param: "gluten", name_es: "Gluten (trigo, cebada, centeno)", name_en: "Gluten" },
      { api_param: "lactose", name_es: "Lactosa / Lácteos", name_en: "Lactose / Dairy" },
      { api_param: "nuts", name_es: "Frutos secos (almendras, nueces, avellanas...)", name_en: "Tree Nuts" },
      { api_param: "eggs", name_es: "Huevos", name_en: "Eggs" },
      { api_param: "fish", name_es: "Pescado", name_en: "Fish" },
      { api_param: "shellfish", name_es: "Crustáceos (gambas, cangrejos, langosta)", name_en: "Crustaceans" },
      { api_param: "soy", name_es: "Soja", name_en: "Soy" },
      { api_param: "peanuts", name_es: "Cacahuetes", name_en: "Peanuts" },
      { api_param: "sesame", name_es: "Sésamo", name_en: "Sesame" },
      { api_param: "mustard", name_es: "Mostaza", name_en: "Mustard" },
      { api_param: "celery", name_es: "Apio", name_en: "Celery" },
      { api_param: "sulfites", name_es: "Sulfitos / Dióxido de azufre", name_en: "Sulfites" },
      { api_param: "lupin", name_es: "Altramuces", name_en: "Lupin" },
      { api_param: "molluscs", name_es: "Moluscos (mejillones, almejas, pulpo)", name_en: "Molluscs" },
      { api_param: "wheat", name_es: "Trigo (intolerancia específica)", name_en: "Wheat" },
      { api_param: "corn", name_es: "Maíz", name_en: "Corn" },
      { api_param: "fructose", name_es: "Fructosa", name_en: "Fructose" },
      { api_param: "histamine", name_es: "Histamina", name_en: "Histamine" },
      { api_param: "fodmap", name_es: "FODMAP (fermentables)", name_en: "FODMAPs" },
      { api_param: "nightshades", name_es: "Solanáceas (tomate, pimiento, berenjena)", name_en: "Nightshades" },
      { api_param: "citrus", name_es: "Cítricos (naranja, limón, pomelo)", name_en: "Citrus" },
      { api_param: "strawberries", name_es: "Fresas / Frutos rojos", name_en: "Strawberries / Berries" },
      { api_param: "kiwi", name_es: "Kiwi", name_en: "Kiwi" },
      { api_param: "peach", name_es: "Melocotón / Frutas con hueso", name_en: "Peach / Stone fruits" },
      { api_param: "banana", name_es: "Plátano", name_en: "Banana" },
      { api_param: "avocado", name_es: "Aguacate", name_en: "Avocado" },
      { api_param: "garlic_onion", name_es: "Ajo y cebolla", name_en: "Garlic & Onion" },
      { api_param: "alcohol", name_es: "Alcohol", name_en: "Alcohol" },
      { api_param: "caffeine", name_es: "Cafeína", name_en: "Caffeine" },
      { api_param: "chocolate", name_es: "Chocolate / Cacao", name_en: "Chocolate / Cacao" },
      { api_param: "artificial_colors", name_es: "Colorantes artificiales", name_en: "Artificial colors" },
      { api_param: "artificial_sweeteners", name_es: "Edulcorantes artificiales", name_en: "Artificial sweeteners" },
      { api_param: "msg", name_es: "Glutamato monosódico (MSG)", name_en: "MSG" },
      { api_param: "latex_fruit", name_es: "Síndrome látex-fruta (aguacate, kiwi, plátano)", name_en: "Latex-fruit syndrome" },
    ];

    for (const a of allergyData) {
      await client.query(
        `INSERT INTO allergies ("apiParam", "nameEs", "nameEn") VALUES ($1, $2, $3) ON CONFLICT ("apiParam") DO NOTHING`,
        [a.api_param, a.name_es, a.name_en]
      );
    }
    console.log(`✓ Inserted ${allergyData.length} allergies`);

    // Diet restrictions
    const restrictionData = [
      { api_param: "vegan", name_es: "Vegano", name_en: "Vegan" },
      { api_param: "vegetarian", name_es: "Vegetariano", name_en: "Vegetarian" },
      { api_param: "pescatarian", name_es: "Pescetariano", name_en: "Pescatarian" },
      { api_param: "flexitarian", name_es: "Flexitariano", name_en: "Flexitarian" },
      { api_param: "keto", name_es: "Keto / Cetogénico", name_en: "Keto" },
      { api_param: "paleo", name_es: "Paleo", name_en: "Paleo" },
      { api_param: "gluten_free", name_es: "Sin gluten (celiacía)", name_en: "Gluten free" },
      { api_param: "dairy_free", name_es: "Sin lácteos", name_en: "Dairy free" },
      { api_param: "low_carb", name_es: "Bajo en carbohidratos", name_en: "Low carb" },
      { api_param: "low_fat", name_es: "Bajo en grasas", name_en: "Low fat" },
      { api_param: "low_sodium", name_es: "Bajo en sodio (hipertensión)", name_en: "Low sodium" },
      { api_param: "low_sugar", name_es: "Bajo en azúcar (diabetes)", name_en: "Low sugar" },
      { api_param: "high_protein", name_es: "Alto en proteína", name_en: "High protein" },
      { api_param: "high_fiber", name_es: "Alto en fibra", name_en: "High fiber" },
      { api_param: "mediterranean", name_es: "Mediterránea", name_en: "Mediterranean" },
      { api_param: "dash", name_es: "Dieta DASH (hipertensión)", name_en: "DASH diet" },
      { api_param: "diabetic", name_es: "Dieta para diabéticos", name_en: "Diabetic diet" },
      { api_param: "renal", name_es: "Dieta renal (enfermedad renal)", name_en: "Renal diet" },
      { api_param: "fodmap_free", name_es: "Sin FODMAP (colon irritable)", name_en: "Low FODMAP" },
      { api_param: "anti_inflammatory", name_es: "Antiinflamatoria", name_en: "Anti-inflammatory" },
      { api_param: "halal", name_es: "Halal", name_en: "Halal" },
      { api_param: "kosher", name_es: "Kosher", name_en: "Kosher" },
      { api_param: "raw_food", name_es: "Crudivegana / Raw food", name_en: "Raw food" },
      { api_param: "intermittent_fasting", name_es: "Ayuno intermitente", name_en: "Intermittent fasting" },
    ];

    for (const r of restrictionData) {
      await client.query(
        `INSERT INTO diet_restrictions ("apiParam", "nameEs", "nameEn") VALUES ($1, $2, $3) ON CONFLICT ("apiParam") DO NOTHING`,
        [r.api_param, r.name_es, r.name_en]
      );
    }
    console.log(`✓ Inserted ${restrictionData.length} diet restrictions`);

    // Food categories
    const categoryData = [
      { api_param: "mediterranean", name_es: "Mediterránea", name_en: "Mediterranean" },
      { api_param: "italian", name_es: "Italiana", name_en: "Italian" },
      { api_param: "mexican", name_es: "Mexicana", name_en: "Mexican" },
      { api_param: "asian", name_es: "Asiática", name_en: "Asian" },
      { api_param: "american", name_es: "Americana", name_en: "American" },
      { api_param: "spanish", name_es: "Española", name_en: "Spanish" },
      { api_param: "french", name_es: "Francesa", name_en: "French" },
      { api_param: "indian", name_es: "India", name_en: "Indian" },
      { api_param: "japanese", name_es: "Japonesa", name_en: "Japanese" },
      { api_param: "healthy", name_es: "Saludable", name_en: "Healthy" },
      { api_param: "fast_food", name_es: "Comida rápida", name_en: "Fast food" },
      { api_param: "desserts", name_es: "Postres", name_en: "Desserts" },
      { api_param: "breakfast", name_es: "Desayunos", name_en: "Breakfast" },
      { api_param: "salads", name_es: "Ensaladas", name_en: "Salads" },
      { api_param: "soups", name_es: "Sopas", name_en: "Soups" },
      { api_param: "grilled", name_es: "A la parrilla", name_en: "Grilled" },
      { api_param: "baked", name_es: "Al horno", name_en: "Baked" },
      { api_param: "smoothies", name_es: "Batidos", name_en: "Smoothies" },
    ];
    for (const c of categoryData) {
      await client.query(
        `INSERT INTO food_categories ("apiParam", "nameEs", "nameEn") VALUES ($1, $2, $3) ON CONFLICT ("apiParam") DO NOTHING`,
        [c.api_param, c.name_es, c.name_en]
      );
    }
    console.log(`✓ Inserted ${categoryData.length} food categories`);

    // Measures
    const measureData = [
      { api_param: "grams", name_es: "Gramos", name_en: "Grams", abbr: "g" },
      { api_param: "kilograms", name_es: "Kilogramos", name_en: "Kilograms", abbr: "kg" },
      { api_param: "milliliters", name_es: "Mililitros", name_en: "Milliliters", abbr: "ml" },
      { api_param: "liters", name_es: "Litros", name_en: "Liters", abbr: "l" },
      { api_param: "cups", name_es: "Tazas", name_en: "Cups", abbr: "taza" },
      { api_param: "tablespoons", name_es: "Cucharadas", name_en: "Tablespoons", abbr: "cda" },
      { api_param: "teaspoons", name_es: "Cucharaditas", name_en: "Teaspoons", abbr: "cdta" },
      { api_param: "units", name_es: "Unidades", name_en: "Units", abbr: "ud" },
      { api_param: "slices", name_es: "Rebanadas", name_en: "Slices", abbr: "reb" },
      { api_param: "pinch", name_es: "Pizca", name_en: "Pinch", abbr: "pizca" },
      { api_param: "bunch", name_es: "Manojo", name_en: "Bunch", abbr: "man" },
      { api_param: "cloves", name_es: "Dientes", name_en: "Cloves", abbr: "dientes" },
    ];
    for (const m of measureData) {
      await client.query(
        `INSERT INTO measures ("apiParam", "nameEs", "nameEn", abbreviation) VALUES ($1, $2, $3, $4) ON CONFLICT ("apiParam") DO NOTHING`,
        [m.api_param, m.name_es, m.name_en, m.abbr]
      );
    }
    console.log(`✓ Inserted ${measureData.length} measures`);

    // Day parts
    const dayPartData = [
      { api_param: "breakfast", name_es: "Desayuno", name_en: "Breakfast", order: 1 },
      { api_param: "mid_morning", name_es: "Media mañana", name_en: "Mid morning", order: 2 },
      { api_param: "lunch", name_es: "Comida", name_en: "Lunch", order: 3 },
      { api_param: "afternoon_snack", name_es: "Merienda", name_en: "Afternoon snack", order: 4 },
      { api_param: "dinner", name_es: "Cena", name_en: "Dinner", order: 5 },
    ];
    for (const d of dayPartData) {
      await client.query(
        `INSERT INTO day_parts ("apiParam", "nameEs", "nameEn", "order") VALUES ($1, $2, $3, $4) ON CONFLICT ("apiParam") DO NOTHING`,
        [d.api_param, d.name_es, d.name_en, d.order]
      );
    }
    console.log(`✓ Inserted ${dayPartData.length} day parts`);

    // Storage locations
    const storageData = [
      { api_param: "fridge", name_es: "Nevera", name_en: "Fridge" },
      { api_param: "freezer", name_es: "Congelador", name_en: "Freezer" },
      { api_param: "pantry", name_es: "Despensa", name_en: "Pantry" },
      { api_param: "counter", name_es: "Encimera", name_en: "Counter" },
      { api_param: "cellar", name_es: "Bodega", name_en: "Cellar" },
    ];
    for (const s of storageData) {
      await client.query(
        `INSERT INTO storage_locations ("apiParam", "nameEs", "nameEn") VALUES ($1, $2, $3) ON CONFLICT ("apiParam") DO NOTHING`,
        [s.api_param, s.name_es, s.name_en]
      );
    }
    console.log(`✓ Inserted ${storageData.length} storage locations`);

    console.log("✅ Seed completed successfully!");
  } catch (err) {
    console.error("Error seeding:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
