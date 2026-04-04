/**
 * Seed demo data for owner user (id=1, Luis Maria Cabello)
 * Simulates 1 month of active usage for demo purposes
 */
import { createConnection } from 'mysql2/promise';
import 'dotenv/config';

const USER_ID = 1;

// Recipe IDs by meal time (from DB query)
const DESAYUNO = [268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287];
const MEDIA    = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
const COMIDA   = [100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129];
const MERIENDA = [173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192];
const CENA     = [348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377];

const pick = (arr, i) => arr[Math.abs(i) % arr.length];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const BASE = new Date('2026-03-04');
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const fmt = (d) => d.toISOString().split('T')[0];
const fmtTs = (d) => d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  console.log('✅ Conectado a la BD');

  // ── 1. Update user profile ────────────────────────────────────────────────
  console.log('\n📋 Actualizando perfil de usuario...');
  await conn.execute(`
    UPDATE user_profiles SET
      age = 31, birthYear = 1994, height = 180, weight = 97, targetWeight = 85,
      bodyFatPercentage = 29, muscleMass = 68, basalMetabolicRate = 2050,
      dailyCalorieGoal = 2200, dailyProteinGoal = 165, dailyCarbsGoal = 220, dailyFatGoal = 65,
      sleepHours = 7, dailyMeals = 5, gender = 'male', cookingLevel = 'intermediate',
      activityLevel = 'active', mainGoal = 'lose_weight', heightUnit = 'cm', weightUnit = 'kg',
      practicesSports = 1, sportsFrequency = '5_plus_week',
      sportsTypes = '["gym","cycling","running"]',
      workType = 'sedentary_desk', stressLevel = 'moderate', waterIntake = 2.5,
      alcoholConsumption = 'occasional', smokingStatus = 'ex_smoker', weightChangeRate = 0.5,
      mealPrepTime = '15_30', budgetPerWeek = 80,
      favoriteCuisines = '["spanish","italian","mediterranean"]',
      dislikedIngredients = '["casqueria","esparragos","remolacha"]',
      cookingEquipment = '["airfryer","oven","microwave","grill","blender"]',
      snackingHabits = 'sometimes', eatOutFrequency = '1_2_week',
      fitnessGoalDetail = 'Llegar a 85kg antes del verano, mejorar composición corporal',
      motivationLevel = 'very_high',
      previousDietExperience = '["none"]'
    WHERE userId = ?
  `, [USER_ID]);
  console.log('  ✅ Perfil actualizado');

  // ── 2. User preferences ───────────────────────────────────────────────────
  console.log('\n⚙️  Actualizando preferencias...');
  await conn.execute(`
    INSERT INTO user_preferences (userId, purchaseFrequency, purchaseLocation,
      suggestHealthierProducts, suggestCheaperProducts, organicProducts,
      interestedInNutritionalAdvices, notifications, newsletter, acceptTerms,
      preferredMealComplexity, portionSize, preferSeasonalIngredients, preferLocalProducts,
      avoidProcessedFood, interestedInMealPrep, wantsShoppingListAutomation,
      wantsCalorieTracking, wantsMacroTracking)
    VALUES (?, 'weekly', 'mercadona', 1, 1, 0, 1, 1, 1, 1,
      'moderate', 'large', 1, 0, 1, 1, 1, 1, 1)
    ON DUPLICATE KEY UPDATE
      purchaseFrequency='weekly', purchaseLocation='mercadona',
      suggestHealthierProducts=1, suggestCheaperProducts=1, organicProducts=0,
      interestedInNutritionalAdvices=1, notifications=1, newsletter=1, acceptTerms=1,
      preferredMealComplexity='moderate', portionSize='large', preferSeasonalIngredients=1,
      preferLocalProducts=0, avoidProcessedFood=1, interestedInMealPrep=1,
      wantsShoppingListAutomation=1, wantsCalorieTracking=1, wantsMacroTracking=1
  `, [USER_ID]);
  console.log('  ✅ Preferencias actualizadas');

  // ── 3. Medical profile ────────────────────────────────────────────────────
  console.log('\n🏥 Actualizando perfil médico...');
  await conn.execute(`
    INSERT INTO user_medical_profiles (userId, useNutritionalSupplements, nutritionalSupplements,
      hasMedicalDiet, hasSurgery, hasMedicalFamilyBackground, useMetabolismMedication,
      hasMedicalConditions, dietaryPattern, lifestyle)
    VALUES (?, 1, 'Proteína de suero (whey), Creatina 5g/día, Vitamina D3',
      0, 0, 0, 0, 0, 'omnivore', 'active')
    ON DUPLICATE KEY UPDATE
      useNutritionalSupplements=1,
      nutritionalSupplements='Proteína de suero (whey), Creatina 5g/día, Vitamina D3',
      hasMedicalDiet=0, hasSurgery=0, hasMedicalFamilyBackground=0,
      useMetabolismMedication=0, hasMedicalConditions=0,
      dietaryPattern='omnivore', lifestyle='active'
  `, [USER_ID]);
  console.log('  ✅ Perfil médico actualizado');

  // ── 4. Weight/metrics history (30 days) ──────────────────────────────────
  console.log('\n📊 Insertando historial de métricas...');
  await conn.execute('DELETE FROM user_metrics WHERE userId=?', [USER_ID]);
  await conn.execute('DELETE FROM user_health_metrics WHERE userId=?', [USER_ID]);

  const startWeight = 97.2;
  for (let day = 0; day < 30; day++) {
    if (day % 3 !== 0) continue; // every 3 days
    const date = fmt(addDays(BASE, day));
    const weight = parseFloat((startWeight - day * 0.071 + (Math.random() * 0.3 - 0.15)).toFixed(1));
    const bodyFat = parseFloat((29 - day * 0.03).toFixed(1));
    const bmi = parseFloat((weight / (1.80 * 1.80)).toFixed(1));
    await conn.execute(
      'INSERT INTO user_metrics (userId, date, weight, bodyFat, bmi, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [USER_ID, date, weight, bodyFat, bmi,
        day === 0 ? 'Inicio del plan' : day === 15 ? 'Mitad del mes — ¡buen progreso!' : null]
    );
    await conn.execute(
      'INSERT INTO user_health_metrics (userId, weight, bodyFatPercentage, recordedAt) VALUES (?, ?, ?, ?)',
      [USER_ID, weight, bodyFat, date]
    );
  }
  console.log('  ✅ Historial de métricas insertado (10 registros)');

  // ── 5. Recipe favorites ───────────────────────────────────────────────────
  console.log('\n❤️  Añadiendo recetas favoritas...');
  await conn.execute('DELETE FROM recipe_favorites WHERE userId=?', [USER_ID]);
  const favRecipes = [100, 146, 149, 152, 156, 268, 270, 348, 352, 355, 22, 29, 173, 180, 110, 120, 130];
  for (const recipeId of favRecipes) {
    await conn.execute(
      'INSERT IGNORE INTO recipe_favorites (userId, recipeId) VALUES (?, ?)',
      [USER_ID, recipeId]
    ).catch(() => {});
  }
  console.log(`  ✅ ${favRecipes.length} recetas favoritas`);

  // ── 6. Menu organizers (4 weeks) ──────────────────────────────────────────
  console.log('\n📅 Creando menús semanales (4 semanas)...');

  // Clean up existing menus
  const [existingMenus] = await conn.execute('SELECT id FROM menu_organizers WHERE userId=?', [USER_ID]);
  for (const m of existingMenus) {
    const [dps] = await conn.execute('SELECT id FROM menu_organizer_day_parts WHERE menuOrganizerId=?', [m.id]);
    for (const dp of dps) {
      await conn.execute('DELETE FROM menu_dp_recipes WHERE menuOrganizerDayPartId=?', [dp.id]);
    }
    await conn.execute('DELETE FROM menu_organizer_day_parts WHERE menuOrganizerId=?', [m.id]);
  }
  await conn.execute('DELETE FROM menu_organizers WHERE userId=?', [USER_ID]);

  const menuNames = [
    'Semana 1 — Inicio del plan',
    'Semana 2 — Déficit calórico',
    'Semana 3 — Progreso constante',
    'Semana 4 — Semana actual',
  ];
  const menuGoals = ['perdida_peso', 'perdida_peso', 'perdida_grasa', 'perdida_peso'];
  const dayPartIds = [1, 2, 3, 4, 5]; // Desayuno, Media mañana, Almuerzo, Merienda, Cena
  const recipePools = [DESAYUNO, MEDIA, COMIDA, MERIENDA, CENA];

  for (let week = 0; week < 4; week++) {
    const startDate = fmt(addDays(BASE, week * 7));
    const endDate   = fmt(addDays(BASE, week * 7 + 6));
    const isActive  = week === 3;

    const [menuRes] = await conn.execute(`
      INSERT INTO menu_organizers
        (userId, name, startDate, endDate, type, isPublic, objective,
         dailyMealsCount, generatedByAI, goal, dailyCalories, persons, difficulty, isSeeded, isActive)
      VALUES (?, ?, ?, ?, 'weekly', 0,
        'Pérdida de peso saludable con déficit calórico moderado',
        5, 1, ?, 2200, 1, 'medio', 0, ?)
    `, [USER_ID, menuNames[week], startDate, endDate, menuGoals[week], isActive ? 1 : 0]);

    const menuId = menuRes.insertId;

    for (let day = 0; day < 7; day++) {
      const date = fmt(addDays(BASE, week * 7 + day));
      const isPastDay = week < 3 || (week === 3 && day < 4);

      for (let meal = 0; meal < 5; meal++) {
        const dpId = dayPartIds[meal];
        const recipeId = pick(recipePools[meal], week * 7 + day + meal * 3);

        const [dpRes] = await conn.execute(`
          INSERT INTO menu_organizer_day_parts
            (menuOrganizerId, dayPartId, date, dayNumber, mealNumber, completed)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [menuId, dpId, date, day + 1, meal + 1, isPastDay ? 1 : 0]);

        await conn.execute(`
          INSERT INTO menu_dp_recipes (menuOrganizerDayPartId, recipeId, servings, completed)
          VALUES (?, ?, 1.0, ?)
        `, [dpRes.insertId, recipeId, isPastDay ? 1 : 0]);
      }
    }
    console.log(`  ✅ "${menuNames[week]}" (id=${menuId})`);
  }

  // ── 7. Meal logs (28 days) ────────────────────────────────────────────────
  console.log('\n🍽️  Insertando registro de comidas (28 días)...');
  await conn.execute('DELETE FROM meal_logs WHERE userId=?', [USER_ID]);

  const mealSlots = [
    { dpId: 1, pool: DESAYUNO, cal: 350, prot: 25, carbs: 40, fat: 12 },
    { dpId: 2, pool: MEDIA,    cal: 180, prot: 8,  carbs: 20, fat: 8  },
    { dpId: 3, pool: COMIDA,   cal: 520, prot: 40, carbs: 55, fat: 15 },
    { dpId: 4, pool: MERIENDA, cal: 200, prot: 10, carbs: 22, fat: 9  },
    { dpId: 5, pool: CENA,     cal: 420, prot: 35, carbs: 35, fat: 14 },
  ];

  for (let day = 0; day < 28; day++) {
    const date = fmt(addDays(BASE, day));
    for (let m = 0; m < 5; m++) {
      // Skip media mañana ~30% of days, merienda ~20%
      if (m === 1 && rand(0, 2) === 0) continue;
      if (m === 3 && rand(0, 4) === 0) continue;
      const slot = mealSlots[m];
      const recipeId = pick(slot.pool, day + m * 5);
      const calVar = rand(-25, 25);
      await conn.execute(`
        INSERT INTO meal_logs
          (userId, recipeId, dayPartId, logDate, servings, calories, proteins, carbohydrates, fats)
        VALUES (?, ?, ?, ?, 1.0, ?, ?, ?, ?)
      `, [USER_ID, recipeId, slot.dpId, date, slot.cal + calVar, slot.prot, slot.carbs, slot.fat]);
    }
  }
  console.log('  ✅ Registro de comidas insertado');

  // ── 8. Complement logs (coffee, protein shake) ────────────────────────────
  console.log('\n☕ Insertando registro de complementos...');
  await conn.execute('DELETE FROM complement_logs WHERE userId=?', [USER_ID]);
  // Complement IDs: 1=Café solo, 2=Café con leche
  for (let day = 0; day < 28; day++) {
    const ts = fmtTs(addDays(BASE, day));
    // Morning coffee
    await conn.execute(
      'INSERT INTO complement_logs (userId, complementId, quantity, loggedAt, mealType) VALUES (?, 2, 1, ?, "desayuno")',
      [USER_ID, ts]
    );
    // Mid-morning coffee
    if (rand(0, 1) === 0) {
      await conn.execute(
        'INSERT INTO complement_logs (userId, complementId, quantity, loggedAt, mealType) VALUES (?, 1, 1, ?, "media_manana")',
        [USER_ID, ts]
      );
    }
  }
  console.log('  ✅ Complementos registrados');

  // ── 9. Pantry stock ───────────────────────────────────────────────────────
  console.log('\n🏪 Insertando inventario de despensa (pantry_stock)...');
  await conn.execute('DELETE FROM pantry_stock WHERE userId=?', [USER_ID]);

  const pantry = [
    { key: 'pechuga_pollo', name: 'Pechuga de pollo', label: 'Hacendado', qty: 800, avail: 800, grams: 800, expDays: 3 },
    { key: 'salmon_fresco', name: 'Salmón fresco', label: 'Pescadería', qty: 400, avail: 400, grams: 400, expDays: 2 },
    { key: 'huevos', name: 'Huevos L', label: 'Hacendado', qty: 12, avail: 10, grams: 660, expDays: 20 },
    { key: 'leche_semidesnata', name: 'Leche semidesnatada', label: 'Hacendado', qty: 2, avail: 1.5, grams: 1500, expDays: 7 },
    { key: 'yogur_natural', name: 'Yogur natural', label: 'Hacendado', qty: 8, avail: 4, grams: 800, expDays: 10 },
    { key: 'queso_fresco', name: 'Queso fresco batido 0%', label: 'Hacendado', qty: 500, avail: 300, grams: 300, expDays: 8 },
    { key: 'arroz_integral', name: 'Arroz integral', label: 'Hacendado', qty: 1000, avail: 600, grams: 600, expDays: 180 },
    { key: 'pasta_integral', name: 'Pasta integral', label: 'Hacendado', qty: 500, avail: 350, grams: 350, expDays: 180 },
    { key: 'lentejas', name: 'Lentejas pardinas', label: 'Hacendado', qty: 500, avail: 300, grams: 300, expDays: 365 },
    { key: 'garbanzos_cocidos', name: 'Garbanzos cocidos', label: 'Hacendado', qty: 400, avail: 400, grams: 400, expDays: 365 },
    { key: 'aceite_oliva', name: 'Aceite de oliva virgen extra', label: 'Carbonell', qty: 750, avail: 500, grams: 500, expDays: 365 },
    { key: 'tomates_cherry', name: 'Tomates cherry', label: 'Fresco', qty: 300, avail: 200, grams: 200, expDays: 5 },
    { key: 'espinacas', name: 'Espinacas frescas', label: 'Fresco', qty: 200, avail: 150, grams: 150, expDays: 4 },
    { key: 'brocoli', name: 'Brócoli', label: 'Fresco', qty: 400, avail: 400, grams: 400, expDays: 5 },
    { key: 'zanahoria', name: 'Zanahoria', label: 'Fresco', qty: 500, avail: 400, grams: 400, expDays: 14 },
    { key: 'cebolla', name: 'Cebolla', label: 'Fresco', qty: 3, avail: 2, grams: 300, expDays: 30 },
    { key: 'platano', name: 'Plátano', label: 'Fresco', qty: 5, avail: 3, grams: 450, expDays: 4 },
    { key: 'manzana', name: 'Manzana', label: 'Fresco', qty: 4, avail: 4, grams: 600, expDays: 10 },
    { key: 'almendras', name: 'Almendras crudas', label: 'Hacendado', qty: 200, avail: 150, grams: 150, expDays: 90 },
    { key: 'proteina_whey', name: 'Proteína whey chocolate', label: 'Optimum Nutrition', qty: 800, avail: 600, grams: 600, expDays: 180 },
    { key: 'avena', name: 'Copos de avena', label: 'Hacendado', qty: 500, avail: 350, grams: 350, expDays: 180 },
    { key: 'atun_lata', name: 'Atún en aceite de oliva', label: 'Calvo', qty: 4, avail: 3, grams: 480, expDays: 365 },
    { key: 'tomate_triturado', name: 'Tomate triturado', label: 'Hacendado', qty: 2, avail: 1, grams: 800, expDays: 365 },
  ];

  const now = fmtTs(new Date('2026-04-01'));
  for (const item of pantry) {
    const exp = fmtTs(addDays(new Date('2026-04-04'), item.expDays));
    await conn.execute(`
      INSERT INTO pantry_stock
        (userId, ingredientKey, ingredientName, commercialLabel,
         quantityPurchased, quantityAvailable, unitSizeGrams, estimatedExpiresAt, purchasedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [USER_ID, item.key, item.name, item.label, item.qty, item.avail, item.grams, exp, now]);
  }
  console.log(`  ✅ ${pantry.length} productos en despensa`);

  // ── 10. User inventory items ──────────────────────────────────────────────
  console.log('\n📦 Insertando inventario de usuario...');
  await conn.execute('DELETE FROM user_inventory_items WHERE userId=?', [USER_ID]);
  const inventoryItems = [
    { name: 'Pechuga de pollo', amount: 800, expDays: 3 },
    { name: 'Salmón fresco', amount: 400, expDays: 2 },
    { name: 'Huevos L', amount: 10, expDays: 20 },
    { name: 'Yogur natural', amount: 4, expDays: 10 },
    { name: 'Arroz integral', amount: 600, expDays: 180 },
    { name: 'Pasta integral', amount: 350, expDays: 180 },
    { name: 'Lentejas', amount: 300, expDays: 365 },
    { name: 'Aceite de oliva virgen extra', amount: 500, expDays: 365 },
    { name: 'Brócoli', amount: 400, expDays: 5 },
    { name: 'Espinacas frescas', amount: 150, expDays: 4 },
    { name: 'Almendras crudas', amount: 150, expDays: 90 },
    { name: 'Proteína whey', amount: 600, expDays: 180 },
    { name: 'Avena', amount: 350, expDays: 180 },
    { name: 'Atún en lata', amount: 3, expDays: 365 },
    { name: 'Plátano', amount: 3, expDays: 4 },
  ];
  for (const item of inventoryItems) {
    const expDate = fmt(addDays(new Date('2026-04-04'), item.expDays));
    await conn.execute(`
      INSERT INTO user_inventory_items (userId, customName, amount, expirationDate, purchaseDate)
      VALUES (?, ?, ?, ?, '2026-04-01')
    `, [USER_ID, item.name, item.amount, expDate]);
  }
  console.log(`  ✅ ${inventoryItems.length} items en inventario`);

  // ── 11. Shopping lists ────────────────────────────────────────────────────
  console.log('\n🛒 Creando listas de la compra...');
  const [existingSL] = await conn.execute('SELECT id FROM shopping_lists WHERE userId=?', [USER_ID]);
  for (const sl of existingSL) {
    await conn.execute('DELETE FROM shopping_list_items WHERE shoppingListId=?', [sl.id]);
  }
  await conn.execute('DELETE FROM shopping_lists WHERE userId=?', [USER_ID]);

  // Completed list (week 3)
  const [sl1] = await conn.execute(`
    INSERT INTO shopping_lists (userId, name, generatedByAI, completed, supermarket, persons)
    VALUES (?, 'Compra semana 3 — Mercadona', 1, 1, 'mercadona', 1)
  `, [USER_ID]);
  const sl1Items = [
    { name: 'Pechuga de pollo', amount: 1200, cat: 'Carne', checked: 1 },
    { name: 'Salmón fresco', amount: 600, cat: 'Pescado', checked: 1 },
    { name: 'Huevos L (docena)', amount: 12, cat: 'Huevos y lácteos', checked: 1 },
    { name: 'Yogur natural (pack 8)', amount: 8, cat: 'Huevos y lácteos', checked: 1 },
    { name: 'Leche semidesnatada', amount: 2, cat: 'Huevos y lácteos', checked: 1 },
    { name: 'Brócoli', amount: 800, cat: 'Fruta y verdura', checked: 1 },
    { name: 'Espinacas frescas', amount: 400, cat: 'Fruta y verdura', checked: 1 },
    { name: 'Tomates cherry', amount: 500, cat: 'Fruta y verdura', checked: 1 },
    { name: 'Plátanos', amount: 6, cat: 'Fruta y verdura', checked: 1 },
    { name: 'Arroz integral', amount: 1000, cat: 'Cereales y pasta', checked: 1 },
    { name: 'Pasta integral', amount: 500, cat: 'Cereales y pasta', checked: 1 },
    { name: 'Atún en aceite de oliva', amount: 4, cat: 'Conservas', checked: 1 },
    { name: 'Aceite de oliva virgen extra', amount: 750, cat: 'Aceites', checked: 1 },
    { name: 'Almendras crudas', amount: 200, cat: 'Frutos secos', checked: 1 },
  ];
  for (let i = 0; i < sl1Items.length; i++) {
    const it = sl1Items[i];
    await conn.execute(`
      INSERT INTO shopping_list_items (shoppingListId, customName, amount, category, checked, \`order\`)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sl1.insertId, it.name, it.amount, it.cat, it.checked, i + 1]);
  }

  // Current list (week 4, in progress)
  const [sl2] = await conn.execute(`
    INSERT INTO shopping_lists (userId, name, generatedByAI, completed, supermarket, persons)
    VALUES (?, 'Compra semana 4 — Mercadona', 1, 0, 'mercadona', 1)
  `, [USER_ID]);
  const sl2Items = [
    { name: 'Pechuga de pollo', amount: 1000, cat: 'Carne', checked: 1 },
    { name: 'Merluza filetes', amount: 600, cat: 'Pescado', checked: 1 },
    { name: 'Huevos L (docena)', amount: 12, cat: 'Huevos y lácteos', checked: 0 },
    { name: 'Queso fresco batido 0%', amount: 500, cat: 'Huevos y lácteos', checked: 0 },
    { name: 'Yogur griego 0%', amount: 4, cat: 'Huevos y lácteos', checked: 1 },
    { name: 'Aguacate', amount: 3, cat: 'Fruta y verdura', checked: 0 },
    { name: 'Espinacas baby', amount: 200, cat: 'Fruta y verdura', checked: 0 },
    { name: 'Pimientos rojos', amount: 3, cat: 'Fruta y verdura', checked: 1 },
    { name: 'Calabacín', amount: 2, cat: 'Fruta y verdura', checked: 0 },
    { name: 'Fresas', amount: 500, cat: 'Fruta y verdura', checked: 0 },
    { name: 'Lentejas pardinas', amount: 500, cat: 'Legumbres', checked: 0 },
    { name: 'Garbanzos cocidos', amount: 400, cat: 'Legumbres', checked: 1 },
    { name: 'Pan integral', amount: 1, cat: 'Panadería', checked: 0 },
    { name: 'Almendras crudas', amount: 200, cat: 'Frutos secos', checked: 0 },
    { name: 'Proteína whey chocolate', amount: 1, cat: 'Suplementos', checked: 0 },
  ];
  for (let i = 0; i < sl2Items.length; i++) {
    const it = sl2Items[i];
    await conn.execute(`
      INSERT INTO shopping_list_items (shoppingListId, customName, amount, category, checked, \`order\`)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sl2.insertId, it.name, it.amount, it.cat, it.checked, i + 1]);
  }
  console.log('  ✅ 2 listas de la compra creadas');

  // ── 12. User achievements ─────────────────────────────────────────────────
  console.log('\n🏆 Añadiendo logros...');
  await conn.execute('DELETE FROM user_achievements WHERE userId=?', [USER_ID]);

  const achievements = [
    { id: 'first_menu',       pts: 50,  day: 0  },
    { id: 'first_log',        pts: 25,  day: 1  },
    { id: 'shopping_list',    pts: 50,  day: 3  },
    { id: 'recipe_favorite',  pts: 75,  day: 5  },
    { id: 'macro_goal',       pts: 100, day: 10 },
    { id: 'week_streak',      pts: 100, day: 7  },
    { id: 'weight_loss_1kg',  pts: 200, day: 14 },
    { id: 'two_week_streak',  pts: 150, day: 14 },
    { id: 'pantry_complete',  pts: 75,  day: 2  },
    { id: 'month_streak',     pts: 300, day: 28 },
  ];

  for (const ach of achievements) {
    const ts = fmtTs(addDays(BASE, ach.day));
    await conn.execute(
      'INSERT IGNORE INTO user_achievements (userId, achievementId, unlockedAt, pointsAwarded) VALUES (?, ?, ?, ?)',
      [USER_ID, ach.id, ts, ach.pts]
    ).catch(() => {});
  }

  const totalPoints = achievements.reduce((s, a) => s + a.pts, 0);
  await conn.execute(`
    INSERT INTO user_points (userId, totalPoints, level)
    VALUES (?, ?, 4)
    ON DUPLICATE KEY UPDATE totalPoints=?, level=4
  `, [USER_ID, totalPoints, totalPoints]).catch(() => {});
  console.log(`  ✅ ${achievements.length} logros, ${totalPoints} puntos totales, nivel 4`);

  // ── 13. Meal reminders ────────────────────────────────────────────────────
  console.log('\n⏰ Configurando recordatorios...');
  await conn.execute('DELETE FROM meal_reminders WHERE userId=?', [USER_ID]).catch(() => {});
  const reminders = [
    { mealType: 'breakfast',   time: '08:00', days: '1111111' },
    { mealType: 'mid_morning', time: '11:00', days: '1111100' },
    { mealType: 'lunch',       time: '14:00', days: '1111111' },
    { mealType: 'snack',       time: '17:30', days: '1111100' },
    { mealType: 'dinner',      time: '21:00', days: '1111111' },
  ];
  for (const r of reminders) {
    await conn.execute(
      'INSERT IGNORE INTO meal_reminders (userId, mealType, time, enabled, daysMask) VALUES (?, ?, ?, 1, ?)',
      [USER_ID, r.mealType, r.time, r.days]
    ).catch(() => {});
  }
  console.log('  ✅ Recordatorios configurados');

  await conn.end();
  console.log('\n🎉 ¡Datos demo insertados correctamente!');
  console.log('   Usuario: Luis Maria Cabello (id=1)');
  console.log('   Período: 4 semanas de uso activo');
  console.log('   Datos: perfil completo, métricas, menús, comidas, despensa, listas, logros');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
