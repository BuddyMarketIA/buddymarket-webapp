import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Recipe catalog per menu goal ────────────────────────────────────────────
// Each menu has 7 days × 4 meals (breakfast, lunch, snack, dinner)
// We'll create a pool of recipes per goal and rotate them across days

const RECIPES = {
  // ── Pérdida de Peso (menu 2) ──────────────────────────────────────────────
  perdida_peso: {
    breakfast: [
      { name: "Avena con arándanos y semillas de chía", cal: 320, prot: 12, carbs: 52, fat: 8, time: 10, desc: "Avena cremosa con leche de avena, arándanos frescos y semillas de chía. Rica en fibra y antioxidantes." },
      { name: "Tostadas integrales con aguacate y huevo", cal: 340, prot: 16, carbs: 30, fat: 16, time: 12, desc: "Tostadas de pan integral con aguacate machacado, huevo pochado y tomate cherry." },
      { name: "Yogur griego con frutos rojos y granola", cal: 290, prot: 18, carbs: 38, fat: 6, time: 5, desc: "Yogur griego 0% con mezcla de frutos rojos, granola sin azúcar y miel de abeja." },
      { name: "Tortilla de claras con espinacas", cal: 210, prot: 22, carbs: 4, fat: 10, time: 15, desc: "Tortilla esponjosa de claras de huevo con espinacas baby y queso fresco." },
      { name: "Smoothie verde proteico", cal: 280, prot: 20, carbs: 35, fat: 5, time: 5, desc: "Batido de espinacas, plátano, proteína de vainilla, leche de almendras y jengibre." },
      { name: "Porridge de quinoa con manzana", cal: 310, prot: 10, carbs: 55, fat: 6, time: 20, desc: "Quinoa cocida con leche de coco, manzana rallada, canela y nueces." },
      { name: "Crepes de avena con fresas", cal: 295, prot: 14, carbs: 44, fat: 7, time: 15, desc: "Crepes finas de avena y huevo rellenas de fresas frescas y queso ricotta." },
    ],
    lunch: [
      { name: "Ensalada de pollo a la plancha con quinoa", cal: 420, prot: 38, carbs: 32, fat: 14, time: 25, desc: "Pechuga de pollo a la plancha sobre cama de quinoa, rúcula, tomates cherry y vinagreta de limón." },
      { name: "Salmón al horno con verduras asadas", cal: 450, prot: 40, carbs: 20, fat: 22, time: 30, desc: "Lomo de salmón al horno con brócoli, pimiento y calabacín asados, aliñados con aceite de oliva y hierbas." },
      { name: "Lentejas con verduras y arroz integral", cal: 380, prot: 22, carbs: 58, fat: 6, time: 35, desc: "Guiso de lentejas pardinas con zanahoria, apio, tomate y arroz integral." },
      { name: "Pechuga de pavo con boniato al horno", cal: 390, prot: 42, carbs: 35, fat: 8, time: 40, desc: "Pechuga de pavo marinada en hierbas provenzales con boniato asado y judías verdes." },
      { name: "Merluza al vapor con espárragos", cal: 310, prot: 35, carbs: 12, fat: 12, time: 20, desc: "Merluza al vapor con espárragos trigueros, limón y aceite de oliva virgen extra." },
      { name: "Bowl de garbanzos con espinacas y huevo", cal: 400, prot: 24, carbs: 45, fat: 14, time: 20, desc: "Garbanzos salteados con espinacas, ajo, pimentón y huevo escalfado." },
      { name: "Pollo al curry con arroz basmati", cal: 440, prot: 36, carbs: 48, fat: 12, time: 35, desc: "Muslos de pollo en salsa de curry ligera con leche de coco y arroz basmati." },
    ],
    snack: [
      { name: "Manzana con mantequilla de almendras", cal: 180, prot: 4, carbs: 28, fat: 8, time: 2, desc: "Manzana verde en láminas con una cucharada de mantequilla de almendras natural." },
      { name: "Hummus con palitos de zanahoria y pepino", cal: 150, prot: 6, carbs: 18, fat: 6, time: 5, desc: "Hummus casero de garbanzos con palitos de zanahoria, pepino y apio." },
      { name: "Requesón con nueces y canela", cal: 160, prot: 12, carbs: 10, fat: 8, time: 3, desc: "Requesón bajo en grasa con nueces picadas, canela y un chorrito de miel." },
      { name: "Edamame al vapor con sal marina", cal: 140, prot: 12, carbs: 12, fat: 5, time: 5, desc: "Vainas de edamame al vapor con sal marina en escamas." },
      { name: "Batido de proteínas con plátano", cal: 200, prot: 22, carbs: 24, fat: 3, time: 3, desc: "Batido de proteína de suero con plátano, leche desnatada y hielo." },
      { name: "Frutos secos y fruta deshidratada", cal: 170, prot: 5, carbs: 20, fat: 9, time: 1, desc: "Mix de almendras, nueces y arándanos deshidratados sin azúcar añadido." },
      { name: "Yogur con pepino y menta", cal: 120, prot: 10, carbs: 12, fat: 3, time: 5, desc: "Yogur natural con pepino rallado, menta fresca y un toque de ajo." },
    ],
    dinner: [
      { name: "Crema de calabaza con semillas de girasol", cal: 250, prot: 8, carbs: 30, fat: 12, time: 25, desc: "Crema suave de calabaza asada con jengibre, cúrcuma y semillas de girasol tostadas." },
      { name: "Tortilla de verduras al horno", cal: 280, prot: 18, carbs: 16, fat: 16, time: 30, desc: "Tortilla de huevos con pimiento, cebolla, calabacín y queso fresco al horno." },
      { name: "Ensalada de atún con aguacate", cal: 320, prot: 28, carbs: 12, fat: 18, time: 10, desc: "Atún en aceite de oliva con aguacate, tomate, cebolla morada y vinagreta de mostaza." },
      { name: "Sopa de verduras con fideos integrales", cal: 240, prot: 10, carbs: 38, fat: 5, time: 25, desc: "Caldo de verduras con zanahoria, puerro, apio, fideos integrales y perejil." },
      { name: "Revuelto de champiñones y espárragos", cal: 260, prot: 16, carbs: 8, fat: 18, time: 15, desc: "Huevos revueltos con champiñones portobello, espárragos trigueros y queso parmesano." },
      { name: "Dorada al papillote con limón", cal: 290, prot: 32, carbs: 6, fat: 14, time: 25, desc: "Dorada entera al papillote con rodajas de limón, tomillo, ajo y aceite de oliva." },
      { name: "Gazpacho andaluz con jamón ibérico", cal: 200, prot: 12, carbs: 18, fat: 8, time: 10, desc: "Gazpacho tradicional de tomate con pepino, pimiento y jamón ibérico en virutas." },
    ],
  },
  // ── Ganancia Muscular (menu 3) ────────────────────────────────────────────
  ganancia_muscular: {
    breakfast: [
      { name: "Tortilla de 4 huevos con avena y plátano", cal: 520, prot: 32, carbs: 58, fat: 16, time: 15, desc: "Tortilla proteica con avena integrada, plátano maduro y miel. Desayuno de campeones." },
      { name: "Pancakes proteicos con sirope de arce", cal: 490, prot: 28, carbs: 62, fat: 12, time: 20, desc: "Pancakes de avena y proteína de vainilla con sirope de arce y fresas frescas." },
      { name: "Batido mass gainer de chocolate y mantequilla de cacahuete", cal: 600, prot: 40, carbs: 70, fat: 18, time: 5, desc: "Batido de proteína de chocolate, leche entera, mantequilla de cacahuete y plátano." },
      { name: "Bowl de arroz con huevos y aguacate", cal: 550, prot: 26, carbs: 65, fat: 20, time: 20, desc: "Arroz blanco con huevos fritos, aguacate, salsa de soja y semillas de sésamo." },
      { name: "Tostadas con salmón ahumado y huevo", cal: 480, prot: 34, carbs: 42, fat: 18, time: 10, desc: "Pan de centeno tostado con salmón ahumado, huevo escalfado, alcaparras y eneldo." },
      { name: "Gachas de avena con proteína y frutos secos", cal: 510, prot: 30, carbs: 60, fat: 16, time: 10, desc: "Avena cocida con proteína de vainilla, almendras, nueces y miel de manuka." },
      { name: "Wrap de pavo y queso con huevo", cal: 540, prot: 38, carbs: 48, fat: 18, time: 15, desc: "Tortilla integral rellena de pavo loncheado, queso manchego, huevo revuelto y espinacas." },
    ],
    lunch: [
      { name: "Arroz con pollo y brócoli (meal prep)", cal: 620, prot: 52, carbs: 68, fat: 14, time: 35, desc: "Pechuga de pollo a la plancha con arroz blanco, brócoli al vapor y salsa teriyaki." },
      { name: "Pasta integral con atún y tomate", cal: 580, prot: 38, carbs: 72, fat: 12, time: 25, desc: "Pasta integral con atún en aceite, tomate cherry, aceitunas negras y albahaca." },
      { name: "Ternera magra con boniato y espinacas", cal: 640, prot: 48, carbs: 52, fat: 20, time: 40, desc: "Solomillo de ternera a la plancha con boniato asado y espinacas salteadas con ajo." },
      { name: "Salmón con quinoa y edamame", cal: 590, prot: 46, carbs: 50, fat: 22, time: 30, desc: "Salmón al horno con quinoa tricolor, edamame y aderezo de jengibre y soja." },
      { name: "Pollo al horno con patata y judías verdes", cal: 610, prot: 50, carbs: 55, fat: 16, time: 45, desc: "Muslos de pollo al horno con patata asada, judías verdes y salsa de mostaza y miel." },
      { name: "Lentejas con arroz y chorizo ibérico", cal: 650, prot: 40, carbs: 72, fat: 18, time: 40, desc: "Lentejas estofadas con arroz, chorizo ibérico, zanahoria y laurel." },
      { name: "Merluza con patatas y pimientos", cal: 560, prot: 44, carbs: 52, fat: 14, time: 35, desc: "Merluza al horno con patatas panadera, pimientos de colores y tomate." },
    ],
    snack: [
      { name: "Batido de proteínas post-entreno", cal: 280, prot: 30, carbs: 28, fat: 5, time: 3, desc: "Batido de proteína de suero con leche desnatada, plátano y creatina monohidrato." },
      { name: "Pan con mantequilla de cacahuete y plátano", cal: 320, prot: 12, carbs: 48, fat: 12, time: 3, desc: "Pan integral tostado con mantequilla de cacahuete natural y plátano en rodajas." },
      { name: "Requesón con miel y nueces", cal: 260, prot: 20, carbs: 22, fat: 10, time: 3, desc: "Requesón bajo en grasa con miel de abeja, nueces y canela." },
      { name: "Huevos duros con sal y pimienta", cal: 200, prot: 18, carbs: 2, fat: 14, time: 10, desc: "Huevos duros con sal marina, pimienta negra y pimentón dulce." },
      { name: "Yogur griego con granola y miel", cal: 290, prot: 18, carbs: 38, fat: 8, time: 3, desc: "Yogur griego 2% con granola artesanal, miel y fresas." },
      { name: "Tostada con queso cottage y tomate", cal: 240, prot: 16, carbs: 28, fat: 6, time: 5, desc: "Pan integral tostado con queso cottage, tomate en rodajas y orégano." },
      { name: "Mix de frutos secos y chocolate negro", cal: 300, prot: 8, carbs: 24, fat: 20, time: 1, desc: "Mix de almendras, nueces, anacardos y pepitas de chocolate negro 85%." },
    ],
    dinner: [
      { name: "Pechuga de pollo con arroz y brócoli", cal: 520, prot: 48, carbs: 50, fat: 12, time: 30, desc: "Pechuga de pollo a la plancha con arroz blanco y brócoli al vapor con limón." },
      { name: "Salmón al horno con quinoa", cal: 540, prot: 42, carbs: 40, fat: 22, time: 30, desc: "Salmón al horno con quinoa cocida, espárragos y salsa de yogur con eneldo." },
      { name: "Tortilla de claras con verduras", cal: 380, prot: 30, carbs: 18, fat: 18, time: 20, desc: "Tortilla de 6 claras con pimiento, cebolla, champiñones y queso mozzarella." },
      { name: "Ternera con patata y ensalada", cal: 580, prot: 46, carbs: 48, fat: 18, time: 35, desc: "Filete de ternera a la plancha con patata cocida y ensalada verde con aceite de oliva." },
      { name: "Pasta con pollo y salsa de tomate", cal: 560, prot: 44, carbs: 60, fat: 12, time: 30, desc: "Pasta integral con pollo en dados, salsa de tomate casera y queso parmesano." },
      { name: "Bacalao al pil-pil con patatas", cal: 490, prot: 40, carbs: 42, fat: 16, time: 40, desc: "Bacalao desalado en salsa pil-pil con patatas cocidas y pimientos del piquillo." },
      { name: "Revuelto de gambas con espárragos y arroz", cal: 510, prot: 38, carbs: 46, fat: 16, time: 25, desc: "Gambas salteadas con espárragos verdes, huevo revuelto y arroz blanco." },
    ],
  },
  // ── Mediterráneo (menu 4) ──────────────────────────────────────────────────
  mediterraneo: {
    breakfast: [
      { name: "Pan con tomate y aceite de oliva virgen", cal: 280, prot: 8, carbs: 42, fat: 10, time: 5, desc: "Pan de masa madre tostado frotado con tomate maduro, aceite de oliva virgen extra y sal." },
      { name: "Yogur con higos y miel de tomillo", cal: 260, prot: 10, carbs: 42, fat: 6, time: 5, desc: "Yogur natural con higos frescos, miel de tomillo y nueces picadas." },
      { name: "Tostadas con queso fresco y aceitunas", cal: 290, prot: 12, carbs: 36, fat: 12, time: 8, desc: "Tostadas integrales con queso fresco, aceitunas kalamata y orégano." },
      { name: "Fruta de temporada con almendras", cal: 220, prot: 6, carbs: 38, fat: 8, time: 3, desc: "Mezcla de frutas de temporada con almendras tostadas y zumo de naranja." },
      { name: "Huevos revueltos con tomate y hierbas", cal: 300, prot: 18, carbs: 12, fat: 20, time: 12, desc: "Huevos revueltos con tomate, albahaca, orégano y aceite de oliva." },
      { name: "Porridge de avena con dátiles y pistachos", cal: 340, prot: 10, carbs: 58, fat: 10, time: 10, desc: "Avena cocida con leche, dátiles Medjool, pistachos y agua de azahar." },
      { name: "Smoothie de frutas mediterráneas", cal: 250, prot: 6, carbs: 50, fat: 4, time: 5, desc: "Batido de higo, melocotón, naranja, yogur y miel." },
    ],
    lunch: [
      { name: "Ensalada griega con feta y aceitunas", cal: 380, prot: 14, carbs: 22, fat: 28, time: 15, desc: "Tomate, pepino, cebolla morada, pimiento verde, queso feta y aceitunas kalamata con orégano." },
      { name: "Paella de verduras y gambas", cal: 480, prot: 24, carbs: 62, fat: 14, time: 45, desc: "Arroz bomba con gambas, mejillones, pimiento, judías verdes y azafrán." },
      { name: "Lentejas estofadas con verduras", cal: 360, prot: 20, carbs: 52, fat: 8, time: 35, desc: "Lentejas con zanahoria, apio, tomate, cebolla y pimentón dulce." },
      { name: "Bacalao con garbanzos y espinacas", cal: 420, prot: 36, carbs: 38, fat: 12, time: 30, desc: "Bacalao desalado con garbanzos, espinacas, ajo y pimentón." },
      { name: "Pollo al limón con patatas y romero", cal: 460, prot: 38, carbs: 42, fat: 16, time: 50, desc: "Pollo asado con limón, romero, ajo y patatas al horno." },
      { name: "Gazpacho con tostadas y jamón", cal: 340, prot: 18, carbs: 32, fat: 14, time: 15, desc: "Gazpacho andaluz con tostadas de pan rústico y jamón serrano." },
      { name: "Lubina al horno con verduras mediterráneas", cal: 390, prot: 34, carbs: 24, fat: 18, time: 35, desc: "Lubina al horno con tomate, pimiento, calabacín, cebolla y aceitunas." },
    ],
    snack: [
      { name: "Hummus con pan de pita y crudités", cal: 200, prot: 8, carbs: 28, fat: 8, time: 5, desc: "Hummus casero con pan de pita integral y bastones de zanahoria y pepino." },
      { name: "Fruta fresca con queso manchego", cal: 180, prot: 8, carbs: 24, fat: 8, time: 3, desc: "Uvas, higos y melocotón con lonchas de queso manchego curado." },
      { name: "Aceitunas con queso y frutos secos", cal: 190, prot: 6, carbs: 10, fat: 16, time: 2, desc: "Aceitunas manzanilla con queso manchego y almendras tostadas." },
      { name: "Tostada con tomate y anchoas", cal: 160, prot: 8, carbs: 20, fat: 6, time: 5, desc: "Tostada de pan rústico con tomate rallado, anchoas del Cantábrico y aceite de oliva." },
      { name: "Yogur con miel y pistachos", cal: 200, prot: 8, carbs: 28, fat: 8, time: 3, desc: "Yogur natural con miel de flores y pistachos pelados." },
      { name: "Dátiles con almendras y chocolate", cal: 210, prot: 4, carbs: 36, fat: 8, time: 2, desc: "Dátiles Medjool rellenos de almendra y bañados en chocolate negro." },
      { name: "Granola mediterránea con fruta", cal: 230, prot: 6, carbs: 38, fat: 8, time: 3, desc: "Granola con almendras, pistachos, higos deshidratados y zumo de naranja." },
    ],
    dinner: [
      { name: "Sopa de fideos con verduras", cal: 260, prot: 10, carbs: 42, fat: 6, time: 25, desc: "Caldo de verduras con fideos, zanahoria, judías verdes y hierbas aromáticas." },
      { name: "Tortilla española con ensalada", cal: 340, prot: 16, carbs: 28, fat: 20, time: 30, desc: "Tortilla de patata y cebolla con ensalada verde y alioli." },
      { name: "Revuelto de champiñones con gambas", cal: 300, prot: 22, carbs: 8, fat: 20, time: 20, desc: "Champiñones y gambas salteados con ajo, perejil y huevos revueltos." },
      { name: "Crema de tomate con albahaca", cal: 220, prot: 6, carbs: 28, fat: 10, time: 20, desc: "Crema de tomate asado con albahaca fresca, aceite de oliva y pan crujiente." },
      { name: "Ensalada de atún con huevo y aceitunas", cal: 320, prot: 26, carbs: 12, fat: 20, time: 10, desc: "Atún, huevo duro, aceitunas, tomate y lechuga con vinagreta mediterránea." },
      { name: "Pisto manchego con huevo", cal: 280, prot: 14, carbs: 22, fat: 16, time: 30, desc: "Pisto de calabacín, pimiento, tomate y cebolla con huevo frito." },
      { name: "Sardinas a la plancha con limón", cal: 290, prot: 28, carbs: 2, fat: 18, time: 15, desc: "Sardinas frescas a la plancha con limón, ajo, perejil y aceite de oliva." },
    ],
  },
  // ── Vegano (menu 5) ────────────────────────────────────────────────────────
  vegano: {
    breakfast: [
      { name: "Smoothie bowl de açaí con frutas", cal: 380, prot: 10, carbs: 68, fat: 10, time: 10, desc: "Bowl de açaí con plátano, fresas, granola, semillas de cáñamo y coco rallado." },
      { name: "Tostadas con aguacate y tomate cherry", cal: 320, prot: 8, carbs: 38, fat: 16, time: 8, desc: "Pan de masa madre con aguacate machacado, tomates cherry, semillas de sésamo y lima." },
      { name: "Porridge de avena con leche de avena y frutos rojos", cal: 340, prot: 10, carbs: 62, fat: 8, time: 10, desc: "Avena cocida con leche de avena, arándanos, frambuesas y sirope de agave." },
      { name: "Yogur de coco con granola y mango", cal: 360, prot: 6, carbs: 58, fat: 14, time: 5, desc: "Yogur de coco con granola artesanal, mango fresco y semillas de chía." },
      { name: "Batido verde de espinacas y plátano", cal: 290, prot: 8, carbs: 52, fat: 6, time: 5, desc: "Espinacas, plátano, leche de almendras, proteína de guisante y jengibre." },
      { name: "Tostadas con mantequilla de cacahuete y plátano", cal: 380, prot: 12, carbs: 54, fat: 14, time: 5, desc: "Pan integral tostado con mantequilla de cacahuete natural, plátano y semillas de chía." },
      { name: "Muesli con leche de soja y fruta", cal: 350, prot: 12, carbs: 58, fat: 8, time: 5, desc: "Muesli de avena, frutos secos y semillas con leche de soja y fruta de temporada." },
    ],
    lunch: [
      { name: "Buddha bowl de quinoa y garbanzos", cal: 480, prot: 20, carbs: 68, fat: 16, time: 30, desc: "Quinoa con garbanzos asados, aguacate, pepino, zanahoria, kale y tahini." },
      { name: "Curry de lentejas rojas con arroz basmati", cal: 460, prot: 22, carbs: 72, fat: 10, time: 35, desc: "Lentejas rojas en curry de coco con espinacas, tomate y arroz basmati." },
      { name: "Tacos de tofu con guacamole", cal: 440, prot: 18, carbs: 52, fat: 20, time: 25, desc: "Tortillas de maíz con tofu marinado, guacamole, pico de gallo y cilantro." },
      { name: "Pasta con pesto de albahaca y tomates secos", cal: 520, prot: 16, carbs: 72, fat: 20, time: 20, desc: "Pasta integral con pesto vegano de albahaca, piñones, tomates secos y levadura nutricional." },
      { name: "Sopa de miso con tofu y algas", cal: 280, prot: 16, carbs: 28, fat: 10, time: 20, desc: "Caldo de miso con tofu sedoso, algas wakame, cebolleta y champiñones shiitake." },
      { name: "Ensalada de garbanzos con aguacate y mango", cal: 420, prot: 14, carbs: 52, fat: 18, time: 15, desc: "Garbanzos con aguacate, mango, cebolla morada, cilantro y vinagreta de lima." },
      { name: "Hamburguesa de lentejas con boniato frito", cal: 500, prot: 20, carbs: 68, fat: 16, time: 40, desc: "Hamburguesa de lentejas y zanahoria con boniato frito al horno y ensalada." },
    ],
    snack: [
      { name: "Hummus con crudités de verduras", cal: 160, prot: 6, carbs: 20, fat: 8, time: 5, desc: "Hummus de garbanzos con zanahoria, pepino, apio y pimiento en bastones." },
      { name: "Fruta fresca con mantequilla de almendras", cal: 200, prot: 4, carbs: 32, fat: 10, time: 3, desc: "Manzana y pera en láminas con mantequilla de almendras natural." },
      { name: "Edamame al vapor", cal: 140, prot: 12, carbs: 12, fat: 5, time: 5, desc: "Vainas de edamame al vapor con sal marina y sésamo." },
      { name: "Dátiles con mantequilla de cacahuete", cal: 220, prot: 5, carbs: 38, fat: 8, time: 2, desc: "Dátiles Medjool rellenos de mantequilla de cacahuete natural." },
      { name: "Chips de kale al horno", cal: 120, prot: 4, carbs: 14, fat: 6, time: 20, desc: "Hojas de kale al horno con aceite de oliva, sal y levadura nutricional." },
      { name: "Batido de proteína vegana con frutos rojos", cal: 220, prot: 20, carbs: 28, fat: 4, time: 3, desc: "Proteína de guisante con leche de avena, frutos rojos y semillas de lino." },
      { name: "Mix de frutos secos y semillas", cal: 190, prot: 6, carbs: 16, fat: 14, time: 1, desc: "Almendras, nueces, semillas de girasol y calabaza tostadas." },
    ],
    dinner: [
      { name: "Wok de verduras con tofu y arroz", cal: 380, prot: 18, carbs: 52, fat: 12, time: 25, desc: "Tofu firme salteado con brócoli, zanahoria, pak choi, soja y arroz integral." },
      { name: "Crema de calabaza y jengibre", cal: 240, prot: 6, carbs: 38, fat: 8, time: 25, desc: "Crema de calabaza asada con jengibre, leche de coco y semillas de calabaza." },
      { name: "Ensalada templada de lentejas y espinacas", cal: 320, prot: 18, carbs: 42, fat: 8, time: 20, desc: "Lentejas beluga con espinacas baby, tomate cherry, nueces y vinagreta de mostaza." },
      { name: "Ratatouille con polenta cremosa", cal: 360, prot: 10, carbs: 52, fat: 12, time: 40, desc: "Ratatouille de berenjenas, calabacín, pimiento y tomate con polenta cremosa." },
      { name: "Sopa de tomate asado con albahaca", cal: 220, prot: 6, carbs: 32, fat: 8, time: 25, desc: "Tomates asados con ajo, cebolla, albahaca y aceite de oliva." },
      { name: "Tacos de champiñones al pastor", cal: 340, prot: 10, carbs: 48, fat: 12, time: 25, desc: "Tortillas de maíz con champiñones marinados al pastor, piña, cebolla y cilantro." },
      { name: "Curry verde de verduras con arroz jazmín", cal: 400, prot: 10, carbs: 60, fat: 16, time: 30, desc: "Curry verde tailandés con leche de coco, berenjena, pimiento, tofu y arroz jazmín." },
    ],
  },
};

