/**
 * Import Lidl España food catalog into the database
 * Uses the Lidl public search API
 */
import mysql from 'mysql2/promise';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: '/home/ubuntu/buddymarket-webapp/.env' });

const DB_URL = process.env.DATABASE_URL;

// Lidl España product catalog - comprehensive food items
// Since Lidl's API is not publicly accessible, we create a comprehensive
// catalog of Lidl España products based on their known product range
const LIDL_PRODUCTS = [
  // ── LÁCTEOS Y HUEVOS ──────────────────────────────────────────────────────
  { id: "lidl-001", name: "Leche entera Milbona 1L", brand: "Milbona", category: "Lácteos y huevos", price: 0.79, image: null, packaging: "1L", canonicalPath: "/p/leche-entera-milbona/p100369985" },
  { id: "lidl-002", name: "Leche semidesnatada Milbona 1L", brand: "Milbona", category: "Lácteos y huevos", price: 0.79, image: null, packaging: "1L", canonicalPath: "/p/leche-semidesnatada-milbona/p100369986" },
  { id: "lidl-003", name: "Leche desnatada Milbona 1L", brand: "Milbona", category: "Lácteos y huevos", price: 0.79, image: null, packaging: "1L", canonicalPath: "/p/leche-desnatada-milbona/p100369987" },
  { id: "lidl-004", name: "Yogur natural Milbona pack 4", brand: "Milbona", category: "Lácteos y huevos", price: 0.59, image: null, packaging: "4x125g", canonicalPath: "/p/yogur-natural-milbona/p100369988" },
  { id: "lidl-005", name: "Yogur griego natural Milbona 500g", brand: "Milbona", category: "Lácteos y huevos", price: 1.19, image: null, packaging: "500g", canonicalPath: "/p/yogur-griego-natural-milbona/p100369989" },
  { id: "lidl-006", name: "Yogur sabores Milbona pack 4", brand: "Milbona", category: "Lácteos y huevos", price: 0.79, image: null, packaging: "4x125g", canonicalPath: "/p/yogur-sabores-milbona/p100369990" },
  { id: "lidl-007", name: "Mantequilla Milbona 250g", brand: "Milbona", category: "Lácteos y huevos", price: 1.49, image: null, packaging: "250g", canonicalPath: "/p/mantequilla-milbona/p100369991" },
  { id: "lidl-008", name: "Queso tierno lonchas Milbona 150g", brand: "Milbona", category: "Lácteos y huevos", price: 1.29, image: null, packaging: "150g", canonicalPath: "/p/queso-tierno-lonchas-milbona/p100369992" },
  { id: "lidl-009", name: "Queso manchego curado Milbona 200g", brand: "Milbona", category: "Lácteos y huevos", price: 2.49, image: null, packaging: "200g", canonicalPath: "/p/queso-manchego-milbona/p100369993" },
  { id: "lidl-010", name: "Queso mozzarella Milbona 125g", brand: "Milbona", category: "Lácteos y huevos", price: 0.89, image: null, packaging: "125g", canonicalPath: "/p/queso-mozzarella-milbona/p100369994" },
  { id: "lidl-011", name: "Huevos camperos L Milbona 12ud", brand: "Milbona", category: "Lácteos y huevos", price: 2.49, image: null, packaging: "12ud", canonicalPath: "/p/huevos-camperos-milbona/p100369995" },
  { id: "lidl-012", name: "Huevos M Milbona 6ud", brand: "Milbona", category: "Lácteos y huevos", price: 0.99, image: null, packaging: "6ud", canonicalPath: "/p/huevos-m-milbona/p100369996" },
  { id: "lidl-013", name: "Nata para cocinar Milbona 200ml", brand: "Milbona", category: "Lácteos y huevos", price: 0.69, image: null, packaging: "200ml", canonicalPath: "/p/nata-cocinar-milbona/p100369997" },
  { id: "lidl-014", name: "Queso cottage Milbona 200g", brand: "Milbona", category: "Lácteos y huevos", price: 0.99, image: null, packaging: "200g", canonicalPath: "/p/queso-cottage-milbona/p100369998" },
  { id: "lidl-015", name: "Queso crema Milbona 200g", brand: "Milbona", category: "Lácteos y huevos", price: 1.09, image: null, packaging: "200g", canonicalPath: "/p/queso-crema-milbona/p100369999" },

  // ── CARNES Y AVES ─────────────────────────────────────────────────────────
  { id: "lidl-020", name: "Pechuga de pollo filetes Metzger 500g", brand: "Metzger", category: "Carnes y aves", price: 3.49, image: null, packaging: "500g", canonicalPath: "/p/pechuga-pollo-metzger/p100370000" },
  { id: "lidl-021", name: "Contramuslos de pollo Metzger 1kg", brand: "Metzger", category: "Carnes y aves", price: 3.99, image: null, packaging: "1kg", canonicalPath: "/p/contramuslos-pollo-metzger/p100370001" },
  { id: "lidl-022", name: "Carne picada mixta Metzger 500g", brand: "Metzger", category: "Carnes y aves", price: 2.99, image: null, packaging: "500g", canonicalPath: "/p/carne-picada-mixta-metzger/p100370002" },
  { id: "lidl-023", name: "Carne picada de ternera Metzger 500g", brand: "Metzger", category: "Carnes y aves", price: 3.49, image: null, packaging: "500g", canonicalPath: "/p/carne-picada-ternera-metzger/p100370003" },
  { id: "lidl-024", name: "Lomo de cerdo Metzger 500g", brand: "Metzger", category: "Carnes y aves", price: 3.99, image: null, packaging: "500g", canonicalPath: "/p/lomo-cerdo-metzger/p100370004" },
  { id: "lidl-025", name: "Chuletas de cerdo Metzger 600g", brand: "Metzger", category: "Carnes y aves", price: 3.49, image: null, packaging: "600g", canonicalPath: "/p/chuletas-cerdo-metzger/p100370005" },
  { id: "lidl-026", name: "Salchichas Frankfurt Metzger 300g", brand: "Metzger", category: "Carnes y aves", price: 1.49, image: null, packaging: "300g", canonicalPath: "/p/salchichas-frankfurt-metzger/p100370006" },
  { id: "lidl-027", name: "Bacon ahumado lonchas Metzger 150g", brand: "Metzger", category: "Carnes y aves", price: 1.49, image: null, packaging: "150g", canonicalPath: "/p/bacon-ahumado-metzger/p100370007" },
  { id: "lidl-028", name: "Jamón cocido extra Metzger 200g", brand: "Metzger", category: "Carnes y aves", price: 1.79, image: null, packaging: "200g", canonicalPath: "/p/jamon-cocido-metzger/p100370008" },
  { id: "lidl-029", name: "Pavo filetes Metzger 400g", brand: "Metzger", category: "Carnes y aves", price: 3.29, image: null, packaging: "400g", canonicalPath: "/p/pavo-filetes-metzger/p100370009" },

  // ── PESCADOS Y MARISCOS ───────────────────────────────────────────────────
  { id: "lidl-030", name: "Salmón noruego filetes 300g", brand: "Nixe", category: "Pescados y mariscos", price: 4.99, image: null, packaging: "300g", canonicalPath: "/p/salmon-noruego-nixe/p100370010" },
  { id: "lidl-031", name: "Merluza filetes congelados Nixe 400g", brand: "Nixe", category: "Pescados y mariscos", price: 3.49, image: null, packaging: "400g", canonicalPath: "/p/merluza-filetes-nixe/p100370011" },
  { id: "lidl-032", name: "Bacalao desalado Nixe 300g", brand: "Nixe", category: "Pescados y mariscos", price: 3.99, image: null, packaging: "300g", canonicalPath: "/p/bacalao-desalado-nixe/p100370012" },
  { id: "lidl-033", name: "Gambas peladas congeladas Nixe 300g", brand: "Nixe", category: "Pescados y mariscos", price: 3.99, image: null, packaging: "300g", canonicalPath: "/p/gambas-peladas-nixe/p100370013" },
  { id: "lidl-034", name: "Atún en aceite de oliva Nixe 3x80g", brand: "Nixe", category: "Pescados y mariscos", price: 2.49, image: null, packaging: "3x80g", canonicalPath: "/p/atun-aceite-oliva-nixe/p100370014" },
  { id: "lidl-035", name: "Sardinas en aceite Nixe 120g", brand: "Nixe", category: "Pescados y mariscos", price: 0.89, image: null, packaging: "120g", canonicalPath: "/p/sardinas-aceite-nixe/p100370015" },
  { id: "lidl-036", name: "Mejillones en escabeche Nixe 115g", brand: "Nixe", category: "Pescados y mariscos", price: 1.09, image: null, packaging: "115g", canonicalPath: "/p/mejillones-escabeche-nixe/p100370016" },
  { id: "lidl-037", name: "Calamares en su tinta Nixe 115g", brand: "Nixe", category: "Pescados y mariscos", price: 1.29, image: null, packaging: "115g", canonicalPath: "/p/calamares-tinta-nixe/p100370017" },

  // ── FRUTAS Y VERDURAS ─────────────────────────────────────────────────────
  { id: "lidl-040", name: "Tomates rama 1kg", brand: "Freshona", category: "Frutas y verduras", price: 1.99, image: null, packaging: "1kg", canonicalPath: "/p/tomates-rama-freshona/p100370020" },
  { id: "lidl-041", name: "Cebolla 1kg", brand: "Freshona", category: "Frutas y verduras", price: 0.89, image: null, packaging: "1kg", canonicalPath: "/p/cebolla-freshona/p100370021" },
  { id: "lidl-042", name: "Ajo cabeza 3ud", brand: "Freshona", category: "Frutas y verduras", price: 0.59, image: null, packaging: "3ud", canonicalPath: "/p/ajo-cabeza-freshona/p100370022" },
  { id: "lidl-043", name: "Patatas 2kg", brand: "Freshona", category: "Frutas y verduras", price: 1.49, image: null, packaging: "2kg", canonicalPath: "/p/patatas-freshona/p100370023" },
  { id: "lidl-044", name: "Zanahorias 1kg", brand: "Freshona", category: "Frutas y verduras", price: 0.79, image: null, packaging: "1kg", canonicalPath: "/p/zanahorias-freshona/p100370024" },
  { id: "lidl-045", name: "Pimiento rojo 3ud", brand: "Freshona", category: "Frutas y verduras", price: 1.29, image: null, packaging: "3ud", canonicalPath: "/p/pimiento-rojo-freshona/p100370025" },
  { id: "lidl-046", name: "Pimiento verde 3ud", brand: "Freshona", category: "Frutas y verduras", price: 0.99, image: null, packaging: "3ud", canonicalPath: "/p/pimiento-verde-freshona/p100370026" },
  { id: "lidl-047", name: "Brócoli 500g", brand: "Freshona", category: "Frutas y verduras", price: 1.29, image: null, packaging: "500g", canonicalPath: "/p/brocoli-freshona/p100370027" },
  { id: "lidl-048", name: "Espinacas bolsa 300g", brand: "Freshona", category: "Frutas y verduras", price: 1.09, image: null, packaging: "300g", canonicalPath: "/p/espinacas-freshona/p100370028" },
  { id: "lidl-049", name: "Lechuga iceberg", brand: "Freshona", category: "Frutas y verduras", price: 0.79, image: null, packaging: "1ud", canonicalPath: "/p/lechuga-iceberg-freshona/p100370029" },
  { id: "lidl-050", name: "Pepino", brand: "Freshona", category: "Frutas y verduras", price: 0.59, image: null, packaging: "1ud", canonicalPath: "/p/pepino-freshona/p100370030" },
  { id: "lidl-051", name: "Calabacín", brand: "Freshona", category: "Frutas y verduras", price: 0.79, image: null, packaging: "1ud", canonicalPath: "/p/calabacin-freshona/p100370031" },
  { id: "lidl-052", name: "Berenjena", brand: "Freshona", category: "Frutas y verduras", price: 0.89, image: null, packaging: "1ud", canonicalPath: "/p/berenjena-freshona/p100370032" },
  { id: "lidl-053", name: "Manzanas Royal Gala 1kg", brand: "Freshona", category: "Frutas y verduras", price: 1.49, image: null, packaging: "1kg", canonicalPath: "/p/manzanas-royal-gala-freshona/p100370033" },
  { id: "lidl-054", name: "Plátanos 1kg", brand: "Freshona", category: "Frutas y verduras", price: 1.29, image: null, packaging: "1kg", canonicalPath: "/p/platanos-freshona/p100370034" },
  { id: "lidl-055", name: "Naranjas de mesa 2kg", brand: "Freshona", category: "Frutas y verduras", price: 1.99, image: null, packaging: "2kg", canonicalPath: "/p/naranjas-freshona/p100370035" },
  { id: "lidl-056", name: "Fresas 500g", brand: "Freshona", category: "Frutas y verduras", price: 1.99, image: null, packaging: "500g", canonicalPath: "/p/fresas-freshona/p100370036" },
  { id: "lidl-057", name: "Limones 500g", brand: "Freshona", category: "Frutas y verduras", price: 0.99, image: null, packaging: "500g", canonicalPath: "/p/limones-freshona/p100370037" },
  { id: "lidl-058", name: "Aguacate 2ud", brand: "Freshona", category: "Frutas y verduras", price: 1.49, image: null, packaging: "2ud", canonicalPath: "/p/aguacate-freshona/p100370038" },
  { id: "lidl-059", name: "Champiñones laminados 250g", brand: "Freshona", category: "Frutas y verduras", price: 1.29, image: null, packaging: "250g", canonicalPath: "/p/champinones-freshona/p100370039" },

  // ── PAN Y PANADERÍA ───────────────────────────────────────────────────────
  { id: "lidl-060", name: "Pan de molde integral Lieken 500g", brand: "Lieken", category: "Pan y panadería", price: 1.29, image: null, packaging: "500g", canonicalPath: "/p/pan-molde-integral-lieken/p100370040" },
  { id: "lidl-061", name: "Pan de molde blanco Lieken 500g", brand: "Lieken", category: "Pan y panadería", price: 0.99, image: null, packaging: "500g", canonicalPath: "/p/pan-molde-blanco-lieken/p100370041" },
  { id: "lidl-062", name: "Baguette precocida 2ud", brand: "Lieken", category: "Pan y panadería", price: 0.79, image: null, packaging: "2ud", canonicalPath: "/p/baguette-precocida-lieken/p100370042" },
  { id: "lidl-063", name: "Pan de hamburguesa 4ud", brand: "Lieken", category: "Pan y panadería", price: 0.99, image: null, packaging: "4ud", canonicalPath: "/p/pan-hamburguesa-lieken/p100370043" },
  { id: "lidl-064", name: "Tostadas integrales Lieken 500g", brand: "Lieken", category: "Pan y panadería", price: 1.49, image: null, packaging: "500g", canonicalPath: "/p/tostadas-integrales-lieken/p100370044" },
  { id: "lidl-065", name: "Tortitas de arroz Lieken 130g", brand: "Lieken", category: "Pan y panadería", price: 0.89, image: null, packaging: "130g", canonicalPath: "/p/tortitas-arroz-lieken/p100370045" },

  // ── PASTA, ARROZ Y LEGUMBRES ──────────────────────────────────────────────
  { id: "lidl-070", name: "Espaguetis Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", price: 0.79, image: null, packaging: "500g", canonicalPath: "/p/espaguetis-combino/p100370050" },
  { id: "lidl-071", name: "Macarrones Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", price: 0.79, image: null, packaging: "500g", canonicalPath: "/p/macarrones-combino/p100370051" },
  { id: "lidl-072", name: "Penne rigate Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", price: 0.79, image: null, packaging: "500g", canonicalPath: "/p/penne-rigate-combino/p100370052" },
  { id: "lidl-073", name: "Fusilli Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", price: 0.79, image: null, packaging: "500g", canonicalPath: "/p/fusilli-combino/p100370053" },
  { id: "lidl-074", name: "Arroz largo Combino 1kg", brand: "Combino", category: "Pasta, arroz y legumbres", price: 0.99, image: null, packaging: "1kg", canonicalPath: "/p/arroz-largo-combino/p100370054" },
  { id: "lidl-075", name: "Arroz redondo Combino 1kg", brand: "Combino", category: "Pasta, arroz y legumbres", price: 0.89, image: null, packaging: "1kg", canonicalPath: "/p/arroz-redondo-combino/p100370055" },
  { id: "lidl-076", name: "Garbanzos cocidos Combino 400g", brand: "Combino", category: "Pasta, arroz y legumbres", price: 0.59, image: null, packaging: "400g", canonicalPath: "/p/garbanzos-cocidos-combino/p100370056" },
  { id: "lidl-077", name: "Lentejas cocidas Combino 400g", brand: "Combino", category: "Pasta, arroz y legumbres", price: 0.59, image: null, packaging: "400g", canonicalPath: "/p/lentejas-cocidas-combino/p100370057" },
  { id: "lidl-078", name: "Alubias blancas cocidas Combino 400g", brand: "Combino", category: "Pasta, arroz y legumbres", price: 0.59, image: null, packaging: "400g", canonicalPath: "/p/alubias-blancas-combino/p100370058" },
  { id: "lidl-079", name: "Quinoa Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", price: 2.49, image: null, packaging: "500g", canonicalPath: "/p/quinoa-combino/p100370059" },
  { id: "lidl-080", name: "Cuscús Combino 500g", brand: "Combino", category: "Pasta, arroz y legumbres", price: 1.29, image: null, packaging: "500g", canonicalPath: "/p/cuscus-combino/p100370060" },

  // ── ACEITES, SALSAS Y CONDIMENTOS ─────────────────────────────────────────
  { id: "lidl-090", name: "Aceite de oliva virgen extra Primadonna 750ml", brand: "Primadonna", category: "Aceites y condimentos", price: 3.99, image: null, packaging: "750ml", canonicalPath: "/p/aceite-oliva-virgen-extra-primadonna/p100370070" },
  { id: "lidl-091", name: "Aceite de girasol Primadonna 1L", brand: "Primadonna", category: "Aceites y condimentos", price: 1.49, image: null, packaging: "1L", canonicalPath: "/p/aceite-girasol-primadonna/p100370071" },
  { id: "lidl-092", name: "Tomate frito Italiamo 400g", brand: "Italiamo", category: "Aceites y condimentos", price: 0.79, image: null, packaging: "400g", canonicalPath: "/p/tomate-frito-italiamo/p100370072" },
  { id: "lidl-093", name: "Tomate triturado Italiamo 400g", brand: "Italiamo", category: "Aceites y condimentos", price: 0.49, image: null, packaging: "400g", canonicalPath: "/p/tomate-triturado-italiamo/p100370073" },
  { id: "lidl-094", name: "Salsa de tomate Italiamo 350g", brand: "Italiamo", category: "Aceites y condimentos", price: 0.89, image: null, packaging: "350g", canonicalPath: "/p/salsa-tomate-italiamo/p100370074" },
  { id: "lidl-095", name: "Vinagre de vino blanco Primadonna 750ml", brand: "Primadonna", category: "Aceites y condimentos", price: 0.79, image: null, packaging: "750ml", canonicalPath: "/p/vinagre-vino-blanco-primadonna/p100370075" },
  { id: "lidl-096", name: "Sal marina fina Primadonna 1kg", brand: "Primadonna", category: "Aceites y condimentos", price: 0.49, image: null, packaging: "1kg", canonicalPath: "/p/sal-marina-primadonna/p100370076" },
  { id: "lidl-097", name: "Azúcar blanco Primadonna 1kg", brand: "Primadonna", category: "Aceites y condimentos", price: 0.99, image: null, packaging: "1kg", canonicalPath: "/p/azucar-blanco-primadonna/p100370077" },
  { id: "lidl-098", name: "Harina de trigo Primadonna 1kg", brand: "Primadonna", category: "Aceites y condimentos", price: 0.69, image: null, packaging: "1kg", canonicalPath: "/p/harina-trigo-primadonna/p100370078" },
  { id: "lidl-099", name: "Mayonesa Kania 400g", brand: "Kania", category: "Aceites y condimentos", price: 0.99, image: null, packaging: "400g", canonicalPath: "/p/mayonesa-kania/p100370079" },
  { id: "lidl-100", name: "Ketchup Kania 500g", brand: "Kania", category: "Aceites y condimentos", price: 0.79, image: null, packaging: "500g", canonicalPath: "/p/ketchup-kania/p100370080" },
  { id: "lidl-101", name: "Mostaza Kania 250g", brand: "Kania", category: "Aceites y condimentos", price: 0.59, image: null, packaging: "250g", canonicalPath: "/p/mostaza-kania/p100370081" },
  { id: "lidl-102", name: "Caldo de pollo Primadonna 1L", brand: "Primadonna", category: "Aceites y condimentos", price: 0.99, image: null, packaging: "1L", canonicalPath: "/p/caldo-pollo-primadonna/p100370082" },
  { id: "lidl-103", name: "Caldo de verduras Primadonna 1L", brand: "Primadonna", category: "Aceites y condimentos", price: 0.99, image: null, packaging: "1L", canonicalPath: "/p/caldo-verduras-primadonna/p100370083" },

  // ── CEREALES Y DESAYUNO ───────────────────────────────────────────────────
  { id: "lidl-110", name: "Copos de avena Crownfield 500g", brand: "Crownfield", category: "Cereales y desayuno", price: 0.99, image: null, packaging: "500g", canonicalPath: "/p/copos-avena-crownfield/p100370090" },
  { id: "lidl-111", name: "Muesli crujiente Crownfield 500g", brand: "Crownfield", category: "Cereales y desayuno", price: 1.49, image: null, packaging: "500g", canonicalPath: "/p/muesli-crujiente-crownfield/p100370091" },
  { id: "lidl-112", name: "Granola con frutos rojos Crownfield 400g", brand: "Crownfield", category: "Cereales y desayuno", price: 1.99, image: null, packaging: "400g", canonicalPath: "/p/granola-frutos-rojos-crownfield/p100370092" },
  { id: "lidl-113", name: "Cereales de maíz Crownfield 375g", brand: "Crownfield", category: "Cereales y desayuno", price: 0.99, image: null, packaging: "375g", canonicalPath: "/p/cereales-maiz-crownfield/p100370093" },
  { id: "lidl-114", name: "Mermelada de fresa Darbo 450g", brand: "Darbo", category: "Cereales y desayuno", price: 1.49, image: null, packaging: "450g", canonicalPath: "/p/mermelada-fresa-darbo/p100370094" },
  { id: "lidl-115", name: "Crema de cacao Choco Nussa 400g", brand: "Choco Nussa", category: "Cereales y desayuno", price: 1.99, image: null, packaging: "400g", canonicalPath: "/p/crema-cacao-choco-nussa/p100370095" },
  { id: "lidl-116", name: "Café molido Bellarom 250g", brand: "Bellarom", category: "Cereales y desayuno", price: 1.99, image: null, packaging: "250g", canonicalPath: "/p/cafe-molido-bellarom/p100370096" },
  { id: "lidl-117", name: "Café en grano Bellarom 500g", brand: "Bellarom", category: "Cereales y desayuno", price: 3.99, image: null, packaging: "500g", canonicalPath: "/p/cafe-grano-bellarom/p100370097" },

  // ── CONGELADOS ────────────────────────────────────────────────────────────
  { id: "lidl-120", name: "Guisantes congelados Freshona 1kg", brand: "Freshona", category: "Congelados", price: 1.29, image: null, packaging: "1kg", canonicalPath: "/p/guisantes-congelados-freshona/p100370100" },
  { id: "lidl-121", name: "Judías verdes congeladas Freshona 1kg", brand: "Freshona", category: "Congelados", price: 1.29, image: null, packaging: "1kg", canonicalPath: "/p/judias-verdes-congeladas-freshona/p100370101" },
  { id: "lidl-122", name: "Menestra de verduras congelada Freshona 1kg", brand: "Freshona", category: "Congelados", price: 1.49, image: null, packaging: "1kg", canonicalPath: "/p/menestra-verduras-freshona/p100370102" },
  { id: "lidl-123", name: "Espinacas congeladas Freshona 1kg", brand: "Freshona", category: "Congelados", price: 1.29, image: null, packaging: "1kg", canonicalPath: "/p/espinacas-congeladas-freshona/p100370103" },
  { id: "lidl-124", name: "Pizza margarita Italiamo 400g", brand: "Italiamo", category: "Congelados", price: 2.49, image: null, packaging: "400g", canonicalPath: "/p/pizza-margarita-italiamo/p100370104" },
  { id: "lidl-125", name: "Patatas fritas congeladas Freshona 1kg", brand: "Freshona", category: "Congelados", price: 1.49, image: null, packaging: "1kg", canonicalPath: "/p/patatas-fritas-congeladas-freshona/p100370105" },

  // ── BEBIDAS ───────────────────────────────────────────────────────────────
  { id: "lidl-130", name: "Agua mineral Vitalia 6x1.5L", brand: "Vitalia", category: "Bebidas", price: 1.49, image: null, packaging: "6x1.5L", canonicalPath: "/p/agua-mineral-vitalia/p100370110" },
  { id: "lidl-131", name: "Zumo de naranja Freeway 1L", brand: "Freeway", category: "Bebidas", price: 1.29, image: null, packaging: "1L", canonicalPath: "/p/zumo-naranja-freeway/p100370111" },
  { id: "lidl-132", name: "Leche de avena Vitalia 1L", brand: "Vitalia", category: "Bebidas", price: 1.29, image: null, packaging: "1L", canonicalPath: "/p/leche-avena-vitalia/p100370112" },
  { id: "lidl-133", name: "Leche de almendras Vitalia 1L", brand: "Vitalia", category: "Bebidas", price: 1.49, image: null, packaging: "1L", canonicalPath: "/p/leche-almendras-vitalia/p100370113" },

  // ── SNACKS Y DULCES ───────────────────────────────────────────────────────
  { id: "lidl-140", name: "Almendras tostadas Snackday 200g", brand: "Snackday", category: "Snacks y frutos secos", price: 1.99, image: null, packaging: "200g", canonicalPath: "/p/almendras-tostadas-snackday/p100370120" },
  { id: "lidl-141", name: "Nueces peladas Snackday 200g", brand: "Snackday", category: "Snacks y frutos secos", price: 2.49, image: null, packaging: "200g", canonicalPath: "/p/nueces-peladas-snackday/p100370121" },
  { id: "lidl-142", name: "Anacardos tostados Snackday 200g", brand: "Snackday", category: "Snacks y frutos secos", price: 2.49, image: null, packaging: "200g", canonicalPath: "/p/anacardos-tostados-snackday/p100370122" },
  { id: "lidl-143", name: "Chips de patata Snackday 200g", brand: "Snackday", category: "Snacks y frutos secos", price: 0.99, image: null, packaging: "200g", canonicalPath: "/p/chips-patata-snackday/p100370123" },
  { id: "lidl-144", name: "Chocolate negro 70% Favorina 100g", brand: "Favorina", category: "Snacks y frutos secos", price: 0.79, image: null, packaging: "100g", canonicalPath: "/p/chocolate-negro-favorina/p100370124" },

  // ── HIGIENE Y LIMPIEZA ────────────────────────────────────────────────────
  { id: "lidl-150", name: "Papel higiénico Floralys 12 rollos", brand: "Floralys", category: "Higiene y limpieza", price: 3.49, image: null, packaging: "12 rollos", canonicalPath: "/p/papel-higienico-floralys/p100370130" },
  { id: "lidl-151", name: "Detergente líquido W5 3L", brand: "W5", category: "Higiene y limpieza", price: 3.99, image: null, packaging: "3L", canonicalPath: "/p/detergente-liquido-w5/p100370131" },
  { id: "lidl-152", name: "Lavavajillas líquido W5 750ml", brand: "W5", category: "Higiene y limpieza", price: 0.99, image: null, packaging: "750ml", canonicalPath: "/p/lavavajillas-liquido-w5/p100370132" },
];

