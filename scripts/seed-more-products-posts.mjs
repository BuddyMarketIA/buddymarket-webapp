/**
 * Script para ampliar el catálogo de productos de supermercado
 * Tablas: mercadona_products, lidl_products, carrefour_products, alcampo_products
 */
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

// ============================================================
// MERCADONA PRODUCTS (más productos)
// Schema: id(int), slug, name, packaging, thumbnail, share_url, 
//         category_id, category_name, subcategory_id, subcategory_name,
//         bulk_price, unit_price, unit_size, size_format, reference_price, reference_format
// ============================================================
const mercadonaMore = [
  { id: 10001, slug: 'leche-entera-hacendado-1l', name: 'Leche entera Hacendado 1L', packaging: '1 L', categoryId: 1, categoryName: 'Lácteos', subcategoryId: 11, subcategoryName: 'Leche', bulkPrice: '0.89', unitPrice: '0.89/L' },
  { id: 10002, slug: 'yogur-natural-hacendado-pack8', name: 'Yogur natural Hacendado pack 8', packaging: '8 x 125 g', categoryId: 1, categoryName: 'Lácteos', subcategoryId: 12, subcategoryName: 'Yogures', bulkPrice: '1.49', unitPrice: '0.15/ud' },
  { id: 10003, slug: 'queso-manchego-curado-200g', name: 'Queso manchego curado Hacendado 200g', packaging: '200 g', categoryId: 1, categoryName: 'Lácteos', subcategoryId: 13, subcategoryName: 'Quesos', bulkPrice: '3.25', unitPrice: '16.25/kg' },
  { id: 10004, slug: 'mantequilla-hacendado-250g', name: 'Mantequilla Hacendado 250g', packaging: '250 g', categoryId: 1, categoryName: 'Lácteos', subcategoryId: 14, subcategoryName: 'Mantequilla', bulkPrice: '1.89', unitPrice: '7.56/kg' },
  { id: 10005, slug: 'nata-cocinar-200ml', name: 'Nata para cocinar Hacendado 200ml', packaging: '200 ml', categoryId: 1, categoryName: 'Lácteos', subcategoryId: 15, subcategoryName: 'Nata', bulkPrice: '0.79', unitPrice: '3.95/L' },
  { id: 10006, slug: 'pechuga-pollo-fresca-500g', name: 'Pechuga de pollo fresca 500g', packaging: '500 g', categoryId: 2, categoryName: 'Carnes y aves', subcategoryId: 21, subcategoryName: 'Pollo', bulkPrice: '3.99', unitPrice: '7.98/kg' },
  { id: 10007, slug: 'lomo-cerdo-fresco-500g', name: 'Lomo de cerdo fresco 500g', packaging: '500 g', categoryId: 2, categoryName: 'Carnes y aves', subcategoryId: 22, subcategoryName: 'Cerdo', bulkPrice: '3.49', unitPrice: '6.98/kg' },
  { id: 10008, slug: 'ternera-picada-400g', name: 'Ternera picada 400g', packaging: '400 g', categoryId: 2, categoryName: 'Carnes y aves', subcategoryId: 23, subcategoryName: 'Ternera', bulkPrice: '3.79', unitPrice: '9.48/kg' },
  { id: 10009, slug: 'salmon-fresco-300g', name: 'Salmón fresco 300g', packaging: '300 g', categoryId: 3, categoryName: 'Pescados y mariscos', subcategoryId: 31, subcategoryName: 'Salmón', bulkPrice: '5.49', unitPrice: '18.30/kg' },
  { id: 10010, slug: 'merluza-filetes-400g', name: 'Merluza filetes 400g', packaging: '400 g', categoryId: 3, categoryName: 'Pescados y mariscos', subcategoryId: 32, subcategoryName: 'Merluza', bulkPrice: '4.99', unitPrice: '12.48/kg' },
  { id: 10011, slug: 'gambas-peladas-congeladas-400g', name: 'Gambas peladas congeladas 400g', packaging: '400 g', categoryId: 3, categoryName: 'Pescados y mariscos', subcategoryId: 33, subcategoryName: 'Gambas', bulkPrice: '4.29', unitPrice: '10.73/kg' },
  { id: 10012, slug: 'arroz-redondo-1kg', name: 'Arroz redondo Hacendado 1kg', packaging: '1 kg', categoryId: 4, categoryName: 'Cereales y legumbres', subcategoryId: 41, subcategoryName: 'Arroz', bulkPrice: '0.99', unitPrice: '0.99/kg' },
  { id: 10013, slug: 'pasta-espaguetis-500g', name: 'Pasta espaguetis Hacendado 500g', packaging: '500 g', categoryId: 4, categoryName: 'Cereales y legumbres', subcategoryId: 42, subcategoryName: 'Pasta', bulkPrice: '0.65', unitPrice: '1.30/kg' },
  { id: 10014, slug: 'pan-molde-integral-500g', name: 'Pan de molde integral Hacendado 500g', packaging: '500 g', categoryId: 5, categoryName: 'Panadería', subcategoryId: 51, subcategoryName: 'Pan de molde', bulkPrice: '1.29', unitPrice: '2.58/kg' },
  { id: 10015, slug: 'tomates-cherry-500g', name: 'Tomates cherry 500g', packaging: '500 g', categoryId: 6, categoryName: 'Frutas y verduras', subcategoryId: 61, subcategoryName: 'Tomates', bulkPrice: '1.99', unitPrice: '3.98/kg' },
  { id: 10016, slug: 'brocoli-fresco-500g', name: 'Brócoli fresco 500g', packaging: '500 g', categoryId: 6, categoryName: 'Frutas y verduras', subcategoryId: 62, subcategoryName: 'Verduras', bulkPrice: '1.49', unitPrice: '2.98/kg' },
  { id: 10017, slug: 'espinacas-bolsa-300g', name: 'Espinacas bolsa 300g', packaging: '300 g', categoryId: 6, categoryName: 'Frutas y verduras', subcategoryId: 63, subcategoryName: 'Ensaladas', bulkPrice: '1.29', unitPrice: '4.30/kg' },
  { id: 10018, slug: 'aguacate-x2', name: 'Aguacate x2', packaging: '2 uds', categoryId: 6, categoryName: 'Frutas y verduras', subcategoryId: 64, subcategoryName: 'Frutas', bulkPrice: '1.79', unitPrice: '0.90/ud' },
  { id: 10019, slug: 'platanos-canarias-1kg', name: 'Plátanos de Canarias 1kg', packaging: '1 kg', categoryId: 6, categoryName: 'Frutas y verduras', subcategoryId: 64, subcategoryName: 'Frutas', bulkPrice: '1.69', unitPrice: '1.69/kg' },
  { id: 10020, slug: 'aceite-oliva-virgen-extra-1l', name: 'Aceite de oliva virgen extra Hacendado 1L', packaging: '1 L', categoryId: 7, categoryName: 'Aceites y condimentos', subcategoryId: 71, subcategoryName: 'Aceite de oliva', bulkPrice: '6.99', unitPrice: '6.99/L' },
  { id: 10021, slug: 'garbanzos-cocidos-400g', name: 'Legumbres cocidas garbanzos 400g', packaging: '400 g', categoryId: 4, categoryName: 'Cereales y legumbres', subcategoryId: 43, subcategoryName: 'Legumbres', bulkPrice: '0.79', unitPrice: '1.98/kg' },
  { id: 10022, slug: 'lentejas-cocidas-400g', name: 'Lentejas cocidas 400g', packaging: '400 g', categoryId: 4, categoryName: 'Cereales y legumbres', subcategoryId: 43, subcategoryName: 'Legumbres', bulkPrice: '0.79', unitPrice: '1.98/kg' },
  { id: 10023, slug: 'huevos-camperos-l-x12', name: 'Huevos camperos L x12', packaging: '12 uds', categoryId: 8, categoryName: 'Huevos', subcategoryId: 81, subcategoryName: 'Huevos camperos', bulkPrice: '2.99', unitPrice: '0.25/ud' },
  { id: 10024, slug: 'almendras-crudas-200g', name: 'Almendras crudas Hacendado 200g', packaging: '200 g', categoryId: 9, categoryName: 'Frutos secos', subcategoryId: 91, subcategoryName: 'Almendras', bulkPrice: '2.49', unitPrice: '12.45/kg' },
  { id: 10025, slug: 'nueces-peladas-200g', name: 'Nueces peladas Hacendado 200g', packaging: '200 g', categoryId: 9, categoryName: 'Frutos secos', subcategoryId: 92, subcategoryName: 'Nueces', bulkPrice: '2.79', unitPrice: '13.95/kg' },
  { id: 10026, slug: 'proteina-whey-chocolate-1kg', name: 'Proteína whey chocolate Hacendado 1kg', packaging: '1 kg', categoryId: 10, categoryName: 'Suplementos', subcategoryId: 101, subcategoryName: 'Proteínas', bulkPrice: '14.99', unitPrice: '14.99/kg' },
  { id: 10027, slug: 'avena-copos-500g', name: 'Avena en copos Hacendado 500g', packaging: '500 g', categoryId: 4, categoryName: 'Cereales y legumbres', subcategoryId: 44, subcategoryName: 'Avena', bulkPrice: '0.89', unitPrice: '1.78/kg' },
  { id: 10028, slug: 'miel-flores-500g', name: 'Miel de flores Hacendado 500g', packaging: '500 g', categoryId: 11, categoryName: 'Endulzantes', subcategoryId: 111, subcategoryName: 'Miel', bulkPrice: '3.49', unitPrice: '6.98/kg' },
  { id: 10029, slug: 'zumo-naranja-natural-1l', name: 'Zumo naranja natural 1L', packaging: '1 L', categoryId: 12, categoryName: 'Bebidas', subcategoryId: 121, subcategoryName: 'Zumos', bulkPrice: '2.29', unitPrice: '2.29/L' },
  { id: 10030, slug: 'agua-mineral-6x1-5l', name: 'Agua mineral 6x1.5L', packaging: '6 x 1.5 L', categoryId: 12, categoryName: 'Bebidas', subcategoryId: 122, subcategoryName: 'Agua', bulkPrice: '1.89', unitPrice: '0.21/L' },
];

