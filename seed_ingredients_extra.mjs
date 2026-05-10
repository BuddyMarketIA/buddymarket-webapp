import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper: insert ignoring duplicates by apiParam
async function insertIngredients(items) {
  let inserted = 0;
  let skipped = 0;
  for (const item of items) {
    try {
      await pool.query(`
        INSERT INTO ingredients (
          "apiParam", "nameEs", "nameEn", category,
          calories, proteins, carbohydrates, fats,
          "saturatedFats", fiber, sugars, sodium,
          "isVegan", "isVegetarian", "isGlutenFree", "isDairyFree",
          "purchaseUnitType", "purchaseUnitSingular", "purchaseUnitPlural",
          "createdAt", "updatedAt"
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW()
        ) ON CONFLICT ("apiParam") DO NOTHING
      `, [
        item.apiParam, item.nameEs, item.nameEn ?? null, item.category,
        item.calories ?? 0, item.proteins ?? 0, item.carbohydrates ?? 0, item.fats ?? 0,
        item.saturatedFats ?? 0, item.fiber ?? 0, item.sugars ?? 0, item.sodium ?? 0,
        item.isVegan ?? true, item.isVegetarian ?? true, item.isGlutenFree ?? true, item.isDairyFree ?? true,
        item.purchaseUnitType ?? 'volume', item.purchaseUnitSingular ?? 'bote', item.purchaseUnitPlural ?? 'botes',
      ]);
      inserted++;
    } catch (e) {
      if (e.code === '23505') { skipped++; } // unique violation
      else { console.error('Error inserting', item.apiParam, e.message); }
    }
  }
  return { inserted, skipped };
}

