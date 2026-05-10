import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const HIPERDINO_PRODUCTS = [
  // ── FRUTAS Y VERDURAS ──────────────────────────────────────────────────────
  { id: "hd-001", name: "Plátano de Canarias", brand: "Hiperdino", price: 1.89, packaging: "1 kg", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80" },
  { id: "hd-002", name: "Tomate rama", brand: "Hiperdino", price: 1.49, packaging: "1 kg", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80" },
  { id: "hd-003", name: "Lechuga iceberg", brand: "Hiperdino", price: 0.89, packaging: "1 ud", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=400&q=80" },
  { id: "hd-004", name: "Naranja zumo", brand: "Hiperdino", price: 1.29, packaging: "2 kg", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80" },
  { id: "hd-005", name: "Manzana golden", brand: "Hiperdino", price: 1.59, packaging: "1 kg", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80" },
  { id: "hd-006", name: "Pera conferencia", brand: "Hiperdino", price: 1.79, packaging: "1 kg", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400&q=80" },
  { id: "hd-007", name: "Pepino", brand: "Hiperdino", price: 0.69, packaging: "1 ud", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&q=80" },
  { id: "hd-008", name: "Pimiento rojo", brand: "Hiperdino", price: 1.19, packaging: "500 g", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80" },
  { id: "hd-009", name: "Cebolla", brand: "Hiperdino", price: 0.99, packaging: "1 kg", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80" },
  { id: "hd-010", name: "Ajo", brand: "Hiperdino", price: 0.79, packaging: "500 g", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&q=80" },
  { id: "hd-011", name: "Zanahoria", brand: "Hiperdino", price: 0.89, packaging: "1 kg", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80" },
  { id: "hd-012", name: "Patata", brand: "Hiperdino", price: 1.29, packaging: "2 kg", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80" },
  { id: "hd-013", name: "Aguacate", brand: "Hiperdino", price: 1.49, packaging: "2 ud", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&q=80" },
  { id: "hd-014", name: "Limón", brand: "Hiperdino", price: 0.99, packaging: "500 g", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1582087895720-a0f9f7f2c8e5?w=400&q=80" },
  { id: "hd-015", name: "Sandía", brand: "Hiperdino", price: 3.99, packaging: "1 ud (aprox. 5 kg)", category: "Frutas y verduras", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80" },

  // ── LÁCTEOS Y HUEVOS ──────────────────────────────────────────────────────
  { id: "hd-016", name: "Leche entera Canarias", brand: "Hiperdino", price: 0.99, packaging: "1 L", category: "Lácteos y huevos", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80" },
  { id: "hd-017", name: "Leche semidesnatada", brand: "Hiperdino", price: 0.89, packaging: "1 L", category: "Lácteos y huevos", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80" },
  { id: "hd-018", name: "Yogur natural Danone", brand: "Danone", price: 1.29, packaging: "4 x 125 g", category: "Lácteos y huevos", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80" },
  { id: "hd-019", name: "Queso fresco", brand: "Hiperdino", price: 1.49, packaging: "250 g", category: "Lácteos y huevos", image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80" },
  { id: "hd-020", name: "Mantequilla", brand: "Hiperdino", price: 1.89, packaging: "250 g", category: "Lácteos y huevos", image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80" },
  { id: "hd-021", name: "Huevos camperos L", brand: "Hiperdino", price: 2.49, packaging: "12 ud", category: "Lácteos y huevos", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80" },
  { id: "hd-022", name: "Queso manchego curado", brand: "Hiperdino", price: 3.99, packaging: "200 g", category: "Lácteos y huevos", image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&q=80" },
  { id: "hd-023", name: "Nata para cocinar", brand: "Hiperdino", price: 0.79, packaging: "200 ml", category: "Lácteos y huevos", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80" },
  { id: "hd-024", name: "Queso gouda lonchas", brand: "Hiperdino", price: 2.29, packaging: "150 g", category: "Lácteos y huevos", image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80" },
  { id: "hd-025", name: "Kéfir natural", brand: "Hiperdino", price: 1.59, packaging: "500 g", category: "Lácteos y huevos", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80" },

  // ── CARNE Y PESCADO ──────────────────────────────────────────────────────
  { id: "hd-026", name: "Pechuga de pollo", brand: "Hiperdino", price: 4.99, packaging: "1 kg", category: "Carne y pescado", image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80" },
  { id: "hd-027", name: "Filete de ternera", brand: "Hiperdino", price: 8.99, packaging: "500 g", category: "Carne y pescado", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80" },
  { id: "hd-028", name: "Chuletas de cerdo", brand: "Hiperdino", price: 3.99, packaging: "1 kg", category: "Carne y pescado", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80" },
  { id: "hd-029", name: "Lomo de cerdo", brand: "Hiperdino", price: 5.49, packaging: "1 kg", category: "Carne y pescado", image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80" },
  { id: "hd-030", name: "Atún en aceite", brand: "Calvo", price: 1.29, packaging: "3 x 80 g", category: "Carne y pescado", image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80" },
  { id: "hd-031", name: "Sardinas en aceite", brand: "Hiperdino", price: 0.89, packaging: "125 g", category: "Carne y pescado", image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80" },
  { id: "hd-032", name: "Merluza congelada", brand: "Hiperdino", price: 5.99, packaging: "700 g", category: "Carne y pescado", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80" },
  { id: "hd-033", name: "Gambas peladas congeladas", brand: "Hiperdino", price: 4.99, packaging: "400 g", category: "Carne y pescado", image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80" },
  { id: "hd-034", name: "Muslos de pollo", brand: "Hiperdino", price: 2.99, packaging: "1 kg", category: "Carne y pescado", image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80" },
  { id: "hd-035", name: "Salmón ahumado", brand: "Hiperdino", price: 3.49, packaging: "100 g", category: "Carne y pescado", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80" },

  // ── PANADERÍA Y BOLLERÍA ──────────────────────────────────────────────────
  { id: "hd-036", name: "Pan de molde integral", brand: "Bimbo", price: 1.89, packaging: "680 g", category: "Panadería", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80" },
  { id: "hd-037", name: "Pan baguette", brand: "Hiperdino", price: 0.49, packaging: "1 ud", category: "Panadería", image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=400&q=80" },
  { id: "hd-038", name: "Croissants", brand: "Hiperdino", price: 1.29, packaging: "4 ud", category: "Panadería", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80" },
  { id: "hd-039", name: "Galletas María", brand: "Fontaneda", price: 1.19, packaging: "600 g", category: "Panadería", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80" },
  { id: "hd-040", name: "Magdalenas", brand: "Hiperdino", price: 1.49, packaging: "12 ud", category: "Panadería", image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&q=80" },
  { id: "hd-041", name: "Tostadas integrales", brand: "Wasa", price: 2.29, packaging: "275 g", category: "Panadería", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80" },
  { id: "hd-042", name: "Pan pita", brand: "Hiperdino", price: 1.09, packaging: "4 ud", category: "Panadería", image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=400&q=80" },

  // ── BEBIDAS ──────────────────────────────────────────────────────────────
  { id: "hd-043", name: "Agua mineral Fonteide", brand: "Fonteide", price: 0.39, packaging: "1.5 L", category: "Bebidas", image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80" },
  { id: "hd-044", name: "Agua con gas", brand: "Hiperdino", price: 0.49, packaging: "1.5 L", category: "Bebidas", image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80" },
  { id: "hd-045", name: "Coca-Cola", brand: "Coca-Cola", price: 1.79, packaging: "2 L", category: "Bebidas", image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80" },
  { id: "hd-046", name: "Zumo naranja Don Simón", brand: "Don Simón", price: 1.49, packaging: "1 L", category: "Bebidas", image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80" },
  { id: "hd-047", name: "Cerveza Dorada", brand: "Dorada", price: 3.99, packaging: "6 x 33 cl", category: "Bebidas", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
  { id: "hd-048", name: "Vino tinto Rioja", brand: "Hiperdino", price: 4.99, packaging: "75 cl", category: "Bebidas", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
  { id: "hd-049", name: "Café molido mezcla", brand: "Hiperdino", price: 2.99, packaging: "250 g", category: "Bebidas", image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80" },
  { id: "hd-050", name: "Té verde Hornimans", brand: "Hornimans", price: 1.89, packaging: "25 sobres", category: "Bebidas", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80" },

  // ── ACEITES Y CONDIMENTOS ──────────────────────────────────────────────────
  { id: "hd-051", name: "Aceite de oliva virgen extra", brand: "Hiperdino", price: 5.99, packaging: "1 L", category: "Aceites y condimentos", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80" },
  { id: "hd-052", name: "Aceite de girasol", brand: "Hiperdino", price: 1.99, packaging: "1 L", category: "Aceites y condimentos", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80" },
  { id: "hd-053", name: "Vinagre de manzana", brand: "Hiperdino", price: 0.99, packaging: "500 ml", category: "Aceites y condimentos", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80" },
  { id: "hd-054", name: "Sal marina fina", brand: "Hiperdino", price: 0.49, packaging: "1 kg", category: "Aceites y condimentos", image: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&q=80" },
  { id: "hd-055", name: "Tomate frito Solís", brand: "Solís", price: 1.29, packaging: "350 g", category: "Aceites y condimentos", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" },
  { id: "hd-056", name: "Mayonesa Hellmann's", brand: "Hellmann's", price: 2.49, packaging: "400 ml", category: "Aceites y condimentos", image: "https://images.unsplash.com/photo-1612187029133-f6e9b1e3a4c3?w=400&q=80" },
  { id: "hd-057", name: "Ketchup Heinz", brand: "Heinz", price: 2.29, packaging: "570 g", category: "Aceites y condimentos", image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80" },
  { id: "hd-058", name: "Pimienta negra molida", brand: "Hiperdino", price: 0.99, packaging: "50 g", category: "Aceites y condimentos", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },

  // ── CEREALES Y LEGUMBRES ──────────────────────────────────────────────────
  { id: "hd-059", name: "Arroz largo SOS", brand: "SOS", price: 1.79, packaging: "1 kg", category: "Cereales y legumbres", image: "https://images.unsplash.com/photo-1536304993881-ff86e0c9b1a6?w=400&q=80" },
  { id: "hd-060", name: "Pasta espaguetis Gallo", brand: "Gallo", price: 1.29, packaging: "500 g", category: "Cereales y legumbres", image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80" },
  { id: "hd-061", name: "Lentejas pardinas", brand: "Hiperdino", price: 1.49, packaging: "1 kg", category: "Cereales y legumbres", image: "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=400&q=80" },
  { id: "hd-062", name: "Garbanzos cocidos", brand: "Hiperdino", price: 0.89, packaging: "400 g", category: "Cereales y legumbres", image: "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=400&q=80" },
  { id: "hd-063", name: "Avena en copos", brand: "Quaker", price: 2.29, packaging: "500 g", category: "Cereales y legumbres", image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&q=80" },
  { id: "hd-064", name: "Macarrones Gallo", brand: "Gallo", price: 1.19, packaging: "500 g", category: "Cereales y legumbres", image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80" },
  { id: "hd-065", name: "Alubias blancas", brand: "Hiperdino", price: 1.39, packaging: "1 kg", category: "Cereales y legumbres", image: "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=400&q=80" },
  { id: "hd-066", name: "Quinoa", brand: "Hiperdino", price: 2.99, packaging: "500 g", category: "Cereales y legumbres", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80" },

  // ── CONGELADOS ──────────────────────────────────────────────────────────
  { id: "hd-067", name: "Guisantes congelados", brand: "Hiperdino", price: 1.29, packaging: "1 kg", category: "Congelados", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80" },
  { id: "hd-068", name: "Pizza margarita congelada", brand: "Hiperdino", price: 2.49, packaging: "350 g", category: "Congelados", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80" },
  { id: "hd-069", name: "Helado vainilla", brand: "Hiperdino", price: 2.99, packaging: "1 L", category: "Congelados", image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80" },
  { id: "hd-070", name: "Croquetas jamón", brand: "Hiperdino", price: 2.79, packaging: "500 g", category: "Congelados", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80" },
  { id: "hd-071", name: "Patatas fritas congeladas", brand: "Hiperdino", price: 1.99, packaging: "1 kg", category: "Congelados", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80" },
  { id: "hd-072", name: "Espinacas congeladas", brand: "Hiperdino", price: 1.49, packaging: "750 g", category: "Congelados", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80" },

  // ── CHARCUTERÍA ──────────────────────────────────────────────────────────
  { id: "hd-073", name: "Jamón serrano lonchas", brand: "Hiperdino", price: 2.99, packaging: "100 g", category: "Charcutería", image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80" },
  { id: "hd-074", name: "Chorizo extra", brand: "Hiperdino", price: 2.49, packaging: "200 g", category: "Charcutería", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80" },
  { id: "hd-075", name: "Salchichas Frankfurt", brand: "Hiperdino", price: 1.99, packaging: "300 g", category: "Charcutería", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80" },
  { id: "hd-076", name: "Mortadela con aceitunas", brand: "Hiperdino", price: 1.79, packaging: "200 g", category: "Charcutería", image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80" },
  { id: "hd-077", name: "Pavo en lonchas", brand: "Hiperdino", price: 2.29, packaging: "150 g", category: "Charcutería", image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80" },

  // ── CONSERVAS ──────────────────────────────────────────────────────────
  { id: "hd-078", name: "Tomate triturado", brand: "Hiperdino", price: 0.79, packaging: "800 g", category: "Conservas", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" },
  { id: "hd-079", name: "Maíz dulce", brand: "Bonduelle", price: 0.99, packaging: "340 g", category: "Conservas", image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80" },
  { id: "hd-080", name: "Aceitunas rellenas", brand: "Hiperdino", price: 1.29, packaging: "370 g", category: "Conservas", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80" },
  { id: "hd-081", name: "Espárragos blancos", brand: "Hiperdino", price: 1.99, packaging: "425 g", category: "Conservas", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80" },
  { id: "hd-082", name: "Mejillones en escabeche", brand: "Hiperdino", price: 1.49, packaging: "115 g", category: "Conservas", image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80" },

  // ── HIGIENE Y DROGUERÍA ──────────────────────────────────────────────────
  { id: "hd-083", name: "Papel higiénico Hiperdino", brand: "Hiperdino", price: 3.99, packaging: "12 rollos", category: "Higiene y droguería", image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400&q=80" },
  { id: "hd-084", name: "Gel de ducha", brand: "Hiperdino", price: 1.49, packaging: "750 ml", category: "Higiene y droguería", image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80" },
  { id: "hd-085", name: "Champú anticaspa", brand: "Head & Shoulders", price: 3.99, packaging: "400 ml", category: "Higiene y droguería", image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80" },
  { id: "hd-086", name: "Detergente lavadora", brand: "Hiperdino", price: 5.99, packaging: "3 kg", category: "Higiene y droguería", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80" },
  { id: "hd-087", name: "Lavavajillas líquido", brand: "Fairy", price: 2.99, packaging: "900 ml", category: "Higiene y droguería", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80" },
  { id: "hd-088", name: "Pasta de dientes", brand: "Colgate", price: 2.49, packaging: "75 ml", category: "Higiene y droguería", image: "https://images.unsplash.com/photo-1559591935-c4e36e3c7d6a?w=400&q=80" },

  // ── SNACKS Y DULCES ──────────────────────────────────────────────────────
  { id: "hd-089", name: "Papas fritas Lay's", brand: "Lay's", price: 1.99, packaging: "170 g", category: "Snacks y dulces", image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80" },
  { id: "hd-090", name: "Chocolate con leche Milka", brand: "Milka", price: 1.89, packaging: "300 g", category: "Snacks y dulces", image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80" },
  { id: "hd-091", name: "Almendras tostadas", brand: "Hiperdino", price: 2.99, packaging: "200 g", category: "Snacks y dulces", image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80" },
  { id: "hd-092", name: "Barritas de cereales", brand: "Hiperdino", price: 2.49, packaging: "6 ud", category: "Snacks y dulces", image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&q=80" },
  { id: "hd-093", name: "Palomitas microondas", brand: "Hiperdino", price: 1.49, packaging: "3 bolsas", category: "Snacks y dulces", image: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&q=80" },

  // ── PRODUCTOS CANARIOS TÍPICOS ──────────────────────────────────────────
  { id: "hd-094", name: "Gofio de millo", brand: "El Molino", price: 2.49, packaging: "500 g", category: "Productos canarios", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80" },
  { id: "hd-095", name: "Mojo rojo picón", brand: "El Capitán", price: 2.29, packaging: "200 g", category: "Productos canarios", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" },
  { id: "hd-096", name: "Mojo verde cilantro", brand: "El Capitán", price: 2.29, packaging: "200 g", category: "Productos canarios", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" },
  { id: "hd-097", name: "Papas arrugadas Canarias", brand: "Hiperdino", price: 1.99, packaging: "1 kg", category: "Productos canarios", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80" },
  { id: "hd-098", name: "Queso palmero ahumado", brand: "Hiperdino", price: 4.99, packaging: "300 g", category: "Productos canarios", image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&q=80" },
  { id: "hd-099", name: "Ron Arehucas 7 años", brand: "Arehucas", price: 12.99, packaging: "70 cl", category: "Productos canarios", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
  { id: "hd-100", name: "Bienmesabe canario", brand: "Hiperdino", price: 3.49, packaging: "300 g", category: "Productos canarios", image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&q=80" },
];

async function seed() {
  console.log(`Sembrando ${HIPERDINO_PRODUCTS.length} productos de Hiperdino...`);
  let inserted = 0;
  let skipped = 0;

  for (const p of HIPERDINO_PRODUCTS) {
    try {
      await pool.query(
        `INSERT INTO hiperdino_products (id, name, brand, image, thumbnail, price, packaging, category, online_available)
         VALUES ($1, $2, $3, $4, $4, $5, $6, $7, TRUE)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           brand = EXCLUDED.brand,
           image = EXCLUDED.image,
           thumbnail = EXCLUDED.thumbnail,
           price = EXCLUDED.price,
           packaging = EXCLUDED.packaging,
           category = EXCLUDED.category,
           "updatedAt" = NOW()`,
        [p.id, p.name, p.brand, p.image, p.price, p.packaging, p.category]
      );
      inserted++;
    } catch (e) {
      console.error(`Error en ${p.id}:`, e.message);
      skipped++;
    }
  }

  console.log(`✓ ${inserted} productos insertados, ${skipped} errores`);

  // Verificar
  const result = await pool.query("SELECT category, COUNT(*) as count FROM hiperdino_products GROUP BY category ORDER BY count DESC");
  console.log("\nProductos por categoría:");
  for (const row of result.rows) {
    console.log(`  ${row.category}: ${row.count}`);
  }

  await pool.end();
}

seed().catch(console.error);
