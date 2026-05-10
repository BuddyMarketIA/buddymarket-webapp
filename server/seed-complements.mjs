/**
 * Seed script for complements (small daily foods/drinks)
 * Run: node server/seed-complements.mjs
 */
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set");

const complements = [
  // ── BEBIDAS CALIENTES ──────────────────────────────────────────────────────
  { name: "Café solo", nameEs: "Café solo", category: "bebida_caliente", emoji: "☕", servingSize: 30, servingUnit: "ml", servingLabel: "1 taza (30ml)", calories: 2, proteins: 0.3, carbs: 0, fats: 0, fiber: 0, caffeine: 63 },
  { name: "Café con leche", nameEs: "Café con leche", category: "bebida_caliente", emoji: "☕", servingSize: 200, servingUnit: "ml", servingLabel: "1 taza (200ml)", calories: 60, proteins: 3.5, carbs: 5, fats: 2, fiber: 0, caffeine: 63 },
  { name: "Café cortado", nameEs: "Café cortado", category: "bebida_caliente", emoji: "☕", servingSize: 60, servingUnit: "ml", servingLabel: "1 cortado (60ml)", calories: 15, proteins: 1, carbs: 1.5, fats: 0.5, fiber: 0, caffeine: 63 },
  { name: "Café americano", nameEs: "Café americano", category: "bebida_caliente", emoji: "☕", servingSize: 240, servingUnit: "ml", servingLabel: "1 vaso (240ml)", calories: 5, proteins: 0.3, carbs: 0, fats: 0, fiber: 0, caffeine: 95 },
  { name: "Cappuccino", nameEs: "Cappuccino", category: "bebida_caliente", emoji: "☕", servingSize: 180, servingUnit: "ml", servingLabel: "1 taza (180ml)", calories: 80, proteins: 4, carbs: 8, fats: 3, fiber: 0, caffeine: 63 },
  { name: "Té verde", nameEs: "Té verde", category: "bebida_caliente", emoji: "🍵", servingSize: 240, servingUnit: "ml", servingLabel: "1 taza (240ml)", calories: 2, proteins: 0, carbs: 0, fats: 0, fiber: 0, caffeine: 28 },
  { name: "Té negro", nameEs: "Té negro", category: "bebida_caliente", emoji: "🍵", servingSize: 240, servingUnit: "ml", servingLabel: "1 taza (240ml)", calories: 2, proteins: 0, carbs: 0, fats: 0, fiber: 0, caffeine: 47 },
  { name: "Té rojo (Pu-erh)", nameEs: "Té rojo", category: "bebida_caliente", emoji: "🍵", servingSize: 240, servingUnit: "ml", servingLabel: "1 taza (240ml)", calories: 2, proteins: 0, carbs: 0, fats: 0, fiber: 0, caffeine: 30 },
  { name: "Manzanilla", nameEs: "Manzanilla", category: "bebida_caliente", emoji: "🌼", servingSize: 240, servingUnit: "ml", servingLabel: "1 taza (240ml)", calories: 2, proteins: 0, carbs: 0.5, fats: 0, fiber: 0, caffeine: 0 },
  { name: "Menta poleo", nameEs: "Menta poleo", category: "bebida_caliente", emoji: "🌿", servingSize: 240, servingUnit: "ml", servingLabel: "1 taza (240ml)", calories: 2, proteins: 0, carbs: 0.5, fats: 0, fiber: 0, caffeine: 0 },
  { name: "Infusión de jengibre", nameEs: "Jengibre", category: "bebida_caliente", emoji: "🫚", servingSize: 240, servingUnit: "ml", servingLabel: "1 taza (240ml)", calories: 5, proteins: 0, carbs: 1, fats: 0, fiber: 0, caffeine: 0 },
  { name: "Infusión de canela", nameEs: "Canela", category: "bebida_caliente", emoji: "🌿", servingSize: 240, servingUnit: "ml", servingLabel: "1 taza (240ml)", calories: 3, proteins: 0, carbs: 0.5, fats: 0, fiber: 0, caffeine: 0 },
  { name: "Caldo de pollo", nameEs: "Caldo de pollo", category: "bebida_caliente", emoji: "🍲", servingSize: 240, servingUnit: "ml", servingLabel: "1 taza (240ml)", calories: 15, proteins: 2, carbs: 1, fats: 0.5, fiber: 0, caffeine: 0 },
  { name: "Caldo de verduras", nameEs: "Caldo de verduras", category: "bebida_caliente", emoji: "🍲", servingSize: 240, servingUnit: "ml", servingLabel: "1 taza (240ml)", calories: 12, proteins: 0.5, carbs: 2, fats: 0, fiber: 0, caffeine: 0 },

  // ── BEBIDAS FRÍAS ──────────────────────────────────────────────────────────
  { name: "Batido de proteínas chocolate", nameEs: "Batido proteínas chocolate", category: "bebida_fria", emoji: "🥤", servingSize: 300, servingUnit: "ml", servingLabel: "1 batido (300ml)", calories: 150, proteins: 25, carbs: 8, fats: 3, fiber: 1, caffeine: 0 },
  { name: "Batido de proteínas vainilla", nameEs: "Batido proteínas vainilla", category: "bebida_fria", emoji: "🥤", servingSize: 300, servingUnit: "ml", servingLabel: "1 batido (300ml)", calories: 140, proteins: 24, carbs: 7, fats: 2.5, fiber: 1, caffeine: 0 },
  { name: "Batido de proteínas fresa", nameEs: "Batido proteínas fresa", category: "bebida_fria", emoji: "🥤", servingSize: 300, servingUnit: "ml", servingLabel: "1 batido (300ml)", calories: 145, proteins: 24, carbs: 9, fats: 2, fiber: 1, caffeine: 0 },
  { name: "Zumo de naranja natural", nameEs: "Zumo de naranja", category: "bebida_fria", emoji: "🍊", servingSize: 200, servingUnit: "ml", servingLabel: "1 vaso (200ml)", calories: 88, proteins: 1.3, carbs: 20, fats: 0.2, fiber: 0.5, caffeine: 0 },
  { name: "Agua con limón", nameEs: "Agua con limón", category: "bebida_fria", emoji: "🍋", servingSize: 300, servingUnit: "ml", servingLabel: "1 vaso (300ml)", calories: 5, proteins: 0, carbs: 1.5, fats: 0, fiber: 0, caffeine: 0 },
  { name: "Leche de avena", nameEs: "Leche de avena", category: "bebida_fria", emoji: "🥛", servingSize: 200, servingUnit: "ml", servingLabel: "1 vaso (200ml)", calories: 90, proteins: 2, carbs: 16, fats: 2, fiber: 1, caffeine: 0 },
  { name: "Leche de almendras", nameEs: "Leche de almendras", category: "bebida_fria", emoji: "🥛", servingSize: 200, servingUnit: "ml", servingLabel: "1 vaso (200ml)", calories: 30, proteins: 1, carbs: 3, fats: 2, fiber: 0.5, caffeine: 0 },
  { name: "Leche entera", nameEs: "Leche entera", category: "bebida_fria", emoji: "🥛", servingSize: 200, servingUnit: "ml", servingLabel: "1 vaso (200ml)", calories: 130, proteins: 6.5, carbs: 9.5, fats: 7, fiber: 0, caffeine: 0 },
  { name: "Leche desnatada", nameEs: "Leche desnatada", category: "bebida_fria", emoji: "🥛", servingSize: 200, servingUnit: "ml", servingLabel: "1 vaso (200ml)", calories: 70, proteins: 7, carbs: 10, fats: 0.2, fiber: 0, caffeine: 0 },

  // ── LÁCTEOS ────────────────────────────────────────────────────────────────
  { name: "Yogur natural", nameEs: "Yogur natural", category: "lacteo", emoji: "🥛", servingSize: 125, servingUnit: "g", servingLabel: "1 yogur (125g)", calories: 75, proteins: 5, carbs: 9, fats: 2, fiber: 0, caffeine: 0 },
  { name: "Yogur griego", nameEs: "Yogur griego", category: "lacteo", emoji: "🥛", servingSize: 150, servingUnit: "g", servingLabel: "1 yogur (150g)", calories: 130, proteins: 9, carbs: 6, fats: 7, fiber: 0, caffeine: 0 },
  { name: "Yogur desnatado", nameEs: "Yogur desnatado", category: "lacteo", emoji: "🥛", servingSize: 125, servingUnit: "g", servingLabel: "1 yogur (125g)", calories: 50, proteins: 5.5, carbs: 7, fats: 0.1, fiber: 0, caffeine: 0 },
  { name: "Kéfir", nameEs: "Kéfir", category: "lacteo", emoji: "🥛", servingSize: 200, servingUnit: "ml", servingLabel: "1 vaso (200ml)", calories: 100, proteins: 6, carbs: 8, fats: 3.5, fiber: 0, caffeine: 0 },
  { name: "Queso fresco", nameEs: "Queso fresco", category: "lacteo", emoji: "🧀", servingSize: 50, servingUnit: "g", servingLabel: "1 porción (50g)", calories: 55, proteins: 7, carbs: 1, fats: 2.5, fiber: 0, caffeine: 0 },
  { name: "Queso cottage", nameEs: "Queso cottage", category: "lacteo", emoji: "🧀", servingSize: 100, servingUnit: "g", servingLabel: "100g", calories: 98, proteins: 11, carbs: 3.4, fats: 4.3, fiber: 0, caffeine: 0 },

  // ── PROTEÍNAS SIMPLES ──────────────────────────────────────────────────────
  { name: "Pavo en lonchas", nameEs: "Pavo en lonchas", category: "proteina", emoji: "🦃", servingSize: 30, servingUnit: "g", servingLabel: "2 lonchas (30g)", calories: 30, proteins: 6, carbs: 0.5, fats: 0.5, fiber: 0, caffeine: 0 },
  { name: "Jamón cocido", nameEs: "Jamón cocido", category: "proteina", emoji: "🥩", servingSize: 30, servingUnit: "g", servingLabel: "2 lonchas (30g)", calories: 35, proteins: 5.5, carbs: 0.5, fats: 1, fiber: 0, caffeine: 0 },
  { name: "Jamón serrano", nameEs: "Jamón serrano", category: "proteina", emoji: "🥩", servingSize: 20, servingUnit: "g", servingLabel: "2 lonchas (20g)", calories: 50, proteins: 7, carbs: 0, fats: 2.5, fiber: 0, caffeine: 0 },
  { name: "Huevo cocido", nameEs: "Huevo cocido", category: "proteina", emoji: "🥚", servingSize: 50, servingUnit: "g", servingLabel: "1 huevo (50g)", calories: 78, proteins: 6.3, carbs: 0.6, fats: 5.3, fiber: 0, caffeine: 0 },
  { name: "Atún al natural", nameEs: "Atún al natural", category: "proteina", emoji: "🐟", servingSize: 80, servingUnit: "g", servingLabel: "1 lata (80g)", calories: 80, proteins: 18, carbs: 0, fats: 0.5, fiber: 0, caffeine: 0 },
  { name: "Sardinas en lata", nameEs: "Sardinas en lata", category: "proteina", emoji: "🐟", servingSize: 60, servingUnit: "g", servingLabel: "1 lata pequeña (60g)", calories: 110, proteins: 14, carbs: 0, fats: 6, fiber: 0, caffeine: 0 },
  { name: "Pollo cocido en tiras", nameEs: "Pollo cocido", category: "proteina", emoji: "🍗", servingSize: 80, servingUnit: "g", servingLabel: "1 porción (80g)", calories: 120, proteins: 22, carbs: 0, fats: 3, fiber: 0, caffeine: 0 },

  // ── FRUTAS ─────────────────────────────────────────────────────────────────
  { name: "Manzana", nameEs: "Manzana", category: "fruta", emoji: "🍎", servingSize: 150, servingUnit: "g", servingLabel: "1 manzana mediana (150g)", calories: 78, proteins: 0.4, carbs: 21, fats: 0.2, fiber: 2.5, caffeine: 0 },
  { name: "Plátano", nameEs: "Plátano", category: "fruta", emoji: "🍌", servingSize: 120, servingUnit: "g", servingLabel: "1 plátano (120g)", calories: 107, proteins: 1.3, carbs: 27, fats: 0.4, fiber: 3.1, caffeine: 0 },
  { name: "Naranja", nameEs: "Naranja", category: "fruta", emoji: "🍊", servingSize: 150, servingUnit: "g", servingLabel: "1 naranja (150g)", calories: 72, proteins: 1.4, carbs: 18, fats: 0.2, fiber: 3.7, caffeine: 0 },
  { name: "Fresas", nameEs: "Fresas", category: "fruta", emoji: "🍓", servingSize: 100, servingUnit: "g", servingLabel: "1 puñado (100g)", calories: 32, proteins: 0.7, carbs: 7.7, fats: 0.3, fiber: 2, caffeine: 0 },
  { name: "Arándanos", nameEs: "Arándanos", category: "fruta", emoji: "🫐", servingSize: 80, servingUnit: "g", servingLabel: "1 puñado (80g)", calories: 46, proteins: 0.6, carbs: 11, fats: 0.3, fiber: 1.9, caffeine: 0 },
  { name: "Uvas", nameEs: "Uvas", category: "fruta", emoji: "🍇", servingSize: 100, servingUnit: "g", servingLabel: "1 racimo pequeño (100g)", calories: 69, proteins: 0.7, carbs: 18, fats: 0.2, fiber: 0.9, caffeine: 0 },
  { name: "Kiwi", nameEs: "Kiwi", category: "fruta", emoji: "🥝", servingSize: 80, servingUnit: "g", servingLabel: "1 kiwi (80g)", calories: 48, proteins: 0.9, carbs: 12, fats: 0.4, fiber: 2.4, caffeine: 0 },
  { name: "Pera", nameEs: "Pera", category: "fruta", emoji: "🍐", servingSize: 150, servingUnit: "g", servingLabel: "1 pera (150g)", calories: 85, proteins: 0.5, carbs: 23, fats: 0.2, fiber: 4.5, caffeine: 0 },
  { name: "Melocotón", nameEs: "Melocotón", category: "fruta", emoji: "🍑", servingSize: 150, servingUnit: "g", servingLabel: "1 melocotón (150g)", calories: 58, proteins: 1.4, carbs: 15, fats: 0.4, fiber: 2.3, caffeine: 0 },

  // ── SNACKS SALUDABLES ──────────────────────────────────────────────────────
  { name: "Almendras", nameEs: "Almendras", category: "snack_saludable", emoji: "🌰", servingSize: 30, servingUnit: "g", servingLabel: "1 puñado (30g)", calories: 174, proteins: 6, carbs: 6, fats: 15, fiber: 3.5, caffeine: 0 },
  { name: "Nueces", nameEs: "Nueces", category: "snack_saludable", emoji: "🌰", servingSize: 30, servingUnit: "g", servingLabel: "1 puñado (30g)", calories: 196, proteins: 4.6, carbs: 4, fats: 19.5, fiber: 2, caffeine: 0 },
  { name: "Anacardos", nameEs: "Anacardos", category: "snack_saludable", emoji: "🌰", servingSize: 30, servingUnit: "g", servingLabel: "1 puñado (30g)", calories: 165, proteins: 4.3, carbs: 9, fats: 13, fiber: 0.9, caffeine: 0 },
  { name: "Barrita de proteínas", nameEs: "Barrita proteínas", category: "snack_saludable", emoji: "🍫", servingSize: 60, servingUnit: "g", servingLabel: "1 barrita (60g)", calories: 200, proteins: 20, carbs: 20, fats: 6, fiber: 3, caffeine: 0 },
  { name: "Barrita de cereales", nameEs: "Barrita cereales", category: "snack_saludable", emoji: "🌾", servingSize: 35, servingUnit: "g", servingLabel: "1 barrita (35g)", calories: 130, proteins: 2, carbs: 25, fats: 3, fiber: 1.5, caffeine: 0 },
  { name: "Galletas de arroz", nameEs: "Galletas de arroz", category: "snack_saludable", emoji: "🍘", servingSize: 30, servingUnit: "g", servingLabel: "3 galletas (30g)", calories: 115, proteins: 2.5, carbs: 25, fats: 0.5, fiber: 0.5, caffeine: 0 },
  { name: "Hummus", nameEs: "Hummus", category: "snack_saludable", emoji: "🫘", servingSize: 50, servingUnit: "g", servingLabel: "2 cucharadas (50g)", calories: 90, proteins: 4, carbs: 8, fats: 5, fiber: 2, caffeine: 0 },
  { name: "Aguacate", nameEs: "Aguacate", category: "snack_saludable", emoji: "🥑", servingSize: 75, servingUnit: "g", servingLabel: "½ aguacate (75g)", calories: 120, proteins: 1.5, carbs: 6, fats: 11, fiber: 5, caffeine: 0 },

  // ── SUPLEMENTOS ────────────────────────────────────────────────────────────
  { name: "Proteína whey", nameEs: "Proteína whey", category: "suplemento", emoji: "💪", servingSize: 30, servingUnit: "g", servingLabel: "1 scoop (30g)", calories: 120, proteins: 24, carbs: 3, fats: 1.5, fiber: 0, caffeine: 0 },
  { name: "Proteína vegana", nameEs: "Proteína vegana", category: "suplemento", emoji: "💪", servingSize: 30, servingUnit: "g", servingLabel: "1 scoop (30g)", calories: 110, proteins: 20, carbs: 5, fats: 2, fiber: 2, caffeine: 0 },
  { name: "BCAA", nameEs: "BCAA", category: "suplemento", emoji: "💊", servingSize: 10, servingUnit: "g", servingLabel: "1 dosis (10g)", calories: 40, proteins: 7, carbs: 2, fats: 0, fiber: 0, caffeine: 0 },
  { name: "Creatina", nameEs: "Creatina", category: "suplemento", emoji: "💊", servingSize: 5, servingUnit: "g", servingLabel: "1 cucharadita (5g)", calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0, caffeine: 0 },
  { name: "Colágeno hidrolizado", nameEs: "Colágeno", category: "suplemento", emoji: "💊", servingSize: 10, servingUnit: "g", servingLabel: "1 sobre (10g)", calories: 38, proteins: 9.5, carbs: 0, fats: 0, fiber: 0, caffeine: 0 },
  { name: "Magnesio", nameEs: "Magnesio", category: "suplemento", emoji: "💊", servingSize: 1, servingUnit: "unidad", servingLabel: "1 comprimido", calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0, caffeine: 0 },
];

async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to DB");

  let inserted = 0;
  let skipped = 0;

  for (const c of complements) {
    const [rows] = await conn.execute(
      "SELECT id FROM complements WHERE name = ? LIMIT 1",
      [c.name]
    );
    if (rows.length > 0) {
      skipped++;
      continue;
    }

    await conn.execute(
      `INSERT INTO complements
        (name, nameEs, category, emoji, servingSize, servingUnit, servingLabel,
         calories, proteins, carbs, fats, fiber, sugar, caffeine,
         isSeeded, isPublic, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
      [
        c.name, c.nameEs ?? c.name, c.category, c.emoji,
        c.servingSize, c.servingUnit, c.servingLabel ?? null,
        c.calories ?? null, c.proteins ?? null, c.carbs ?? null,
        c.fats ?? null, c.fiber ?? null, null, c.caffeine ?? null,
      ]
    );
    inserted++;
  }

  console.log(`Done: ${inserted} inserted, ${skipped} skipped`);
  await conn.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
