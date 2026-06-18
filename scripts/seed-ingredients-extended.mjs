/**
 * Extended seed for ingredient_nutrition table
 * Adds ~300 more ingredients to reach ~500+ total
 */
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ingredients = [
  // ─── CARNES ───────────────────────────────────────────────────────────────
  { name: "Ternera (lomo)", category: "carnes", calories: 158, protein: 26.1, carbs: 0, fat: 5.4, fiber: 0, unit: "100g" },
  { name: "Ternera (picada)", category: "carnes", calories: 196, protein: 20.5, carbs: 0, fat: 12.2, fiber: 0, unit: "100g" },
  { name: "Cerdo (lomo)", category: "carnes", calories: 182, protein: 22.4, carbs: 0, fat: 9.8, fiber: 0, unit: "100g" },
  { name: "Cerdo (costillas)", category: "carnes", calories: 280, protein: 18.3, carbs: 0, fat: 22.6, fiber: 0, unit: "100g" },
  { name: "Cordero (pierna)", category: "carnes", calories: 191, protein: 21.3, carbs: 0, fat: 11.4, fiber: 0, unit: "100g" },
  { name: "Pavo (pechuga)", category: "carnes", calories: 104, protein: 24.1, carbs: 0, fat: 0.7, fiber: 0, unit: "100g" },
  { name: "Pato (pechuga)", category: "carnes", calories: 140, protein: 23.5, carbs: 0, fat: 4.8, fiber: 0, unit: "100g" },
  { name: "Conejo", category: "carnes", calories: 136, protein: 20.5, carbs: 0, fat: 5.5, fiber: 0, unit: "100g" },
  { name: "Jamón serrano", category: "carnes", calories: 241, protein: 30.5, carbs: 0, fat: 13.0, fiber: 0, unit: "100g" },
  { name: "Chorizo", category: "carnes", calories: 455, protein: 24.1, carbs: 1.9, fat: 38.0, fiber: 0, unit: "100g" },
  { name: "Salchichón", category: "carnes", calories: 430, protein: 22.0, carbs: 1.5, fat: 37.0, fiber: 0, unit: "100g" },
  { name: "Morcilla", category: "carnes", calories: 380, protein: 14.5, carbs: 15.0, fat: 30.0, fiber: 1.0, unit: "100g" },
  { name: "Bacon (panceta)", category: "carnes", calories: 458, protein: 12.6, carbs: 0, fat: 45.0, fiber: 0, unit: "100g" },
  { name: "Salchicha Frankfurt", category: "carnes", calories: 290, protein: 11.7, carbs: 3.0, fat: 25.6, fiber: 0, unit: "100g" },
  { name: "Mortadela", category: "carnes", calories: 311, protein: 14.0, carbs: 2.5, fat: 27.0, fiber: 0, unit: "100g" },
  // ─── PESCADOS ─────────────────────────────────────────────────────────────
  { name: "Lubina", category: "pescados", calories: 97, protein: 18.4, carbs: 0, fat: 2.5, fiber: 0, unit: "100g" },
  { name: "Dorada", category: "pescados", calories: 96, protein: 18.0, carbs: 0, fat: 2.7, fiber: 0, unit: "100g" },
  { name: "Merluza", category: "pescados", calories: 72, protein: 16.5, carbs: 0, fat: 0.6, fiber: 0, unit: "100g" },
  { name: "Bacalao fresco", category: "pescados", calories: 82, protein: 18.0, carbs: 0, fat: 0.7, fiber: 0, unit: "100g" },
  { name: "Bacalao salado", category: "pescados", calories: 130, protein: 28.0, carbs: 0, fat: 0.7, fiber: 0, unit: "100g" },
  { name: "Atún en lata (al natural)", category: "pescados", calories: 103, protein: 24.0, carbs: 0, fat: 0.5, fiber: 0, unit: "100g" },
  { name: "Atún en lata (en aceite)", category: "pescados", calories: 198, protein: 23.0, carbs: 0, fat: 11.5, fiber: 0, unit: "100g" },
  { name: "Sardinas en lata", category: "pescados", calories: 208, protein: 24.6, carbs: 0, fat: 11.5, fiber: 0, unit: "100g" },
  { name: "Caballa", category: "pescados", calories: 205, protein: 19.0, carbs: 0, fat: 13.9, fiber: 0, unit: "100g" },
  { name: "Trucha", category: "pescados", calories: 119, protein: 20.5, carbs: 0, fat: 3.9, fiber: 0, unit: "100g" },
  { name: "Rape", category: "pescados", calories: 76, protein: 16.8, carbs: 0, fat: 0.7, fiber: 0, unit: "100g" },
  { name: "Rodaballo", category: "pescados", calories: 95, protein: 17.0, carbs: 0, fat: 2.7, fiber: 0, unit: "100g" },
  { name: "Lenguado", category: "pescados", calories: 83, protein: 17.9, carbs: 0, fat: 1.2, fiber: 0, unit: "100g" },
  { name: "Pulpo", category: "mariscos", calories: 82, protein: 14.9, carbs: 2.2, fat: 1.0, fiber: 0, unit: "100g" },
  { name: "Calamar", category: "mariscos", calories: 92, protein: 15.6, carbs: 3.1, fat: 1.4, fiber: 0, unit: "100g" },
  { name: "Sepia", category: "mariscos", calories: 79, protein: 16.1, carbs: 0.9, fat: 0.7, fiber: 0, unit: "100g" },
  { name: "Gambas", category: "mariscos", calories: 85, protein: 18.0, carbs: 0.5, fat: 0.9, fiber: 0, unit: "100g" },
  { name: "Langostinos", category: "mariscos", calories: 89, protein: 19.2, carbs: 0.4, fat: 0.8, fiber: 0, unit: "100g" },
  { name: "Mejillones", category: "mariscos", calories: 86, protein: 11.9, carbs: 3.7, fat: 2.2, fiber: 0, unit: "100g" },
  { name: "Almejas", category: "mariscos", calories: 74, protein: 12.8, carbs: 2.6, fat: 0.9, fiber: 0, unit: "100g" },
  { name: "Berberechos", category: "mariscos", calories: 82, protein: 15.0, carbs: 2.5, fat: 0.9, fiber: 0, unit: "100g" },
  // ─── LÁCTEOS ──────────────────────────────────────────────────────────────
  { name: "Leche entera", category: "lacteos", calories: 65, protein: 3.2, carbs: 4.8, fat: 3.7, fiber: 0, unit: "100ml" },
  { name: "Leche semidesnatada", category: "lacteos", calories: 46, protein: 3.3, carbs: 4.9, fat: 1.6, fiber: 0, unit: "100ml" },
  { name: "Leche desnatada", category: "lacteos", calories: 35, protein: 3.4, carbs: 5.0, fat: 0.1, fiber: 0, unit: "100ml" },
  { name: "Yogur natural", category: "lacteos", calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, unit: "100g" },
  { name: "Yogur desnatado", category: "lacteos", calories: 39, protein: 4.5, carbs: 5.2, fat: 0.2, fiber: 0, unit: "100g" },
  { name: "Yogur griego", category: "lacteos", calories: 133, protein: 5.7, carbs: 3.8, fat: 10.3, fiber: 0, unit: "100g" },
  { name: "Queso manchego", category: "lacteos", calories: 392, protein: 26.7, carbs: 0.5, fat: 32.0, fiber: 0, unit: "100g" },
  { name: "Queso brie", category: "lacteos", calories: 334, protein: 20.8, carbs: 0.5, fat: 27.7, fiber: 0, unit: "100g" },
  { name: "Queso camembert", category: "lacteos", calories: 300, protein: 19.8, carbs: 0.5, fat: 24.3, fiber: 0, unit: "100g" },
  { name: "Queso parmesano", category: "lacteos", calories: 431, protein: 38.5, carbs: 0, fat: 29.7, fiber: 0, unit: "100g" },
  { name: "Queso ricotta", category: "lacteos", calories: 174, protein: 11.3, carbs: 3.0, fat: 13.0, fiber: 0, unit: "100g" },
  { name: "Queso cottage", category: "lacteos", calories: 98, protein: 11.1, carbs: 3.4, fat: 4.3, fiber: 0, unit: "100g" },
  { name: "Queso feta", category: "lacteos", calories: 264, protein: 14.2, carbs: 4.1, fat: 21.3, fiber: 0, unit: "100g" },
  { name: "Queso mozzarella", category: "lacteos", calories: 280, protein: 18.0, carbs: 2.2, fat: 22.0, fiber: 0, unit: "100g" },
  { name: "Nata para cocinar", category: "lacteos", calories: 292, protein: 2.2, carbs: 3.6, fat: 30.0, fiber: 0, unit: "100ml" },
  { name: "Mantequilla", category: "lacteos", calories: 717, protein: 0.9, carbs: 0.1, fat: 81.1, fiber: 0, unit: "100g" },
  // ─── CEREALES Y HARINAS ───────────────────────────────────────────────────
  { name: "Arroz integral", category: "cereales", calories: 362, protein: 7.5, carbs: 76.2, fat: 2.7, fiber: 3.5, unit: "100g" },
  { name: "Arroz basmati", category: "cereales", calories: 356, protein: 7.0, carbs: 79.0, fat: 0.5, fiber: 0.4, unit: "100g" },
  { name: "Pasta integral", category: "cereales", calories: 348, protein: 13.4, carbs: 67.0, fat: 2.5, fiber: 8.0, unit: "100g" },
  { name: "Macarrones", category: "cereales", calories: 371, protein: 13.0, carbs: 74.7, fat: 1.8, fiber: 2.5, unit: "100g" },
  { name: "Espaguetis", category: "cereales", calories: 371, protein: 13.0, carbs: 74.7, fat: 1.8, fiber: 2.5, unit: "100g" },
  { name: "Harina de trigo", category: "cereales", calories: 364, protein: 10.3, carbs: 76.3, fat: 1.2, fiber: 2.7, unit: "100g" },
  { name: "Harina de avena", category: "cereales", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, unit: "100g" },
  { name: "Harina de almendra", category: "cereales", calories: 571, protein: 21.4, carbs: 21.4, fat: 50.0, fiber: 12.5, unit: "100g" },
  { name: "Harina de coco", category: "cereales", calories: 400, protein: 20.0, carbs: 60.0, fat: 12.0, fiber: 40.0, unit: "100g" },
  { name: "Pan de centeno", category: "cereales", calories: 259, protein: 8.5, carbs: 48.3, fat: 3.3, fiber: 6.2, unit: "100g" },
  { name: "Pan integral", category: "cereales", calories: 247, protein: 9.0, carbs: 45.0, fat: 3.5, fiber: 6.5, unit: "100g" },
  { name: "Pan de molde", category: "cereales", calories: 265, protein: 8.5, carbs: 49.0, fat: 3.5, fiber: 2.5, unit: "100g" },
  { name: "Tortitas de arroz", category: "cereales", calories: 387, protein: 7.5, carbs: 83.0, fat: 2.8, fiber: 1.5, unit: "100g" },
  { name: "Cuscús", category: "cereales", calories: 376, protein: 12.8, carbs: 77.4, fat: 0.6, fiber: 2.2, unit: "100g" },
  { name: "Quinoa cocida", category: "cereales", calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8, unit: "100g" },
  { name: "Mijo", category: "cereales", calories: 378, protein: 11.0, carbs: 72.9, fat: 4.2, fiber: 8.5, unit: "100g" },
  { name: "Amaranto", category: "cereales", calories: 371, protein: 13.6, carbs: 65.3, fat: 7.0, fiber: 6.7, unit: "100g" },
  // ─── LEGUMBRES ────────────────────────────────────────────────────────────
  { name: "Lentejas cocidas", category: "legumbres", calories: 116, protein: 9.0, carbs: 20.1, fat: 0.4, fiber: 7.9, unit: "100g" },
  { name: "Garbanzos cocidos", category: "legumbres", calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, unit: "100g" },
  { name: "Judías blancas cocidas", category: "legumbres", calories: 139, protein: 9.7, carbs: 25.1, fat: 0.5, fiber: 7.4, unit: "100g" },
  { name: "Judías negras cocidas", category: "legumbres", calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5, fiber: 8.7, unit: "100g" },
  { name: "Habas cocidas", category: "legumbres", calories: 110, protein: 7.9, carbs: 19.7, fat: 0.4, fiber: 5.4, unit: "100g" },
  { name: "Guisantes cocidos", category: "legumbres", calories: 84, protein: 5.4, carbs: 15.6, fat: 0.2, fiber: 5.1, unit: "100g" },
  { name: "Edamame", category: "legumbres", calories: 121, protein: 11.9, carbs: 8.9, fat: 5.2, fiber: 5.2, unit: "100g" },
  { name: "Tofu", category: "legumbres", calories: 76, protein: 8.1, carbs: 1.9, fat: 4.8, fiber: 0.3, unit: "100g" },
  { name: "Tempeh", category: "legumbres", calories: 193, protein: 20.3, carbs: 9.4, fat: 10.8, fiber: 0, unit: "100g" },
  // ─── FRUTAS ───────────────────────────────────────────────────────────────
  { name: "Manzana", category: "frutas", calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, unit: "100g" },
  { name: "Pera", category: "frutas", calories: 57, protein: 0.4, carbs: 15.2, fat: 0.1, fiber: 3.1, unit: "100g" },
  { name: "Naranja", category: "frutas", calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, unit: "100g" },
  { name: "Mandarina", category: "frutas", calories: 53, protein: 0.8, carbs: 13.3, fat: 0.3, fiber: 1.8, unit: "100g" },
  { name: "Limón", category: "frutas", calories: 29, protein: 1.1, carbs: 9.3, fat: 0.3, fiber: 2.8, unit: "100g" },
  { name: "Uvas", category: "frutas", calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, unit: "100g" },
  { name: "Melocotón", category: "frutas", calories: 39, protein: 0.9, carbs: 9.5, fat: 0.3, fiber: 1.5, unit: "100g" },
  { name: "Ciruela", category: "frutas", calories: 46, protein: 0.7, carbs: 11.4, fat: 0.3, fiber: 1.4, unit: "100g" },
  { name: "Cereza", category: "frutas", calories: 63, protein: 1.1, carbs: 16.0, fat: 0.2, fiber: 2.1, unit: "100g" },
  { name: "Albaricoque", category: "frutas", calories: 48, protein: 1.4, carbs: 11.1, fat: 0.4, fiber: 2.0, unit: "100g" },
  { name: "Higo", category: "frutas", calories: 74, protein: 0.8, carbs: 19.2, fat: 0.3, fiber: 2.9, unit: "100g" },
  { name: "Mango", category: "frutas", calories: 60, protein: 0.8, carbs: 15.0, fat: 0.4, fiber: 1.6, unit: "100g" },
  { name: "Piña", category: "frutas", calories: 50, protein: 0.5, carbs: 13.1, fat: 0.1, fiber: 1.4, unit: "100g" },
  { name: "Papaya", category: "frutas", calories: 43, protein: 0.5, carbs: 10.8, fat: 0.3, fiber: 1.7, unit: "100g" },
  { name: "Kiwi", category: "frutas", calories: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3.0, unit: "100g" },
  { name: "Maracuyá", category: "frutas", calories: 97, protein: 2.2, carbs: 23.4, fat: 0.7, fiber: 10.4, unit: "100g" },
  { name: "Coco (carne)", category: "frutas", calories: 354, protein: 3.3, carbs: 15.2, fat: 33.5, fiber: 9.0, unit: "100g" },
  { name: "Aguacate", category: "frutas", calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7, fiber: 6.7, unit: "100g" },
  { name: "Plátano", category: "frutas", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, unit: "100g" },
  { name: "Fresas", category: "frutas", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0, unit: "100g" },
  { name: "Frambuesas", category: "frutas", calories: 52, protein: 1.2, carbs: 11.9, fat: 0.7, fiber: 6.5, unit: "100g" },
  { name: "Arándanos", category: "frutas", calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, unit: "100g" },
  { name: "Moras", category: "frutas", calories: 43, protein: 1.4, carbs: 9.6, fat: 0.5, fiber: 5.3, unit: "100g" },
  { name: "Sandía", category: "frutas", calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, unit: "100g" },
  { name: "Melón", category: "frutas", calories: 34, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 0.9, unit: "100g" },
  // ─── VERDURAS ─────────────────────────────────────────────────────────────
  { name: "Tomate", category: "verduras", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, unit: "100g" },
  { name: "Pimiento rojo", category: "verduras", calories: 31, protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1, unit: "100g" },
  { name: "Pimiento verde", category: "verduras", calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, fiber: 1.7, unit: "100g" },
  { name: "Pimiento amarillo", category: "verduras", calories: 27, protein: 1.0, carbs: 6.3, fat: 0.2, fiber: 0.9, unit: "100g" },
  { name: "Berenjena", category: "verduras", calories: 25, protein: 1.0, carbs: 5.9, fat: 0.2, fiber: 3.0, unit: "100g" },
  { name: "Calabacín", category: "verduras", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1.0, unit: "100g" },
  { name: "Pepino", category: "verduras", calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, unit: "100g" },
  { name: "Lechuga", category: "verduras", calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.8, unit: "100g" },
  { name: "Espinacas", category: "verduras", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, unit: "100g" },
  { name: "Acelgas", category: "verduras", calories: 19, protein: 1.8, carbs: 3.7, fat: 0.2, fiber: 1.6, unit: "100g" },
  { name: "Rúcula", category: "verduras", calories: 25, protein: 2.6, carbs: 3.7, fat: 0.7, fiber: 1.6, unit: "100g" },
  { name: "Kale", category: "verduras", calories: 49, protein: 4.3, carbs: 8.8, fat: 0.9, fiber: 3.6, unit: "100g" },
  { name: "Col lombarda", category: "verduras", calories: 31, protein: 1.4, carbs: 7.4, fat: 0.2, fiber: 2.1, unit: "100g" },
  { name: "Coliflor", category: "verduras", calories: 25, protein: 1.9, carbs: 5.0, fat: 0.3, fiber: 2.0, unit: "100g" },
  { name: "Brócoli", category: "verduras", calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, unit: "100g" },
  { name: "Coles de Bruselas", category: "verduras", calories: 43, protein: 3.4, carbs: 8.9, fat: 0.3, fiber: 3.8, unit: "100g" },
  { name: "Zanahoria", category: "verduras", calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, unit: "100g" },
  { name: "Remolacha", category: "verduras", calories: 43, protein: 1.6, carbs: 9.6, fat: 0.2, fiber: 2.8, unit: "100g" },
  { name: "Apio", category: "verduras", calories: 16, protein: 0.7, carbs: 3.0, fat: 0.2, fiber: 1.6, unit: "100g" },
  { name: "Puerro", category: "verduras", calories: 61, protein: 1.5, carbs: 14.2, fat: 0.3, fiber: 1.8, unit: "100g" },
  { name: "Cebolla morada", category: "verduras", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, unit: "100g" },
  { name: "Cebolleta", category: "verduras", calories: 32, protein: 1.8, carbs: 7.3, fat: 0.2, fiber: 2.6, unit: "100g" },
  { name: "Champiñones", category: "verduras", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1.0, unit: "100g" },
  { name: "Setas portobello", category: "verduras", calories: 29, protein: 3.6, carbs: 5.1, fat: 0.4, fiber: 1.3, unit: "100g" },
  { name: "Espárragos verdes", category: "verduras", calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1, unit: "100g" },
  { name: "Alcachofas", category: "verduras", calories: 47, protein: 3.3, carbs: 10.5, fat: 0.2, fiber: 5.4, unit: "100g" },
  { name: "Hinojo", category: "verduras", calories: 31, protein: 1.2, carbs: 7.3, fat: 0.2, fiber: 3.1, unit: "100g" },
  { name: "Endivia", category: "verduras", calories: 17, protein: 1.3, carbs: 3.4, fat: 0.2, fiber: 3.1, unit: "100g" },
  { name: "Rábano", category: "verduras", calories: 16, protein: 0.7, carbs: 3.4, fat: 0.1, fiber: 1.6, unit: "100g" },
  { name: "Nabo", category: "verduras", calories: 28, protein: 0.9, carbs: 6.4, fat: 0.1, fiber: 1.8, unit: "100g" },
  { name: "Patata dulce (boniato)", category: "verduras", calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3.0, unit: "100g" },
  { name: "Maíz dulce", category: "verduras", calories: 86, protein: 3.2, carbs: 19.0, fat: 1.2, fiber: 2.7, unit: "100g" },
  // ─── FRUTOS SECOS Y SEMILLAS ──────────────────────────────────────────────
  { name: "Almendras", category: "frutos_secos", calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, unit: "100g" },
  { name: "Nueces", category: "frutos_secos", calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, unit: "100g" },
  { name: "Avellanas", category: "frutos_secos", calories: 628, protein: 15.0, carbs: 16.7, fat: 60.8, fiber: 9.7, unit: "100g" },
  { name: "Anacardos", category: "frutos_secos", calories: 553, protein: 18.2, carbs: 30.2, fat: 43.8, fiber: 3.3, unit: "100g" },
  { name: "Pistachos", category: "frutos_secos", calories: 562, protein: 20.2, carbs: 27.5, fat: 45.4, fiber: 10.3, unit: "100g" },
  { name: "Nueces de macadamia", category: "frutos_secos", calories: 718, protein: 7.9, carbs: 13.8, fat: 75.8, fiber: 8.6, unit: "100g" },
  { name: "Nueces de Brasil", category: "frutos_secos", calories: 659, protein: 14.3, carbs: 12.3, fat: 67.1, fiber: 7.5, unit: "100g" },
  { name: "Semillas de girasol", category: "frutos_secos", calories: 584, protein: 20.8, carbs: 20.0, fat: 51.5, fiber: 8.6, unit: "100g" },
  { name: "Semillas de calabaza", category: "frutos_secos", calories: 559, protein: 30.2, carbs: 10.7, fat: 49.1, fiber: 6.0, unit: "100g" },
  { name: "Semillas de lino", category: "frutos_secos", calories: 534, protein: 18.3, carbs: 28.9, fat: 42.2, fiber: 27.3, unit: "100g" },
  { name: "Semillas de cáñamo", category: "frutos_secos", calories: 553, protein: 31.6, carbs: 8.7, fat: 48.8, fiber: 4.0, unit: "100g" },
  { name: "Semillas de amapola", category: "frutos_secos", calories: 525, protein: 17.9, carbs: 28.1, fat: 41.6, fiber: 19.5, unit: "100g" },
  { name: "Tahini (pasta de sésamo)", category: "frutos_secos", calories: 595, protein: 17.0, carbs: 21.2, fat: 53.8, fiber: 9.3, unit: "100g" },
  { name: "Mantequilla de cacahuete", category: "frutos_secos", calories: 588, protein: 25.1, carbs: 20.1, fat: 50.4, fiber: 6.0, unit: "100g" },
  // ─── ACEITES Y GRASAS ─────────────────────────────────────────────────────
  { name: "Aceite de oliva virgen extra", category: "aceites", calories: 884, protein: 0, carbs: 0, fat: 100.0, fiber: 0, unit: "100ml" },
  { name: "Aceite de coco", category: "aceites", calories: 862, protein: 0, carbs: 0, fat: 100.0, fiber: 0, unit: "100ml" },
  { name: "Aceite de girasol", category: "aceites", calories: 884, protein: 0, carbs: 0, fat: 100.0, fiber: 0, unit: "100ml" },
  { name: "Aceite de aguacate", category: "aceites", calories: 884, protein: 0, carbs: 0, fat: 100.0, fiber: 0, unit: "100ml" },
  { name: "Aceite de sésamo", category: "aceites", calories: 884, protein: 0, carbs: 0, fat: 100.0, fiber: 0, unit: "100ml" },
  // ─── BEBIDAS ──────────────────────────────────────────────────────────────
  { name: "Leche de almendra (sin azúcar)", category: "bebidas", calories: 17, protein: 0.6, carbs: 0.7, fat: 1.4, fiber: 0.3, unit: "100ml" },
  { name: "Leche de avena", category: "bebidas", calories: 47, protein: 1.0, carbs: 9.0, fat: 0.8, fiber: 0.8, unit: "100ml" },
  { name: "Leche de soja", category: "bebidas", calories: 54, protein: 3.3, carbs: 6.3, fat: 1.8, fiber: 0.6, unit: "100ml" },
  { name: "Leche de coco (bebida)", category: "bebidas", calories: 23, protein: 0.2, carbs: 3.4, fat: 1.0, fiber: 0, unit: "100ml" },
  { name: "Zumo de naranja natural", category: "bebidas", calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2, unit: "100ml" },
  { name: "Zumo de manzana", category: "bebidas", calories: 46, protein: 0.1, carbs: 11.3, fat: 0.1, fiber: 0.2, unit: "100ml" },
  { name: "Café solo", category: "bebidas", calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, unit: "100ml" },
  { name: "Té verde", category: "bebidas", calories: 1, protein: 0.2, carbs: 0.2, fat: 0, fiber: 0, unit: "100ml" },
  { name: "Té negro", category: "bebidas", calories: 1, protein: 0.1, carbs: 0.3, fat: 0, fiber: 0, unit: "100ml" },
  // ─── CONDIMENTOS Y ESPECIAS ───────────────────────────────────────────────
  { name: "Sal marina", category: "condimentos", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, unit: "100g" },
  { name: "Pimienta negra", category: "condimentos", calories: 251, protein: 10.4, carbs: 63.9, fat: 3.3, fiber: 25.3, unit: "100g" },
  { name: "Pimentón dulce", category: "condimentos", calories: 282, protein: 14.1, carbs: 53.9, fat: 12.9, fiber: 34.9, unit: "100g" },
  { name: "Comino", category: "condimentos", calories: 375, protein: 17.8, carbs: 44.2, fat: 22.3, fiber: 10.5, unit: "100g" },
  { name: "Cúrcuma", category: "condimentos", calories: 354, protein: 7.8, carbs: 64.9, fat: 9.9, fiber: 21.1, unit: "100g" },
  { name: "Canela", category: "condimentos", calories: 247, protein: 4.0, carbs: 80.6, fat: 1.2, fiber: 53.1, unit: "100g" },
  { name: "Orégano seco", category: "condimentos", calories: 265, protein: 9.0, carbs: 68.9, fat: 4.3, fiber: 42.5, unit: "100g" },
  { name: "Tomillo seco", category: "condimentos", calories: 276, protein: 9.1, carbs: 63.9, fat: 7.4, fiber: 37.0, unit: "100g" },
  { name: "Romero seco", category: "condimentos", calories: 331, protein: 4.9, carbs: 64.1, fat: 15.2, fiber: 42.6, unit: "100g" },
  { name: "Laurel seco", category: "condimentos", calories: 313, protein: 7.6, carbs: 74.9, fat: 8.4, fiber: 26.3, unit: "100g" },
  { name: "Jengibre fresco", category: "condimentos", calories: 80, protein: 1.8, carbs: 17.8, fat: 0.8, fiber: 2.0, unit: "100g" },
  { name: "Ajo en polvo", category: "condimentos", calories: 331, protein: 16.8, carbs: 72.7, fat: 0.7, fiber: 9.0, unit: "100g" },
  { name: "Vinagre de manzana", category: "condimentos", calories: 21, protein: 0, carbs: 0.9, fat: 0, fiber: 0, unit: "100ml" },
  { name: "Salsa de soja", category: "condimentos", calories: 53, protein: 8.1, carbs: 4.9, fat: 0.1, fiber: 0.8, unit: "100ml" },
  { name: "Mostaza", category: "condimentos", calories: 66, protein: 4.4, carbs: 5.8, fat: 3.3, fiber: 3.2, unit: "100g" },
  { name: "Ketchup", category: "condimentos", calories: 101, protein: 1.7, carbs: 25.9, fat: 0.1, fiber: 0.3, unit: "100g" },
  { name: "Mayonesa", category: "condimentos", calories: 680, protein: 1.1, carbs: 0.6, fat: 74.9, fiber: 0, unit: "100g" },
  // ─── DULCES Y POSTRES ─────────────────────────────────────────────────────
  { name: "Chocolate negro 70%", category: "dulces", calories: 598, protein: 7.8, carbs: 45.9, fat: 42.6, fiber: 10.9, unit: "100g" },
  { name: "Chocolate con leche", category: "dulces", calories: 535, protein: 7.7, carbs: 59.2, fat: 29.7, fiber: 3.4, unit: "100g" },
  { name: "Miel", category: "dulces", calories: 304, protein: 0.3, carbs: 82.4, fat: 0, fiber: 0.2, unit: "100g" },
  { name: "Sirope de agave", category: "dulces", calories: 310, protein: 0.1, carbs: 76.0, fat: 0.5, fiber: 0, unit: "100ml" },
  { name: "Azúcar moreno", category: "dulces", calories: 380, protein: 0.1, carbs: 98.1, fat: 0, fiber: 0, unit: "100g" },
  { name: "Stevia (polvo)", category: "dulces", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, unit: "100g" },
  { name: "Mermelada de fresa", category: "dulces", calories: 250, protein: 0.4, carbs: 65.0, fat: 0.1, fiber: 0.6, unit: "100g" },
  // ─── SUPLEMENTOS ──────────────────────────────────────────────────────────
  { name: "Proteína de suero (whey)", category: "suplementos", calories: 373, protein: 78.0, carbs: 8.0, fat: 5.0, fiber: 0, unit: "100g" },
  { name: "Proteína vegana (guisante)", category: "suplementos", calories: 360, protein: 80.0, carbs: 5.0, fat: 4.0, fiber: 2.0, unit: "100g" },
  { name: "Creatina monohidrato", category: "suplementos", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, unit: "100g" },
  { name: "Colágeno hidrolizado", category: "suplementos", calories: 350, protein: 90.0, carbs: 0, fat: 0, fiber: 0, unit: "100g" },
];

async function seed() {
  console.log(`Seeding ${ingredients.length} ingredients...`);
  let inserted = 0;
  let skipped = 0;

  for (const ing of ingredients) {
    try {
      const existing = await pool.query(
        'SELECT id FROM ingredient_nutrition WHERE name = $1',
        [ing.name]
      );
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }
      await pool.query(
        `INSERT INTO ingredient_nutrition (name, category, calories, protein, carbs, fat, fiber, unit, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [ing.name, ing.category, ing.calories, ing.protein, ing.carbs, ing.fat, ing.fiber, ing.unit]
      );
      inserted++;
    } catch (e) {
      console.error(`Error inserting ${ing.name}:`, e.message);
    }
  }

  const total = await pool.query('SELECT COUNT(*) FROM ingredient_nutrition');
  console.log(`✅ Done! Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  console.log(`📊 Total ingredients in DB: ${total.rows[0].count}`);
  await pool.end();
}

seed().catch(console.error);