// ─── SALSAS ──────────────────────────────────────────────────────────────────
const salsas = [
  // Salsas clásicas
  { apiParam: 'salsa_tomate', nameEs: 'Salsa de tomate', nameEn: 'Tomato sauce', category: 'salsas', calories: 29, proteins: 1.5, carbohydrates: 5.5, fats: 0.3, sugars: 4.5, sodium: 320, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_tomate_casera', nameEs: 'Salsa de tomate casera', nameEn: 'Homemade tomato sauce', category: 'salsas', calories: 35, proteins: 1.2, carbohydrates: 6, fats: 1, sugars: 4, sodium: 180, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'ketchup', nameEs: 'Ketchup', nameEn: 'Ketchup', category: 'salsas', calories: 100, proteins: 1.3, carbohydrates: 25, fats: 0.1, sugars: 22, sodium: 907, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mayonesa', nameEs: 'Mayonesa', nameEn: 'Mayonnaise', category: 'salsas', calories: 680, proteins: 1.1, carbohydrates: 0.6, fats: 75, saturatedFats: 11, sugars: 0.5, sodium: 635, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mayonesa_vegana', nameEs: 'Mayonesa vegana', nameEn: 'Vegan mayo', category: 'salsas', calories: 620, proteins: 0.2, carbohydrates: 1, fats: 68, saturatedFats: 6, sugars: 0.5, sodium: 480, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mostaza_amarilla', nameEs: 'Mostaza amarilla', nameEn: 'Yellow mustard', category: 'salsas', calories: 66, proteins: 3.7, carbohydrates: 6, fats: 3.6, fiber: 3, sodium: 1120, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'mostaza_dijon', nameEs: 'Mostaza Dijon', nameEn: 'Dijon mustard', category: 'salsas', calories: 66, proteins: 3.7, carbohydrates: 6, fats: 3.6, fiber: 3, sodium: 1020, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'mostaza_antigua', nameEs: 'Mostaza a la antigua', nameEn: 'Whole grain mustard', category: 'salsas', calories: 70, proteins: 4, carbohydrates: 5, fats: 4, fiber: 3, sodium: 980, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'salsa_bechamel', nameEs: 'Bechamel', nameEn: 'Béchamel sauce', category: 'salsas', calories: 95, proteins: 3, carbohydrates: 8, fats: 5.5, saturatedFats: 3.5, sodium: 280, isVegan: false, isVegetarian: true, isGlutenFree: false, isDairyFree: false },
  { apiParam: 'salsa_carbonara', nameEs: 'Salsa carbonara', nameEn: 'Carbonara sauce', category: 'salsas', calories: 180, proteins: 5, carbohydrates: 3, fats: 16, saturatedFats: 8, sodium: 350, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_boloñesa', nameEs: 'Salsa boloñesa', nameEn: 'Bolognese sauce', category: 'salsas', calories: 110, proteins: 7, carbohydrates: 6, fats: 6, saturatedFats: 2, sodium: 290, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_pesto', nameEs: 'Pesto', nameEn: 'Pesto sauce', category: 'salsas', calories: 430, proteins: 8, carbohydrates: 4, fats: 43, saturatedFats: 7, sodium: 580, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'pesto_rojo', nameEs: 'Pesto rojo', nameEn: 'Red pesto', category: 'salsas', calories: 380, proteins: 6, carbohydrates: 8, fats: 36, saturatedFats: 5, sodium: 520, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_alfredo', nameEs: 'Salsa Alfredo', nameEn: 'Alfredo sauce', category: 'salsas', calories: 200, proteins: 4, carbohydrates: 3, fats: 19, saturatedFats: 12, sodium: 420, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_romesco', nameEs: 'Salsa romesco', nameEn: 'Romesco sauce', category: 'salsas', calories: 180, proteins: 4, carbohydrates: 8, fats: 15, saturatedFats: 2, sodium: 310, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_brava', nameEs: 'Salsa brava', nameEn: 'Brava sauce', category: 'salsas', calories: 65, proteins: 1, carbohydrates: 7, fats: 4, sodium: 380, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'alioli', nameEs: 'Alioli', nameEn: 'Aioli', category: 'salsas', calories: 620, proteins: 1, carbohydrates: 2, fats: 68, saturatedFats: 10, sodium: 420, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_verde', nameEs: 'Salsa verde', nameEn: 'Green sauce', category: 'salsas', calories: 90, proteins: 1.5, carbohydrates: 3, fats: 8, sodium: 320, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'chimichurri', nameEs: 'Chimichurri', nameEn: 'Chimichurri', category: 'salsas', calories: 120, proteins: 1, carbohydrates: 3, fats: 12, sodium: 280, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'guacamole', nameEs: 'Guacamole', nameEn: 'Guacamole', category: 'salsas', calories: 150, proteins: 2, carbohydrates: 8, fats: 13, fiber: 5, sodium: 180, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'hummus', nameEs: 'Hummus', nameEn: 'Hummus', category: 'salsas', calories: 177, proteins: 8, carbohydrates: 20, fats: 8, fiber: 6, sodium: 379, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'tzatziki', nameEs: 'Tzatziki', nameEn: 'Tzatziki', category: 'salsas', calories: 54, proteins: 3.5, carbohydrates: 4, fats: 2.5, sodium: 220, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'tahini', nameEs: 'Tahini', nameEn: 'Tahini', category: 'salsas', calories: 595, proteins: 17, carbohydrates: 21, fats: 53, fiber: 9, sodium: 115, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_cesar', nameEs: 'Salsa César', nameEn: 'Caesar dressing', category: 'salsas', calories: 310, proteins: 3, carbohydrates: 4, fats: 32, saturatedFats: 5, sodium: 780, isVegan: false, isVegetarian: false, isGlutenFree: false, isDairyFree: false },
  { apiParam: 'salsa_ranch', nameEs: 'Salsa ranch', nameEn: 'Ranch dressing', category: 'salsas', calories: 270, proteins: 1.5, carbohydrates: 5, fats: 27, saturatedFats: 4, sodium: 550, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_barbacoa', nameEs: 'Salsa barbacoa', nameEn: 'BBQ sauce', category: 'salsas', calories: 172, proteins: 1, carbohydrates: 40, fats: 0.5, sugars: 35, sodium: 820, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_teriyaki', nameEs: 'Salsa teriyaki', nameEn: 'Teriyaki sauce', category: 'salsas', calories: 89, proteins: 5, carbohydrates: 18, fats: 0.1, sugars: 15, sodium: 2320, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'salsa_soja', nameEs: 'Salsa de soja', nameEn: 'Soy sauce', category: 'salsas', calories: 53, proteins: 8, carbohydrates: 5, fats: 0.1, sodium: 5720, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'salsa_soja_baja_sodio', nameEs: 'Salsa de soja baja en sodio', nameEn: 'Low sodium soy sauce', category: 'salsas', calories: 53, proteins: 8, carbohydrates: 5, fats: 0.1, sodium: 2900, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'tamari', nameEs: 'Tamari', nameEn: 'Tamari', category: 'salsas', calories: 60, proteins: 11, carbohydrates: 5, fats: 0.1, sodium: 4500, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_hoisin', nameEs: 'Salsa hoisin', nameEn: 'Hoisin sauce', category: 'salsas', calories: 220, proteins: 4, carbohydrates: 45, fats: 2, sugars: 30, sodium: 1360, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'salsa_ostras', nameEs: 'Salsa de ostras', nameEn: 'Oyster sauce', category: 'salsas', calories: 100, proteins: 1.5, carbohydrates: 23, fats: 0.3, sugars: 10, sodium: 2010, isVegan: false, isVegetarian: false, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'salsa_worcestershire', nameEs: 'Salsa Worcestershire', nameEn: 'Worcestershire sauce', category: 'salsas', calories: 78, proteins: 0, carbohydrates: 19, fats: 0, sodium: 980, isVegan: false, isVegetarian: false, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'tabasco', nameEs: 'Tabasco', nameEn: 'Tabasco sauce', category: 'salsas', calories: 12, proteins: 0.5, carbohydrates: 1, fats: 0.2, sodium: 1170, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'sriracha', nameEs: 'Sriracha', nameEn: 'Sriracha', category: 'salsas', calories: 93, proteins: 2, carbohydrates: 19, fats: 1, sugars: 12, sodium: 2200, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_picante_habanero', nameEs: 'Salsa picante habanero', nameEn: 'Habanero hot sauce', category: 'salsas', calories: 15, proteins: 0.5, carbohydrates: 3, fats: 0.1, sodium: 800, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_sweet_chili', nameEs: 'Salsa sweet chili', nameEn: 'Sweet chili sauce', category: 'salsas', calories: 200, proteins: 0.5, carbohydrates: 48, fats: 0.1, sugars: 40, sodium: 1100, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_agridulce', nameEs: 'Salsa agridulce', nameEn: 'Sweet and sour sauce', category: 'salsas', calories: 120, proteins: 0.3, carbohydrates: 29, fats: 0.1, sugars: 25, sodium: 650, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_curry', nameEs: 'Salsa de curry', nameEn: 'Curry sauce', category: 'salsas', calories: 95, proteins: 2, carbohydrates: 10, fats: 5, sodium: 480, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_tikka_masala', nameEs: 'Salsa tikka masala', nameEn: 'Tikka masala sauce', category: 'salsas', calories: 110, proteins: 2.5, carbohydrates: 8, fats: 7, saturatedFats: 3, sodium: 520, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_satay', nameEs: 'Salsa satay', nameEn: 'Satay sauce', category: 'salsas', calories: 220, proteins: 8, carbohydrates: 12, fats: 16, sodium: 680, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_mole', nameEs: 'Salsa mole', nameEn: 'Mole sauce', category: 'salsas', calories: 150, proteins: 3, carbohydrates: 18, fats: 7, fiber: 3, sodium: 420, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_tapenade', nameEs: 'Tapenade', nameEn: 'Tapenade', category: 'salsas', calories: 280, proteins: 2, carbohydrates: 5, fats: 28, sodium: 1200, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_harissa', nameEs: 'Harissa', nameEn: 'Harissa', category: 'salsas', calories: 50, proteins: 2, carbohydrates: 6, fats: 2.5, sodium: 850, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_gochujang', nameEs: 'Gochujang', nameEn: 'Gochujang', category: 'salsas', calories: 100, proteins: 3, carbohydrates: 20, fats: 0.5, sodium: 1900, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'salsa_ponzu', nameEs: 'Salsa ponzu', nameEn: 'Ponzu sauce', category: 'salsas', calories: 40, proteins: 2, carbohydrates: 7, fats: 0.1, sodium: 1800, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'salsa_nuoc_cham', nameEs: 'Salsa nuoc cham', nameEn: 'Nuoc cham', category: 'salsas', calories: 35, proteins: 1, carbohydrates: 8, fats: 0.1, sodium: 1500, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_tahini_limon', nameEs: 'Salsa de tahini y limón', nameEn: 'Tahini lemon sauce', category: 'salsas', calories: 180, proteins: 5, carbohydrates: 8, fats: 15, sodium: 280, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_yogur_pepino', nameEs: 'Salsa de yogur y pepino', nameEn: 'Yogurt cucumber sauce', category: 'salsas', calories: 55, proteins: 4, carbohydrates: 5, fats: 1.5, sodium: 200, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_mango', nameEs: 'Salsa de mango', nameEn: 'Mango sauce', category: 'salsas', calories: 80, proteins: 0.5, carbohydrates: 19, fats: 0.2, sugars: 17, sodium: 120, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_frambuesa', nameEs: 'Salsa de frambuesa', nameEn: 'Raspberry sauce', category: 'salsas', calories: 90, proteins: 0.5, carbohydrates: 22, fats: 0.1, sugars: 18, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_naranja', nameEs: 'Salsa de naranja', nameEn: 'Orange sauce', category: 'salsas', calories: 75, proteins: 0.5, carbohydrates: 18, fats: 0.1, sugars: 16, sodium: 80, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_pedro_ximenez', nameEs: 'Reducción de Pedro Ximénez', nameEn: 'Pedro Ximénez reduction', category: 'salsas', calories: 180, proteins: 0.2, carbohydrates: 42, fats: 0, sugars: 40, sodium: 15, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_roquefort', nameEs: 'Salsa roquefort', nameEn: 'Roquefort sauce', category: 'salsas', calories: 220, proteins: 6, carbohydrates: 3, fats: 21, saturatedFats: 13, sodium: 780, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_4_quesos', nameEs: 'Salsa cuatro quesos', nameEn: 'Four cheese sauce', category: 'salsas', calories: 250, proteins: 10, carbohydrates: 4, fats: 22, saturatedFats: 14, sodium: 680, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_setas', nameEs: 'Salsa de setas', nameEn: 'Mushroom sauce', category: 'salsas', calories: 80, proteins: 2, carbohydrates: 5, fats: 5, sodium: 380, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_pimientos', nameEs: 'Salsa de pimientos asados', nameEn: 'Roasted pepper sauce', category: 'salsas', calories: 45, proteins: 1, carbohydrates: 7, fats: 1.5, sodium: 280, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_espinacas', nameEs: 'Salsa de espinacas', nameEn: 'Spinach sauce', category: 'salsas', calories: 70, proteins: 3, carbohydrates: 4, fats: 4.5, sodium: 320, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_americana', nameEs: 'Salsa americana', nameEn: 'American sauce', category: 'salsas', calories: 120, proteins: 3, carbohydrates: 8, fats: 8, sodium: 480, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_veloute', nameEs: 'Velouté', nameEn: 'Velouté sauce', category: 'salsas', calories: 85, proteins: 2.5, carbohydrates: 7, fats: 5, sodium: 350, isVegan: false, isVegetarian: false, isGlutenFree: false, isDairyFree: false },
  { apiParam: 'demi_glace', nameEs: 'Demi-glace', nameEn: 'Demi-glace', category: 'salsas', calories: 50, proteins: 4, carbohydrates: 4, fats: 1.5, sodium: 580, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_vino_tinto', nameEs: 'Salsa de vino tinto', nameEn: 'Red wine sauce', category: 'salsas', calories: 65, proteins: 1, carbohydrates: 5, fats: 3, sodium: 420, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_cerveza', nameEs: 'Salsa de cerveza', nameEn: 'Beer sauce', category: 'salsas', calories: 70, proteins: 1.5, carbohydrates: 7, fats: 3, sodium: 380, isVegan: false, isVegetarian: false, isGlutenFree: false, isDairyFree: false },
  { apiParam: 'salsa_de_mostaza_miel', nameEs: 'Salsa mostaza y miel', nameEn: 'Honey mustard sauce', category: 'salsas', calories: 150, proteins: 1, carbohydrates: 22, fats: 7, sugars: 20, sodium: 480, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_limón', nameEs: 'Salsa de limón', nameEn: 'Lemon sauce', category: 'salsas', calories: 40, proteins: 0.3, carbohydrates: 9, fats: 0.5, sodium: 120, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_ajo', nameEs: 'Salsa de ajo', nameEn: 'Garlic sauce', category: 'salsas', calories: 90, proteins: 1.5, carbohydrates: 5, fats: 7, sodium: 350, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_hierbas', nameEs: 'Salsa de hierbas frescas', nameEn: 'Fresh herb sauce', category: 'salsas', calories: 75, proteins: 1, carbohydrates: 3, fats: 6.5, sodium: 180, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_aguacate', nameEs: 'Salsa de aguacate', nameEn: 'Avocado sauce', category: 'salsas', calories: 140, proteins: 1.5, carbohydrates: 6, fats: 13, fiber: 4, sodium: 150, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_cacahuete', nameEs: 'Salsa de cacahuete', nameEn: 'Peanut sauce', category: 'salsas', calories: 220, proteins: 8, carbohydrates: 12, fats: 17, sodium: 580, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_coco', nameEs: 'Salsa de coco', nameEn: 'Coconut sauce', category: 'salsas', calories: 120, proteins: 1, carbohydrates: 8, fats: 10, saturatedFats: 8, sodium: 180, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_jengibre', nameEs: 'Salsa de jengibre', nameEn: 'Ginger sauce', category: 'salsas', calories: 55, proteins: 1, carbohydrates: 12, fats: 0.5, sodium: 680, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_tamarindo', nameEs: 'Salsa de tamarindo', nameEn: 'Tamarind sauce', category: 'salsas', calories: 110, proteins: 1, carbohydrates: 27, fats: 0.2, sodium: 580, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_soja_miel', nameEs: 'Salsa de soja y miel', nameEn: 'Honey soy sauce', category: 'salsas', calories: 120, proteins: 4, carbohydrates: 24, fats: 0.2, sugars: 20, sodium: 2800, isVegan: false, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'salsa_de_pato', nameEs: 'Salsa de pato', nameEn: 'Duck sauce', category: 'salsas', calories: 130, proteins: 0.5, carbohydrates: 32, fats: 0.1, sugars: 28, sodium: 480, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_ciruelas', nameEs: 'Salsa de ciruelas', nameEn: 'Plum sauce', category: 'salsas', calories: 140, proteins: 0.5, carbohydrates: 34, fats: 0.1, sugars: 30, sodium: 380, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_arándanos', nameEs: 'Salsa de arándanos', nameEn: 'Cranberry sauce', category: 'salsas', calories: 150, proteins: 0.3, carbohydrates: 38, fats: 0.1, sugars: 35, sodium: 15, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_menta', nameEs: 'Salsa de menta', nameEn: 'Mint sauce', category: 'salsas', calories: 45, proteins: 0.5, carbohydrates: 10, fats: 0.2, sodium: 120, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_rábano_picante', nameEs: 'Salsa de rábano picante', nameEn: 'Horseradish sauce', category: 'salsas', calories: 48, proteins: 1, carbohydrates: 8, fats: 1.5, sodium: 420, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_anchoas', nameEs: 'Salsa de anchoas', nameEn: 'Anchovy sauce', category: 'salsas', calories: 90, proteins: 8, carbohydrates: 2, fats: 5.5, sodium: 2200, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_trufa', nameEs: 'Salsa de trufa', nameEn: 'Truffle sauce', category: 'salsas', calories: 180, proteins: 2, carbohydrates: 5, fats: 17, sodium: 380, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_cebolla', nameEs: 'Salsa de cebolla caramelizada', nameEn: 'Caramelized onion sauce', category: 'salsas', calories: 70, proteins: 1, carbohydrates: 14, fats: 1.5, sugars: 10, sodium: 280, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_espárragos', nameEs: 'Salsa de espárragos', nameEn: 'Asparagus sauce', category: 'salsas', calories: 55, proteins: 2, carbohydrates: 5, fats: 3, sodium: 280, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_alcaparras', nameEs: 'Salsa de alcaparras', nameEn: 'Caper sauce', category: 'salsas', calories: 65, proteins: 1, carbohydrates: 4, fats: 5, sodium: 680, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_pepinillos', nameEs: 'Salsa de pepinillos', nameEn: 'Gherkin sauce', category: 'salsas', calories: 55, proteins: 0.5, carbohydrates: 6, fats: 3, sodium: 780, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_golf', nameEs: 'Salsa golf', nameEn: 'Golf sauce', category: 'salsas', calories: 290, proteins: 0.8, carbohydrates: 12, fats: 26, sodium: 680, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_cocktail', nameEs: 'Salsa cóctel', nameEn: 'Cocktail sauce', category: 'salsas', calories: 110, proteins: 1, carbohydrates: 18, fats: 4, sodium: 780, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_tartara', nameEs: 'Salsa tártara', nameEn: 'Tartar sauce', category: 'salsas', calories: 310, proteins: 1, carbohydrates: 5, fats: 32, sodium: 680, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_bearnesa', nameEs: 'Salsa bearnesa', nameEn: 'Béarnaise sauce', category: 'salsas', calories: 380, proteins: 2, carbohydrates: 2, fats: 41, saturatedFats: 24, sodium: 380, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_hollandaise', nameEs: 'Salsa holandesa', nameEn: 'Hollandaise sauce', category: 'salsas', calories: 360, proteins: 2.5, carbohydrates: 1, fats: 38, saturatedFats: 22, sodium: 420, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_queso_crema', nameEs: 'Salsa de queso crema', nameEn: 'Cream cheese sauce', category: 'salsas', calories: 200, proteins: 4, carbohydrates: 3, fats: 19, saturatedFats: 12, sodium: 380, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_nata', nameEs: 'Salsa de nata', nameEn: 'Cream sauce', category: 'salsas', calories: 190, proteins: 2, carbohydrates: 3, fats: 19, saturatedFats: 12, sodium: 280, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_leche_de_coco', nameEs: 'Salsa de leche de coco', nameEn: 'Coconut milk sauce', category: 'salsas', calories: 130, proteins: 1.5, carbohydrates: 5, fats: 12, saturatedFats: 10, sodium: 180, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_miso_jengibre', nameEs: 'Salsa miso y jengibre', nameEn: 'Miso ginger sauce', category: 'salsas', calories: 80, proteins: 4, carbohydrates: 10, fats: 2, sodium: 1200, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'salsa_de_sésamo', nameEs: 'Salsa de sésamo', nameEn: 'Sesame sauce', category: 'salsas', calories: 180, proteins: 5, carbohydrates: 8, fats: 15, sodium: 680, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_parmesano', nameEs: 'Salsa de parmesano', nameEn: 'Parmesan sauce', category: 'salsas', calories: 220, proteins: 8, carbohydrates: 4, fats: 19, saturatedFats: 12, sodium: 580, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'salsa_de_tomate_picante', nameEs: 'Salsa de tomate picante', nameEn: 'Spicy tomato sauce', category: 'salsas', calories: 35, proteins: 1.5, carbohydrates: 6, fats: 0.5, sodium: 420, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_tomate_albahaca', nameEs: 'Salsa de tomate y albahaca', nameEn: 'Tomato basil sauce', category: 'salsas', calories: 38, proteins: 1.5, carbohydrates: 6.5, fats: 0.8, sodium: 280, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_marinara', nameEs: 'Salsa marinara', nameEn: 'Marinara sauce', category: 'salsas', calories: 40, proteins: 1.5, carbohydrates: 7, fats: 1, sodium: 320, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_arrabbiata', nameEs: 'Salsa arrabbiata', nameEn: 'Arrabbiata sauce', category: 'salsas', calories: 42, proteins: 1.5, carbohydrates: 7, fats: 1.2, sodium: 350, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_putanesca', nameEs: 'Salsa puttanesca', nameEn: 'Puttanesca sauce', category: 'salsas', calories: 55, proteins: 2, carbohydrates: 6, fats: 2.5, sodium: 680, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_aglio_olio', nameEs: 'Salsa aglio e olio', nameEn: 'Aglio e olio sauce', category: 'salsas', calories: 120, proteins: 1, carbohydrates: 3, fats: 12, sodium: 180, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_naranja_soja', nameEs: 'Salsa naranja y soja', nameEn: 'Orange soy sauce', category: 'salsas', calories: 70, proteins: 2, carbohydrates: 14, fats: 0.2, sodium: 1800, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'salsa_de_lima', nameEs: 'Salsa de lima', nameEn: 'Lime sauce', category: 'salsas', calories: 38, proteins: 0.3, carbohydrates: 9, fats: 0.3, sodium: 100, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_chile_negro', nameEs: 'Salsa de chile negro', nameEn: 'Black bean chili sauce', category: 'salsas', calories: 85, proteins: 3, carbohydrates: 14, fats: 1.5, sodium: 980, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_pepino', nameEs: 'Salsa de pepino', nameEn: 'Cucumber sauce', category: 'salsas', calories: 30, proteins: 1.5, carbohydrates: 4, fats: 0.8, sodium: 180, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_zanahoria', nameEs: 'Salsa de zanahoria', nameEn: 'Carrot sauce', category: 'salsas', calories: 45, proteins: 1, carbohydrates: 9, fats: 0.5, sodium: 220, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salsa_de_remolacha', nameEs: 'Salsa de remolacha', nameEn: 'Beet sauce', category: 'salsas', calories: 50, proteins: 1.5, carbohydrates: 10, fats: 0.5, sodium: 200, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
];

// ─── ACEITES EXTRA ────────────────────────────────────────────────────────────
const aceites = [
  { apiParam: 'aceite_oliva_virgen_extra', nameEs: 'Aceite de oliva virgen extra', nameEn: 'Extra virgin olive oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 14, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true, purchaseUnitType: 'volume', purchaseUnitSingular: 'botella', purchaseUnitPlural: 'botellas' },
  { apiParam: 'aceite_oliva_suave', nameEs: 'Aceite de oliva suave', nameEn: 'Light olive oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 14, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_maiz', nameEs: 'Aceite de maíz', nameEn: 'Corn oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 13, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_palma', nameEs: 'Aceite de palma', nameEn: 'Palm oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 49, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_cacahuete', nameEs: 'Aceite de cacahuete', nameEn: 'Peanut oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 17, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_linaza', nameEs: 'Aceite de linaza', nameEn: 'Flaxseed oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 9, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_nuez', nameEs: 'Aceite de nuez', nameEn: 'Walnut oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 9, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_almendras', nameEs: 'Aceite de almendras', nameEn: 'Almond oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 8, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_trufa', nameEs: 'Aceite de trufa', nameEn: 'Truffle oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 14, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_chili', nameEs: 'Aceite de chili', nameEn: 'Chili oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0.5, fats: 100, saturatedFats: 14, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_ajo', nameEs: 'Aceite de ajo', nameEn: 'Garlic oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0.5, fats: 100, saturatedFats: 14, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_hierbas', nameEs: 'Aceite de hierbas', nameEn: 'Herb oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0.5, fats: 100, saturatedFats: 14, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_canola', nameEs: 'Aceite de canola', nameEn: 'Canola oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 7, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_uva', nameEs: 'Aceite de semilla de uva', nameEn: 'Grapeseed oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 10, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_argán', nameEs: 'Aceite de argán', nameEn: 'Argan oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 20, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_hemp', nameEs: 'Aceite de cáñamo', nameEn: 'Hemp oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 8, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_borraja', nameEs: 'Aceite de borraja', nameEn: 'Borage oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 13, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aceite_onagra', nameEs: 'Aceite de onagra', nameEn: 'Evening primrose oil', category: 'aceites', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 10, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mantequilla_ghee', nameEs: 'Ghee (mantequilla clarificada)', nameEn: 'Ghee', category: 'aceites', calories: 900, proteins: 0.3, carbohydrates: 0, fats: 99.5, saturatedFats: 62, sodium: 2, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'aceite_MCT', nameEs: 'Aceite MCT', nameEn: 'MCT oil', category: 'aceites', calories: 862, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 95, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
];

// ─── VINAGRES ─────────────────────────────────────────────────────────────────
const vinagres = [
  { apiParam: 'vinagre_vino_blanco', nameEs: 'Vinagre de vino blanco', nameEn: 'White wine vinegar', category: 'vinagres', calories: 18, proteins: 0, carbohydrates: 0.6, fats: 0, sodium: 2, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true, purchaseUnitType: 'volume', purchaseUnitSingular: 'botella', purchaseUnitPlural: 'botellas' },
  { apiParam: 'vinagre_vino_tinto', nameEs: 'Vinagre de vino tinto', nameEn: 'Red wine vinegar', category: 'vinagres', calories: 19, proteins: 0, carbohydrates: 0.3, fats: 0, sodium: 2, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'vinagre_manzana', nameEs: 'Vinagre de manzana', nameEn: 'Apple cider vinegar', category: 'vinagres', calories: 22, proteins: 0, carbohydrates: 0.9, fats: 0, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'vinagre_jerez', nameEs: 'Vinagre de Jerez', nameEn: 'Sherry vinegar', category: 'vinagres', calories: 20, proteins: 0, carbohydrates: 0.5, fats: 0, sodium: 2, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'vinagre_balsámico', nameEs: 'Vinagre balsámico', nameEn: 'Balsamic vinegar', category: 'vinagres', calories: 88, proteins: 0.5, carbohydrates: 17, fats: 0, sugars: 15, sodium: 23, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'vinagre_balsámico_blanco', nameEs: 'Vinagre balsámico blanco', nameEn: 'White balsamic vinegar', category: 'vinagres', calories: 60, proteins: 0, carbohydrates: 14, fats: 0, sugars: 12, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'vinagre_arroz', nameEs: 'Vinagre de arroz', nameEn: 'Rice vinegar', category: 'vinagres', calories: 18, proteins: 0, carbohydrates: 0.5, fats: 0, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'vinagre_umeboshi', nameEs: 'Vinagre de umeboshi', nameEn: 'Umeboshi vinegar', category: 'vinagres', calories: 15, proteins: 0.5, carbohydrates: 2, fats: 0, sodium: 3800, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'vinagre_malta', nameEs: 'Vinagre de malta', nameEn: 'Malt vinegar', category: 'vinagres', calories: 15, proteins: 0, carbohydrates: 0.6, fats: 0, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'vinagre_coco', nameEs: 'Vinagre de coco', nameEn: 'Coconut vinegar', category: 'vinagres', calories: 18, proteins: 0, carbohydrates: 0.5, fats: 0, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'vinagre_frambuesa', nameEs: 'Vinagre de frambuesa', nameEn: 'Raspberry vinegar', category: 'vinagres', calories: 25, proteins: 0, carbohydrates: 5, fats: 0, sugars: 4, sodium: 2, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'vinagre_estragón', nameEs: 'Vinagre de estragón', nameEn: 'Tarragon vinegar', category: 'vinagres', calories: 20, proteins: 0, carbohydrates: 0.5, fats: 0, sodium: 2, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'reduccion_balsámica', nameEs: 'Reducción balsámica', nameEn: 'Balsamic reduction', category: 'vinagres', calories: 200, proteins: 1, carbohydrates: 48, fats: 0, sugars: 42, sodium: 50, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
];

// ─── ADEREZOS ─────────────────────────────────────────────────────────────────
const aderezos = [
  { apiParam: 'aderezo_italiano', nameEs: 'Aderezo italiano', nameEn: 'Italian dressing', category: 'aderezos', calories: 220, proteins: 0.3, carbohydrates: 5, fats: 22, sodium: 780, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true, purchaseUnitType: 'volume', purchaseUnitSingular: 'botella', purchaseUnitPlural: 'botellas' },
  { apiParam: 'aderezo_francés', nameEs: 'Aderezo francés', nameEn: 'French dressing', category: 'aderezos', calories: 180, proteins: 0.2, carbohydrates: 12, fats: 15, sodium: 580, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aderezo_mil_islas', nameEs: 'Aderezo mil islas', nameEn: 'Thousand island dressing', category: 'aderezos', calories: 220, proteins: 0.5, carbohydrates: 10, fats: 20, sodium: 480, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aderezo_balsámico', nameEs: 'Aderezo balsámico', nameEn: 'Balsamic dressing', category: 'aderezos', calories: 120, proteins: 0.2, carbohydrates: 8, fats: 10, sodium: 280, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aderezo_mostaza_miel', nameEs: 'Aderezo mostaza y miel', nameEn: 'Honey mustard dressing', category: 'aderezos', calories: 180, proteins: 0.5, carbohydrates: 18, fats: 12, sugars: 16, sodium: 380, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aderezo_limón_tahini', nameEs: 'Aderezo de limón y tahini', nameEn: 'Lemon tahini dressing', category: 'aderezos', calories: 160, proteins: 4, carbohydrates: 7, fats: 13, sodium: 280, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aderezo_sésamo_jengibre', nameEs: 'Aderezo de sésamo y jengibre', nameEn: 'Sesame ginger dressing', category: 'aderezos', calories: 140, proteins: 2, carbohydrates: 10, fats: 11, sodium: 680, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'aderezo_aguacate', nameEs: 'Aderezo de aguacate', nameEn: 'Avocado dressing', category: 'aderezos', calories: 130, proteins: 1.5, carbohydrates: 5, fats: 12, fiber: 3, sodium: 180, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aderezo_yogur_limón', nameEs: 'Aderezo de yogur y limón', nameEn: 'Yogurt lemon dressing', category: 'aderezos', calories: 55, proteins: 3.5, carbohydrates: 5, fats: 1.5, sodium: 120, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'aderezo_vinagreta_clásica', nameEs: 'Vinagreta clásica', nameEn: 'Classic vinaigrette', category: 'aderezos', calories: 150, proteins: 0.1, carbohydrates: 2, fats: 16, sodium: 220, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aderezo_vinagreta_hierbas', nameEs: 'Vinagreta de hierbas', nameEn: 'Herb vinaigrette', category: 'aderezos', calories: 145, proteins: 0.2, carbohydrates: 2, fats: 15, sodium: 200, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aderezo_miso', nameEs: 'Aderezo de miso', nameEn: 'Miso dressing', category: 'aderezos', calories: 90, proteins: 3, carbohydrates: 8, fats: 5, sodium: 980, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'aderezo_de_nuez', nameEs: 'Aderezo de nuez', nameEn: 'Walnut dressing', category: 'aderezos', calories: 180, proteins: 2, carbohydrates: 3, fats: 18, sodium: 180, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aderezo_de_frambuesa', nameEs: 'Aderezo de frambuesa', nameEn: 'Raspberry dressing', category: 'aderezos', calories: 100, proteins: 0.3, carbohydrates: 12, fats: 6, sugars: 10, sodium: 180, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'aderezo_de_granada', nameEs: 'Aderezo de granada', nameEn: 'Pomegranate dressing', category: 'aderezos', calories: 110, proteins: 0.3, carbohydrates: 14, fats: 6, sugars: 12, sodium: 160, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
];

// ─── SEMILLAS EXTRA ───────────────────────────────────────────────────────────
const semillas = [
  { apiParam: 'semillas_chia', nameEs: 'Semillas de chía', nameEn: 'Chia seeds', category: 'semillas', calories: 486, proteins: 17, carbohydrates: 42, fats: 31, fiber: 34, sodium: 16, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true, purchaseUnitType: 'weight', purchaseUnitSingular: 'bolsa', purchaseUnitPlural: 'bolsas' },
  { apiParam: 'semillas_lino', nameEs: 'Semillas de lino', nameEn: 'Flax seeds', category: 'semillas', calories: 534, proteins: 18, carbohydrates: 29, fats: 42, fiber: 27, sodium: 30, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_sésamo', nameEs: 'Semillas de sésamo', nameEn: 'Sesame seeds', category: 'semillas', calories: 573, proteins: 17, carbohydrates: 23, fats: 50, fiber: 12, sodium: 11, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_sésamo_negro', nameEs: 'Semillas de sésamo negro', nameEn: 'Black sesame seeds', category: 'semillas', calories: 573, proteins: 17, carbohydrates: 23, fats: 50, fiber: 12, sodium: 11, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_girasol', nameEs: 'Semillas de girasol', nameEn: 'Sunflower seeds', category: 'semillas', calories: 584, proteins: 21, carbohydrates: 20, fats: 51, fiber: 9, sodium: 9, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_calabaza', nameEs: 'Semillas de calabaza', nameEn: 'Pumpkin seeds', category: 'semillas', calories: 559, proteins: 30, carbohydrates: 11, fats: 49, fiber: 6, sodium: 7, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_amapola', nameEs: 'Semillas de amapola', nameEn: 'Poppy seeds', category: 'semillas', calories: 525, proteins: 18, carbohydrates: 28, fats: 42, fiber: 20, sodium: 26, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_cáñamo', nameEs: 'Semillas de cáñamo', nameEn: 'Hemp seeds', category: 'semillas', calories: 553, proteins: 32, carbohydrates: 8.7, fats: 49, fiber: 4, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_fenogreco', nameEs: 'Semillas de fenogreco', nameEn: 'Fenugreek seeds', category: 'semillas', calories: 323, proteins: 23, carbohydrates: 58, fats: 6, fiber: 25, sodium: 67, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_mostaza', nameEs: 'Semillas de mostaza', nameEn: 'Mustard seeds', category: 'semillas', calories: 508, proteins: 26, carbohydrates: 28, fats: 36, fiber: 12, sodium: 13, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_hinojo', nameEs: 'Semillas de hinojo', nameEn: 'Fennel seeds', category: 'semillas', calories: 345, proteins: 16, carbohydrates: 52, fats: 15, fiber: 40, sodium: 88, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_comino', nameEs: 'Semillas de comino', nameEn: 'Cumin seeds', category: 'semillas', calories: 375, proteins: 18, carbohydrates: 44, fats: 22, fiber: 11, sodium: 168, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_cilantro', nameEs: 'Semillas de cilantro', nameEn: 'Coriander seeds', category: 'semillas', calories: 298, proteins: 12, carbohydrates: 55, fats: 18, fiber: 42, sodium: 35, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_cardamomo', nameEs: 'Semillas de cardamomo', nameEn: 'Cardamom seeds', category: 'semillas', calories: 311, proteins: 11, carbohydrates: 68, fats: 7, fiber: 28, sodium: 18, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_nigella', nameEs: 'Semillas de nigella (kalonji)', nameEn: 'Nigella seeds', category: 'semillas', calories: 345, proteins: 16, carbohydrates: 44, fats: 22, fiber: 11, sodium: 88, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_psyllium', nameEs: 'Semillas de psyllium', nameEn: 'Psyllium seeds', category: 'semillas', calories: 200, proteins: 3, carbohydrates: 75, fats: 1, fiber: 71, sodium: 20, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_quinoa', nameEs: 'Semillas de quinoa', nameEn: 'Quinoa seeds', category: 'semillas', calories: 368, proteins: 14, carbohydrates: 64, fats: 6, fiber: 7, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_amaranto', nameEs: 'Semillas de amaranto', nameEn: 'Amaranth seeds', category: 'semillas', calories: 371, proteins: 14, carbohydrates: 65, fats: 7, fiber: 7, sodium: 4, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_teff', nameEs: 'Semillas de teff', nameEn: 'Teff seeds', category: 'semillas', calories: 367, proteins: 13, carbohydrates: 73, fats: 2.4, fiber: 8, sodium: 12, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'semillas_cacao', nameEs: 'Semillas de cacao (nibs)', nameEn: 'Cacao nibs', category: 'semillas', calories: 480, proteins: 14, carbohydrates: 34, fats: 40, fiber: 9, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
];

// ─── PASTA Y CEREALES EXTRA ───────────────────────────────────────────────────
const pastaCereales = [
  { apiParam: 'pasta_espagueti', nameEs: 'Espagueti', nameEn: 'Spaghetti', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true, purchaseUnitType: 'weight', purchaseUnitSingular: 'paquete', purchaseUnitPlural: 'paquetes' },
  { apiParam: 'pasta_penne', nameEs: 'Penne', nameEn: 'Penne pasta', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_fusilli', nameEs: 'Fusilli', nameEn: 'Fusilli pasta', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_farfalle', nameEs: 'Farfalle (mariposas)', nameEn: 'Farfalle pasta', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_rigatoni', nameEs: 'Rigatoni', nameEn: 'Rigatoni pasta', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_tagliatelle', nameEs: 'Tagliatelle', nameEn: 'Tagliatelle pasta', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_linguine', nameEs: 'Linguine', nameEn: 'Linguine pasta', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_lasaña', nameEs: 'Láminas de lasaña', nameEn: 'Lasagna sheets', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_macarrones', nameEs: 'Macarrones', nameEn: 'Macaroni', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_conchiglie', nameEs: 'Conchiglie (conchas)', nameEn: 'Conchiglie pasta', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_orecchiette', nameEs: 'Orecchiette', nameEn: 'Orecchiette pasta', category: 'cereales', calories: 371, proteins: 13, carbohydrates: 74, fats: 1.5, fiber: 3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_gnocchi', nameEs: 'Gnocchi', nameEn: 'Gnocchi', category: 'cereales', calories: 170, proteins: 4, carbohydrates: 33, fats: 2, fiber: 2, sodium: 280, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_sin_gluten', nameEs: 'Pasta sin gluten (arroz/maíz)', nameEn: 'Gluten-free pasta', category: 'cereales', calories: 365, proteins: 7, carbohydrates: 78, fats: 1.5, fiber: 2, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'pasta_espelta', nameEs: 'Pasta de espelta', nameEn: 'Spelt pasta', category: 'cereales', calories: 360, proteins: 14, carbohydrates: 70, fats: 2.5, fiber: 8, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'pasta_legumbres', nameEs: 'Pasta de legumbres', nameEn: 'Legume pasta', category: 'cereales', calories: 340, proteins: 22, carbohydrates: 55, fats: 3, fiber: 12, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'fideos_udon', nameEs: 'Fideos udon', nameEn: 'Udon noodles', category: 'cereales', calories: 130, proteins: 4, carbohydrates: 27, fats: 0.5, fiber: 1, sodium: 220, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'fideos_soba', nameEs: 'Fideos soba', nameEn: 'Soba noodles', category: 'cereales', calories: 336, proteins: 14, carbohydrates: 70, fats: 1.5, fiber: 2, sodium: 60, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'fideos_ramen', nameEs: 'Fideos ramen', nameEn: 'Ramen noodles', category: 'cereales', calories: 350, proteins: 10, carbohydrates: 70, fats: 3, fiber: 2, sodium: 1200, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'fideos_arroz', nameEs: 'Fideos de arroz', nameEn: 'Rice noodles', category: 'cereales', calories: 364, proteins: 7, carbohydrates: 80, fats: 0.5, fiber: 1.5, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'fideos_celofán', nameEs: 'Fideos de celofán (glass noodles)', nameEn: 'Glass noodles', category: 'cereales', calories: 351, proteins: 0.2, carbohydrates: 87, fats: 0.1, fiber: 0.5, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'cuscus', nameEs: 'Cuscús', nameEn: 'Couscous', category: 'cereales', calories: 376, proteins: 13, carbohydrates: 77, fats: 0.6, fiber: 5, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'bulgur', nameEs: 'Bulgur', nameEn: 'Bulgur wheat', category: 'cereales', calories: 342, proteins: 12, carbohydrates: 76, fats: 1.3, fiber: 18, sodium: 17, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'mijo', nameEs: 'Mijo', nameEn: 'Millet', category: 'cereales', calories: 378, proteins: 11, carbohydrates: 73, fats: 4.2, fiber: 8.5, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'sorgo', nameEs: 'Sorgo', nameEn: 'Sorghum', category: 'cereales', calories: 329, proteins: 11, carbohydrates: 72, fats: 3.5, fiber: 6.3, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'farro', nameEs: 'Farro (espelta verde)', nameEn: 'Farro', category: 'cereales', calories: 340, proteins: 14, carbohydrates: 68, fats: 2.5, fiber: 7, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'trigo_sarraceno', nameEs: 'Trigo sarraceno', nameEn: 'Buckwheat', category: 'cereales', calories: 343, proteins: 13, carbohydrates: 72, fats: 3.4, fiber: 10, sodium: 1, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'polenta', nameEs: 'Polenta (harina de maíz)', nameEn: 'Polenta', category: 'cereales', calories: 362, proteins: 8, carbohydrates: 79, fats: 2, fiber: 7, sodium: 35, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'arroz_integral', nameEs: 'Arroz integral', nameEn: 'Brown rice', category: 'cereales', calories: 370, proteins: 7.5, carbohydrates: 77, fats: 2.7, fiber: 3.5, sodium: 7, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'arroz_basmati', nameEs: 'Arroz basmati', nameEn: 'Basmati rice', category: 'cereales', calories: 364, proteins: 7, carbohydrates: 79, fats: 0.5, fiber: 0.5, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'arroz_jazmín', nameEs: 'Arroz jazmín', nameEn: 'Jasmine rice', category: 'cereales', calories: 364, proteins: 7, carbohydrates: 79, fats: 0.5, fiber: 0.5, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'arroz_negro', nameEs: 'Arroz negro', nameEn: 'Black rice', category: 'cereales', calories: 356, proteins: 9, carbohydrates: 75, fats: 2, fiber: 4, sodium: 4, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'arroz_rojo', nameEs: 'Arroz rojo', nameEn: 'Red rice', category: 'cereales', calories: 357, proteins: 8, carbohydrates: 75, fats: 2, fiber: 3.5, sodium: 4, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'arroz_sushi', nameEs: 'Arroz para sushi', nameEn: 'Sushi rice', category: 'cereales', calories: 356, proteins: 6.5, carbohydrates: 79, fats: 0.5, fiber: 0.3, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'arroz_salvaje', nameEs: 'Arroz salvaje', nameEn: 'Wild rice', category: 'cereales', calories: 357, proteins: 15, carbohydrates: 75, fats: 1.1, fiber: 6, sodium: 7, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
];

// ─── HARINAS EXTRA ────────────────────────────────────────────────────────────
const harinas = [
  { apiParam: 'harina_trigo', nameEs: 'Harina de trigo', nameEn: 'Wheat flour', category: 'cereales', calories: 364, proteins: 10, carbohydrates: 76, fats: 1, fiber: 3, sodium: 2, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true, purchaseUnitType: 'weight', purchaseUnitSingular: 'bolsa', purchaseUnitPlural: 'bolsas' },
  { apiParam: 'harina_integral', nameEs: 'Harina integral', nameEn: 'Whole wheat flour', category: 'cereales', calories: 340, proteins: 13, carbohydrates: 72, fats: 2, fiber: 11, sodium: 2, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'harina_espelta', nameEs: 'Harina de espelta', nameEn: 'Spelt flour', category: 'cereales', calories: 338, proteins: 14, carbohydrates: 70, fats: 2.5, fiber: 8, sodium: 2, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'harina_arroz', nameEs: 'Harina de arroz', nameEn: 'Rice flour', category: 'cereales', calories: 366, proteins: 6, carbohydrates: 80, fats: 1.4, fiber: 2.4, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'harina_maiz', nameEs: 'Harina de maíz', nameEn: 'Corn flour', category: 'cereales', calories: 361, proteins: 7, carbohydrates: 79, fats: 3.6, fiber: 7, sodium: 35, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'harina_almendra', nameEs: 'Harina de almendra', nameEn: 'Almond flour', category: 'cereales', calories: 571, proteins: 21, carbohydrates: 21, fats: 50, fiber: 11, sodium: 1, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'harina_coco', nameEs: 'Harina de coco', nameEn: 'Coconut flour', category: 'cereales', calories: 400, proteins: 19, carbohydrates: 60, fats: 13, fiber: 40, sodium: 80, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'harina_garbanzo', nameEs: 'Harina de garbanzo', nameEn: 'Chickpea flour', category: 'cereales', calories: 387, proteins: 22, carbohydrates: 58, fats: 6, fiber: 11, sodium: 64, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'harina_avena', nameEs: 'Harina de avena', nameEn: 'Oat flour', category: 'cereales', calories: 404, proteins: 15, carbohydrates: 66, fats: 8, fiber: 10, sodium: 8, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'harina_tapioca', nameEs: 'Harina de tapioca', nameEn: 'Tapioca flour', category: 'cereales', calories: 358, proteins: 0.2, carbohydrates: 88, fats: 0.1, fiber: 0.9, sodium: 1, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'harina_sarraceno', nameEs: 'Harina de trigo sarraceno', nameEn: 'Buckwheat flour', category: 'cereales', calories: 335, proteins: 13, carbohydrates: 71, fats: 3.1, fiber: 10, sodium: 11, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'harina_centeno', nameEs: 'Harina de centeno', nameEn: 'Rye flour', category: 'cereales', calories: 335, proteins: 9, carbohydrates: 73, fats: 2, fiber: 15, sodium: 2, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'maizena', nameEs: 'Maizena (almidón de maíz)', nameEn: 'Cornstarch', category: 'cereales', calories: 381, proteins: 0.3, carbohydrates: 91, fats: 0.1, fiber: 0.9, sodium: 9, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'harina_quinoa', nameEs: 'Harina de quinoa', nameEn: 'Quinoa flour', category: 'cereales', calories: 368, proteins: 14, carbohydrates: 64, fats: 6, fiber: 7, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
];

// ─── LÁCTEOS ALTERNATIVOS EXTRA ───────────────────────────────────────────────
const lacteosAlternativos = [
  { apiParam: 'leche_almendra', nameEs: 'Leche de almendra', nameEn: 'Almond milk', category: 'lacteos_alternativos', calories: 17, proteins: 0.5, carbohydrates: 0.7, fats: 1.5, sodium: 72, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true, purchaseUnitType: 'volume', purchaseUnitSingular: 'brick', purchaseUnitPlural: 'bricks' },
  { apiParam: 'leche_avena', nameEs: 'Leche de avena', nameEn: 'Oat milk', category: 'lacteos_alternativos', calories: 47, proteins: 1, carbohydrates: 9, fats: 1.5, fiber: 0.5, sodium: 52, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'leche_soja', nameEs: 'Leche de soja', nameEn: 'Soy milk', category: 'lacteos_alternativos', calories: 54, proteins: 3.3, carbohydrates: 6, fats: 1.8, sodium: 51, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'leche_coco', nameEs: 'Leche de coco (bebida)', nameEn: 'Coconut milk drink', category: 'lacteos_alternativos', calories: 45, proteins: 0.5, carbohydrates: 4, fats: 3, saturatedFats: 2.5, sodium: 40, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'leche_arroz', nameEs: 'Leche de arroz', nameEn: 'Rice milk', category: 'lacteos_alternativos', calories: 47, proteins: 0.3, carbohydrates: 10, fats: 1, sodium: 39, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'leche_cáñamo', nameEs: 'Leche de cáñamo', nameEn: 'Hemp milk', category: 'lacteos_alternativos', calories: 33, proteins: 1.5, carbohydrates: 1.3, fats: 2.5, sodium: 80, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'leche_macadamia', nameEs: 'Leche de macadamia', nameEn: 'Macadamia milk', category: 'lacteos_alternativos', calories: 50, proteins: 0.5, carbohydrates: 1, fats: 5, saturatedFats: 1, sodium: 80, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'leche_anacardo', nameEs: 'Leche de anacardo', nameEn: 'Cashew milk', category: 'lacteos_alternativos', calories: 25, proteins: 0.5, carbohydrates: 2, fats: 2, sodium: 65, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'yogur_soja', nameEs: 'Yogur de soja', nameEn: 'Soy yogurt', category: 'lacteos_alternativos', calories: 60, proteins: 4, carbohydrates: 7, fats: 1.5, sodium: 55, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'yogur_coco', nameEs: 'Yogur de coco', nameEn: 'Coconut yogurt', category: 'lacteos_alternativos', calories: 90, proteins: 0.5, carbohydrates: 8, fats: 6, saturatedFats: 5, sodium: 30, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'yogur_almendra', nameEs: 'Yogur de almendra', nameEn: 'Almond yogurt', category: 'lacteos_alternativos', calories: 55, proteins: 1.5, carbohydrates: 7, fats: 2.5, sodium: 45, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'nata_coco', nameEs: 'Nata de coco', nameEn: 'Coconut cream', category: 'lacteos_alternativos', calories: 330, proteins: 3, carbohydrates: 6, fats: 34, saturatedFats: 30, sodium: 15, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'queso_vegano', nameEs: 'Queso vegano', nameEn: 'Vegan cheese', category: 'lacteos_alternativos', calories: 280, proteins: 4, carbohydrates: 20, fats: 22, saturatedFats: 10, sodium: 580, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mantequilla_vegana', nameEs: 'Mantequilla vegana', nameEn: 'Vegan butter', category: 'lacteos_alternativos', calories: 720, proteins: 0.1, carbohydrates: 0.5, fats: 80, saturatedFats: 25, sodium: 580, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'crema_avena', nameEs: 'Crema de avena para cocinar', nameEn: 'Oat cooking cream', category: 'lacteos_alternativos', calories: 95, proteins: 1, carbohydrates: 9, fats: 6, sodium: 80, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
];

// ─── DULCES EXTRA ─────────────────────────────────────────────────────────────
const dulces = [
  { apiParam: 'chocolate_negro_70', nameEs: 'Chocolate negro 70%', nameEn: 'Dark chocolate 70%', category: 'dulces', calories: 598, proteins: 8, carbohydrates: 46, fats: 43, fiber: 11, sugars: 28, sodium: 20, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true, purchaseUnitType: 'weight', purchaseUnitSingular: 'tableta', purchaseUnitPlural: 'tabletas' },
  { apiParam: 'chocolate_negro_85', nameEs: 'Chocolate negro 85%', nameEn: 'Dark chocolate 85%', category: 'dulces', calories: 620, proteins: 10, carbohydrates: 36, fats: 48, fiber: 14, sugars: 18, sodium: 20, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'chocolate_negro_90', nameEs: 'Chocolate negro 90%', nameEn: 'Dark chocolate 90%', category: 'dulces', calories: 630, proteins: 11, carbohydrates: 30, fats: 50, fiber: 16, sugars: 12, sodium: 20, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'chocolate_con_leche', nameEs: 'Chocolate con leche', nameEn: 'Milk chocolate', category: 'dulces', calories: 535, proteins: 7.5, carbohydrates: 60, fats: 30, fiber: 3, sugars: 55, sodium: 80, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'chocolate_blanco', nameEs: 'Chocolate blanco', nameEn: 'White chocolate', category: 'dulces', calories: 539, proteins: 6, carbohydrates: 60, fats: 32, fiber: 0, sugars: 58, sodium: 90, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'cacao_polvo', nameEs: 'Cacao en polvo sin azúcar', nameEn: 'Unsweetened cocoa powder', category: 'dulces', calories: 228, proteins: 20, carbohydrates: 58, fats: 14, fiber: 33, sodium: 21, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'cacao_polvo_alcalinizado', nameEs: 'Cacao en polvo alcalinizado', nameEn: 'Dutch process cocoa powder', category: 'dulces', calories: 228, proteins: 20, carbohydrates: 58, fats: 14, fiber: 33, sodium: 21, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'pasta_cacao', nameEs: 'Pasta de cacao puro', nameEn: 'Cacao paste', category: 'dulces', calories: 600, proteins: 15, carbohydrates: 30, fats: 55, fiber: 15, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mantequilla_cacao', nameEs: 'Manteca de cacao', nameEn: 'Cacao butter', category: 'dulces', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, saturatedFats: 60, sodium: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'crema_avellanas', nameEs: 'Crema de avellanas y cacao', nameEn: 'Hazelnut chocolate spread', category: 'dulces', calories: 539, proteins: 6, carbohydrates: 58, fats: 31, fiber: 3, sugars: 55, sodium: 50, isVegan: false, isVegetarian: true, isGlutenFree: false, isDairyFree: false },
  { apiParam: 'mermelada_fresa', nameEs: 'Mermelada de fresa', nameEn: 'Strawberry jam', category: 'dulces', calories: 250, proteins: 0.5, carbohydrates: 65, fats: 0.1, sugars: 60, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mermelada_albaricoque', nameEs: 'Mermelada de albaricoque', nameEn: 'Apricot jam', category: 'dulces', calories: 250, proteins: 0.5, carbohydrates: 65, fats: 0.1, sugars: 60, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mermelada_naranja', nameEs: 'Mermelada de naranja', nameEn: 'Orange marmalade', category: 'dulces', calories: 250, proteins: 0.3, carbohydrates: 65, fats: 0.1, sugars: 60, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mermelada_frambuesa', nameEs: 'Mermelada de frambuesa', nameEn: 'Raspberry jam', category: 'dulces', calories: 250, proteins: 0.5, carbohydrates: 65, fats: 0.1, sugars: 60, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mermelada_melocotón', nameEs: 'Mermelada de melocotón', nameEn: 'Peach jam', category: 'dulces', calories: 250, proteins: 0.5, carbohydrates: 65, fats: 0.1, sugars: 60, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'miel_acacia', nameEs: 'Miel de acacia', nameEn: 'Acacia honey', category: 'dulces', calories: 304, proteins: 0.3, carbohydrates: 82, fats: 0, sugars: 80, sodium: 4, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'miel_romero', nameEs: 'Miel de romero', nameEn: 'Rosemary honey', category: 'dulces', calories: 304, proteins: 0.3, carbohydrates: 82, fats: 0, sugars: 80, sodium: 4, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'miel_manuka', nameEs: 'Miel de manuka', nameEn: 'Manuka honey', category: 'dulces', calories: 304, proteins: 0.3, carbohydrates: 82, fats: 0, sugars: 80, sodium: 4, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'sirope_arce', nameEs: 'Sirope de arce', nameEn: 'Maple syrup', category: 'dulces', calories: 260, proteins: 0, carbohydrates: 67, fats: 0.1, sugars: 60, sodium: 9, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'sirope_agave', nameEs: 'Sirope de agave', nameEn: 'Agave syrup', category: 'dulces', calories: 310, proteins: 0.1, carbohydrates: 76, fats: 0.5, sugars: 68, sodium: 4, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'sirope_dátil', nameEs: 'Sirope de dátil', nameEn: 'Date syrup', category: 'dulces', calories: 280, proteins: 1, carbohydrates: 72, fats: 0.1, sugars: 65, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'sirope_yacón', nameEs: 'Sirope de yacón', nameEn: 'Yacon syrup', category: 'dulces', calories: 135, proteins: 0.5, carbohydrates: 35, fats: 0.1, fiber: 25, sugars: 10, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'melaza', nameEs: 'Melaza', nameEn: 'Molasses', category: 'dulces', calories: 290, proteins: 0, carbohydrates: 75, fats: 0.1, sugars: 55, sodium: 37, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'azucar_coco', nameEs: 'Azúcar de coco', nameEn: 'Coconut sugar', category: 'dulces', calories: 375, proteins: 0, carbohydrates: 100, fats: 0, sugars: 95, sodium: 45, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'azucar_panela', nameEs: 'Panela (azúcar moreno integral)', nameEn: 'Panela sugar', category: 'dulces', calories: 380, proteins: 0.3, carbohydrates: 98, fats: 0, sugars: 95, sodium: 30, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'pasta_almendra', nameEs: 'Pasta de almendra (mazapán)', nameEn: 'Almond paste (marzipan)', category: 'dulces', calories: 450, proteins: 8, carbohydrates: 60, fats: 22, fiber: 4, sugars: 55, sodium: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'caramelo_liquido', nameEs: 'Caramelo líquido', nameEn: 'Liquid caramel', category: 'dulces', calories: 380, proteins: 0.5, carbohydrates: 95, fats: 0.5, sugars: 90, sodium: 180, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'gelatina_sin_sabor', nameEs: 'Gelatina sin sabor', nameEn: 'Unflavored gelatin', category: 'dulces', calories: 335, proteins: 85, carbohydrates: 0, fats: 0, sodium: 196, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'agar_agar', nameEs: 'Agar agar', nameEn: 'Agar agar', category: 'dulces', calories: 26, proteins: 0.5, carbohydrates: 7, fats: 0, fiber: 7, sodium: 9, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'levadura_quimica', nameEs: 'Levadura química (polvo de hornear)', nameEn: 'Baking powder', category: 'dulces', calories: 53, proteins: 0, carbohydrates: 28, fats: 0, sodium: 10600, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'bicarbonato_sodio', nameEs: 'Bicarbonato de sodio', nameEn: 'Baking soda', category: 'dulces', calories: 0, proteins: 0, carbohydrates: 0, fats: 0, sodium: 27360, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'extracto_vainilla', nameEs: 'Extracto de vainilla', nameEn: 'Vanilla extract', category: 'dulces', calories: 288, proteins: 0.1, carbohydrates: 13, fats: 0.1, sodium: 9, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'vainilla_en_polvo', nameEs: 'Vainilla en polvo', nameEn: 'Vanilla powder', category: 'dulces', calories: 288, proteins: 0.1, carbohydrates: 13, fats: 0.1, sodium: 9, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'azucar_glas', nameEs: 'Azúcar glas (impalpable)', nameEn: 'Powdered sugar', category: 'dulces', calories: 389, proteins: 0, carbohydrates: 100, fats: 0, sugars: 98, sodium: 1, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'azucar_moreno', nameEs: 'Azúcar moreno', nameEn: 'Brown sugar', category: 'dulces', calories: 380, proteins: 0, carbohydrates: 98, fats: 0, sugars: 96, sodium: 28, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
];

// ─── PROTEÍNAS VEGETALES EXTRA ────────────────────────────────────────────────
const proteinasVegetales = [
  { apiParam: 'tofu_firme', nameEs: 'Tofu firme', nameEn: 'Firm tofu', category: 'proteinas_vegetales', calories: 76, proteins: 8, carbohydrates: 1.9, fats: 4.8, sodium: 7, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true, purchaseUnitType: 'weight', purchaseUnitSingular: 'bloque', purchaseUnitPlural: 'bloques' },
  { apiParam: 'tofu_sedoso', nameEs: 'Tofu sedoso', nameEn: 'Silken tofu', category: 'proteinas_vegetales', calories: 55, proteins: 5, carbohydrates: 2, fats: 3, sodium: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'tofu_ahumado', nameEs: 'Tofu ahumado', nameEn: 'Smoked tofu', category: 'proteinas_vegetales', calories: 120, proteins: 14, carbohydrates: 2, fats: 6, sodium: 380, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'tempeh', nameEs: 'Tempeh', nameEn: 'Tempeh', category: 'proteinas_vegetales', calories: 193, proteins: 19, carbohydrates: 9, fats: 11, fiber: 9, sodium: 9, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'seitán', nameEs: 'Seitán', nameEn: 'Seitan', category: 'proteinas_vegetales', calories: 370, proteins: 75, carbohydrates: 14, fats: 2, sodium: 580, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'edamame', nameEs: 'Edamame', nameEn: 'Edamame', category: 'proteinas_vegetales', calories: 121, proteins: 11, carbohydrates: 9, fats: 5, fiber: 5, sodium: 6, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'proteina_soja_texturizada', nameEs: 'Proteína de soja texturizada (soja texturizada)', nameEn: 'Textured soy protein', category: 'proteinas_vegetales', calories: 330, proteins: 52, carbohydrates: 30, fats: 1, fiber: 14, sodium: 1, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'proteina_guisante', nameEs: 'Proteína de guisante', nameEn: 'Pea protein', category: 'proteinas_vegetales', calories: 360, proteins: 80, carbohydrates: 5, fats: 3, sodium: 400, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'proteina_arroz', nameEs: 'Proteína de arroz', nameEn: 'Rice protein', category: 'proteinas_vegetales', calories: 370, proteins: 78, carbohydrates: 10, fats: 3, sodium: 200, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'jackfruit_verde', nameEs: 'Jackfruit verde (jaca verde)', nameEn: 'Green jackfruit', category: 'proteinas_vegetales', calories: 95, proteins: 1.7, carbohydrates: 23, fats: 0.6, fiber: 1.5, sodium: 3, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'lupino', nameEs: 'Lupino (altramuces)', nameEn: 'Lupin beans', category: 'proteinas_vegetales', calories: 371, proteins: 36, carbohydrates: 40, fats: 9.7, fiber: 19, sodium: 55, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const allGroups = [
    { name: 'salsas', items: salsas },
    { name: 'aceites extra', items: aceites },
    { name: 'vinagres', items: vinagres },
    { name: 'aderezos', items: aderezos },
    { name: 'semillas', items: semillas },
    { name: 'pasta y cereales', items: pastaCereales },
    { name: 'harinas', items: harinas },
    { name: 'lácteos alternativos', items: lacteosAlternativos },
    { name: 'dulces', items: dulces },
    { name: 'proteínas vegetales', items: proteinasVegetales },
  ];

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const group of allGroups) {
    const { inserted, skipped } = await insertIngredients(group.items);
    console.log(`[${group.name}] Insertados: ${inserted}, Omitidos (ya existían): ${skipped}`);
    totalInserted += inserted;
    totalSkipped += skipped;
  }

  console.log(`\n✅ Total insertados: ${totalInserted}`);
  console.log(`⏭️  Total omitidos: ${totalSkipped}`);
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  pool.end();
  process.exit(1);
});
