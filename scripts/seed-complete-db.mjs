/**
 * seed-complete-db.mjs
 * Rellena todas las tablas vacías de la BD con datos de ejemplo coherentes.
 * Tablas cubiertas:
 *  - instructionsJson en recipes (112 recetas)
 *  - ingredients (ingredientes normalizados)
 *  - recipe_ingredients (relación receta ↔ ingrediente)
 *  - recipe_steps (pasos de preparación)
 *  - complements (complementos del día)
 *  - buddy_makers (2 creadores de recetas)
 *  - expert_menus (menús semanales de los expertos)
 *  - recipe_allergies / recipe_diet_restrictions
 */
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function q(sql, params = []) {
  const r = await pool.query(sql, params);
  return r.rows;
}

// ─── 1. INSTRUCCIONES PARA RECETAS ───────────────────────────────────────────
// Mapa de instrucciones genéricas por tipo de receta
function buildInstructions(name) {
  const n = name.toLowerCase();
  if (n.includes('smoothie') || n.includes('batido')) {
    return [
      { step: 1, text: 'Lavar y pelar los ingredientes frescos.' },
      { step: 2, text: 'Introducir todos los ingredientes en la batidora.' },
      { step: 3, text: 'Triturar a velocidad alta durante 60 segundos hasta obtener una textura homogénea.' },
      { step: 4, text: 'Probar y ajustar el dulzor si es necesario.' },
      { step: 5, text: 'Servir inmediatamente en un vaso frío.' },
    ];
  }
  if (n.includes('ensalada') || n.includes('bowl') || n.includes('buddha')) {
    return [
      { step: 1, text: 'Lavar y secar bien todas las verduras y hojas.' },
      { step: 2, text: 'Cortar los ingredientes en trozos del tamaño deseado.' },
      { step: 3, text: 'Si hay proteína (pollo, atún, huevo), cocinarla o prepararla por separado.' },
      { step: 4, text: 'Disponer los ingredientes en el bol de forma ordenada y visual.' },
      { step: 5, text: 'Aliñar con aceite de oliva virgen extra, limón, sal y pimienta al gusto.' },
      { step: 6, text: 'Servir inmediatamente.' },
    ];
  }
  if (n.includes('porridge') || n.includes('avena') || n.includes('gachas')) {
    return [
      { step: 1, text: 'Medir la avena y el líquido (leche o agua) en las proporciones indicadas.' },
      { step: 2, text: 'Calentar en un cazo a fuego medio-bajo, removiendo constantemente.' },
      { step: 3, text: 'Cocinar durante 5-7 minutos hasta que la avena absorba el líquido y quede cremosa.' },
      { step: 4, text: 'Retirar del fuego y añadir los toppings: frutas, semillas, miel o frutos secos.' },
      { step: 5, text: 'Servir caliente en un bol.' },
    ];
  }
  if (n.includes('tortilla')) {
    return [
      { step: 1, text: 'Batir los huevos en un bol con una pizca de sal.' },
      { step: 2, text: 'Si hay verduras, saltearlas en una sartén con un poco de aceite hasta que estén tiernas.' },
      { step: 3, text: 'Añadir los huevos batidos sobre las verduras y cocinar a fuego medio.' },
      { step: 4, text: 'Cuando los bordes estén cuajados, dar la vuelta con ayuda de un plato.' },
      { step: 5, text: 'Cocinar 2 minutos más por el otro lado y servir.' },
    ];
  }
  if (n.includes('salmón') || n.includes('merluza') || n.includes('bacalao') || n.includes('dorada') || n.includes('lubina') || n.includes('sardinas')) {
    return [
      { step: 1, text: 'Precalentar el horno a 180°C o preparar la plancha a fuego medio-alto.' },
      { step: 2, text: 'Sazonar el pescado con sal, pimienta y hierbas aromáticas.' },
      { step: 3, text: 'Si se hornea, colocar en una bandeja con un chorrito de aceite y limón.' },
      { step: 4, text: 'Hornear 15-20 minutos (según el grosor) o cocinar a la plancha 3-4 min por lado.' },
      { step: 5, text: 'Acompañar con las verduras o guarnición indicada y servir caliente.' },
    ];
  }
  if (n.includes('pollo') || n.includes('pechuga') || n.includes('pavo')) {
    return [
      { step: 1, text: 'Limpiar y secar la carne con papel de cocina.' },
      { step: 2, text: 'Sazonar con sal, pimienta, ajo y las especias indicadas.' },
      { step: 3, text: 'Calentar una sartén o plancha con un poco de aceite a fuego medio-alto.' },
      { step: 4, text: 'Cocinar la carne 4-5 minutos por cada lado hasta que esté dorada y bien hecha.' },
      { step: 5, text: 'Dejar reposar 2 minutos antes de cortar y servir con la guarnición.' },
    ];
  }
  if (n.includes('lentejas') || n.includes('garbanzos') || n.includes('legumbre')) {
    return [
      { step: 1, text: 'Si son legumbres secas, dejarlas en remojo la noche anterior.' },
      { step: 2, text: 'Sofreír cebolla, ajo y pimiento en una olla con aceite de oliva.' },
      { step: 3, text: 'Añadir las especias y rehogar 1 minuto.' },
      { step: 4, text: 'Incorporar las legumbres (cocidas o en conserva) y el caldo o agua.' },
      { step: 5, text: 'Cocinar a fuego medio 20-30 minutos removiendo ocasionalmente.' },
      { step: 6, text: 'Rectificar de sal y servir caliente.' },
    ];
  }
  if (n.includes('pasta') || n.includes('arroz') || n.includes('quinoa')) {
    return [
      { step: 1, text: 'Cocer la pasta, arroz o quinoa en agua con sal según las instrucciones del paquete.' },
      { step: 2, text: 'Mientras tanto, preparar la salsa o el acompañamiento en una sartén.' },
      { step: 3, text: 'Escurrir el cereal y mezclar con la salsa.' },
      { step: 4, text: 'Añadir la proteína o verduras indicadas y mezclar bien.' },
      { step: 5, text: 'Servir caliente con un chorrito de aceite de oliva y queso rallado si se desea.' },
    ];
  }
  if (n.includes('sopa') || n.includes('crema') || n.includes('gazpacho')) {
    return [
      { step: 1, text: 'Lavar y trocear todas las verduras.' },
      { step: 2, text: 'Para sopas calientes: sofreír las verduras en aceite, añadir caldo y cocer 20 minutos.' },
      { step: 3, text: 'Para gazpacho: triturar todos los ingredientes crudos con la batidora.' },
      { step: 4, text: 'Si es crema, triturar con la batidora de mano hasta obtener textura lisa.' },
      { step: 5, text: 'Rectificar de sal, añadir los toppings y servir.' },
    ];
  }
  if (n.includes('yogur') || n.includes('requesón')) {
    return [
      { step: 1, text: 'Servir el yogur o requesón en un bol.' },
      { step: 2, text: 'Añadir los toppings: frutas, frutos secos, semillas, granola o miel.' },
      { step: 3, text: 'Mezclar ligeramente y servir inmediatamente.' },
    ];
  }
  if (n.includes('tostada') || n.includes('pan')) {
    return [
      { step: 1, text: 'Tostar el pan en la tostadora o en una sartén.' },
      { step: 2, text: 'Preparar el topping: cortar el aguacate, el tomate, etc.' },
      { step: 3, text: 'Untar o disponer el topping sobre el pan tostado.' },
      { step: 4, text: 'Sazonar con sal, pimienta y un chorrito de aceite de oliva.' },
      { step: 5, text: 'Servir inmediatamente.' },
    ];
  }
  if (n.includes('curry') || n.includes('wok') || n.includes('salteado')) {
    return [
      { step: 1, text: 'Preparar y cortar todos los ingredientes antes de empezar.' },
      { step: 2, text: 'Calentar el wok o sartén a fuego alto con aceite.' },
      { step: 3, text: 'Añadir las especias y sofreír 30 segundos hasta que aromen.' },
      { step: 4, text: 'Incorporar los ingredientes más duros primero (zanahoria, pimiento) y saltear 3 min.' },
      { step: 5, text: 'Añadir los ingredientes más blandos (espinacas, tofu) y la salsa.' },
      { step: 6, text: 'Cocinar 5 minutos más y servir sobre arroz o quinoa.' },
    ];
  }
  // Genérico
  return [
    { step: 1, text: 'Preparar y lavar todos los ingredientes.' },
    { step: 2, text: 'Cortar y medir las cantidades indicadas.' },
    { step: 3, text: 'Cocinar según el método indicado (plancha, horno, vapor o crudo).' },
    { step: 4, text: 'Sazonar al gusto con sal, pimienta y aceite de oliva virgen extra.' },
    { step: 5, text: 'Servir en el plato o bol y consumir inmediatamente.' },
  ];
}