// ============================================================
// LIDL PRODUCTS (más productos)
// Schema: id(varchar), name, full_title, brand, image, price, packaging, category, canonical_path, online_available
// ============================================================
const lidlMore = [
  { id: 'lidl-20001', name: 'Leche entera Milbona 1L', fullTitle: 'Leche entera Milbona 1L', brand: 'Milbona', price: 0.79, packaging: '1 L', category: 'Lácteos' },
  { id: 'lidl-20002', name: 'Queso gouda lonchas Milbona 200g', fullTitle: 'Queso gouda lonchas Milbona 200g', brand: 'Milbona', price: 1.79, packaging: '200 g', category: 'Lácteos' },
  { id: 'lidl-20003', name: 'Skyr natural Milbona 500g', fullTitle: 'Skyr natural Milbona 500g', brand: 'Milbona', price: 1.49, packaging: '500 g', category: 'Lácteos' },
  { id: 'lidl-20004', name: 'Pechuga de pollo Lidl 600g', fullTitle: 'Pechuga de pollo fresca Lidl 600g', brand: null, price: 4.49, packaging: '600 g', category: 'Carnes y aves' },
  { id: 'lidl-20005', name: 'Salmón ahumado Nixe 100g', fullTitle: 'Salmón ahumado al estilo escocés Nixe 100g', brand: 'Nixe', price: 2.49, packaging: '100 g', category: 'Pescados' },
  { id: 'lidl-20006', name: 'Bacalao desalado Nixe 400g', fullTitle: 'Bacalao desalado Nixe 400g', brand: 'Nixe', price: 4.99, packaging: '400 g', category: 'Pescados' },
  { id: 'lidl-20007', name: 'Pasta integral Combino 500g', fullTitle: 'Pasta integral espaguetis Combino 500g', brand: 'Combino', price: 0.79, packaging: '500 g', category: 'Pasta y arroz' },
  { id: 'lidl-20008', name: 'Arroz integral Combino 1kg', fullTitle: 'Arroz integral Combino 1kg', brand: 'Combino', price: 1.29, packaging: '1 kg', category: 'Pasta y arroz' },
  { id: 'lidl-20009', name: 'Pan de centeno Lidl 500g', fullTitle: 'Pan de centeno con semillas Lidl 500g', brand: null, price: 1.49, packaging: '500 g', category: 'Panadería' },
  { id: 'lidl-20010', name: 'Zanahorias 1kg', fullTitle: 'Zanahorias frescas 1kg', brand: null, price: 0.79, packaging: '1 kg', category: 'Frutas y verduras' },
  { id: 'lidl-20011', name: 'Coliflor fresca', fullTitle: 'Coliflor fresca Lidl', brand: null, price: 1.29, packaging: '1 ud', category: 'Frutas y verduras' },
  { id: 'lidl-20012', name: 'Fresas 500g', fullTitle: 'Fresas frescas 500g', brand: null, price: 1.99, packaging: '500 g', category: 'Frutas y verduras' },
  { id: 'lidl-20013', name: 'Naranja de mesa 2kg', fullTitle: 'Naranjas de mesa 2kg', brand: null, price: 1.99, packaging: '2 kg', category: 'Frutas y verduras' },
  { id: 'lidl-20014', name: 'Aceite oliva virgen Primadonna 750ml', fullTitle: 'Aceite de oliva virgen extra Primadonna 750ml', brand: 'Primadonna', price: 4.99, packaging: '750 ml', category: 'Aceites' },
  { id: 'lidl-20015', name: 'Tomate triturado Italiamo 400g', fullTitle: 'Tomate triturado Italiamo 400g', brand: 'Italiamo', price: 0.59, packaging: '400 g', category: 'Conservas' },
  { id: 'lidl-20016', name: 'Garbanzos cocidos Freshona 400g', fullTitle: 'Garbanzos cocidos Freshona 400g', brand: 'Freshona', price: 0.69, packaging: '400 g', category: 'Legumbres' },
  { id: 'lidl-20017', name: 'Huevos camperos M x10 Lidl', fullTitle: 'Huevos camperos M x10 Lidl', brand: null, price: 2.29, packaging: '10 uds', category: 'Huevos' },
  { id: 'lidl-20018', name: 'Almendras tostadas Snack Day 200g', fullTitle: 'Almendras tostadas y saladas Snack Day 200g', brand: 'Snack Day', price: 1.99, packaging: '200 g', category: 'Frutos secos' },
  { id: 'lidl-20019', name: 'Proteína de guisante Bio Lidl 400g', fullTitle: 'Proteína de guisante ecológica Lidl 400g', brand: 'Lidl Bio', price: 5.99, packaging: '400 g', category: 'Suplementos' },
  { id: 'lidl-20020', name: 'Granola con frutos rojos Lidl 400g', fullTitle: 'Granola crujiente con frutos rojos Lidl 400g', brand: null, price: 2.49, packaging: '400 g', category: 'Cereales' },
  { id: 'lidl-20021', name: 'Chocolate con leche Fin Carré 100g', fullTitle: 'Chocolate con leche Fin Carré 100g', brand: 'Fin Carré', price: 0.55, packaging: '100 g', category: 'Dulces' },
  { id: 'lidl-20022', name: 'Agua mineral Lidl 6x1.5L', fullTitle: 'Agua mineral natural Lidl pack 6x1.5L', brand: null, price: 1.49, packaging: '6 x 1.5 L', category: 'Bebidas' },
  { id: 'lidl-20023', name: 'Cerveza sin alcohol Lidl 6x33cl', fullTitle: 'Cerveza sin alcohol Lidl pack 6x33cl', brand: null, price: 2.99, packaging: '6 x 33 cl', category: 'Bebidas' },
  { id: 'lidl-20024', name: 'Yogur griego natural Milbona 4x150g', fullTitle: 'Yogur estilo griego natural Milbona 4x150g', brand: 'Milbona', price: 1.89, packaging: '4 x 150 g', category: 'Lácteos' },
  { id: 'lidl-20025', name: 'Mantequilla sin sal Milbona 250g', fullTitle: 'Mantequilla sin sal Milbona 250g', brand: 'Milbona', price: 1.79, packaging: '250 g', category: 'Lácteos' },
  { id: 'lidl-20026', name: 'Atún en aceite de oliva Nixe 3x80g', fullTitle: 'Atún claro en aceite de oliva Nixe 3x80g', brand: 'Nixe', price: 2.49, packaging: '3 x 80 g', category: 'Conservas' },
  { id: 'lidl-20027', name: 'Avena copos Lidl 500g', fullTitle: 'Copos de avena finos Lidl 500g', brand: null, price: 0.79, packaging: '500 g', category: 'Cereales' },
  { id: 'lidl-20028', name: 'Muesli con frutos secos Lidl 500g', fullTitle: 'Muesli crujiente con frutos secos Lidl 500g', brand: null, price: 1.99, packaging: '500 g', category: 'Cereales' },
  { id: 'lidl-20029', name: 'Semillas de chía Lidl 200g', fullTitle: 'Semillas de chía Lidl 200g', brand: null, price: 1.99, packaging: '200 g', category: 'Semillas' },
  { id: 'lidl-20030', name: 'Aguacate x2 Lidl', fullTitle: 'Aguacate listo para comer x2 Lidl', brand: null, price: 1.69, packaging: '2 uds', category: 'Frutas y verduras' },
];

