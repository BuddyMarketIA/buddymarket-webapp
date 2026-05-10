/**
 * Seed Lidl España catalog with representative products per category
 * Based on real Lidl España product range (Freshona, Milbona, Combino, etc.)
 */
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const products = [
  // ── Frutas y verduras ──────────────────────────────────────────────────────
  { name: "Manzanas Gala 1kg", brand: "Freshona", category: "Frutas y verduras", subcategory: "Fruta", price: 1.49, packaging: "1 kg" },
  { name: "Plátanos de Canarias 1kg", brand: "Freshona", category: "Frutas y verduras", subcategory: "Fruta", price: 1.69, packaging: "1 kg" },
  { name: "Naranjas de mesa 2kg", brand: "Freshona", category: "Frutas y verduras", subcategory: "Fruta", price: 2.29, packaging: "2 kg" },
  { name: "Peras Conference 1kg", brand: "Freshona", category: "Frutas y verduras", subcategory: "Fruta", price: 1.59, packaging: "1 kg" },
  { name: "Uvas blancas sin pepitas 500g", brand: "Freshona", category: "Frutas y verduras", subcategory: "Fruta", price: 1.99, packaging: "500 g" },
  { name: "Fresas 500g", brand: "Freshona", category: "Frutas y verduras", subcategory: "Fruta", price: 1.79, packaging: "500 g" },
  { name: "Kiwis 6 unidades", brand: "Freshona", category: "Frutas y verduras", subcategory: "Fruta", price: 1.49, packaging: "6 ud" },
  { name: "Melón piel de sapo 1 unidad", brand: "Freshona", category: "Frutas y verduras", subcategory: "Fruta", price: 2.49, packaging: "1 ud" },
  { name: "Tomates rama 500g", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 1.29, packaging: "500 g" },
  { name: "Tomates cherry 250g", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 0.99, packaging: "250 g" },
  { name: "Lechuga iceberg 1 unidad", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 0.79, packaging: "1 ud" },
  { name: "Espinacas baby 150g", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 1.19, packaging: "150 g" },
  { name: "Brócoli 500g", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 1.09, packaging: "500 g" },
  { name: "Zanahorias 1kg", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 0.89, packaging: "1 kg" },
  { name: "Cebolla 1kg", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 0.79, packaging: "1 kg" },
  { name: "Pimiento rojo 3 unidades", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 1.49, packaging: "3 ud" },
  { name: "Pimiento verde 3 unidades", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 1.29, packaging: "3 ud" },
  { name: "Pepino 2 unidades", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 0.89, packaging: "2 ud" },
  { name: "Calabacín 500g", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 0.99, packaging: "500 g" },
  { name: "Berenjena 2 unidades", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 1.19, packaging: "2 ud" },
  { name: "Patatas 2,5kg", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 1.99, packaging: "2,5 kg" },
  { name: "Ajo cabeza 3 unidades", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 0.59, packaging: "3 ud" },
  { name: "Champiñones laminados 250g", brand: "Freshona", category: "Frutas y verduras", subcategory: "Verdura", price: 1.09, packaging: "250 g" },
  { name: "Aguacate 2 unidades", brand: "Freshona", category: "Frutas y verduras", subcategory: "Fruta", price: 1.49, packaging: "2 ud" },
  { name: "Limones malla 500g", brand: "Freshona", category: "Frutas y verduras", subcategory: "Fruta", price: 0.99, packaging: "500 g" },

  // ── Lácteos y huevos ───────────────────────────────────────────────────────
  { name: "Leche entera Milbona 1L", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Leche", price: 0.79, packaging: "1 L" },
  { name: "Leche semidesnatada Milbona 1L", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Leche", price: 0.79, packaging: "1 L" },
  { name: "Leche desnatada Milbona 1L", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Leche", price: 0.79, packaging: "1 L" },
  { name: "Leche sin lactosa Milbona 1L", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Leche", price: 1.09, packaging: "1 L" },
  { name: "Bebida de avena Milbona 1L", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Bebidas vegetales", price: 0.99, packaging: "1 L" },
  { name: "Bebida de soja Milbona 1L", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Bebidas vegetales", price: 0.99, packaging: "1 L" },
  { name: "Yogur natural Milbona pack 4", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Yogures", price: 0.89, packaging: "4 × 125 g" },
  { name: "Yogur griego natural Milbona 500g", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Yogures", price: 1.29, packaging: "500 g" },
  { name: "Yogur de fresa Milbona pack 4", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Yogures", price: 0.99, packaging: "4 × 125 g" },
  { name: "Queso fresco Milbona 300g", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Queso", price: 1.19, packaging: "300 g" },
  { name: "Queso mozzarella Milbona 125g", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Queso", price: 0.89, packaging: "125 g" },
  { name: "Queso manchego tierno Milbona 200g", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Queso", price: 2.29, packaging: "200 g" },
  { name: "Queso rallado Milbona 150g", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Queso", price: 1.09, packaging: "150 g" },
  { name: "Mantequilla Milbona 250g", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Mantequilla", price: 1.49, packaging: "250 g" },
  { name: "Nata para cocinar Milbona 200ml", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Nata", price: 0.79, packaging: "200 ml" },
  { name: "Huevos camperos L 12 unidades", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Huevos", price: 2.49, packaging: "12 ud" },
  { name: "Huevos M 6 unidades", brand: "Milbona", category: "Lácteos y huevos", subcategory: "Huevos", price: 1.19, packaging: "6 ud" },

  // ── Carnes y aves ──────────────────────────────────────────────────────────
  { name: "Pechuga de pollo filetes 500g", brand: "Freshona", category: "Carnes y aves", subcategory: "Pollo", price: 3.49, packaging: "500 g" },
  { name: "Muslos de pollo 1kg", brand: "Freshona", category: "Carnes y aves", subcategory: "Pollo", price: 2.99, packaging: "1 kg" },
  { name: "Pollo entero 1,5kg", brand: "Freshona", category: "Carnes y aves", subcategory: "Pollo", price: 4.49, packaging: "~1,5 kg" },
  { name: "Carne picada mixta 500g", brand: "Freshona", category: "Carnes y aves", subcategory: "Vacuno", price: 2.79, packaging: "500 g" },
  { name: "Filetes de ternera 300g", brand: "Freshona", category: "Carnes y aves", subcategory: "Vacuno", price: 4.99, packaging: "300 g" },
  { name: "Lomo de cerdo filetes 400g", brand: "Freshona", category: "Carnes y aves", subcategory: "Cerdo", price: 3.29, packaging: "400 g" },
  { name: "Chuletas de cerdo 500g", brand: "Freshona", category: "Carnes y aves", subcategory: "Cerdo", price: 2.99, packaging: "500 g" },
  { name: "Bacon ahumado lonchas 150g", brand: "Freshona", category: "Carnes y aves", subcategory: "Cerdo", price: 1.29, packaging: "150 g" },
  { name: "Salchichas Frankfurt 6 unidades", brand: "Freshona", category: "Carnes y aves", subcategory: "Embutidos", price: 1.09, packaging: "6 ud" },
  { name: "Hamburguesas de vacuno 4 unidades", brand: "Freshona", category: "Carnes y aves", subcategory: "Vacuno", price: 3.49, packaging: "4 × 125 g" },

  // ── Pescados y mariscos ────────────────────────────────────────────────────
  { name: "Salmón noruego filetes 300g", brand: "Freshona", category: "Pescados y mariscos", subcategory: "Pescado fresco", price: 5.99, packaging: "300 g" },
  { name: "Merluza filetes 400g", brand: "Freshona", category: "Pescados y mariscos", subcategory: "Pescado fresco", price: 4.49, packaging: "400 g" },
  { name: "Bacalao desalado 300g", brand: "Freshona", category: "Pescados y mariscos", subcategory: "Pescado fresco", price: 3.99, packaging: "300 g" },
  { name: "Gambas peladas congeladas 200g", brand: "Freshona", category: "Pescados y mariscos", subcategory: "Marisco", price: 3.49, packaging: "200 g" },
  { name: "Atún en aceite de oliva 3 × 80g", brand: "Nixe", category: "Pescados y mariscos", subcategory: "Conservas", price: 2.49, packaging: "3 × 80 g" },
  { name: "Sardinas en aceite 120g", brand: "Nixe", category: "Pescados y mariscos", subcategory: "Conservas", price: 0.89, packaging: "120 g" },
  { name: "Mejillones en escabeche 115g", brand: "Nixe", category: "Pescados y mariscos", subcategory: "Conservas", price: 1.29, packaging: "115 g" },

  // ── Pasta, arroz y legumbres ───────────────────────────────────────────────
  { name: "Espaguetis Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Pasta", price: 0.59, packaging: "500 g" },
  { name: "Macarrones Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Pasta", price: 0.59, packaging: "500 g" },
  { name: "Penne Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Pasta", price: 0.59, packaging: "500 g" },
  { name: "Pasta integral Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Pasta", price: 0.79, packaging: "500 g" },
  { name: "Arroz redondo Combino 1kg", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Arroz", price: 0.89, packaging: "1 kg" },
  { name: "Arroz largo Combino 1kg", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Arroz", price: 0.99, packaging: "1 kg" },
  { name: "Arroz basmati Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Arroz", price: 1.09, packaging: "500 g" },
  { name: "Garbanzos cocidos Combino 400g", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Legumbres", price: 0.69, packaging: "400 g" },
  { name: "Lentejas cocidas Combino 400g", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Legumbres", price: 0.69, packaging: "400 g" },
  { name: "Alubias blancas Combino 400g", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Legumbres", price: 0.69, packaging: "400 g" },
  { name: "Quinoa Combino 400g", brand: "Combino", category: "Pasta, arroz y legumbres", subcategory: "Cereales", price: 1.99, packaging: "400 g" },

  // ── Pan y panadería ────────────────────────────────────────────────────────
  { name: "Pan de molde blanco 500g", brand: "Rosenmehl", category: "Pan y panadería", subcategory: "Pan de molde", price: 0.99, packaging: "500 g" },
  { name: "Pan de molde integral 500g", brand: "Rosenmehl", category: "Pan y panadería", subcategory: "Pan de molde", price: 1.09, packaging: "500 g" },
  { name: "Pan de molde sin gluten 250g", brand: "Rosenmehl", category: "Pan y panadería", subcategory: "Pan de molde", price: 2.29, packaging: "250 g" },
  { name: "Baguette precocida 2 unidades", brand: "Rosenmehl", category: "Pan y panadería", subcategory: "Pan", price: 0.89, packaging: "2 ud" },
  { name: "Pan de hamburguesa 4 unidades", brand: "Rosenmehl", category: "Pan y panadería", subcategory: "Pan", price: 0.99, packaging: "4 ud" },
  { name: "Tostadas integrales 500g", brand: "Rosenmehl", category: "Pan y panadería", subcategory: "Tostadas", price: 1.19, packaging: "500 g" },
  { name: "Crackers de centeno 200g", brand: "Rosenmehl", category: "Pan y panadería", subcategory: "Tostadas", price: 0.99, packaging: "200 g" },
  { name: "Croissants 6 unidades", brand: "Rosenmehl", category: "Pan y panadería", subcategory: "Bollería", price: 1.49, packaging: "6 ud" },

  // ── Aceites y condimentos ──────────────────────────────────────────────────
  { name: "Aceite de oliva virgen extra 1L", brand: "Belantis", category: "Aceites y condimentos", subcategory: "Aceite de oliva", price: 3.99, packaging: "1 L" },
  { name: "Aceite de girasol 1L", brand: "Belantis", category: "Aceites y condimentos", subcategory: "Aceite de girasol", price: 1.29, packaging: "1 L" },
  { name: "Vinagre de vino blanco 500ml", brand: "Belantis", category: "Aceites y condimentos", subcategory: "Vinagre", price: 0.59, packaging: "500 ml" },
  { name: "Vinagre balsámico 250ml", brand: "Belantis", category: "Aceites y condimentos", subcategory: "Vinagre", price: 1.29, packaging: "250 ml" },
  { name: "Sal marina fina 1kg", brand: "Belantis", category: "Aceites y condimentos", subcategory: "Sal", price: 0.39, packaging: "1 kg" },
  { name: "Pimienta negra molida 50g", brand: "Belantis", category: "Aceites y condimentos", subcategory: "Especias", price: 0.79, packaging: "50 g" },
  { name: "Pimentón dulce 75g", brand: "Belantis", category: "Aceites y condimentos", subcategory: "Especias", price: 0.79, packaging: "75 g" },
  { name: "Orégano seco 15g", brand: "Belantis", category: "Aceites y condimentos", subcategory: "Especias", price: 0.49, packaging: "15 g" },
  { name: "Comino molido 40g", brand: "Belantis", category: "Aceites y condimentos", subcategory: "Especias", price: 0.69, packaging: "40 g" },
  { name: "Curry en polvo 40g", brand: "Belantis", category: "Aceites y condimentos", subcategory: "Especias", price: 0.79, packaging: "40 g" },
  { name: "Ketchup 500ml", brand: "Freshona", category: "Aceites y condimentos", subcategory: "Salsas", price: 0.89, packaging: "500 ml" },
  { name: "Mostaza Dijon 200ml", brand: "Freshona", category: "Aceites y condimentos", subcategory: "Salsas", price: 0.79, packaging: "200 ml" },
  { name: "Mayonesa 400ml", brand: "Freshona", category: "Aceites y condimentos", subcategory: "Salsas", price: 1.09, packaging: "400 ml" },
  { name: "Salsa de soja 150ml", brand: "Freshona", category: "Aceites y condimentos", subcategory: "Salsas", price: 0.99, packaging: "150 ml" },

  // ── Conservas ──────────────────────────────────────────────────────────────
  { name: "Tomate triturado Combino 400g", brand: "Combino", category: "Conservas", subcategory: "Tomate", price: 0.49, packaging: "400 g" },
  { name: "Tomate entero pelado Combino 400g", brand: "Combino", category: "Conservas", subcategory: "Tomate", price: 0.49, packaging: "400 g" },
  { name: "Tomate frito Combino 350g", brand: "Combino", category: "Conservas", subcategory: "Tomate", price: 0.59, packaging: "350 g" },
  { name: "Maíz dulce Combino 285g", brand: "Combino", category: "Conservas", subcategory: "Verduras", price: 0.59, packaging: "285 g" },
  { name: "Guisantes Combino 400g", brand: "Combino", category: "Conservas", subcategory: "Verduras", price: 0.59, packaging: "400 g" },
  { name: "Caldo de pollo Combino 1L", brand: "Combino", category: "Conservas", subcategory: "Caldos", price: 0.99, packaging: "1 L" },
  { name: "Caldo de verduras Combino 1L", brand: "Combino", category: "Conservas", subcategory: "Caldos", price: 0.99, packaging: "1 L" },

  // ── Cereales y desayuno ────────────────────────────────────────────────────
  { name: "Copos de avena Crownfield 500g", brand: "Crownfield", category: "Cereales y desayuno", subcategory: "Avena", price: 0.79, packaging: "500 g" },
  { name: "Muesli crujiente Crownfield 500g", brand: "Crownfield", category: "Cereales y desayuno", subcategory: "Muesli", price: 1.49, packaging: "500 g" },
  { name: "Granola con frutos rojos 400g", brand: "Crownfield", category: "Cereales y desayuno", subcategory: "Granola", price: 1.99, packaging: "400 g" },
  { name: "Cereales de maíz Crownfield 375g", brand: "Crownfield", category: "Cereales y desayuno", subcategory: "Cereales", price: 0.89, packaging: "375 g" },
  { name: "Cereales integrales Crownfield 500g", brand: "Crownfield", category: "Cereales y desayuno", subcategory: "Cereales", price: 1.09, packaging: "500 g" },
  { name: "Mermelada de fresa 450g", brand: "Freshona", category: "Cereales y desayuno", subcategory: "Mermeladas", price: 0.99, packaging: "450 g" },
  { name: "Mermelada de melocotón 450g", brand: "Freshona", category: "Cereales y desayuno", subcategory: "Mermeladas", price: 0.99, packaging: "450 g" },
  { name: "Crema de cacao y avellanas 400g", brand: "Choco Nussa", category: "Cereales y desayuno", subcategory: "Untables", price: 1.49, packaging: "400 g" },

  // ── Dulces y snacks ────────────────────────────────────────────────────────
  { name: "Chocolate negro 70% 100g", brand: "J.D. Gross", category: "Dulces y snacks", subcategory: "Chocolate", price: 0.99, packaging: "100 g" },
  { name: "Chocolate con leche 100g", brand: "J.D. Gross", category: "Dulces y snacks", subcategory: "Chocolate", price: 0.79, packaging: "100 g" },
  { name: "Galletas digestive 400g", brand: "Biscotto", category: "Dulces y snacks", subcategory: "Galletas", price: 0.89, packaging: "400 g" },
  { name: "Galletas de avena 200g", brand: "Biscotto", category: "Dulces y snacks", subcategory: "Galletas", price: 0.99, packaging: "200 g" },
  { name: "Patatas fritas onduladas 175g", brand: "Snackrite", category: "Dulces y snacks", subcategory: "Snacks salados", price: 0.89, packaging: "175 g" },
  { name: "Palomitas de microondas 3 × 100g", brand: "Snackrite", category: "Dulces y snacks", subcategory: "Snacks salados", price: 1.09, packaging: "3 × 100 g" },

  // ── Snacks y frutos secos ──────────────────────────────────────────────────
  { name: "Almendras tostadas 200g", brand: "Snackrite", category: "Snacks y frutos secos", subcategory: "Frutos secos", price: 1.99, packaging: "200 g" },
  { name: "Nueces peladas 200g", brand: "Snackrite", category: "Snacks y frutos secos", subcategory: "Frutos secos", price: 2.49, packaging: "200 g" },
  { name: "Anacardos tostados 150g", brand: "Snackrite", category: "Snacks y frutos secos", subcategory: "Frutos secos", price: 2.29, packaging: "150 g" },
  { name: "Mix de frutos secos 200g", brand: "Snackrite", category: "Snacks y frutos secos", subcategory: "Frutos secos", price: 1.99, packaging: "200 g" },
  { name: "Pasas sultanas 200g", brand: "Snackrite", category: "Snacks y frutos secos", subcategory: "Fruta seca", price: 0.99, packaging: "200 g" },

  // ── Agua y refrescos ───────────────────────────────────────────────────────
  { name: "Agua mineral natural 1,5L", brand: "Saskia", category: "Agua y refrescos", subcategory: "Agua", price: 0.29, packaging: "1,5 L" },
  { name: "Agua con gas 1,5L", brand: "Saskia", category: "Agua y refrescos", subcategory: "Agua", price: 0.39, packaging: "1,5 L" },
  { name: "Refresco de cola 2L", brand: "Freeway", category: "Agua y refrescos", subcategory: "Refrescos", price: 0.89, packaging: "2 L" },
  { name: "Refresco de naranja 2L", brand: "Freeway", category: "Agua y refrescos", subcategory: "Refrescos", price: 0.89, packaging: "2 L" },
  { name: "Tónica 4 × 250ml", brand: "Freeway", category: "Agua y refrescos", subcategory: "Refrescos", price: 0.99, packaging: "4 × 250 ml" },
  { name: "Zumo de naranja 1L", brand: "Freshona", category: "Agua y refrescos", subcategory: "Zumos", price: 1.19, packaging: "1 L" },
  { name: "Zumo de piña 1L", brand: "Freshona", category: "Agua y refrescos", subcategory: "Zumos", price: 0.99, packaging: "1 L" },

  // ── Café e infusiones ──────────────────────────────────────────────────────
  { name: "Café molido natural 250g", brand: "Bellarom", category: "Café e infusiones", subcategory: "Café", price: 1.99, packaging: "250 g" },
  { name: "Café molido mezcla 250g", brand: "Bellarom", category: "Café e infusiones", subcategory: "Café", price: 1.79, packaging: "250 g" },
  { name: "Cápsulas café espresso 10 ud", brand: "Bellarom", category: "Café e infusiones", subcategory: "Café cápsulas", price: 1.99, packaging: "10 ud" },
  { name: "Té verde 20 bolsitas", brand: "Freshona", category: "Café e infusiones", subcategory: "Té", price: 0.79, packaging: "20 ud" },
  { name: "Manzanilla 20 bolsitas", brand: "Freshona", category: "Café e infusiones", subcategory: "Infusiones", price: 0.59, packaging: "20 ud" },

  // ── Congelados ─────────────────────────────────────────────────────────────
  { name: "Verduras para wok 750g", brand: "Freshona", category: "Congelados", subcategory: "Verduras", price: 1.99, packaging: "750 g" },
  { name: "Espinacas congeladas 750g", brand: "Freshona", category: "Congelados", subcategory: "Verduras", price: 1.29, packaging: "750 g" },
  { name: "Guisantes congelados 1kg", brand: "Freshona", category: "Congelados", subcategory: "Verduras", price: 1.49, packaging: "1 kg" },
  { name: "Patatas fritas congeladas 750g", brand: "Freshona", category: "Congelados", subcategory: "Patatas", price: 1.29, packaging: "750 g" },
  { name: "Pizza margarita congelada 360g", brand: "Trattoria Alfredo", category: "Congelados", subcategory: "Pizzas", price: 1.99, packaging: "360 g" },
  { name: "Lasaña boloñesa congelada 400g", brand: "Trattoria Alfredo", category: "Congelados", subcategory: "Platos preparados", price: 2.49, packaging: "400 g" },
  { name: "Helado de vainilla 900ml", brand: "Gelatelli", category: "Congelados", subcategory: "Helados", price: 2.49, packaging: "900 ml" },

  // ── Harina y repostería ────────────────────────────────────────────────────
  { name: "Harina de trigo 1kg", brand: "Combino", category: "Harina y repostería", subcategory: "Harina", price: 0.59, packaging: "1 kg" },
  { name: "Harina integral 1kg", brand: "Combino", category: "Harina y repostería", subcategory: "Harina", price: 0.79, packaging: "1 kg" },
  { name: "Azúcar blanco 1kg", brand: "Combino", category: "Harina y repostería", subcategory: "Azúcar", price: 0.89, packaging: "1 kg" },
  { name: "Azúcar moreno 500g", brand: "Combino", category: "Harina y repostería", subcategory: "Azúcar", price: 0.79, packaging: "500 g" },
  { name: "Levadura en polvo 3 × 10g", brand: "Combino", category: "Harina y repostería", subcategory: "Levadura", price: 0.39, packaging: "3 × 10 g" },
  { name: "Cacao en polvo 200g", brand: "Combino", category: "Harina y repostería", subcategory: "Cacao", price: 1.19, packaging: "200 g" },

  // ── Higiene y droguería ────────────────────────────────────────────────────
  { name: "Papel higiénico 8 rollos", brand: "Floralys", category: "Higiene y droguería", subcategory: "Papel higiénico", price: 2.99, packaging: "8 rollos" },
  { name: "Papel de cocina 4 rollos", brand: "Floralys", category: "Higiene y droguería", subcategory: "Papel cocina", price: 1.99, packaging: "4 rollos" },
  { name: "Detergente líquido 1,5L", brand: "W5", category: "Higiene y droguería", subcategory: "Detergente", price: 2.49, packaging: "1,5 L" },
  { name: "Lavavajillas líquido 750ml", brand: "W5", category: "Higiene y droguería", subcategory: "Lavavajillas", price: 0.99, packaging: "750 ml" },
  { name: "Gel de ducha 750ml", brand: "Cien", category: "Higiene y droguería", subcategory: "Higiene personal", price: 0.99, packaging: "750 ml" },
  { name: "Champú cabello normal 400ml", brand: "Cien", category: "Higiene y droguería", subcategory: "Higiene personal", price: 1.09, packaging: "400 ml" },
  { name: "Pasta de dientes 75ml", brand: "Cien", category: "Higiene y droguería", subcategory: "Higiene personal", price: 0.79, packaging: "75 ml" },
];

// Clear existing Lidl products
await conn.execute("DELETE FROM lidl_products");
console.log("Cleared existing Lidl products");

let inserted = 0;
for (const p of products) {
  try {
    // Store subcategory in full_title for filtering purposes
    const fullTitle = p.subcategory ? `${p.category} > ${p.subcategory} | ${p.name}` : p.name;
    await conn.execute(
      `INSERT INTO lidl_products (id, name, full_title, brand, category, price, packaging, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [randomUUID(), p.name, fullTitle, p.brand ?? null, p.category, p.price ?? null, p.packaging ?? null]
    );
    inserted++;
  } catch (err) {
    console.error(`Error inserting ${p.name}:`, err.message);
  }
}

console.log(`✅ Inserted ${inserted} Lidl products`);

const [rows] = await conn.execute("SELECT category, COUNT(*) as cnt FROM lidl_products GROUP BY category ORDER BY cnt DESC");
console.log("Categories:", rows);

await conn.end();