async function seedRecipeInstructions() {
  console.log('\n📝 Añadiendo instrucciones a recetas...');
  const recipes = await q('SELECT id, name FROM recipes WHERE "instructionsJson" IS NULL OR "instructionsJson" = \'[]\'');
  let updated = 0;
  for (const r of recipes) {
    const instructions = buildInstructions(r.name);
    await q('UPDATE recipes SET "instructionsJson" = $1 WHERE id = $2', [JSON.stringify(instructions), r.id]);
    updated++;
  }
  console.log(`  ✅ ${updated} recetas actualizadas con instrucciones`);
}

// ─── 2. INGREDIENTES NORMALIZADOS ────────────────────────────────────────────
const INGREDIENTS_DATA = [
  // Proteínas animales
  { apiParam: 'chicken_breast', nameEs: 'Pechuga de pollo', nameEn: 'Chicken breast', category: 'proteina', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'bandeja', purchaseUnitPlural: 'bandejas', calories: 165, proteins: 31, carbohydrates: 0, fats: 3.6, fiber: 0, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'salmon', nameEs: 'Salmón', nameEn: 'Salmon', category: 'proteina', purchaseUnitType: 'weight', purchaseGramsPerUnit: 400, purchaseUnitSingular: 'lomo', purchaseUnitPlural: 'lomos', calories: 208, proteins: 20, carbohydrates: 0, fats: 13, fiber: 0, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'tuna_canned', nameEs: 'Atún en conserva', nameEn: 'Canned tuna', category: 'proteina', purchaseUnitType: 'weight', purchaseGramsPerUnit: 80, purchaseUnitSingular: 'lata', purchaseUnitPlural: 'latas', calories: 132, proteins: 28, carbohydrates: 0, fats: 1, fiber: 0, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'eggs', nameEs: 'Huevos', nameEn: 'Eggs', category: 'proteina', purchaseUnitType: 'unit', purchaseGramsPerUnit: 60, purchaseUnitSingular: 'docena', purchaseUnitPlural: 'docenas', calories: 155, proteins: 13, carbohydrates: 1.1, fats: 11, fiber: 0, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'turkey_breast', nameEs: 'Pechuga de pavo', nameEn: 'Turkey breast', category: 'proteina', purchaseUnitType: 'weight', purchaseGramsPerUnit: 400, purchaseUnitSingular: 'bandeja', purchaseUnitPlural: 'bandejas', calories: 135, proteins: 30, carbohydrates: 0, fats: 1, fiber: 0, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'beef_lean', nameEs: 'Ternera magra', nameEn: 'Lean beef', category: 'proteina', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'bandeja', purchaseUnitPlural: 'bandejas', calories: 250, proteins: 26, carbohydrates: 0, fats: 15, fiber: 0, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'tofu', nameEs: 'Tofu', nameEn: 'Tofu', category: 'proteina', purchaseUnitType: 'weight', purchaseGramsPerUnit: 400, purchaseUnitSingular: 'bloque', purchaseUnitPlural: 'bloques', calories: 76, proteins: 8, carbohydrates: 1.9, fats: 4.8, fiber: 0.3, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'cod', nameEs: 'Bacalao', nameEn: 'Cod', category: 'proteina', purchaseUnitType: 'weight', purchaseGramsPerUnit: 400, purchaseUnitSingular: 'lomo', purchaseUnitPlural: 'lomos', calories: 105, proteins: 23, carbohydrates: 0, fats: 0.9, fiber: 0, isVegan: false, isVegetarian: false, isGlutenFree: true, isDairyFree: true },
  // Cereales y carbohidratos
  { apiParam: 'oats', nameEs: 'Avena', nameEn: 'Oats', category: 'cereal', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'paquete', purchaseUnitPlural: 'paquetes', calories: 389, proteins: 17, carbohydrates: 66, fats: 7, fiber: 10.6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'quinoa', nameEs: 'Quinoa', nameEn: 'Quinoa', category: 'cereal', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'paquete', purchaseUnitPlural: 'paquetes', calories: 368, proteins: 14, carbohydrates: 64, fats: 6, fiber: 7, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'brown_rice', nameEs: 'Arroz integral', nameEn: 'Brown rice', category: 'cereal', purchaseUnitType: 'weight', purchaseGramsPerUnit: 1000, purchaseUnitSingular: 'paquete', purchaseUnitPlural: 'paquetes', calories: 370, proteins: 7.5, carbohydrates: 77, fats: 2.7, fiber: 3.5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'whole_pasta', nameEs: 'Pasta integral', nameEn: 'Whole wheat pasta', category: 'cereal', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'paquete', purchaseUnitPlural: 'paquetes', calories: 348, proteins: 13, carbohydrates: 68, fats: 2.5, fiber: 8, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'whole_bread', nameEs: 'Pan integral', nameEn: 'Whole wheat bread', category: 'cereal', purchaseUnitType: 'unit', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'barra', purchaseUnitPlural: 'barras', calories: 247, proteins: 9, carbohydrates: 45, fats: 3.4, fiber: 6, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'sweet_potato', nameEs: 'Boniato', nameEn: 'Sweet potato', category: 'verdura', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'kg', purchaseUnitPlural: 'kg', calories: 86, proteins: 1.6, carbohydrates: 20, fats: 0.1, fiber: 3, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  // Verduras
  { apiParam: 'spinach', nameEs: 'Espinacas', nameEn: 'Spinach', category: 'verdura', purchaseUnitType: 'weight', purchaseGramsPerUnit: 300, purchaseUnitSingular: 'bolsa', purchaseUnitPlural: 'bolsas', calories: 23, proteins: 2.9, carbohydrates: 3.6, fats: 0.4, fiber: 2.2, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'broccoli', nameEs: 'Brócoli', nameEn: 'Broccoli', category: 'verdura', purchaseUnitType: 'unit', purchaseGramsPerUnit: 400, purchaseUnitSingular: 'pieza', purchaseUnitPlural: 'piezas', calories: 34, proteins: 2.8, carbohydrates: 7, fats: 0.4, fiber: 2.6, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'tomato', nameEs: 'Tomate', nameEn: 'Tomato', category: 'verdura', purchaseUnitType: 'unit', purchaseGramsPerUnit: 150, purchaseUnitSingular: 'unidad', purchaseUnitPlural: 'unidades', calories: 18, proteins: 0.9, carbohydrates: 3.9, fats: 0.2, fiber: 1.2, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'onion', nameEs: 'Cebolla', nameEn: 'Onion', category: 'verdura', purchaseUnitType: 'unit', purchaseGramsPerUnit: 150, purchaseUnitSingular: 'unidad', purchaseUnitPlural: 'unidades', calories: 40, proteins: 1.1, carbohydrates: 9.3, fats: 0.1, fiber: 1.7, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'garlic', nameEs: 'Ajo', nameEn: 'Garlic', category: 'verdura', purchaseUnitType: 'unit', purchaseGramsPerUnit: 60, purchaseUnitSingular: 'cabeza', purchaseUnitPlural: 'cabezas', calories: 149, proteins: 6.4, carbohydrates: 33, fats: 0.5, fiber: 2.1, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'avocado', nameEs: 'Aguacate', nameEn: 'Avocado', category: 'fruta', purchaseUnitType: 'unit', purchaseGramsPerUnit: 200, purchaseUnitSingular: 'unidad', purchaseUnitPlural: 'unidades', calories: 160, proteins: 2, carbohydrates: 9, fats: 15, fiber: 7, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'cucumber', nameEs: 'Pepino', nameEn: 'Cucumber', category: 'verdura', purchaseUnitType: 'unit', purchaseGramsPerUnit: 300, purchaseUnitSingular: 'unidad', purchaseUnitPlural: 'unidades', calories: 15, proteins: 0.7, carbohydrates: 3.6, fats: 0.1, fiber: 0.5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'carrot', nameEs: 'Zanahoria', nameEn: 'Carrot', category: 'verdura', purchaseUnitType: 'unit', purchaseGramsPerUnit: 100, purchaseUnitSingular: 'unidad', purchaseUnitPlural: 'unidades', calories: 41, proteins: 0.9, carbohydrates: 10, fats: 0.2, fiber: 2.8, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'pumpkin', nameEs: 'Calabaza', nameEn: 'Pumpkin', category: 'verdura', purchaseUnitType: 'weight', purchaseGramsPerUnit: 1000, purchaseUnitSingular: 'kg', purchaseUnitPlural: 'kg', calories: 26, proteins: 1, carbohydrates: 6.5, fats: 0.1, fiber: 0.5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'asparagus', nameEs: 'Espárragos', nameEn: 'Asparagus', category: 'verdura', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'manojo', purchaseUnitPlural: 'manojos', calories: 20, proteins: 2.2, carbohydrates: 3.9, fats: 0.1, fiber: 2.1, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mushrooms', nameEs: 'Champiñones', nameEn: 'Mushrooms', category: 'verdura', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'bandeja', purchaseUnitPlural: 'bandejas', calories: 22, proteins: 3.1, carbohydrates: 3.3, fats: 0.3, fiber: 1, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  // Legumbres
  { apiParam: 'lentils', nameEs: 'Lentejas', nameEn: 'Lentils', category: 'legumbre', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'paquete', purchaseUnitPlural: 'paquetes', calories: 353, proteins: 25, carbohydrates: 60, fats: 1.1, fiber: 10.7, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'chickpeas', nameEs: 'Garbanzos', nameEn: 'Chickpeas', category: 'legumbre', purchaseUnitType: 'weight', purchaseGramsPerUnit: 400, purchaseUnitSingular: 'bote', purchaseUnitPlural: 'botes', calories: 364, proteins: 19, carbohydrates: 61, fats: 6, fiber: 17, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'edamame', nameEs: 'Edamame', nameEn: 'Edamame', category: 'legumbre', purchaseUnitType: 'weight', purchaseGramsPerUnit: 400, purchaseUnitSingular: 'bolsa', purchaseUnitPlural: 'bolsas', calories: 121, proteins: 11, carbohydrates: 9, fats: 5, fiber: 5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  // Lácteos y derivados
  { apiParam: 'greek_yogurt', nameEs: 'Yogur griego', nameEn: 'Greek yogurt', category: 'lacteo', purchaseUnitType: 'unit', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'tarro', purchaseUnitPlural: 'tarros', calories: 59, proteins: 10, carbohydrates: 3.6, fats: 0.4, fiber: 0, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'cottage_cheese', nameEs: 'Requesón', nameEn: 'Cottage cheese', category: 'lacteo', purchaseUnitType: 'weight', purchaseGramsPerUnit: 250, purchaseUnitSingular: 'tarrina', purchaseUnitPlural: 'tarrinas', calories: 98, proteins: 11, carbohydrates: 3.4, fats: 4.3, fiber: 0, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'feta_cheese', nameEs: 'Queso feta', nameEn: 'Feta cheese', category: 'lacteo', purchaseUnitType: 'weight', purchaseGramsPerUnit: 200, purchaseUnitSingular: 'bloque', purchaseUnitPlural: 'bloques', calories: 264, proteins: 14, carbohydrates: 4, fats: 21, fiber: 0, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  // Frutas
  { apiParam: 'banana', nameEs: 'Plátano', nameEn: 'Banana', category: 'fruta', purchaseUnitType: 'unit', purchaseGramsPerUnit: 120, purchaseUnitSingular: 'unidad', purchaseUnitPlural: 'unidades', calories: 89, proteins: 1.1, carbohydrates: 23, fats: 0.3, fiber: 2.6, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'blueberries', nameEs: 'Arándanos', nameEn: 'Blueberries', category: 'fruta', purchaseUnitType: 'weight', purchaseGramsPerUnit: 250, purchaseUnitSingular: 'bandeja', purchaseUnitPlural: 'bandejas', calories: 57, proteins: 0.7, carbohydrates: 14, fats: 0.3, fiber: 2.4, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'apple', nameEs: 'Manzana', nameEn: 'Apple', category: 'fruta', purchaseUnitType: 'unit', purchaseGramsPerUnit: 180, purchaseUnitSingular: 'unidad', purchaseUnitPlural: 'unidades', calories: 52, proteins: 0.3, carbohydrates: 14, fats: 0.2, fiber: 2.4, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'strawberries', nameEs: 'Fresas', nameEn: 'Strawberries', category: 'fruta', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'bandeja', purchaseUnitPlural: 'bandejas', calories: 32, proteins: 0.7, carbohydrates: 7.7, fats: 0.3, fiber: 2, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'mango', nameEs: 'Mango', nameEn: 'Mango', category: 'fruta', purchaseUnitType: 'unit', purchaseGramsPerUnit: 300, purchaseUnitSingular: 'unidad', purchaseUnitPlural: 'unidades', calories: 60, proteins: 0.8, carbohydrates: 15, fats: 0.4, fiber: 1.6, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  // Frutos secos y semillas
  { apiParam: 'almonds', nameEs: 'Almendras', nameEn: 'Almonds', category: 'fruto_seco', purchaseUnitType: 'weight', purchaseGramsPerUnit: 200, purchaseUnitSingular: 'bolsa', purchaseUnitPlural: 'bolsas', calories: 579, proteins: 21, carbohydrates: 22, fats: 50, fiber: 12.5, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'walnuts', nameEs: 'Nueces', nameEn: 'Walnuts', category: 'fruto_seco', purchaseUnitType: 'weight', purchaseGramsPerUnit: 200, purchaseUnitSingular: 'bolsa', purchaseUnitPlural: 'bolsas', calories: 654, proteins: 15, carbohydrates: 14, fats: 65, fiber: 6.7, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'chia_seeds', nameEs: 'Semillas de chía', nameEn: 'Chia seeds', category: 'semilla', purchaseUnitType: 'weight', purchaseGramsPerUnit: 200, purchaseUnitSingular: 'bolsa', purchaseUnitPlural: 'bolsas', calories: 486, proteins: 17, carbohydrates: 42, fats: 31, fiber: 34, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'almond_butter', nameEs: 'Mantequilla de almendras', nameEn: 'Almond butter', category: 'fruto_seco', purchaseUnitType: 'weight', purchaseGramsPerUnit: 250, purchaseUnitSingular: 'tarro', purchaseUnitPlural: 'tarros', calories: 614, proteins: 21, carbohydrates: 22, fats: 56, fiber: 10, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'peanut_butter', nameEs: 'Mantequilla de cacahuete', nameEn: 'Peanut butter', category: 'fruto_seco', purchaseUnitType: 'weight', purchaseGramsPerUnit: 350, purchaseUnitSingular: 'tarro', purchaseUnitPlural: 'tarros', calories: 588, proteins: 25, carbohydrates: 20, fats: 50, fiber: 6, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  // Aceites y condimentos
  { apiParam: 'olive_oil', nameEs: 'Aceite de oliva virgen extra', nameEn: 'Extra virgin olive oil', category: 'aceite', purchaseUnitType: 'volume', purchaseGramsPerUnit: 750, purchaseUnitSingular: 'botella', purchaseUnitPlural: 'botellas', calories: 884, proteins: 0, carbohydrates: 0, fats: 100, fiber: 0, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'hummus', nameEs: 'Hummus', nameEn: 'Hummus', category: 'legumbre', purchaseUnitType: 'weight', purchaseGramsPerUnit: 200, purchaseUnitSingular: 'tarrina', purchaseUnitPlural: 'tarrinas', calories: 166, proteins: 8, carbohydrates: 14, fats: 10, fiber: 6, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'granola', nameEs: 'Granola', nameEn: 'Granola', category: 'cereal', purchaseUnitType: 'weight', purchaseGramsPerUnit: 400, purchaseUnitSingular: 'bolsa', purchaseUnitPlural: 'bolsas', calories: 471, proteins: 10, carbohydrates: 64, fats: 20, fiber: 5, isVegan: true, isVegetarian: true, isGlutenFree: false, isDairyFree: true },
  { apiParam: 'honey', nameEs: 'Miel', nameEn: 'Honey', category: 'otro', purchaseUnitType: 'weight', purchaseGramsPerUnit: 500, purchaseUnitSingular: 'tarro', purchaseUnitPlural: 'tarros', calories: 304, proteins: 0.3, carbohydrates: 82, fats: 0, fiber: 0.2, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'lemon', nameEs: 'Limón', nameEn: 'Lemon', category: 'fruta', purchaseUnitType: 'unit', purchaseGramsPerUnit: 100, purchaseUnitSingular: 'unidad', purchaseUnitPlural: 'unidades', calories: 29, proteins: 1.1, carbohydrates: 9.3, fats: 0.3, fiber: 2.8, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
  { apiParam: 'protein_powder', nameEs: 'Proteína en polvo (whey)', nameEn: 'Whey protein powder', category: 'suplemento', purchaseUnitType: 'weight', purchaseGramsPerUnit: 1000, purchaseUnitSingular: 'bote', purchaseUnitPlural: 'botes', calories: 400, proteins: 80, carbohydrates: 10, fats: 5, fiber: 0, isVegan: false, isVegetarian: true, isGlutenFree: true, isDairyFree: false },
  { apiParam: 'vegan_protein', nameEs: 'Proteína vegana en polvo', nameEn: 'Vegan protein powder', category: 'suplemento', purchaseUnitType: 'weight', purchaseGramsPerUnit: 1000, purchaseUnitSingular: 'bote', purchaseUnitPlural: 'botes', calories: 380, proteins: 75, carbohydrates: 12, fats: 4, fiber: 3, isVegan: true, isVegetarian: true, isGlutenFree: true, isDairyFree: true },
];

async function seedIngredients() {
  console.log('\n🥕 Insertando ingredientes normalizados...');
  let inserted = 0;
  for (const ing of INGREDIENTS_DATA) {
    const existing = await q('SELECT id FROM ingredients WHERE "apiParam" = $1', [ing.apiParam]);
    if (existing.length === 0) {
      await q(`INSERT INTO ingredients (
        "apiParam", "nameEs", "nameEn", category, "purchaseUnitType", "purchaseGramsPerUnit",
        "purchaseUnitSingular", "purchaseUnitPlural", calories, proteins, carbohydrates, fats, fiber,
        "isVegan", "isVegetarian", "isGlutenFree", "isDairyFree", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())`,
      [ing.apiParam, ing.nameEs, ing.nameEn, ing.category, ing.purchaseUnitType, ing.purchaseGramsPerUnit,
       ing.purchaseUnitSingular, ing.purchaseUnitPlural, ing.calories, ing.proteins, ing.carbohydrates,
       ing.fats, ing.fiber, ing.isVegan, ing.isVegetarian, ing.isGlutenFree, ing.isDairyFree]);
      inserted++;
    }
  }
  console.log(`  ✅ ${inserted} ingredientes insertados (${INGREDIENTS_DATA.length - inserted} ya existían)`);
}

// ─── 3. COMPLEMENTOS DEL DÍA ─────────────────────────────────────────────────
const COMPLEMENTS_DATA = [
  { name: 'coffee', nameEs: 'Café solo', category: 'bebida_caliente', servingSize: 1, servingUnit: 'taza', servingLabel: '1 taza (200ml)', calories: 2, proteins: 0.3, carbs: 0, fats: 0, fiber: 0, caffeine: 80, emoji: '☕', isSeeded: true, isPublic: true },
  { name: 'coffee_milk', nameEs: 'Café con leche', category: 'bebida_caliente', servingSize: 1, servingUnit: 'taza', servingLabel: '1 taza (200ml)', calories: 55, proteins: 3.5, carbs: 5, fats: 2, fiber: 0, caffeine: 60, emoji: '☕', isSeeded: true, isPublic: true },
  { name: 'green_tea', nameEs: 'Té verde', category: 'bebida_caliente', servingSize: 1, servingUnit: 'taza', servingLabel: '1 taza (250ml)', calories: 2, proteins: 0, carbs: 0, fats: 0, fiber: 0, caffeine: 30, emoji: '🍵', isSeeded: true, isPublic: true },
  { name: 'infusion', nameEs: 'Infusión', category: 'bebida_caliente', servingSize: 1, servingUnit: 'taza', servingLabel: '1 taza (250ml)', calories: 1, proteins: 0, carbs: 0.2, fats: 0, fiber: 0, caffeine: 0, emoji: '🫖', isSeeded: true, isPublic: true },
  { name: 'protein_shake', nameEs: 'Batido de proteínas', category: 'suplemento', servingSize: 1, servingUnit: 'vaso', servingLabel: '1 vaso (300ml)', calories: 150, proteins: 25, carbs: 8, fats: 2, fiber: 1, caffeine: 0, emoji: '🥤', isSeeded: true, isPublic: true },
  { name: 'water', nameEs: 'Agua', category: 'bebida_fria', servingSize: 1, servingUnit: 'vaso', servingLabel: '1 vaso (250ml)', calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0, caffeine: 0, emoji: '💧', isSeeded: true, isPublic: true },
  { name: 'greek_yogurt_plain', nameEs: 'Yogur griego natural', category: 'lacteo', servingSize: 1, servingUnit: 'unidad', servingLabel: '1 yogur (125g)', calories: 74, proteins: 12, carbs: 4.5, fats: 0.5, fiber: 0, caffeine: 0, emoji: '🥛', isSeeded: true, isPublic: true },
  { name: 'turkey_slice', nameEs: 'Pechuga de pavo en lonchas', category: 'proteina', servingSize: 2, servingUnit: 'lonchas', servingLabel: '2 lonchas (40g)', calories: 54, proteins: 12, carbs: 0.5, fats: 0.4, fiber: 0, caffeine: 0, emoji: '🦃', isSeeded: true, isPublic: true },
  { name: 'almonds_handful', nameEs: 'Puñado de almendras', category: 'fruta', servingSize: 1, servingUnit: 'puñado', servingLabel: '1 puñado (25g)', calories: 145, proteins: 5, carbs: 5.5, fats: 12.5, fiber: 3, caffeine: 0, emoji: '🌰', isSeeded: true, isPublic: true },
  { name: 'dark_chocolate', nameEs: 'Chocolate negro (85%)', category: 'snack_saludable', servingSize: 2, servingUnit: 'onzas', servingLabel: '2 onzas (20g)', calories: 120, proteins: 2, carbs: 7, fats: 9, fiber: 2, caffeine: 10, emoji: '🍫', isSeeded: true, isPublic: true },
  { name: 'banana_small', nameEs: 'Plátano pequeño', category: 'fruta', servingSize: 1, servingUnit: 'unidad', servingLabel: '1 plátano pequeño (100g)', calories: 89, proteins: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, caffeine: 0, emoji: '🍌', isSeeded: true, isPublic: true },
  { name: 'apple_medium', nameEs: 'Manzana mediana', category: 'fruta', servingSize: 1, servingUnit: 'unidad', servingLabel: '1 manzana (150g)', calories: 78, proteins: 0.4, carbs: 21, fats: 0.3, fiber: 3.6, caffeine: 0, emoji: '🍎', isSeeded: true, isPublic: true },
];

async function seedComplements() {
  console.log('\n☕ Insertando complementos del día...');
  let inserted = 0;
  for (const c of COMPLEMENTS_DATA) {
    const existing = await q('SELECT id FROM complements WHERE name = $1', [c.name]);
    if (existing.length === 0) {
      await q(`INSERT INTO complements (
        name, "nameEs", category, "servingSize", "servingUnit", "servingLabel",
        calories, proteins, carbs, fats, fiber, sugar, caffeine, emoji,
        "isSeeded", "isPublic", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW())`,
      [c.name, c.nameEs, c.category, c.servingSize, c.servingUnit, c.servingLabel,
       c.calories, c.proteins, c.carbs, c.fats, c.fiber, 0, c.caffeine || 0, c.emoji,
       c.isSeeded, c.isPublic]);
      inserted++;
    }
  }
  console.log(`  ✅ ${inserted} complementos insertados`);
}

// ─── 4. BUDDY MAKERS ─────────────────────────────────────────────────────────
async function seedBuddyMakers() {
  console.log('\n👨‍🍳 Insertando BuddyMakers...');

  const makers = [
    {
      email: 'ana.cocinera@buddymarket.com',
      name: 'Ana García',
      openId: 'ana_maker_seed',
      maker: {
        displayName: 'Ana García',
        bio: 'Cocinera apasionada y creadora de recetas saludables. Especializada en cocina mediterránea y recetas rápidas para el día a día. Mis recetas son sencillas, nutritivas y deliciosas.',
        avatarUrl: 'https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
        instagramHandle: 'anagarcia_cocina',
        specialty: 'Cocina mediterránea',
        verified: true,
        featured: true,
        followersCount: 1240,
        recipesCount: 45,
        rating: 4.8,
      }
    },
    {
      email: 'miguel.vegano@buddymarket.com',
      name: 'Miguel Torres',
      openId: 'miguel_maker_seed',
      maker: {
        displayName: 'Miguel Torres',
        bio: 'Chef vegano y activista por la alimentación sostenible. Creo recetas plant-based que demuestran que la comida vegana puede ser increíblemente sabrosa y nutritiva.',
        avatarUrl: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?w=200&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80',
        instagramHandle: 'migueltorres_vegan',
        specialty: 'Cocina vegana',
        verified: true,
        featured: false,
        followersCount: 876,
        recipesCount: 32,
        rating: 4.7,
      }
    }
  ];

  for (const m of makers) {
    const existingUser = await q('SELECT id FROM users WHERE email = $1', [m.email]);
    let userId;
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      const r = await q(
        `INSERT INTO users ("openId", name, email, role, "accountType", "registrationStep", "onboardingCompleted", active, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,'admin','user','completed',true,true,NOW(),NOW()) RETURNING id`,
        [m.openId, m.name, m.email]
      );
      userId = r[0].id;
    }

    const existingMaker = await q('SELECT id FROM buddy_makers WHERE "userId" = $1', [userId]);
    if (existingMaker.length === 0) {
      await q(`INSERT INTO buddy_makers (
        "userId", "displayName", bio, "avatarUrl", "coverUrl", "instagramHandle", specialty,
        verified, featured, "followersCount", "recipesCount", rating, "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())`,
      [userId, m.maker.displayName, m.maker.bio, m.maker.avatarUrl, m.maker.coverUrl,
       m.maker.instagramHandle, m.maker.specialty, m.maker.verified, m.maker.featured,
       m.maker.followersCount, m.maker.recipesCount, m.maker.rating]);
      console.log(`  ✅ BuddyMaker ${m.name} creado`);
    } else {
      console.log(`  ↳ BuddyMaker ${m.name} ya existe`);
    }
  }
}

// ─── 5. EXPERT MENUS ─────────────────────────────────────────────────────────
async function seedExpertMenus() {
  console.log('\n📅 Insertando menús de expertos...');
  const experts = await q('SELECT id, "displayName", category FROM buddy_experts ORDER BY id');
  if (experts.length === 0) { console.log('  ⚠️  No hay expertos en la BD'); return; }

  const menuTemplates = [
    {
      title: 'Menú Semanal Pérdida de Peso — Semana 1',
      description: 'Primera semana del plan de pérdida de peso. Déficit calórico moderado con alta saciedad. Incluye 5 comidas al día para evitar el hambre.',
      coverUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
      category: 'perdida_peso',
      dailyCalories: 1600,
      isFree: true,
    },
    {
      title: 'Menú Semanal Rendimiento — Semana 1',
      description: 'Menú diseñado para deportistas. Alto en carbohidratos de calidad para maximizar el rendimiento y la recuperación.',
      coverUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
      category: 'rendimiento',
      dailyCalories: 2400,
      isFree: true,
    },
    {
      title: 'Menú Semanal Vegano — Semana 1',
      description: 'Menú plant-based completo y equilibrado. Todas las proteínas son de origen vegetal y están perfectamente combinadas.',
      coverUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
      category: 'vegano',
      dailyCalories: 1900,
      isFree: true,
    },
    {
      title: 'Menú Semanal Bienestar — Semana 1',
      description: 'Menú antiinflamatorio y equilibrado para mejorar el bienestar general. Rico en antioxidantes y ácidos grasos omega-3.',
      coverUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
      category: 'bienestar',
      dailyCalories: 1800,
      isFree: true,
    },
  ];

  let inserted = 0;
  for (const expert of experts) {
    const template = menuTemplates.find(t => t.category === expert.category) || menuTemplates[0];
    const existing = await q('SELECT id FROM expert_menus WHERE "expertId" = $1 LIMIT 1', [expert.id]);
    if (existing.length === 0) {
      const menuData = {
        days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => ({
          day,
          meals: {
            breakfast: `Desayuno nutritivo del ${day.toLowerCase()}`,
            morning_snack: `Media mañana ligera`,
            lunch: `Comida principal del ${day.toLowerCase()}`,
            afternoon_snack: `Merienda saludable`,
            dinner: `Cena equilibrada del ${day.toLowerCase()}`,
          }
        }))
      };
      await q(`INSERT INTO expert_menus (
        "expertId", title, description, "coverUrl", "weekNumber", year, category,
        "dailyCalories", "isFree", "isPublic", "copiesCount", "likesCount", "menuData", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12,NOW(),NOW())`,
      [expert.id, template.title, template.description, template.coverUrl,
       1, 2025, template.category, template.dailyCalories, template.isFree,
       Math.floor(Math.random() * 200 + 50), Math.floor(Math.random() * 150 + 30),
       JSON.stringify(menuData)]);
      inserted++;
    }
  }
  console.log(`  ✅ ${inserted} menús de expertos insertados`);
}

// ─── 6. RELACIONES RECETA ↔ ALERGIAS ─────────────────────────────────────────
async function seedRecipeAllergyRelations() {
  console.log('\n🔗 Creando relaciones receta ↔ alergias...');
  const recipes = await q('SELECT id, name, "ingredientsJson" FROM recipes WHERE "isSeeded" = true ORDER BY id');
  const allergies = await q('SELECT id, "nameEs" FROM allergies ORDER BY id');
  const allergyMap = Object.fromEntries(allergies.map(a => [a.nameEs.toLowerCase(), a.id]));

  const ALLERGEN_KEYWORDS = {
    'gluten': ['avena', 'pasta', 'pan', 'tostada', 'harina', 'tortilla de avena', 'pancakes', 'crepes', 'porridge', 'gachas'],
    'lácteos': ['yogur', 'queso', 'leche', 'requesón', 'feta', 'cottage'],
    'huevos': ['huevo', 'tortilla', 'revuelto'],
    'pescado': ['salmón', 'atún', 'merluza', 'bacalao', 'dorada', 'lubina', 'sardinas'],
    'mariscos': ['gambas', 'edamame'],
    'frutos secos': ['almendras', 'nueces', 'pistachos', 'cacahuete', 'frutos secos'],
    'soja': ['tofu', 'edamame', 'soja', 'miso'],
  };

  let inserted = 0;
  for (const recipe of recipes) {
    const nameLower = recipe.name.toLowerCase();
    for (const [allergenName, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
      if (keywords.some(kw => nameLower.includes(kw))) {
        // Buscar el alérgeno en la BD
        const allergyId = Object.entries(allergyMap).find(([k]) => k.includes(allergenName.toLowerCase()))?.[1];
        if (allergyId) {
          const exists = await q('SELECT 1 FROM recipe_allergies WHERE "recipeId" = $1 AND "allergyId" = $2', [recipe.id, allergyId]);
          if (exists.length === 0) {
            await q('INSERT INTO recipe_allergies ("recipeId", "allergyId") VALUES ($1, $2)', [recipe.id, allergyId]);
            inserted++;
          }
        }
      }
    }
  }
  console.log(`  ✅ ${inserted} relaciones receta ↔ alergia creadas`);
}

// ─── 7. RELACIONES RECETA ↔ RESTRICCIONES DIETÉTICAS ────────────────────────
async function seedRecipeDietRelations() {
  console.log('\n🥗 Creando relaciones receta ↔ restricciones dietéticas...');
  const recipes = await q('SELECT id, name FROM recipes WHERE "isSeeded" = true ORDER BY id');
  const restrictions = await q('SELECT id, "nameEs" FROM diet_restrictions ORDER BY id');
  const restrictionMap = Object.fromEntries(restrictions.map(r => [r.nameEs.toLowerCase(), r.id]));

  const VEGAN_KEYWORDS = ['tofu', 'quinoa', 'lentejas', 'garbanzos', 'edamame', 'smoothie verde', 'buddha bowl', 'hummus', 'curry de lentejas', 'wok de verduras', 'ratatouille', 'sopa de miso', 'chips de kale', 'tacos de champiñones', 'hamburguesa de lentejas', 'curry verde', 'pasta con pesto'];
  const VEGETARIAN_KEYWORDS = [...VEGAN_KEYWORDS, 'yogur', 'huevo', 'tortilla', 'revuelto', 'queso', 'requesón', 'porridge', 'avena', 'granola'];
  const GLUTEN_FREE_KEYWORDS = ['salmón', 'merluza', 'bacalao', 'pollo', 'pechuga', 'ensalada', 'bowl', 'quinoa', 'arroz', 'lentejas', 'garbanzos', 'tofu', 'smoothie', 'batido'];

  let inserted = 0;
  for (const recipe of recipes) {
    const nameLower = recipe.name.toLowerCase();
    const isVegan = VEGAN_KEYWORDS.some(kw => nameLower.includes(kw));
    const isVegetarian = VEGETARIAN_KEYWORDS.some(kw => nameLower.includes(kw));
    const isGlutenFree = GLUTEN_FREE_KEYWORDS.some(kw => nameLower.includes(kw)) && !nameLower.includes('pasta') && !nameLower.includes('pan') && !nameLower.includes('tostada') && !nameLower.includes('avena');

    const toInsert = [];
    if (isVegan) {
      const id = Object.entries(restrictionMap).find(([k]) => k.includes('vegano') || k.includes('vegan'))?.[1];
      if (id) toInsert.push(id);
    }
    if (isVegetarian) {
      const id = Object.entries(restrictionMap).find(([k]) => k.includes('vegetarian'))?.[1];
      if (id) toInsert.push(id);
    }
    if (isGlutenFree) {
      const id = Object.entries(restrictionMap).find(([k]) => k.includes('gluten'))?.[1];
      if (id) toInsert.push(id);
    }

    for (const restrictionId of [...new Set(toInsert)]) {
      const exists = await q('SELECT 1 FROM recipe_diet_restrictions WHERE "recipeId" = $1 AND "dietRestrictionId" = $2', [recipe.id, restrictionId]);
        if (exists.length === 0) {
          await q('INSERT INTO recipe_diet_restrictions ("recipeId", "dietRestrictionId") VALUES ($1, $2)', [recipe.id, restrictionId]);
          inserted++;
        }
    }
  }
  console.log(`  ✅ ${inserted} relaciones receta ↔ restricción dietética creadas`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Iniciando seed completo de la BD...\n');
  try {
    await seedRecipeInstructions();
    await seedIngredients();
    await seedComplements();
    await seedBuddyMakers();
    await seedExpertMenus();
    await seedRecipeAllergyRelations();
    await seedRecipeDietRelations();
    console.log('\n🎉 Seed completo finalizado con éxito');
  } catch (e) {
    console.error('\n❌ Error durante el seed:', e.message);
    console.error(e.stack);
  } finally {
    await pool.end();
  }
}

main();