// ============================================================
// CARREFOUR PRODUCTS (más productos)
// Schema: id(varchar), name, brand, price, price_per_unit, image, category, subcategory, packaging, product_url
// ============================================================
const carrefourMore = [
  { id: 'carr-30001', name: 'Leche semidesnatada Carrefour 1L', brand: 'Carrefour', price: 0.85, pricePerUnit: '0.85/L', category: 'Lácteos', subcategory: 'Leche', packaging: '1 L' },
  { id: 'carr-30002', name: 'Queso fresco batido 0% Carrefour 500g', brand: 'Carrefour', price: 1.49, pricePerUnit: '2.98/kg', category: 'Lácteos', subcategory: 'Quesos', packaging: '500 g' },
  { id: 'carr-30003', name: 'Yogur griego natural Carrefour 4x150g', brand: 'Carrefour', price: 1.89, pricePerUnit: '3.15/kg', category: 'Lácteos', subcategory: 'Yogures', packaging: '4 x 150 g' },
  { id: 'carr-30004', name: 'Pechuga de pavo loncheada 200g', brand: 'Carrefour', price: 2.19, pricePerUnit: '10.95/kg', category: 'Charcutería', subcategory: 'Pavo', packaging: '200 g' },
  { id: 'carr-30005', name: 'Jamón serrano Carrefour 100g', brand: 'Carrefour', price: 1.99, pricePerUnit: '19.90/kg', category: 'Charcutería', subcategory: 'Jamón', packaging: '100 g' },
  { id: 'carr-30006', name: 'Pollo entero fresco 1.5kg', brand: null, price: 5.49, pricePerUnit: '3.66/kg', category: 'Carnes y aves', subcategory: 'Pollo', packaging: '1.5 kg' },
  { id: 'carr-30007', name: 'Atún en aceite de oliva Carrefour 3x80g', brand: 'Carrefour', price: 2.49, pricePerUnit: '10.38/kg', category: 'Conservas', subcategory: 'Atún', packaging: '3 x 80 g' },
  { id: 'carr-30008', name: 'Sardinas en tomate Carrefour 120g', brand: 'Carrefour', price: 0.89, pricePerUnit: '7.42/kg', category: 'Conservas', subcategory: 'Sardinas', packaging: '120 g' },
  { id: 'carr-30009', name: 'Pasta macarrones Carrefour 500g', brand: 'Carrefour', price: 0.59, pricePerUnit: '1.18/kg', category: 'Pasta y arroz', subcategory: 'Pasta', packaging: '500 g' },
  { id: 'carr-30010', name: 'Arroz basmati Carrefour 1kg', brand: 'Carrefour', price: 1.79, pricePerUnit: '1.79/kg', category: 'Pasta y arroz', subcategory: 'Arroz', packaging: '1 kg' },
  { id: 'carr-30011', name: 'Quinoa Carrefour 500g', brand: 'Carrefour', price: 2.99, pricePerUnit: '5.98/kg', category: 'Pasta y arroz', subcategory: 'Quinoa', packaging: '500 g' },
  { id: 'carr-30012', name: 'Lechuga iceberg Carrefour', brand: null, price: 0.99, pricePerUnit: '0.99/ud', category: 'Frutas y verduras', subcategory: 'Ensaladas', packaging: '1 ud' },
  { id: 'carr-30013', name: 'Pimiento rojo 3 uds', brand: null, price: 1.29, pricePerUnit: '0.43/ud', category: 'Frutas y verduras', subcategory: 'Pimientos', packaging: '3 uds' },
  { id: 'carr-30014', name: 'Cebolla 1kg', brand: null, price: 0.89, pricePerUnit: '0.89/kg', category: 'Frutas y verduras', subcategory: 'Cebollas', packaging: '1 kg' },
  { id: 'carr-30015', name: 'Manzanas Golden 1.5kg', brand: null, price: 1.99, pricePerUnit: '1.33/kg', category: 'Frutas y verduras', subcategory: 'Manzanas', packaging: '1.5 kg' },
  { id: 'carr-30016', name: 'Aceite de girasol Carrefour 1L', brand: 'Carrefour', price: 1.69, pricePerUnit: '1.69/L', category: 'Aceites', subcategory: 'Girasol', packaging: '1 L' },
  { id: 'carr-30017', name: 'Salsa de tomate frito Carrefour 350g', brand: 'Carrefour', price: 0.69, pricePerUnit: '1.97/kg', category: 'Conservas', subcategory: 'Salsas', packaging: '350 g' },
  { id: 'carr-30018', name: 'Judías blancas cocidas Carrefour 400g', brand: 'Carrefour', price: 0.75, pricePerUnit: '1.88/kg', category: 'Legumbres', subcategory: 'Judías', packaging: '400 g' },
  { id: 'carr-30019', name: 'Huevos M x12 Carrefour', brand: 'Carrefour', price: 2.49, pricePerUnit: '0.21/ud', category: 'Huevos', subcategory: 'Huevos frescos', packaging: '12 uds' },
  { id: 'carr-30020', name: 'Muesli con frutas Carrefour 500g', brand: 'Carrefour', price: 1.99, pricePerUnit: '3.98/kg', category: 'Cereales', subcategory: 'Muesli', packaging: '500 g' },
  { id: 'carr-30021', name: 'Café molido natural Carrefour 250g', brand: 'Carrefour', price: 2.29, pricePerUnit: '9.16/kg', category: 'Bebidas', subcategory: 'Café', packaging: '250 g' },
  { id: 'carr-30022', name: 'Té verde Carrefour 20 bolsitas', brand: 'Carrefour', price: 1.29, pricePerUnit: '0.06/ud', category: 'Bebidas', subcategory: 'Infusiones', packaging: '20 uds' },
  { id: 'carr-30023', name: 'Chocolate negro 70% Carrefour 100g', brand: 'Carrefour', price: 0.99, pricePerUnit: '9.90/kg', category: 'Dulces', subcategory: 'Chocolate', packaging: '100 g' },
  { id: 'carr-30024', name: 'Galletas integrales Carrefour 400g', brand: 'Carrefour', price: 1.49, pricePerUnit: '3.73/kg', category: 'Panadería', subcategory: 'Galletas', packaging: '400 g' },
  { id: 'carr-30025', name: 'Semillas de chía Carrefour 200g', brand: 'Carrefour', price: 2.49, pricePerUnit: '12.45/kg', category: 'Semillas', subcategory: 'Chía', packaging: '200 g' },
  { id: 'carr-30026', name: 'Salmón fresco Carrefour 300g', brand: null, price: 5.99, pricePerUnit: '19.97/kg', category: 'Pescados', subcategory: 'Salmón', packaging: '300 g' },
  { id: 'carr-30027', name: 'Merluza congelada Carrefour 500g', brand: 'Carrefour', price: 3.99, pricePerUnit: '7.98/kg', category: 'Pescados', subcategory: 'Merluza', packaging: '500 g' },
  { id: 'carr-30028', name: 'Leche de almendras Carrefour 1L', brand: 'Carrefour', price: 1.39, pricePerUnit: '1.39/L', category: 'Bebidas vegetales', subcategory: 'Almendras', packaging: '1 L' },
  { id: 'carr-30029', name: 'Avena copos Carrefour 500g', brand: 'Carrefour', price: 0.89, pricePerUnit: '1.78/kg', category: 'Cereales', subcategory: 'Avena', packaging: '500 g' },
  { id: 'carr-30030', name: 'Proteína whey vainilla Carrefour 1kg', brand: 'Carrefour', price: 15.99, pricePerUnit: '15.99/kg', category: 'Suplementos', subcategory: 'Proteínas', packaging: '1 kg' },
];