// Fallback: use perdida_peso recipes for other menus
RECIPES.definicion = RECIPES.perdida_peso;
RECIPES.mantenimiento = RECIPES.mediterraneo;
RECIPES.familiar = RECIPES.mediterraneo;

const MENU_RECIPE_MAP = {
  2: 'perdida_peso',
  3: 'ganancia_muscular',
  4: 'mediterraneo',
  5: 'vegano',
  6: 'definicion',
  7: 'mantenimiento',
  8: 'perdida_peso',
  9: 'familiar',
};

const MEAL_NAME_MAP = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  afternoon_snack: 'snack',
  dinner: 'dinner',
  morning_snack: 'snack',
  snack: 'snack',
};

async function run() {
  // Get all day parts grouped by menu
  const dpResult = await pool.query(
    'SELECT id, "menuOrganizerId", "dayNumber", "mealNumber", name FROM menu_organizer_day_parts ORDER BY "menuOrganizerId", "dayNumber", "mealNumber"'
  );
  
  const byMenu = {};
  for (const row of dpResult.rows) {
    if (!byMenu[row.menuOrganizerId]) byMenu[row.menuOrganizerId] = [];
    byMenu[row.menuOrganizerId].push(row);
  }

  let totalRecipes = 0;
  let totalAssociations = 0;

  for (const [menuId, dayParts] of Object.entries(byMenu)) {
    const recipeKey = MENU_RECIPE_MAP[menuId];
    if (!recipeKey) { console.log(`Skipping menu ${menuId} - no recipe key`); continue; }
    const recipePool = RECIPES[recipeKey];
    if (!recipePool) { console.log(`Skipping menu ${menuId} - no recipe pool for ${recipeKey}`); continue; }

    console.log(`\nProcessing menu ${menuId} (${recipeKey}) with ${dayParts.length} day parts...`);

    for (const dp of dayParts) {
      const mealKey = MEAL_NAME_MAP[dp.name] || 'snack';
      const recipeList = recipePool[mealKey] || recipePool.snack;
      // Pick recipe based on day number (rotate through the 7 options)
      const recipeData = recipeList[(dp.dayNumber - 1) % recipeList.length];

      // Insert recipe if not exists (by name)
      let recipeId;
      const existing = await pool.query('SELECT id FROM recipes WHERE name = $1 AND "isSeeded" = true LIMIT 1', [recipeData.name]);
      if (existing.rows.length > 0) {
        recipeId = existing.rows[0].id;
      } else {
        const inserted = await pool.query(
          `INSERT INTO recipes ("userId", name, description, "caloriesPerServing", "proteinsPerServing", "carbsPerServing", "fatsPerServing", "preparationTime", difficulty, "isPublic", "isSeeded", "mealTime", "servings")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING id`,
          [1, recipeData.name, recipeData.desc, recipeData.cal, recipeData.prot, recipeData.carbs, recipeData.fat, recipeData.time, 'medium', true, true, 'cualquiera', 1]
        );
        recipeId = inserted.rows[0].id;
        totalRecipes++;
      }

      // Associate recipe with day part
      try {
        await pool.query(
          `INSERT INTO menu_dp_recipes ("menuOrganizerDayPartId", "recipeId", servings) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [dp.id, recipeId, 1]
        );
        totalAssociations++;
      } catch (e) {
        // ignore duplicate
      }
    }
  }

  console.log(`\n✅ Done! Created ${totalRecipes} recipes, ${totalAssociations} associations`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