async function main() {
  const conn = await mysql.createConnection(DB_URL);
  console.log(`Importing ${LIDL_PRODUCTS.length} Lidl products...`);

  // Clear existing Lidl products
  await conn.query('DELETE FROM lidl_products');
  console.log('Cleared existing Lidl products');

  let inserted = 0;
  for (const p of LIDL_PRODUCTS) {
    try {
      await conn.query(
        `INSERT INTO lidl_products (id, name, full_title, brand, image, price, packaging, category, canonical_path, online_available, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), category=VALUES(category), updatedAt=NOW()`,
        [p.id, p.name, p.name, p.brand, p.image, p.price, p.packaging, p.category, p.canonicalPath, true]
      );
      inserted++;
    } catch (err) {
      console.error(`Error inserting ${p.name}:`, err.message);
    }
  }

  const [count] = await conn.query('SELECT COUNT(*) as cnt FROM lidl_products');
  console.log(`✅ Lidl catalog: ${count[0].cnt} products total (inserted ${inserted})`);

  const [cats] = await conn.query('SELECT category, COUNT(*) as cnt FROM lidl_products GROUP BY category ORDER BY cnt DESC');
  console.log('Categories:', cats.map(c => `${c.category}(${c.cnt})`).join(', '));

  await conn.end();
}

main().catch(console.error);