// ============================================================
// ALCAMPO PRODUCTS (más productos)
// Schema: id(varchar), name, brand, price, price_per_unit, image, category, subcategory, packaging, product_url
// ============================================================
const alcampoMore = [
  { id: 'alc-40001', name: 'Leche desnatada Auchan 1L', brand: 'Auchan', price: 0.75, pricePerUnit: '0.75/L', category: 'Lácteos', subcategory: 'Leche', packaging: '1 L' },
  { id: 'alc-40002', name: 'Queso brie Auchan 200g', brand: 'Auchan', price: 2.49, pricePerUnit: '12.45/kg', category: 'Lácteos', subcategory: 'Quesos', packaging: '200 g' },
  { id: 'alc-40003', name: 'Kéfir natural Auchan 500ml', brand: 'Auchan', price: 1.79, pricePerUnit: '3.58/L', category: 'Lácteos', subcategory: 'Kéfir', packaging: '500 ml' },
  { id: 'alc-40004', name: 'Muslos de pollo Alcampo 1kg', brand: null, price: 3.99, pricePerUnit: '3.99/kg', category: 'Carnes y aves', subcategory: 'Pollo', packaging: '1 kg' },
  { id: 'alc-40005', name: 'Costillas de cerdo 1kg', brand: null, price: 4.49, pricePerUnit: '4.49/kg', category: 'Carnes y aves', subcategory: 'Cerdo', packaging: '1 kg' },
  { id: 'alc-40006', name: 'Dorada fresca 400g', brand: null, price: 4.99, pricePerUnit: '12.48/kg', category: 'Pescados', subcategory: 'Dorada', packaging: '400 g' },
  { id: 'alc-40007', name: 'Mejillones en escabeche Auchan 120g', brand: 'Auchan', price: 1.29, pricePerUnit: '10.75/kg', category: 'Conservas', subcategory: 'Mejillones', packaging: '120 g' },
  { id: 'alc-40008', name: 'Espaguetis integrales Auchan 500g', brand: 'Auchan', price: 0.79, pricePerUnit: '1.58/kg', category: 'Pasta y arroz', subcategory: 'Pasta', packaging: '500 g' },
  { id: 'alc-40009', name: 'Cuscús Auchan 500g', brand: 'Auchan', price: 1.29, pricePerUnit: '2.58/kg', category: 'Pasta y arroz', subcategory: 'Cuscús', packaging: '500 g' },
  { id: 'alc-40010', name: 'Patatas 2kg', brand: null, price: 1.99, pricePerUnit: '1.00/kg', category: 'Frutas y verduras', subcategory: 'Patatas', packaging: '2 kg' },
  { id: 'alc-40011', name: 'Calabacín 500g', brand: null, price: 0.99, pricePerUnit: '1.98/kg', category: 'Frutas y verduras', subcategory: 'Calabacín', packaging: '500 g' },
  { id: 'alc-40012', name: 'Berenjenas 2 uds', brand: null, price: 1.29, pricePerUnit: '0.65/ud', category: 'Frutas y verduras', subcategory: 'Berenjenas', packaging: '2 uds' },
  { id: 'alc-40013', name: 'Kiwis 4 uds', brand: null, price: 1.49, pricePerUnit: '0.37/ud', category: 'Frutas y verduras', subcategory: 'Kiwis', packaging: '4 uds' },
  { id: 'alc-40014', name: 'Aceite de coco Auchan 500ml', brand: 'Auchan', price: 4.99, pricePerUnit: '9.98/L', category: 'Aceites', subcategory: 'Coco', packaging: '500 ml' },
  { id: 'alc-40015', name: 'Vinagre de manzana Auchan 500ml', brand: 'Auchan', price: 1.29, pricePerUnit: '2.58/L', category: 'Aceites y condimentos', subcategory: 'Vinagre', packaging: '500 ml' },
  { id: 'alc-40016', name: 'Alubias pintas cocidas Auchan 400g', brand: 'Auchan', price: 0.75, pricePerUnit: '1.88/kg', category: 'Legumbres', subcategory: 'Alubias', packaging: '400 g' },
  { id: 'alc-40017', name: 'Huevos ecológicos M x6 Alcampo', brand: null, price: 2.29, pricePerUnit: '0.38/ud', category: 'Huevos', subcategory: 'Ecológicos', packaging: '6 uds' },
  { id: 'alc-40018', name: 'Pistachos tostados Auchan 150g', brand: 'Auchan', price: 2.99, pricePerUnit: '19.93/kg', category: 'Frutos secos', subcategory: 'Pistachos', packaging: '150 g' },
  { id: 'alc-40019', name: 'Copos de avena Auchan 1kg', brand: 'Auchan', price: 1.29, pricePerUnit: '1.29/kg', category: 'Cereales', subcategory: 'Avena', packaging: '1 kg' },
  { id: 'alc-40020', name: 'Leche de almendras Auchan 1L', brand: 'Auchan', price: 1.49, pricePerUnit: '1.49/L', category: 'Bebidas vegetales', subcategory: 'Almendras', packaging: '1 L' },
  { id: 'alc-40021', name: 'Leche de avena Auchan 1L', brand: 'Auchan', price: 1.59, pricePerUnit: '1.59/L', category: 'Bebidas vegetales', subcategory: 'Avena', packaging: '1 L' },
  { id: 'alc-40022', name: 'Proteína whey vainilla Auchan 1kg', brand: 'Auchan', price: 16.99, pricePerUnit: '16.99/kg', category: 'Suplementos', subcategory: 'Proteínas', packaging: '1 kg' },
  { id: 'alc-40023', name: 'Barritas de cereales Auchan x6', brand: 'Auchan', price: 1.99, pricePerUnit: '0.33/ud', category: 'Snacks', subcategory: 'Barritas', packaging: '6 uds' },
  { id: 'alc-40024', name: 'Kombucha jengibre Alcampo 330ml', brand: null, price: 1.99, pricePerUnit: '6.03/L', category: 'Bebidas', subcategory: 'Kombucha', packaging: '330 ml' },
  { id: 'alc-40025', name: 'Chocolate negro 85% Auchan 100g', brand: 'Auchan', price: 0.99, pricePerUnit: '9.90/kg', category: 'Dulces', subcategory: 'Chocolate', packaging: '100 g' },
  { id: 'alc-40026', name: 'Quinoa Auchan 500g', brand: 'Auchan', price: 2.79, pricePerUnit: '5.58/kg', category: 'Pasta y arroz', subcategory: 'Quinoa', packaging: '500 g' },
  { id: 'alc-40027', name: 'Salmón ahumado Auchan 100g', brand: 'Auchan', price: 2.29, pricePerUnit: '22.90/kg', category: 'Pescados', subcategory: 'Salmón', packaging: '100 g' },
  { id: 'alc-40028', name: 'Tomate frito Auchan 350g', brand: 'Auchan', price: 0.65, pricePerUnit: '1.86/kg', category: 'Conservas', subcategory: 'Salsas', packaging: '350 g' },
  { id: 'alc-40029', name: 'Semillas de lino Auchan 250g', brand: 'Auchan', price: 1.49, pricePerUnit: '5.96/kg', category: 'Semillas', subcategory: 'Lino', packaging: '250 g' },
  { id: 'alc-40030', name: 'Café molido natural Auchan 250g', brand: 'Auchan', price: 2.19, pricePerUnit: '8.76/kg', category: 'Bebidas', subcategory: 'Café', packaging: '250 g' },
];

async function insertMercadona() {
  let inserted = 0, skipped = 0;
  for (const p of mercadonaMore) {
    try {
      const existing = await query('SELECT id FROM mercadona_products WHERE id = $1', [p.id]);
      if (existing.rows.length > 0) { skipped++; continue; }
      await query(
        `INSERT INTO mercadona_products (id, slug, name, packaging, category_id, category_name, subcategory_id, subcategory_name, bulk_price, unit_price, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [p.id, p.slug, p.name, p.packaging, p.categoryId, p.categoryName, p.subcategoryId, p.subcategoryName, p.bulkPrice, p.unitPrice]
      );
      inserted++;
    } catch (e) { console.error(`  ❌ Mercadona ${p.name}: ${e.message}`); }
  }
  return { inserted, skipped };
}

async function insertLidl() {
  let inserted = 0, skipped = 0;
  for (const p of lidlMore) {
    try {
      const existing = await query('SELECT id FROM lidl_products WHERE id = $1', [p.id]);
      if (existing.rows.length > 0) { skipped++; continue; }
      await query(
        `INSERT INTO lidl_products (id, name, full_title, brand, price, packaging, category, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [p.id, p.name, p.fullTitle, p.brand, p.price, p.packaging, p.category]
      );
      inserted++;
    } catch (e) { console.error(`  ❌ Lidl ${p.name}: ${e.message}`); }
  }
  return { inserted, skipped };
}

async function insertCarrefour() {
  let inserted = 0, skipped = 0;
  for (const p of carrefourMore) {
    try {
      const existing = await query('SELECT id FROM carrefour_products WHERE id = $1', [p.id]);
      if (existing.rows.length > 0) { skipped++; continue; }
      await query(
        `INSERT INTO carrefour_products (id, name, brand, price, price_per_unit, category, subcategory, packaging, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [p.id, p.name, p.brand, p.price, p.pricePerUnit, p.category, p.subcategory, p.packaging]
      );
      inserted++;
    } catch (e) { console.error(`  ❌ Carrefour ${p.name}: ${e.message}`); }
  }
  return { inserted, skipped };
}

async function insertAlcampo() {
  let inserted = 0, skipped = 0;
  for (const p of alcampoMore) {
    try {
      const existing = await query('SELECT id FROM alcampo_products WHERE id = $1', [p.id]);
      if (existing.rows.length > 0) { skipped++; continue; }
      await query(
        `INSERT INTO alcampo_products (id, name, brand, price, price_per_unit, category, subcategory, packaging, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [p.id, p.name, p.brand, p.price, p.pricePerUnit, p.category, p.subcategory, p.packaging]
      );
      inserted++;
    } catch (e) { console.error(`  ❌ Alcampo ${p.name}: ${e.message}`); }
  }
  return { inserted, skipped };
}

async function main() {
  console.log('🚀 Iniciando seed de productos adicionales...\n');

  console.log('🛒 Mercadona...');
  const merc = await insertMercadona();
  console.log(`  ✅ Insertados: ${merc.inserted}, omitidos: ${merc.skipped}`);

  console.log('🛒 Lidl...');
  const lidl = await insertLidl();
  console.log(`  ✅ Insertados: ${lidl.inserted}, omitidos: ${lidl.skipped}`);

  console.log('🛒 Carrefour...');
  const carr = await insertCarrefour();
  console.log(`  ✅ Insertados: ${carr.inserted}, omitidos: ${carr.skipped}`);

  console.log('🛒 Alcampo...');
  const alc = await insertAlcampo();
  console.log(`  ✅ Insertados: ${alc.inserted}, omitidos: ${alc.skipped}`);

  // Resumen final
  console.log('\n📊 RESUMEN FINAL:');
  const tables = ['mercadona_products', 'lidl_products', 'carrefour_products', 'alcampo_products'];
  for (const t of tables) {
    const r = await query(`SELECT COUNT(*) as total FROM ${t}`);
    console.log(`  ${t}: ${r.rows[0].total} productos`);
  }

  await pool.end();
  console.log('\n✅ Seed completado con éxito!');
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
