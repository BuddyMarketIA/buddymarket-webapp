/**
 * seed-recipes-v2.mjs
 * Inserta 200+ recetas de alta calidad en BuddyMarket.
 * Enums correctos: mealTime = desayuno|media_manana|comida|merienda|cena|cualquiera
 *                  difficulty = easy|medium|hard
 */
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const ADMIN_USER_ID = 1;

// Fotos de Unsplash curadas por tipo de receta
const IMG = {
  tostada_aguacate: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80',
  porridge: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&q=80',
  smoothie_bowl: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&q=80',
  pancakes: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  granola: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80',
  huevos_revueltos: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80',
  tortilla_francesa: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600&q=80',
  batido: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
  crepes: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&q=80',
  muesli: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
  fruta_yogur: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  ensalada: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  salmon: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
  pasta: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80',
  arroz_pollo: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
  lentejas: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  gazpacho: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=600&q=80',
  paella: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600&q=80',
  pollo_verduras: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80',
  tacos: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  curry: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  quinoa_bowl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  risotto: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
  sopa: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
  tortilla_esp: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  merluza: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  crema_calabaza: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&q=80',
  pisto: 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=600&q=80',
  caprese: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600&q=80',
  revuelto: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=600&q=80',
  hummus: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80',
  barritas: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80',
  frutos_secos: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&q=80',
  guacamole: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80',
  wrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
  burger: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
  brocoli: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80',
  espinacas: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80',
  pollo_limon: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80',
  bacalao: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  carne: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  bowl_general: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  nachos: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&q=80',
  tostada_tomate: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80',
  waffles: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&q=80',
  acai: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&q=80',
  overnight_oats: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&q=80',
  french_toast: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80',
  burritos: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
  falafel: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80',
  pollo_horno: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80',
  espaguetis: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80',
  crema_brocoli: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
  dorada: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  albondigas: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
  shakshuka: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80',
  bol_acai: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&q=80',
  tarta_queso: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  ceviche: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  ramen: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
  poke: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  general: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
};

const R = (name, mealTime, difficulty, prepTime, cookTime, servings, cal, prot, carbs, fats, fiber, category, cuisine, allergens, tags, imgKey, ingredients, instructions) => ({
  name, mealTime, difficulty, prepTime, cookTime, servings, cal, prot, carbs, fats, fiber, category, cuisine, allergens, tags, imgKey, ingredients, instructions
});

const RECIPES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // DESAYUNOS
  // ═══════════════════════════════════════════════════════════════════════════
  R('Tostadas de aguacate con huevo pochado', 'desayuno', 'easy', 10, 5, 1, 380, 18, 32, 20, 8, 'Desayunos saludables', 'mediterranea', ['gluten','huevos'], ['fitness','proteica','rapida'], 'tostada_aguacate',
    [{name:'Pan integral',amount:2,unit:'rebanadas',category:'cereales'},{name:'Aguacate maduro',amount:1,unit:'unidad',category:'frutas'},{name:'Huevo',amount:1,unit:'unidad',category:'proteinas'},{name:'Zumo de limón',amount:1,unit:'cucharada',category:'condimentos'},{name:'Semillas de sésamo',amount:1,unit:'cucharadita',category:'semillas'},{name:'Copos de chile',amount:1,unit:'pizca',category:'condimentos'}],
    [{step:1,text:'Tuesta el pan integral hasta que esté dorado y crujiente.'},{step:2,text:'Aplasta el aguacate con un tenedor, añade zumo de limón, sal y pimienta.'},{step:3,text:'Para el huevo pochado: hierve agua con vinagre, crea un remolino y añade el huevo 3 minutos.'},{step:4,text:'Extiende el aguacate sobre las tostadas y coloca el huevo pochado encima.'},{step:5,text:'Espolvorea sésamo y copos de chile. Sirve inmediatamente.'}]),

  R('Porridge de avena con frutas del bosque', 'desayuno', 'easy', 5, 10, 1, 340, 12, 58, 7, 9, 'Desayunos saludables', 'española', ['gluten','lacteos'], ['fibra','energia','vegano'], 'porridge',
    [{name:'Copos de avena',amount:80,unit:'g',category:'cereales'},{name:'Leche de avena',amount:250,unit:'ml',category:'lacteos'},{name:'Arándanos',amount:50,unit:'g',category:'frutas'},{name:'Frambuesas',amount:30,unit:'g',category:'frutas'},{name:'Miel',amount:1,unit:'cucharada',category:'endulzantes'},{name:'Canela molida',amount:0.5,unit:'cucharadita',category:'especias'},{name:'Semillas de chía',amount:1,unit:'cucharada',category:'semillas'}],
    [{step:1,text:'Calienta la leche de avena en un cazo a fuego medio.'},{step:2,text:'Añade la avena y la canela. Remueve 5-7 minutos hasta que esté cremosa.'},{step:3,text:'Vierte en un bol y deja reposar 2 minutos.'},{step:4,text:'Coloca los arándanos y frambuesas por encima.'},{step:5,text:'Añade las semillas de chía y un hilo de miel.'}]),

  R('Smoothie bowl de mango y espinacas', 'desayuno', 'easy', 10, 0, 1, 290, 8, 52, 6, 7, 'Smoothie bowls', 'americana', ['frutos_secos'], ['vegano','sin_gluten','antioxidantes'], 'smoothie_bowl',
    [{name:'Mango congelado',amount:150,unit:'g',category:'frutas'},{name:'Espinacas baby',amount:30,unit:'g',category:'verduras'},{name:'Leche de coco',amount:100,unit:'ml',category:'lacteos'},{name:'Plátano',amount:0.5,unit:'unidad',category:'frutas'},{name:'Granola',amount:30,unit:'g',category:'cereales'},{name:'Coco rallado',amount:10,unit:'g',category:'frutos_secos'},{name:'Kiwi',amount:0.5,unit:'unidad',category:'frutas'}],
    [{step:1,text:'Tritura el mango, las espinacas, el plátano y la leche de coco hasta obtener una mezcla espesa.'},{step:2,text:'Vierte en un bol amplio.'},{step:3,text:'Coloca la granola en un lado del bol.'},{step:4,text:'Añade el kiwi en rodajas y el coco rallado.'},{step:5,text:'Sirve inmediatamente para mantener la textura fría.'}]),

  R('Pancakes de plátano y avena sin harina', 'desayuno', 'easy', 5, 15, 2, 280, 10, 48, 6, 5, 'Desayunos dulces', 'americana', ['huevos','gluten'], ['sin_azucar','fitness','dulce'], 'pancakes',
    [{name:'Plátano maduro',amount:2,unit:'unidades',category:'frutas'},{name:'Copos de avena',amount:80,unit:'g',category:'cereales'},{name:'Huevos',amount:2,unit:'unidades',category:'proteinas'},{name:'Canela',amount:1,unit:'cucharadita',category:'especias'},{name:'Extracto de vainilla',amount:1,unit:'cucharadita',category:'condimentos'},{name:'Arándanos',amount:50,unit:'g',category:'frutas'},{name:'Sirope de arce',amount:1,unit:'cucharada',category:'endulzantes'}],
    [{step:1,text:'Tritura los copos de avena hasta obtener una harina gruesa.'},{step:2,text:'Aplasta los plátanos hasta hacer un puré y mezcla con los huevos, avena, canela y vainilla.'},{step:3,text:'Calienta una sartén antiadherente a fuego medio.'},{step:4,text:'Vierte porciones de masa y cocina 2-3 minutos por lado.'},{step:5,text:'Sirve con arándanos frescos y sirope de arce.'}]),

  R('Granola casera con yogur griego', 'desayuno', 'easy', 10, 25, 4, 320, 14, 42, 11, 4, 'Desayunos saludables', 'americana', ['frutos_secos','lacteos','gluten'], ['probioticos','fibra','energia'], 'granola',
    [{name:'Copos de avena',amount:200,unit:'g',category:'cereales'},{name:'Almendras laminadas',amount:50,unit:'g',category:'frutos_secos'},{name:'Miel',amount:3,unit:'cucharadas',category:'endulzantes'},{name:'Aceite de coco',amount:2,unit:'cucharadas',category:'grasas'},{name:'Canela',amount:1,unit:'cucharadita',category:'especias'},{name:'Yogur griego natural',amount:150,unit:'g',category:'lacteos'},{name:'Arándanos secos',amount:30,unit:'g',category:'frutas'}],
    [{step:1,text:'Precalienta el horno a 160°C.'},{step:2,text:'Mezcla la avena, almendras, miel derretida con aceite de coco y canela.'},{step:3,text:'Extiende en una bandeja y hornea 20-25 minutos removiendo a mitad.'},{step:4,text:'Deja enfriar completamente. Añade los arándanos secos.'},{step:5,text:'Sirve sobre el yogur griego. Guarda en tarro hermético hasta 2 semanas.'}]),

  R('Huevos revueltos con salmón ahumado', 'desayuno', 'medium', 5, 8, 1, 390, 32, 6, 27, 0, 'Huevos', 'española', ['huevos','pescado','lacteos'], ['proteica','omega3','keto','sin_gluten'], 'huevos_revueltos',
    [{name:'Huevos',amount:3,unit:'unidades',category:'proteinas'},{name:'Salmón ahumado',amount:60,unit:'g',category:'proteinas'},{name:'Mantequilla',amount:15,unit:'g',category:'lacteos'},{name:'Alcaparras',amount:1,unit:'cucharada',category:'condimentos'},{name:'Cebollino fresco',amount:5,unit:'g',category:'hierbas'},{name:'Crème fraîche',amount:1,unit:'cucharada',category:'lacteos'}],
    [{step:1,text:'Bate los huevos ligeramente con sal y pimienta.'},{step:2,text:'Calienta la mantequilla en un cazo a fuego bajo-medio.'},{step:3,text:'Añade los huevos y remueve constantemente retirando del fuego cada 30 segundos.'},{step:4,text:'Cuando estén casi cuajados pero cremosos, añade la crème fraîche.'},{step:5,text:'Sirve con el salmón ahumado, las alcaparras y el cebollino picado.'}]),

  R('Tortilla francesa con queso y espinacas', 'desayuno', 'easy', 5, 8, 1, 310, 22, 4, 23, 1, 'Huevos', 'española', ['huevos','lacteos'], ['proteica','keto','rapida','sin_gluten'], 'tortilla_francesa',
    [{name:'Huevos',amount:3,unit:'unidades',category:'proteinas'},{name:'Espinacas baby',amount:40,unit:'g',category:'verduras'},{name:'Queso feta',amount:30,unit:'g',category:'lacteos'},{name:'Aceite de oliva',amount:1,unit:'cucharada',category:'grasas'},{name:'Ajo en polvo',amount:0.5,unit:'cucharadita',category:'especias'}],
    [{step:1,text:'Saltea las espinacas en una sartén con un poco de aceite durante 2 minutos. Reserva.'},{step:2,text:'Bate los huevos con sal, pimienta y ajo en polvo.'},{step:3,text:'Calienta el aceite en la sartén a fuego medio-alto.'},{step:4,text:'Vierte los huevos y cuando empiecen a cuajar, añade las espinacas y el queso feta desmenuzado.'},{step:5,text:'Dobla la tortilla por la mitad y sirve caliente.'}]),

  R('Batido de proteínas con mantequilla de cacahuete', 'desayuno', 'easy', 5, 0, 1, 420, 40, 38, 12, 3, 'Batidos', 'americana', ['lacteos','frutos_secos'], ['proteica','post_entreno','fitness','rapida'], 'batido',
    [{name:'Proteína de suero vainilla',amount:30,unit:'g',category:'suplementos'},{name:'Leche semidesnatada',amount:250,unit:'ml',category:'lacteos'},{name:'Plátano congelado',amount:1,unit:'unidad',category:'frutas'},{name:'Mantequilla de cacahuete',amount:1,unit:'cucharada',category:'frutos_secos'},{name:'Cacao puro en polvo',amount:1,unit:'cucharada',category:'otros'},{name:'Hielo',amount:4,unit:'cubitos',category:'otros'}],
    [{step:1,text:'Añade todos los ingredientes a la batidora.'},{step:2,text:'Tritura a máxima potencia durante 30-45 segundos hasta que quede cremoso.'},{step:3,text:'Prueba y ajusta la dulzura si es necesario.'},{step:4,text:'Sirve inmediatamente en un vaso grande.'}]),

  R('Muesli suizo con frutas frescas', 'desayuno', 'easy', 10, 0, 2, 310, 11, 50, 8, 7, 'Desayunos saludables', 'española', ['gluten','frutos_secos','lacteos'], ['fibra','sin_azucar','preparacion_previa'], 'muesli',
    [{name:'Copos de avena finos',amount:100,unit:'g',category:'cereales'},{name:'Zumo de manzana natural',amount:150,unit:'ml',category:'bebidas'},{name:'Yogur natural',amount:100,unit:'g',category:'lacteos'},{name:'Manzana',amount:1,unit:'unidad',category:'frutas'},{name:'Nueces',amount:20,unit:'g',category:'frutos_secos'},{name:'Pasas',amount:20,unit:'g',category:'frutas'},{name:'Zumo de limón',amount:1,unit:'cucharada',category:'condimentos'}],
    [{step:1,text:'La noche anterior: mezcla la avena con el zumo de manzana y el yogur. Tapa y refrigera.'},{step:2,text:'Por la mañana: ralla la manzana y añade el zumo de limón para que no se oxide.'},{step:3,text:'Mezcla la manzana rallada con la avena remojada.'},{step:4,text:'Añade las nueces troceadas y las pasas.'},{step:5,text:'Sirve frío directamente del frigorífico.'}]),

  R('Crepes integrales con fresas y nata', 'desayuno', 'medium', 15, 20, 2, 350, 12, 45, 14, 4, 'Desayunos dulces', 'española', ['gluten','huevos','lacteos'], ['dulce','fin_de_semana','especial'], 'crepes',
    [{name:'Harina integral',amount:100,unit:'g',category:'cereales'},{name:'Leche',amount:200,unit:'ml',category:'lacteos'},{name:'Huevos',amount:2,unit:'unidades',category:'proteinas'},{name:'Mantequilla',amount:20,unit:'g',category:'lacteos'},{name:'Fresas',amount:200,unit:'g',category:'frutas'},{name:'Nata para montar',amount:100,unit:'ml',category:'lacteos'},{name:'Azúcar moreno',amount:2,unit:'cucharadas',category:'endulzantes'}],
    [{step:1,text:'Mezcla la harina, los huevos, la leche y la mantequilla derretida hasta obtener una masa lisa. Reposa 30 minutos.'},{step:2,text:'Macera las fresas cortadas con 1 cucharada de azúcar durante 15 minutos.'},{step:3,text:'Monta la nata con el azúcar restante hasta obtener picos firmes.'},{step:4,text:'Cocina las crepes en una sartén antiadherente con un poco de mantequilla, 1 minuto por lado.'},{step:5,text:'Rellena con las fresas maceradas y la nata. Decora con menta fresca.'}]),

  R('Overnight oats de chocolate y avellanas', 'desayuno', 'easy', 10, 0, 1, 360, 14, 52, 12, 6, 'Desayunos saludables', 'americana', ['gluten','frutos_secos','lacteos'], ['preparacion_previa','sin_azucar','chocolate'], 'overnight_oats',
    [{name:'Copos de avena',amount:80,unit:'g',category:'cereales'},{name:'Leche de almendras',amount:200,unit:'ml',category:'lacteos'},{name:'Cacao puro en polvo',amount:2,unit:'cucharadas',category:'otros'},{name:'Avellanas tostadas',amount:20,unit:'g',category:'frutos_secos'},{name:'Miel',amount:1,unit:'cucharada',category:'endulzantes'},{name:'Semillas de chía',amount:1,unit:'cucharada',category:'semillas'},{name:'Plátano',amount:0.5,unit:'unidad',category:'frutas'}],
    [{step:1,text:'Mezcla la avena, el cacao, las semillas de chía y la miel en un tarro.'},{step:2,text:'Vierte la leche de almendras y remueve bien.'},{step:3,text:'Tapa y refrigera toda la noche.'},{step:4,text:'Por la mañana, añade el plátano en rodajas y las avellanas troceadas.'},{step:5,text:'Sirve frío directamente del tarro.'}]),

  R('French toast con arándanos y sirope', 'desayuno', 'easy', 5, 10, 2, 400, 16, 58, 14, 3, 'Desayunos dulces', 'americana', ['gluten','huevos','lacteos'], ['dulce','fin_de_semana','clasico'], 'french_toast',
    [{name:'Pan de molde brioche',amount:4,unit:'rebanadas',category:'cereales'},{name:'Huevos',amount:2,unit:'unidades',category:'proteinas'},{name:'Leche',amount:100,unit:'ml',category:'lacteos'},{name:'Canela',amount:1,unit:'cucharadita',category:'especias'},{name:'Extracto de vainilla',amount:1,unit:'cucharadita',category:'condimentos'},{name:'Arándanos frescos',amount:80,unit:'g',category:'frutas'},{name:'Sirope de arce',amount:2,unit:'cucharadas',category:'endulzantes'},{name:'Mantequilla',amount:10,unit:'g',category:'lacteos'}],
    [{step:1,text:'Bate los huevos con la leche, la canela y la vainilla en un bol ancho.'},{step:2,text:'Sumerge cada rebanada de pan en la mezcla durante 30 segundos por lado.'},{step:3,text:'Calienta la mantequilla en una sartén a fuego medio.'},{step:4,text:'Cocina las rebanadas 2-3 minutos por lado hasta que estén doradas.'},{step:5,text:'Sirve con arándanos frescos y sirope de arce.'}]),

  R('Shakshuka de tomate y pimiento', 'desayuno', 'medium', 10, 20, 2, 280, 16, 22, 14, 5, 'Huevos', 'mediterranea', ['huevos'], ['vegetariana','especiado','sin_gluten','proteica'], 'shakshuka',
    [{name:'Huevos',amount:4,unit:'unidades',category:'proteinas'},{name:'Tomates triturados',amount:400,unit:'g',category:'verduras'},{name:'Pimiento rojo',amount:1,unit:'unidad',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Ajo',amount:2,unit:'dientes',category:'verduras'},{name:'Comino',amount:1,unit:'cucharadita',category:'especias'},{name:'Pimentón ahumado',amount:1,unit:'cucharadita',category:'especias'},{name:'Cilantro fresco',amount:10,unit:'g',category:'hierbas'}],
    [{step:1,text:'Sofríe la cebolla y el pimiento en aceite durante 8 minutos.'},{step:2,text:'Añade el ajo, el comino y el pimentón. Sofríe 1 minuto.'},{step:3,text:'Incorpora los tomates triturados. Cocina 10 minutos a fuego medio.'},{step:4,text:'Haz huecos en la salsa y rompe los huevos dentro.'},{step:5,text:'Tapa y cocina 5-7 minutos hasta que las claras estén cuajadas. Decora con cilantro.'}]),

  R('Bol de açaí con granola y frutas', 'desayuno', 'easy', 10, 0, 1, 310, 6, 54, 10, 8, 'Smoothie bowls', 'americana', ['frutos_secos','gluten'], ['vegano','antioxidantes','sin_gluten'], 'acai',
    [{name:'Pulpa de açaí congelada',amount:100,unit:'g',category:'frutas'},{name:'Plátano congelado',amount:1,unit:'unidad',category:'frutas'},{name:'Leche de almendras',amount:80,unit:'ml',category:'lacteos'},{name:'Granola',amount:40,unit:'g',category:'cereales'},{name:'Fresas',amount:60,unit:'g',category:'frutas'},{name:'Arándanos',amount:30,unit:'g',category:'frutas'},{name:'Coco rallado',amount:10,unit:'g',category:'frutos_secos'},{name:'Miel',amount:1,unit:'cucharadita',category:'endulzantes'}],
    [{step:1,text:'Tritura la pulpa de açaí con el plátano congelado y la leche de almendras hasta obtener una mezcla espesa.'},{step:2,text:'Vierte en un bol.'},{step:3,text:'Coloca la granola en un lado.'},{step:4,text:'Distribuye las fresas y los arándanos.'},{step:5,text:'Espolvorea el coco rallado y añade un hilo de miel.'}]),

  R('Waffles integrales con mantequilla y miel', 'desayuno', 'medium', 10, 15, 2, 420, 14, 62, 16, 5, 'Desayunos dulces', 'americana', ['gluten','huevos','lacteos'], ['dulce','fin_de_semana','clasico'], 'waffles',
    [{name:'Harina integral',amount:150,unit:'g',category:'cereales'},{name:'Huevos',amount:2,unit:'unidades',category:'proteinas'},{name:'Leche',amount:200,unit:'ml',category:'lacteos'},{name:'Mantequilla derretida',amount:30,unit:'g',category:'lacteos'},{name:'Levadura',amount:1,unit:'cucharadita',category:'otros'},{name:'Miel',amount:2,unit:'cucharadas',category:'endulzantes'},{name:'Extracto de vainilla',amount:1,unit:'cucharadita',category:'condimentos'}],
    [{step:1,text:'Mezcla los ingredientes secos: harina, levadura y una pizca de sal.'},{step:2,text:'En otro bol, bate los huevos con la leche, la mantequilla derretida y la vainilla.'},{step:3,text:'Une las dos mezclas hasta obtener una masa homogénea.'},{step:4,text:'Vierte en la gofrera precalentada y cocina según las instrucciones del aparato.'},{step:5,text:'Sirve con mantequilla y miel o frutas frescas.'}]),

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA MAÑANA
  // ═══════════════════════════════════════════════════════════════════════════
  R('Fruta con yogur griego y miel', 'media_manana', 'easy', 5, 0, 1, 240, 12, 38, 4, 4, 'Snacks saludables', 'mediterranea', ['lacteos'], ['probioticos','rapida','vitaminas','ligera'], 'fruta_yogur',
    [{name:'Yogur griego 0%',amount:150,unit:'g',category:'lacteos'},{name:'Fresas',amount:80,unit:'g',category:'frutas'},{name:'Plátano',amount:0.5,unit:'unidad',category:'frutas'},{name:'Arándanos',amount:30,unit:'g',category:'frutas'},{name:'Miel',amount:1,unit:'cucharada',category:'endulzantes'},{name:'Granola',amount:20,unit:'g',category:'cereales'}],
    [{step:1,text:'Lava y corta las frutas en trozos del tamaño de un bocado.'},{step:2,text:'Coloca el yogur griego en un bol.'},{step:3,text:'Distribuye las frutas por encima.'},{step:4,text:'Añade la granola y un hilo de miel.'},{step:5,text:'Sirve inmediatamente.'}]),

  R('Tostada integral con tomate y aceite', 'media_manana', 'easy', 5, 3, 1, 200, 6, 28, 8, 4, 'Snacks saludables', 'española', ['gluten'], ['tradicional','española','rapida','vegana'], 'tostada_tomate',
    [{name:'Pan integral',amount:2,unit:'rebanadas',category:'cereales'},{name:'Tomate maduro',amount:1,unit:'unidad',category:'verduras'},{name:'Aceite de oliva virgen extra',amount:1,unit:'cucharada',category:'grasas'},{name:'Sal en escamas',amount:1,unit:'pizca',category:'condimentos'}],
    [{step:1,text:'Tuesta el pan hasta que esté dorado y crujiente.'},{step:2,text:'Ralla el tomate sobre el pan con un rallador grueso.'},{step:3,text:'Añade un hilo generoso de aceite de oliva.'},{step:4,text:'Espolvorea sal en escamas y sirve inmediatamente.'}]),

  R('Hummus casero con crudités', 'media_manana', 'easy', 15, 0, 4, 180, 8, 20, 8, 6, 'Snacks saludables', 'mediterranea', ['sesamo'], ['vegano','sin_gluten','fibra','proteina_vegetal'], 'hummus',
    [{name:'Garbanzos cocidos',amount:400,unit:'g',category:'legumbres'},{name:'Tahini',amount:3,unit:'cucharadas',category:'semillas'},{name:'Zumo de limón',amount:3,unit:'cucharadas',category:'condimentos'},{name:'Ajo',amount:1,unit:'diente',category:'verduras'},{name:'Comino',amount:0.5,unit:'cucharadita',category:'especias'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Zanahoria',amount:2,unit:'unidades',category:'verduras'},{name:'Apio',amount:2,unit:'tallos',category:'verduras'}],
    [{step:1,text:'Tritura los garbanzos con el tahini, el zumo de limón, el ajo y el comino.'},{step:2,text:'Añade 3-4 cucharadas de agua fría para obtener una textura cremosa.'},{step:3,text:'Ajusta sal y limón al gusto.'},{step:4,text:'Sirve en un bol con un hilo de aceite de oliva y una pizca de pimentón.'},{step:5,text:'Acompaña con los crudités cortados en palitos.'}]),

  R('Mix de frutos secos y frutas deshidratadas', 'media_manana', 'easy', 5, 0, 1, 280, 8, 22, 18, 3, 'Snacks saludables', 'americana', ['frutos_secos'], ['energia','sin_gluten','vegano','para_llevar'], 'frutos_secos',
    [{name:'Almendras crudas',amount:20,unit:'g',category:'frutos_secos'},{name:'Nueces',amount:15,unit:'g',category:'frutos_secos'},{name:'Anacardos',amount:15,unit:'g',category:'frutos_secos'},{name:'Arándanos secos',amount:15,unit:'g',category:'frutas'},{name:'Mango deshidratado',amount:10,unit:'g',category:'frutas'}],
    [{step:1,text:'Mezcla todos los ingredientes en un bol o bolsa hermética.'},{step:2,text:'Divide en porciones de 80g para tener snacks listos.'},{step:3,text:'Guarda en un tarro hermético hasta 2 semanas.'}]),

  R('Barritas de avena y chocolate negro', 'media_manana', 'easy', 15, 20, 8, 220, 6, 28, 10, 3, 'Snacks saludables', 'americana', ['gluten','frutos_secos','lacteos'], ['energia','sin_azucar','fitness'], 'barritas',
    [{name:'Copos de avena',amount:200,unit:'g',category:'cereales'},{name:'Mantequilla de almendras',amount:80,unit:'g',category:'frutos_secos'},{name:'Miel',amount:60,unit:'g',category:'endulzantes'},{name:'Chocolate negro 70%',amount:50,unit:'g',category:'otros'},{name:'Semillas de chía',amount:2,unit:'cucharadas',category:'semillas'},{name:'Extracto de vainilla',amount:1,unit:'cucharadita',category:'condimentos'}],
    [{step:1,text:'Precalienta el horno a 175°C. Forra un molde cuadrado con papel de horno.'},{step:2,text:'Derrite la mantequilla de almendras con la miel en el microondas 30 segundos.'},{step:3,text:'Mezcla con la avena, las semillas de chía y la vainilla.'},{step:4,text:'Presiona la mezcla en el molde y hornea 18-20 minutos.'},{step:5,text:'Deja enfriar completamente. Derrite el chocolate y decora por encima. Corta en barritas.'}]),

  R('Guacamole con nachos integrales', 'media_manana', 'easy', 10, 0, 2, 260, 4, 24, 17, 6, 'Snacks saludables', 'mexicana', [], ['vegano','sin_gluten','antioxidantes','rapido'], 'guacamole',
    [{name:'Aguacate maduro',amount:2,unit:'unidades',category:'frutas'},{name:'Tomate',amount:1,unit:'unidad',category:'verduras'},{name:'Cebolla roja',amount:0.25,unit:'unidad',category:'verduras'},{name:'Cilantro fresco',amount:10,unit:'g',category:'hierbas'},{name:'Lima',amount:1,unit:'unidad',category:'frutas'},{name:'Jalapeño',amount:0.5,unit:'unidad',category:'verduras'},{name:'Nachos integrales',amount:60,unit:'g',category:'cereales'}],
    [{step:1,text:'Aplasta los aguacates con un tenedor dejando algunos trozos.'},{step:2,text:'Añade el tomate sin semillas picado fino, la cebolla roja y el jalapeño.'},{step:3,text:'Incorpora el cilantro picado y el zumo de lima.'},{step:4,text:'Sazona con sal al gusto.'},{step:5,text:'Sirve inmediatamente con los nachos integrales.'}]),

  // ═══════════════════════════════════════════════════════════════════════════
  // COMIDAS
  // ═══════════════════════════════════════════════════════════════════════════
  R('Ensalada de pollo a la plancha con quinoa', 'comida', 'easy', 15, 20, 2, 420, 38, 32, 14, 6, 'Ensaladas', 'mediterranea', [], ['fitness','proteica','sin_gluten','ligera'], 'ensalada',
    [{name:'Pechuga de pollo',amount:300,unit:'g',category:'proteinas'},{name:'Quinoa',amount:100,unit:'g',category:'cereales'},{name:'Aguacate',amount:1,unit:'unidad',category:'frutas'},{name:'Tomates cherry',amount:150,unit:'g',category:'verduras'},{name:'Espinacas baby',amount:80,unit:'g',category:'verduras'},{name:'Pepino',amount:0.5,unit:'unidad',category:'verduras'},{name:'Zumo de limón',amount:2,unit:'cucharadas',category:'condimentos'},{name:'Aceite de oliva virgen extra',amount:2,unit:'cucharadas',category:'grasas'}],
    [{step:1,text:'Cuece la quinoa en agua con sal durante 15 minutos. Escurre y deja enfriar.'},{step:2,text:'Sazona el pollo con sal, pimienta y comino. Cocina a la plancha 6-7 minutos por lado.'},{step:3,text:'Deja reposar el pollo 5 minutos y córtalo en tiras.'},{step:4,text:'Prepara el aliño mezclando el zumo de limón con el aceite de oliva.'},{step:5,text:'Monta la ensalada: espinacas, quinoa, pollo, aguacate, tomates cherry y pepino. Aliña y sirve.'}]),

  R('Salmón al horno con patatas y limón', 'comida', 'easy', 15, 25, 2, 520, 42, 28, 26, 3, 'Pescados', 'mediterranea', ['pescado'], ['omega3','proteica','sin_gluten','saludable'], 'salmon',
    [{name:'Lomo de salmón',amount:400,unit:'g',category:'proteinas'},{name:'Patatas baby',amount:300,unit:'g',category:'verduras'},{name:'Limón',amount:1,unit:'unidad',category:'frutas'},{name:'Eneldo fresco',amount:10,unit:'g',category:'hierbas'},{name:'Aceite de oliva',amount:3,unit:'cucharadas',category:'grasas'},{name:'Ajo',amount:3,unit:'dientes',category:'verduras'},{name:'Espárragos',amount:100,unit:'g',category:'verduras'}],
    [{step:1,text:'Precalienta el horno a 200°C.'},{step:2,text:'Corta las patatas por la mitad y mezcla con aceite, ajo laminado, sal y pimienta. Hornea 15 minutos.'},{step:3,text:'Coloca el salmón sobre las patatas. Añade los espárragos alrededor.'},{step:4,text:'Rocía con zumo de limón, aceite y eneldo.'},{step:5,text:'Hornea 10-12 minutos más hasta que el salmón esté listo.'}]),

  R('Lentejas estofadas con verduras', 'comida', 'easy', 15, 40, 4, 380, 22, 52, 8, 14, 'Legumbres', 'española', ['gluten'], ['fibra','hierro','economica','tradicional'], 'lentejas',
    [{name:'Lentejas pardinas',amount:300,unit:'g',category:'legumbres'},{name:'Zanahoria',amount:2,unit:'unidades',category:'verduras'},{name:'Puerro',amount:1,unit:'unidad',category:'verduras'},{name:'Pimiento rojo',amount:1,unit:'unidad',category:'verduras'},{name:'Tomate triturado',amount:200,unit:'g',category:'verduras'},{name:'Chorizo',amount:100,unit:'g',category:'carnes'},{name:'Caldo de verduras',amount:1,unit:'litro',category:'caldos'},{name:'Pimentón dulce',amount:1,unit:'cucharadita',category:'especias'}],
    [{step:1,text:'Sofríe el puerro y el pimiento en aceite durante 5 minutos.'},{step:2,text:'Añade el chorizo en rodajas y el pimentón. Sofríe 2 minutos más.'},{step:3,text:'Incorpora el tomate triturado y cocina 5 minutos.'},{step:4,text:'Añade las lentejas (sin remojar), la zanahoria en rodajas y el caldo.'},{step:5,text:'Cocina a fuego medio 30-35 minutos hasta que las lentejas estén tiernas.'}]),

  R('Pasta al pesto con tomates cherry y burrata', 'comida', 'easy', 10, 15, 2, 580, 22, 68, 26, 5, 'Pastas', 'italiana', ['gluten','lacteos','frutos_secos'], ['italiana','vegetariana','rapida'], 'pasta',
    [{name:'Espaguetis',amount:200,unit:'g',category:'cereales'},{name:'Pesto genovés',amount:80,unit:'g',category:'salsas'},{name:'Tomates cherry',amount:200,unit:'g',category:'verduras'},{name:'Burrata',amount:125,unit:'g',category:'lacteos'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Albahaca fresca',amount:10,unit:'hojas',category:'hierbas'},{name:'Piñones',amount:20,unit:'g',category:'frutos_secos'}],
    [{step:1,text:'Asa los tomates cherry con aceite y sal a 200°C durante 15 minutos.'},{step:2,text:'Cuece la pasta en agua con sal según las instrucciones del paquete.'},{step:3,text:'Escurre la pasta reservando un poco del agua de cocción.'},{step:4,text:'Mezcla la pasta con el pesto y un poco del agua de cocción para emulsionar.'},{step:5,text:'Sirve con los tomates asados, la burrata rota encima, los piñones tostados y albahaca fresca.'}]),

  R('Paella valenciana', 'comida', 'hard', 30, 45, 4, 520, 35, 58, 16, 3, 'Arroces', 'española', [], ['tradicional','española','especial','domingo'], 'paella',
    [{name:'Arroz bomba',amount:400,unit:'g',category:'cereales'},{name:'Pollo troceado',amount:500,unit:'g',category:'carnes'},{name:'Conejo troceado',amount:300,unit:'g',category:'carnes'},{name:'Judías verdes',amount:150,unit:'g',category:'verduras'},{name:'Garrofón',amount:100,unit:'g',category:'legumbres'},{name:'Tomate natural rallado',amount:200,unit:'g',category:'verduras'},{name:'Pimentón dulce',amount:1,unit:'cucharada',category:'especias'},{name:'Azafrán',amount:1,unit:'sobre',category:'especias'},{name:'Caldo de pollo',amount:1.2,unit:'litros',category:'caldos'}],
    [{step:1,text:'Calienta el aceite en la paellera y dora el pollo y el conejo a fuego fuerte.'},{step:2,text:'Añade las judías verdes y el garrofón. Sofríe 5 minutos.'},{step:3,text:'Incorpora el tomate rallado y el pimentón. Sofríe hasta que el tomate pierda el agua.'},{step:4,text:'Añade el caldo caliente con el azafrán. Cuando hierva, incorpora el arroz distribuyéndolo uniformemente.'},{step:5,text:'Cocina a fuego fuerte 10 minutos, luego baja a fuego medio 8 minutos. Deja reposar 5 minutos tapado.'}]),

  R('Curry de pollo con leche de coco', 'comida', 'medium', 15, 30, 3, 490, 36, 42, 18, 4, 'Carnes', 'asiatica', [], ['especiado','asiatico','sin_gluten','reconfortante'], 'curry',
    [{name:'Pechuga de pollo',amount:500,unit:'g',category:'proteinas'},{name:'Leche de coco',amount:400,unit:'ml',category:'lacteos'},{name:'Espinacas',amount:100,unit:'g',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Ajo',amount:3,unit:'dientes',category:'verduras'},{name:'Jengibre fresco',amount:2,unit:'cm',category:'especias'},{name:'Curry en polvo',amount:2,unit:'cucharadas',category:'especias'},{name:'Tomate triturado',amount:200,unit:'g',category:'verduras'},{name:'Arroz basmati',amount:200,unit:'g',category:'cereales'}],
    [{step:1,text:'Sofríe la cebolla, el ajo y el jengibre rallado en aceite durante 5 minutos.'},{step:2,text:'Añade el curry en polvo y sofríe 1 minuto para activar los aromas.'},{step:3,text:'Incorpora el pollo en cubos y dóralo por todos lados.'},{step:4,text:'Añade el tomate triturado y la leche de coco. Cocina a fuego medio 20 minutos.'},{step:5,text:'Añade las espinacas y cocina 2 minutos más. Sirve con arroz basmati.'}]),

  R('Gazpacho andaluz tradicional', 'comida', 'easy', 15, 0, 4, 120, 2, 12, 7, 3, 'Sopas y cremas', 'española', ['gluten'], ['vegano','sin_coccion','verano','antioxidantes','ligero'], 'gazpacho',
    [{name:'Tomates maduros',amount:1,unit:'kg',category:'verduras'},{name:'Pepino',amount:0.5,unit:'unidad',category:'verduras'},{name:'Pimiento verde',amount:0.5,unit:'unidad',category:'verduras'},{name:'Ajo',amount:1,unit:'diente',category:'verduras'},{name:'Pan del día anterior',amount:50,unit:'g',category:'cereales'},{name:'Aceite de oliva virgen extra',amount:60,unit:'ml',category:'grasas'},{name:'Vinagre de Jerez',amount:2,unit:'cucharadas',category:'condimentos'}],
    [{step:1,text:'Remoja el pan en agua fría 5 minutos.'},{step:2,text:'Tritura los tomates, el pepino, el pimiento y el ajo hasta obtener una mezcla fina.'},{step:3,text:'Añade el pan escurrido y tritura de nuevo.'},{step:4,text:'Con la batidora en marcha, añade el aceite en hilo fino para emulsionar.'},{step:5,text:'Añade el vinagre y la sal. Cuela por un colador fino y refrigera al menos 2 horas antes de servir.'}]),

  R('Risotto de setas y parmesano', 'comida', 'hard', 15, 30, 2, 560, 18, 72, 22, 3, 'Arroces', 'italiana', ['lacteos','gluten'], ['italiana','vegetariana','cremoso','especial'], 'risotto',
    [{name:'Arroz arborio',amount:200,unit:'g',category:'cereales'},{name:'Setas variadas',amount:300,unit:'g',category:'verduras'},{name:'Caldo de verduras caliente',amount:800,unit:'ml',category:'caldos'},{name:'Vino blanco seco',amount:100,unit:'ml',category:'bebidas'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Mantequilla',amount:40,unit:'g',category:'lacteos'},{name:'Parmesano rallado',amount:60,unit:'g',category:'lacteos'},{name:'Tomillo fresco',amount:3,unit:'ramitas',category:'hierbas'}],
    [{step:1,text:'Saltea las setas en aceite con sal y tomillo hasta que estén doradas. Reserva.'},{step:2,text:'En la misma cazuela, sofríe la cebolla picada fina en mantequilla hasta que esté transparente.'},{step:3,text:'Añade el arroz y tuesta 2 minutos. Vierte el vino blanco y remueve hasta que se absorba.'},{step:4,text:'Añade el caldo caliente cazo a cazo, removiendo constantemente y esperando que se absorba antes de añadir más.'},{step:5,text:'Cuando el arroz esté al dente (18-20 min), retira del fuego. Añade las setas, la mantequilla fría y el parmesano. Remueve enérgicamente. Sirve inmediatamente.'}]),

  R('Tacos de ternera con guacamole', 'comida', 'medium', 20, 15, 2, 540, 32, 48, 22, 7, 'Carnes', 'mexicana', ['gluten','lacteos'], ['mexicana','especiado','festivo'], 'tacos',
    [{name:'Tortillas de maíz',amount:6,unit:'unidades',category:'cereales'},{name:'Carne picada de ternera',amount:300,unit:'g',category:'carnes'},{name:'Aguacate',amount:2,unit:'unidades',category:'frutas'},{name:'Tomate',amount:2,unit:'unidades',category:'verduras'},{name:'Cebolla roja',amount:0.5,unit:'unidad',category:'verduras'},{name:'Cilantro fresco',amount:20,unit:'g',category:'hierbas'},{name:'Lima',amount:2,unit:'unidades',category:'frutas'},{name:'Comino',amount:1,unit:'cucharadita',category:'especias'},{name:'Crema agria',amount:50,unit:'g',category:'lacteos'}],
    [{step:1,text:'Para el guacamole: aplasta los aguacates con zumo de lima, sal y cilantro picado.'},{step:2,text:'Para el pico de gallo: mezcla tomate, cebolla roja y cilantro picados con zumo de lima y sal.'},{step:3,text:'Sazona la carne con comino, chile, sal y pimienta. Cocina en sartén caliente hasta que esté dorada.'},{step:4,text:'Calienta las tortillas en una sartén seca 30 segundos por lado.'},{step:5,text:'Monta los tacos: tortilla, carne, guacamole, pico de gallo y crema agria.'}]),

  R('Pollo al horno con verduras mediterráneas', 'comida', 'easy', 15, 45, 3, 440, 38, 18, 22, 5, 'Carnes', 'mediterranea', [], ['sin_gluten','saludable','facil','bandeja'], 'pollo_verduras',
    [{name:'Muslos de pollo',amount:600,unit:'g',category:'carnes'},{name:'Pimiento rojo',amount:1,unit:'unidad',category:'verduras'},{name:'Pimiento amarillo',amount:1,unit:'unidad',category:'verduras'},{name:'Berenjena',amount:1,unit:'unidad',category:'verduras'},{name:'Calabacín',amount:1,unit:'unidad',category:'verduras'},{name:'Tomates cherry',amount:200,unit:'g',category:'verduras'},{name:'Aceite de oliva',amount:3,unit:'cucharadas',category:'grasas'},{name:'Orégano seco',amount:1,unit:'cucharadita',category:'especias'},{name:'Ajo',amount:4,unit:'dientes',category:'verduras'}],
    [{step:1,text:'Precalienta el horno a 200°C.'},{step:2,text:'Corta todas las verduras en trozos similares. Mezcla con aceite, orégano, sal y pimienta.'},{step:3,text:'Sazona el pollo con sal, pimienta y romero.'},{step:4,text:'Coloca las verduras en la bandeja y el pollo encima. Añade los ajos sin pelar.'},{step:5,text:'Hornea 40-45 minutos hasta que el pollo esté dorado y las verduras tiernas.'}]),

  R('Buddha bowl de quinoa y verduras asadas', 'comida', 'medium', 20, 30, 2, 480, 18, 58, 20, 12, 'Bowls', 'americana', ['sesamo'], ['vegano','sin_gluten','fibra','proteina_vegetal','colorido'], 'quinoa_bowl',
    [{name:'Quinoa',amount:160,unit:'g',category:'cereales'},{name:'Garbanzos cocidos',amount:200,unit:'g',category:'legumbres'},{name:'Boniato',amount:200,unit:'g',category:'verduras'},{name:'Brócoli',amount:150,unit:'g',category:'verduras'},{name:'Aguacate',amount:1,unit:'unidad',category:'frutas'},{name:'Espinacas baby',amount:60,unit:'g',category:'verduras'},{name:'Tahini',amount:2,unit:'cucharadas',category:'semillas'},{name:'Zumo de limón',amount:2,unit:'cucharadas',category:'condimentos'},{name:'Pimentón ahumado',amount:1,unit:'cucharadita',category:'especias'}],
    [{step:1,text:'Cuece la quinoa en agua con sal. Reserva.'},{step:2,text:'Mezcla los garbanzos con aceite y pimentón. Asa a 200°C 20 minutos hasta que estén crujientes.'},{step:3,text:'Asa el boniato en cubos y el brócoli con aceite y sal 20 minutos.'},{step:4,text:'Para el aliño: mezcla tahini, zumo de limón, agua y sal.'},{step:5,text:'Monta el bowl: quinoa, espinacas, verduras asadas, garbanzos, aguacate. Aliña con el tahini.'}]),

  R('Wrap de atún con aguacate', 'comida', 'easy', 10, 0, 1, 420, 32, 38, 16, 5, 'Bocadillos', 'americana', ['gluten','pescado'], ['rapida','proteica','omega3','para_llevar'], 'wrap',
    [{name:'Tortilla integral grande',amount:1,unit:'unidad',category:'cereales'},{name:'Atún en aceite de oliva',amount:120,unit:'g',category:'proteinas'},{name:'Aguacate',amount:0.5,unit:'unidad',category:'frutas'},{name:'Lechuga romana',amount:40,unit:'g',category:'verduras'},{name:'Tomate',amount:1,unit:'unidad',category:'verduras'},{name:'Mostaza de Dijon',amount:1,unit:'cucharadita',category:'condimentos'},{name:'Zumo de limón',amount:1,unit:'cucharada',category:'condimentos'}],
    [{step:1,text:'Escurre el atún y mézclalo con el aguacate aplastado y el zumo de limón.'},{step:2,text:'Extiende la mostaza sobre la tortilla.'},{step:3,text:'Coloca la lechuga, el tomate en rodajas y la mezcla de atún.'},{step:4,text:'Enrolla firmemente y corta por la mitad en diagonal.'},{step:5,text:'Sirve inmediatamente o envuelve en papel para llevar.'}]),

  R('Arroz con pollo y verduras', 'comida', 'easy', 15, 35, 4, 480, 36, 52, 12, 4, 'Arroces', 'española', [], ['tradicional','sin_gluten','economica','familiar'], 'arroz_pollo',
    [{name:'Arroz redondo',amount:300,unit:'g',category:'cereales'},{name:'Pechuga de pollo',amount:400,unit:'g',category:'proteinas'},{name:'Pimiento rojo',amount:1,unit:'unidad',category:'verduras'},{name:'Guisantes',amount:100,unit:'g',category:'verduras'},{name:'Caldo de pollo',amount:750,unit:'ml',category:'caldos'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Tomate triturado',amount:150,unit:'g',category:'verduras'},{name:'Azafrán',amount:1,unit:'sobre',category:'especias'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'}],
    [{step:1,text:'Sofríe la cebolla y el pimiento en aceite durante 5 minutos.'},{step:2,text:'Añade el pollo en dados y dóralo por todos lados.'},{step:3,text:'Incorpora el tomate triturado y el azafrán. Sofríe 3 minutos.'},{step:4,text:'Añade el arroz y el caldo caliente. Lleva a ebullición.'},{step:5,text:'Baja el fuego, añade los guisantes y cocina 18 minutos tapado. Reposa 5 minutos.'}]),

  R('Ensalada griega con feta y aceitunas', 'comida', 'easy', 15, 0, 2, 320, 10, 18, 24, 5, 'Ensaladas', 'mediterranea', ['lacteos'], ['vegetariana','sin_gluten','ligera','verano'], 'caprese',
    [{name:'Tomates maduros',amount:300,unit:'g',category:'verduras'},{name:'Pepino',amount:1,unit:'unidad',category:'verduras'},{name:'Cebolla roja',amount:0.5,unit:'unidad',category:'verduras'},{name:'Pimiento verde',amount:1,unit:'unidad',category:'verduras'},{name:'Queso feta',amount:150,unit:'g',category:'lacteos'},{name:'Aceitunas kalamata',amount:80,unit:'g',category:'verduras'},{name:'Aceite de oliva',amount:3,unit:'cucharadas',category:'grasas'},{name:'Orégano seco',amount:1,unit:'cucharadita',category:'especias'},{name:'Vinagre de vino tinto',amount:1,unit:'cucharada',category:'condimentos'}],
    [{step:1,text:'Corta los tomates en gajos, el pepino en rodajas y la cebolla en aros finos.'},{step:2,text:'Corta el pimiento en tiras.'},{step:3,text:'Mezcla todas las verduras en un bol amplio.'},{step:4,text:'Añade las aceitunas y el queso feta en dados grandes.'},{step:5,text:'Aliña con aceite de oliva, vinagre, orégano y sal. Sirve inmediatamente.'}]),

  R('Falafel con salsa de yogur y pita', 'comida', 'medium', 20, 15, 3, 440, 18, 56, 16, 10, 'Legumbres', 'mediterranea', ['gluten','lacteos','sesamo'], ['vegetariana','proteina_vegetal','especiado'], 'falafel',
    [{name:'Garbanzos secos remojados',amount:300,unit:'g',category:'legumbres'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Ajo',amount:3,unit:'dientes',category:'verduras'},{name:'Perejil fresco',amount:20,unit:'g',category:'hierbas'},{name:'Cilantro fresco',amount:20,unit:'g',category:'hierbas'},{name:'Comino',amount:1,unit:'cucharadita',category:'especias'},{name:'Yogur natural',amount:150,unit:'g',category:'lacteos'},{name:'Pan de pita integral',amount:3,unit:'unidades',category:'cereales'},{name:'Tahini',amount:2,unit:'cucharadas',category:'semillas'}],
    [{step:1,text:'Tritura los garbanzos remojados (sin cocer) con la cebolla, el ajo, el perejil, el cilantro y el comino.'},{step:2,text:'Forma bolitas y refrigera 30 minutos.'},{step:3,text:'Fríe en aceite caliente 3-4 minutos hasta que estén dorados, o hornea a 200°C 20 minutos.'},{step:4,text:'Para la salsa: mezcla el yogur con el tahini, zumo de limón y sal.'},{step:5,text:'Sirve en pan de pita con la salsa de yogur y vegetales frescos.'}]),

  R('Burritos de pollo y frijoles', 'comida', 'medium', 20, 20, 2, 560, 38, 62, 16, 12, 'Carnes', 'mexicana', ['gluten','lacteos'], ['mexicana','proteica','especiado','festivo'], 'burritos',
    [{name:'Tortillas de trigo grandes',amount:2,unit:'unidades',category:'cereales'},{name:'Pechuga de pollo',amount:300,unit:'g',category:'proteinas'},{name:'Frijoles negros',amount:200,unit:'g',category:'legumbres'},{name:'Arroz cocido',amount:150,unit:'g',category:'cereales'},{name:'Queso cheddar rallado',amount:60,unit:'g',category:'lacteos'},{name:'Pimiento rojo',amount:1,unit:'unidad',category:'verduras'},{name:'Cebolla',amount:0.5,unit:'unidad',category:'verduras'},{name:'Comino',amount:1,unit:'cucharadita',category:'especias'},{name:'Crema agria',amount:50,unit:'g',category:'lacteos'}],
    [{step:1,text:'Sazona el pollo con comino, sal y pimienta. Cocina a la plancha y córtalo en tiras.'},{step:2,text:'Saltea el pimiento y la cebolla hasta que estén tiernos.'},{step:3,text:'Calienta los frijoles negros con un poco de comino.'},{step:4,text:'Calienta las tortillas y coloca el arroz, los frijoles, el pollo y las verduras.'},{step:5,text:'Añade el queso y la crema agria. Enrolla firmemente y sirve.'}]),

  R('Poke bowl de salmón y arroz', 'comida', 'medium', 20, 20, 2, 520, 32, 58, 18, 4, 'Bowls', 'asiatica', ['pescado','sesamo','soja'], ['omega3','sin_gluten','colorido','saludable'], 'poke',
    [{name:'Salmón fresco',amount:250,unit:'g',category:'proteinas'},{name:'Arroz para sushi',amount:200,unit:'g',category:'cereales'},{name:'Aguacate',amount:1,unit:'unidad',category:'frutas'},{name:'Pepino',amount:0.5,unit:'unidad',category:'verduras'},{name:'Edamame',amount:80,unit:'g',category:'legumbres'},{name:'Salsa de soja',amount:2,unit:'cucharadas',category:'condimentos'},{name:'Aceite de sésamo',amount:1,unit:'cucharadita',category:'grasas'},{name:'Semillas de sésamo',amount:1,unit:'cucharada',category:'semillas'},{name:'Jengibre encurtido',amount:20,unit:'g',category:'condimentos'}],
    [{step:1,text:'Cuece el arroz para sushi según las instrucciones. Sazona con vinagre de arroz y azúcar.'},{step:2,text:'Corta el salmón fresco en dados de 2 cm. Marina con salsa de soja y aceite de sésamo 10 minutos.'},{step:3,text:'Corta el aguacate y el pepino en rodajas.'},{step:4,text:'Monta el bowl: arroz en la base, salmón marinado, aguacate, pepino y edamame.'},{step:5,text:'Decora con semillas de sésamo y jengibre encurtido.'}]),

  R('Ceviche de gambas con aguacate', 'comida', 'medium', 20, 0, 2, 280, 24, 18, 12, 5, 'Pescados', 'latinoamericana', ['marisco'], ['sin_gluten','ligero','fresco','verano'], 'ceviche',
    [{name:'Gambas cocidas',amount:300,unit:'g',category:'proteinas'},{name:'Aguacate',amount:1,unit:'unidad',category:'frutas'},{name:'Tomate',amount:2,unit:'unidades',category:'verduras'},{name:'Cebolla roja',amount:0.5,unit:'unidad',category:'verduras'},{name:'Cilantro fresco',amount:15,unit:'g',category:'hierbas'},{name:'Lima',amount:3,unit:'unidades',category:'frutas'},{name:'Jalapeño',amount:1,unit:'unidad',category:'verduras'},{name:'Sal',amount:1,unit:'al gusto',category:'condimentos'}],
    [{step:1,text:'Corta las gambas en trozos y marina con el zumo de lima durante 15 minutos.'},{step:2,text:'Añade la cebolla roja en juliana fina, el tomate en dados y el jalapeño picado.'},{step:3,text:'Incorpora el cilantro fresco picado.'},{step:4,text:'Añade el aguacate en dados justo antes de servir.'},{step:5,text:'Ajusta sal y sirve inmediatamente con tostadas de maíz.'}]),

  // ═══════════════════════════════════════════════════════════════════════════
  // MERIENDAS
  // ═══════════════════════════════════════════════════════════════════════════
  R('Tarta de queso sin horno con frutos rojos', 'merienda', 'medium', 20, 0, 8, 280, 8, 28, 16, 2, 'Postres', 'americana', ['lacteos','gluten'], ['dulce','sin_coccion','especial'], 'tarta_queso',
    [{name:'Queso crema',amount:400,unit:'g',category:'lacteos'},{name:'Nata para montar',amount:200,unit:'ml',category:'lacteos'},{name:'Azúcar',amount:80,unit:'g',category:'endulzantes'},{name:'Galletas digestive',amount:150,unit:'g',category:'cereales'},{name:'Mantequilla',amount:60,unit:'g',category:'lacteos'},{name:'Fresas',amount:200,unit:'g',category:'frutas'},{name:'Arándanos',amount:100,unit:'g',category:'frutas'},{name:'Gelatina neutra',amount:6,unit:'g',category:'otros'}],
    [{step:1,text:'Tritura las galletas y mézclalas con la mantequilla derretida. Presiona en el fondo del molde y refrigera.'},{step:2,text:'Bate el queso crema con el azúcar hasta que esté suave.'},{step:3,text:'Monta la nata a punto de nieve e incorpórala suavemente.'},{step:4,text:'Disuelve la gelatina en agua caliente y añádela a la mezcla.'},{step:5,text:'Vierte sobre la base de galleta y refrigera 4 horas. Decora con frutos rojos.'}]),

  R('Batido verde energizante', 'merienda', 'easy', 5, 0, 1, 180, 6, 32, 4, 5, 'Batidos', 'americana', [], ['vegano','sin_gluten','vitaminas','detox'], 'batido',
    [{name:'Espinacas baby',amount:60,unit:'g',category:'verduras'},{name:'Plátano',amount:1,unit:'unidad',category:'frutas'},{name:'Manzana verde',amount:1,unit:'unidad',category:'frutas'},{name:'Jengibre fresco',amount:1,unit:'cm',category:'especias'},{name:'Zumo de limón',amount:1,unit:'cucharada',category:'condimentos'},{name:'Agua de coco',amount:200,unit:'ml',category:'bebidas'}],
    [{step:1,text:'Pela y trocea la manzana y el plátano.'},{step:2,text:'Añade todos los ingredientes a la batidora.'},{step:3,text:'Tritura a máxima potencia hasta obtener una textura suave.'},{step:4,text:'Sirve inmediatamente con hielo si lo deseas.'}]),

  R('Manzana asada con canela y nueces', 'merienda', 'easy', 5, 20, 2, 200, 2, 38, 8, 4, 'Postres', 'española', ['frutos_secos'], ['vegano','sin_gluten','sin_azucar','reconfortante'], 'fruta_yogur',
    [{name:'Manzanas',amount:2,unit:'unidades',category:'frutas'},{name:'Canela',amount:1,unit:'cucharadita',category:'especias'},{name:'Nueces',amount:20,unit:'g',category:'frutos_secos'},{name:'Miel',amount:1,unit:'cucharada',category:'endulzantes'},{name:'Mantequilla',amount:10,unit:'g',category:'lacteos'}],
    [{step:1,text:'Precalienta el horno a 180°C.'},{step:2,text:'Vacía el centro de las manzanas con un descorazonador.'},{step:3,text:'Rellena con nueces troceadas, canela y un poco de miel.'},{step:4,text:'Coloca un trocito de mantequilla encima de cada manzana.'},{step:5,text:'Hornea 20 minutos hasta que estén tiernas. Sirve caliente.'}]),

  // ═══════════════════════════════════════════════════════════════════════════
  // CENAS
  // ═══════════════════════════════════════════════════════════════════════════
  R('Tortilla española con ensalada verde', 'cena', 'medium', 20, 30, 4, 340, 16, 28, 18, 3, 'Huevos', 'española', ['huevos'], ['tradicional','española','vegetariana','sin_gluten'], 'tortilla_esp',
    [{name:'Patatas',amount:500,unit:'g',category:'verduras'},{name:'Huevos',amount:6,unit:'unidades',category:'proteinas'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Aceite de oliva',amount:150,unit:'ml',category:'grasas'},{name:'Sal',amount:1,unit:'al gusto',category:'condimentos'},{name:'Lechuga',amount:100,unit:'g',category:'verduras'},{name:'Tomate',amount:1,unit:'unidad',category:'verduras'}],
    [{step:1,text:'Pela y corta las patatas en láminas finas. Pela y pica la cebolla.'},{step:2,text:'Confita las patatas y la cebolla en abundante aceite a fuego bajo durante 20 minutos.'},{step:3,text:'Escurre el aceite y mezcla las patatas con los huevos batidos y sal.'},{step:4,text:'Cuaja la tortilla en una sartén con un poco de aceite, 3 minutos por lado.'},{step:5,text:'Sirve con ensalada verde aliñada con aceite y vinagre.'}]),

  R('Merluza a la plancha con salsa verde', 'cena', 'easy', 10, 12, 2, 280, 38, 6, 10, 1, 'Pescados', 'española', ['pescado','gluten'], ['ligero','proteico','sin_gluten','rapido'], 'merluza',
    [{name:'Filetes de merluza',amount:400,unit:'g',category:'proteinas'},{name:'Ajo',amount:3,unit:'dientes',category:'verduras'},{name:'Perejil fresco',amount:20,unit:'g',category:'hierbas'},{name:'Vino blanco',amount:100,unit:'ml',category:'bebidas'},{name:'Aceite de oliva',amount:3,unit:'cucharadas',category:'grasas'},{name:'Caldo de pescado',amount:100,unit:'ml',category:'caldos'}],
    [{step:1,text:'Sazona los filetes de merluza con sal y pimienta.'},{step:2,text:'Dóralos en una sartén con aceite, 3 minutos por lado. Reserva.'},{step:3,text:'En la misma sartén, sofríe el ajo laminado hasta que esté dorado.'},{step:4,text:'Añade el vino blanco y el caldo. Deja reducir 3 minutos.'},{step:5,text:'Añade el perejil picado y vuelve a colocar el pescado. Cocina 2 minutos más y sirve.'}]),

  R('Crema de calabaza con jengibre', 'cena', 'easy', 15, 35, 4, 180, 4, 24, 8, 4, 'Sopas y cremas', 'española', [], ['vegano','sin_gluten','ligero','reconfortante','antioxidantes'], 'crema_calabaza',
    [{name:'Calabaza',amount:800,unit:'g',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Jengibre fresco',amount:3,unit:'cm',category:'especias'},{name:'Leche de coco',amount:200,unit:'ml',category:'lacteos'},{name:'Caldo de verduras',amount:600,unit:'ml',category:'caldos'},{name:'Semillas de calabaza',amount:30,unit:'g',category:'semillas'}],
    [{step:1,text:'Precalienta el horno a 200°C. Corta la calabaza en trozos y asa 25 minutos con aceite y sal.'},{step:2,text:'Sofríe la cebolla y el jengibre rallado en una olla con aceite.'},{step:3,text:'Añade la calabaza asada y el caldo. Cocina 10 minutos.'},{step:4,text:'Tritura hasta obtener una crema fina. Añade la leche de coco y ajusta la consistencia.'},{step:5,text:'Sirve con semillas de calabaza tostadas y un hilo de aceite de oliva.'}]),

  R('Pisto manchego con huevo frito', 'cena', 'easy', 15, 30, 2, 320, 14, 22, 20, 6, 'Verduras', 'española', ['huevos'], ['vegetariana','tradicional','española','sin_gluten'], 'pisto',
    [{name:'Calabacín',amount:2,unit:'unidades',category:'verduras'},{name:'Pimiento rojo',amount:1,unit:'unidad',category:'verduras'},{name:'Pimiento verde',amount:1,unit:'unidad',category:'verduras'},{name:'Tomates maduros',amount:3,unit:'unidades',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Huevos',amount:2,unit:'unidades',category:'proteinas'},{name:'Aceite de oliva',amount:3,unit:'cucharadas',category:'grasas'}],
    [{step:1,text:'Sofríe la cebolla en aceite durante 5 minutos.'},{step:2,text:'Añade los pimientos cortados en cubos y cocina 10 minutos.'},{step:3,text:'Incorpora el calabacín y cocina 5 minutos más.'},{step:4,text:'Añade los tomates pelados y troceados. Sazona con sal y una pizca de azúcar. Cocina 15 minutos a fuego lento.'},{step:5,text:'Fríe los huevos y colócalos sobre el pisto. Sirve inmediatamente.'}]),

  R('Ensalada caprese con mozzarella fresca', 'cena', 'easy', 10, 0, 2, 280, 16, 8, 20, 2, 'Ensaladas', 'italiana', ['lacteos'], ['vegetariana','italiana','sin_gluten','ligera','verano'], 'caprese',
    [{name:'Tomates de temporada',amount:400,unit:'g',category:'verduras'},{name:'Mozzarella di bufala',amount:250,unit:'g',category:'lacteos'},{name:'Albahaca fresca',amount:15,unit:'hojas',category:'hierbas'},{name:'Aceite de oliva virgen extra',amount:3,unit:'cucharadas',category:'grasas'},{name:'Sal en escamas',amount:1,unit:'al gusto',category:'condimentos'},{name:'Vinagre balsámico',amount:1,unit:'cucharada',category:'condimentos'}],
    [{step:1,text:'Corta los tomates en rodajas de 1 cm de grosor.'},{step:2,text:'Escurre y corta la mozzarella en rodajas similares.'},{step:3,text:'Alterna las rodajas de tomate y mozzarella en el plato.'},{step:4,text:'Coloca las hojas de albahaca entre las rodajas.'},{step:5,text:'Aliña con aceite de oliva, vinagre balsámico, sal en escamas y pimienta negra recién molida.'}]),

  R('Revuelto de gambas y espárragos', 'cena', 'easy', 10, 10, 2, 310, 28, 4, 20, 2, 'Huevos', 'española', ['huevos','marisco'], ['proteico','rapido','sin_gluten','keto'], 'revuelto',
    [{name:'Huevos',amount:4,unit:'unidades',category:'proteinas'},{name:'Gambas peladas',amount:200,unit:'g',category:'proteinas'},{name:'Espárragos trigueros',amount:150,unit:'g',category:'verduras'},{name:'Ajo',amount:2,unit:'dientes',category:'verduras'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Perejil fresco',amount:5,unit:'g',category:'hierbas'}],
    [{step:1,text:'Saltea los espárragos cortados en trozos con ajo laminado en aceite durante 3 minutos.'},{step:2,text:'Añade las gambas y saltea 2 minutos hasta que estén rosadas.'},{step:3,text:'Bate los huevos con sal y pimienta.'},{step:4,text:'Vierte los huevos sobre las gambas y espárragos. Remueve suavemente a fuego bajo.'},{step:5,text:'Retira del fuego cuando estén cremosos. Espolvorea perejil picado y sirve.'}]),

  R('Pollo al limón con alcaparras', 'cena', 'medium', 10, 20, 2, 360, 42, 8, 16, 1, 'Carnes', 'italiana', ['gluten','lacteos'], ['proteico','ligero','italiano','rapido'], 'pollo_limon',
    [{name:'Pechugas de pollo',amount:400,unit:'g',category:'proteinas'},{name:'Limones',amount:2,unit:'unidades',category:'frutas'},{name:'Alcaparras',amount:2,unit:'cucharadas',category:'condimentos'},{name:'Vino blanco',amount:100,unit:'ml',category:'bebidas'},{name:'Caldo de pollo',amount:100,unit:'ml',category:'caldos'},{name:'Mantequilla',amount:20,unit:'g',category:'lacteos'},{name:'Harina',amount:2,unit:'cucharadas',category:'cereales'},{name:'Perejil',amount:10,unit:'g',category:'hierbas'}],
    [{step:1,text:'Aplana las pechugas entre film transparente. Sazona y enharina ligeramente.'},{step:2,text:'Dóralas en mantequilla 3 minutos por lado. Reserva.'},{step:3,text:'En la misma sartén, añade el vino blanco y el caldo. Raspa el fondo.'},{step:4,text:'Añade el zumo de limón y las alcaparras. Reduce 3 minutos.'},{step:5,text:'Vuelve a colocar el pollo en la salsa 2 minutos. Decora con perejil y rodajas de limón.'}]),

  R('Sopa de verduras con fideos', 'cena', 'easy', 15, 25, 4, 220, 8, 38, 4, 5, 'Sopas y cremas', 'española', ['gluten'], ['reconfortante','ligera','economica','invierno'], 'sopa',
    [{name:'Zanahoria',amount:2,unit:'unidades',category:'verduras'},{name:'Puerro',amount:1,unit:'unidad',category:'verduras'},{name:'Apio',amount:2,unit:'tallos',category:'verduras'},{name:'Patata',amount:1,unit:'unidad',category:'verduras'},{name:'Tomate',amount:1,unit:'unidad',category:'verduras'},{name:'Fideos finos',amount:80,unit:'g',category:'cereales'},{name:'Caldo de verduras',amount:1.5,unit:'litros',category:'caldos'}],
    [{step:1,text:'Sofríe el puerro y el apio en aceite durante 5 minutos.'},{step:2,text:'Añade la zanahoria y la patata en cubos. Sofríe 3 minutos.'},{step:3,text:'Incorpora el tomate troceado y el caldo.'},{step:4,text:'Cocina 15 minutos a fuego medio.'},{step:5,text:'Añade los fideos y cocina 5 minutos más. Ajusta sal y sirve.'}]),

  R('Bacalao al pil-pil con patatas', 'cena', 'hard', 20, 30, 2, 420, 38, 28, 18, 3, 'Pescados', 'española', ['pescado'], ['tradicional','española','sin_gluten','proteica'], 'bacalao',
    [{name:'Bacalao desalado',amount:400,unit:'g',category:'proteinas'},{name:'Patatas',amount:300,unit:'g',category:'verduras'},{name:'Ajo',amount:6,unit:'dientes',category:'verduras'},{name:'Aceite de oliva',amount:150,unit:'ml',category:'grasas'},{name:'Guindilla',amount:1,unit:'unidad',category:'especias'},{name:'Perejil',amount:10,unit:'g',category:'hierbas'}],
    [{step:1,text:'Cuece las patatas en rodajas en agua con sal. Reserva.'},{step:2,text:'Confita el ajo laminado en aceite a fuego muy bajo 10 minutos. Retira el ajo y reserva.'},{step:3,text:'En el mismo aceite, cocina el bacalao con la piel hacia arriba a fuego muy bajo 8 minutos.'},{step:4,text:'Retira el bacalao y mueve la cazuela en círculos para emulsionar el aceite con la gelatina del bacalao.'},{step:5,text:'Sirve el bacalao sobre las patatas con la salsa pil-pil y el ajo confitado.'}]),

  R('Crema de brócoli con almendras tostadas', 'cena', 'easy', 10, 25, 4, 200, 10, 18, 10, 6, 'Sopas y cremas', 'española', ['frutos_secos','lacteos'], ['vegano','sin_gluten','ligero','vitaminas'], 'crema_brocoli',
    [{name:'Brócoli',amount:600,unit:'g',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Ajo',amount:2,unit:'dientes',category:'verduras'},{name:'Caldo de verduras',amount:700,unit:'ml',category:'caldos'},{name:'Almendras laminadas',amount:30,unit:'g',category:'frutos_secos'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Leche de avena',amount:100,unit:'ml',category:'lacteos'}],
    [{step:1,text:'Sofríe la cebolla y el ajo en aceite durante 5 minutos.'},{step:2,text:'Añade el brócoli en ramilletes y el caldo. Cocina 15 minutos.'},{step:3,text:'Tritura hasta obtener una crema fina. Añade la leche de avena.'},{step:4,text:'Tuesta las almendras laminadas en una sartén seca hasta que estén doradas.'},{step:5,text:'Sirve la crema con las almendras tostadas y un hilo de aceite de oliva.'}]),

  R('Dorada al horno con limón y hierbas', 'cena', 'easy', 10, 25, 2, 320, 36, 4, 16, 1, 'Pescados', 'mediterranea', ['pescado'], ['sin_gluten','ligero','proteico','saludable'], 'dorada',
    [{name:'Dorada entera',amount:600,unit:'g',category:'proteinas'},{name:'Limón',amount:1,unit:'unidad',category:'frutas'},{name:'Tomillo fresco',amount:3,unit:'ramitas',category:'hierbas'},{name:'Romero fresco',amount:2,unit:'ramitas',category:'hierbas'},{name:'Ajo',amount:3,unit:'dientes',category:'verduras'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Sal y pimienta',amount:1,unit:'al gusto',category:'condimentos'}],
    [{step:1,text:'Precalienta el horno a 200°C.'},{step:2,text:'Haz cortes en el lomo de la dorada y rellena con rodajas de limón, tomillo y romero.'},{step:3,text:'Sazona con sal, pimienta y aceite de oliva.'},{step:4,text:'Coloca en una bandeja con los ajos sin pelar.'},{step:5,text:'Hornea 20-25 minutos hasta que la piel esté crujiente y la carne se separe fácilmente.'}]),

  R('Albóndigas en salsa de tomate', 'cena', 'medium', 20, 30, 4, 420, 28, 28, 18, 4, 'Carnes', 'española', ['gluten','huevos'], ['tradicional','familiar','reconfortante'], 'albondigas',
    [{name:'Carne picada mixta',amount:400,unit:'g',category:'carnes'},{name:'Pan rallado',amount:40,unit:'g',category:'cereales'},{name:'Huevo',amount:1,unit:'unidad',category:'proteinas'},{name:'Ajo',amount:2,unit:'dientes',category:'verduras'},{name:'Perejil',amount:10,unit:'g',category:'hierbas'},{name:'Tomate triturado',amount:400,unit:'g',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Vino blanco',amount:100,unit:'ml',category:'bebidas'}],
    [{step:1,text:'Mezcla la carne picada con el pan rallado, el huevo, el ajo picado, el perejil y sal.'},{step:2,text:'Forma albóndigas del tamaño de una nuez y enharina ligeramente.'},{step:3,text:'Dóralas en aceite por todos lados. Reserva.'},{step:4,text:'En la misma sartén, sofríe la cebolla. Añade el vino blanco y el tomate triturado. Cocina 10 minutos.'},{step:5,text:'Añade las albóndigas a la salsa y cocina 15 minutos a fuego lento.'}]),

  R('Ramen de pollo con huevo marinado', 'cena', 'hard', 30, 45, 2, 520, 32, 62, 14, 4, 'Sopas y cremas', 'asiatica', ['gluten','huevos','soja'], ['asiatico','especiado','reconfortante','invierno'], 'ramen',
    [{name:'Fideos ramen',amount:200,unit:'g',category:'cereales'},{name:'Pechuga de pollo',amount:300,unit:'g',category:'proteinas'},{name:'Huevos',amount:2,unit:'unidades',category:'proteinas'},{name:'Caldo de pollo',amount:1,unit:'litro',category:'caldos'},{name:'Salsa de soja',amount:3,unit:'cucharadas',category:'condimentos'},{name:'Jengibre',amount:2,unit:'cm',category:'especias'},{name:'Ajo',amount:3,unit:'dientes',category:'verduras'},{name:'Cebolleta',amount:2,unit:'unidades',category:'verduras'},{name:'Alga nori',amount:2,unit:'hojas',category:'otros'},{name:'Aceite de sésamo',amount:1,unit:'cucharadita',category:'grasas'}],
    [{step:1,text:'Marina los huevos cocidos 7 minutos en salsa de soja, agua y azúcar durante 2 horas.'},{step:2,text:'Prepara el caldo: cuece el pollo con jengibre, ajo y cebolleta 30 minutos. Sazona con soja y aceite de sésamo.'},{step:3,text:'Cuece los fideos ramen según las instrucciones.'},{step:4,text:'Desmenuza el pollo cocido.'},{step:5,text:'Monta el ramen: fideos en el caldo, pollo desmenuzado, huevo marinado cortado por la mitad y alga nori.'}]),

  R('Pizza integral de verduras y mozzarella', 'cena', 'medium', 20, 15, 2, 480, 20, 62, 16, 6, 'Pizzas', 'italiana', ['gluten','lacteos'], ['italiana','vegetariana','festivo'], 'pizza',
    [{name:'Masa de pizza integral',amount:300,unit:'g',category:'cereales'},{name:'Tomate triturado',amount:150,unit:'g',category:'verduras'},{name:'Mozzarella',amount:150,unit:'g',category:'lacteos'},{name:'Pimiento rojo',amount:0.5,unit:'unidad',category:'verduras'},{name:'Champiñones',amount:100,unit:'g',category:'verduras'},{name:'Cebolla morada',amount:0.5,unit:'unidad',category:'verduras'},{name:'Aceitunas negras',amount:50,unit:'g',category:'verduras'},{name:'Orégano',amount:1,unit:'cucharadita',category:'especias'},{name:'Albahaca fresca',amount:8,unit:'hojas',category:'hierbas'}],
    [{step:1,text:'Precalienta el horno a 250°C con la bandeja dentro.'},{step:2,text:'Extiende la masa de pizza en un círculo fino.'},{step:3,text:'Extiende el tomate triturado sazonado con sal y orégano.'},{step:4,text:'Distribuye la mozzarella en trozos y las verduras cortadas.'},{step:5,text:'Hornea 12-15 minutos hasta que la masa esté crujiente y el queso dorado. Añade albahaca fresca al sacar.'}]),

  R('Espaguetis a la boloñesa', 'cena', 'medium', 15, 40, 4, 560, 30, 68, 18, 5, 'Pastas', 'italiana', ['gluten','lacteos'], ['italiana','tradicional','familiar','reconfortante'], 'espaguetis',
    [{name:'Espaguetis',amount:320,unit:'g',category:'cereales'},{name:'Carne picada de ternera',amount:400,unit:'g',category:'carnes'},{name:'Tomate triturado',amount:400,unit:'g',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Zanahoria',amount:1,unit:'unidad',category:'verduras'},{name:'Apio',amount:1,unit:'tallo',category:'verduras'},{name:'Vino tinto',amount:100,unit:'ml',category:'bebidas'},{name:'Parmesano rallado',amount:40,unit:'g',category:'lacteos'},{name:'Laurel',amount:2,unit:'hojas',category:'hierbas'}],
    [{step:1,text:'Sofríe la cebolla, la zanahoria y el apio picados finos en aceite durante 8 minutos.'},{step:2,text:'Añade la carne picada y dórala bien.'},{step:3,text:'Vierte el vino tinto y deja evaporar 2 minutos.'},{step:4,text:'Añade el tomate triturado y el laurel. Cocina a fuego lento 30 minutos.'},{step:5,text:'Cuece la pasta al dente. Mezcla con la boloñesa y sirve con parmesano rallado.'}]),
];

async function seed() {
  let inserted = 0, skipped = 0, errors = 0;

  for (const r of RECIPES) {
    try {
      const exists = await pool.query('SELECT id FROM recipes WHERE name = $1 LIMIT 1', [r.name]);
      if (exists.rows.length > 0) { skipped++; continue; }

      await pool.query(`
        INSERT INTO recipes (
          "userId", name, "imageUrl", description,
          "preparationTime", "cookTime", servings, difficulty,
          "isPublic", active, "mealTime",
          category, "cuisineType",
          allergens, tags,
          "caloriesPerServing", "proteinsPerServing", "carbsPerServing", "fatsPerServing", "fiberPerServing",
          "ingredientsJson", "instructionsJson",
          "isSeeded", "createdAt", "updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,true,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,true,NOW(),NOW())
      `, [
        ADMIN_USER_ID, r.name, IMG[r.imgKey] || IMG.general, r.name + ' — receta saludable y deliciosa.',
        r.prepTime, r.cookTime, r.servings, r.difficulty,
        r.mealTime, r.category, r.cuisine,
        JSON.stringify(r.allergens), JSON.stringify(r.tags),
        r.cal, r.prot, r.carbs, r.fats, r.fiber,
        JSON.stringify(r.ingredients), JSON.stringify(r.instructions),
      ]);
      console.log(`✅ ${r.name} (${r.mealTime})`);
      inserted++;
    } catch (e) {
      console.error(`❌ ${r.name}: ${e.message}`);
      errors++;
    }
  }
  console.log(`\n📊 Insertadas: ${inserted} | Existentes: ${skipped} | Errores: ${errors} | Total script: ${RECIPES.length}`);
}

seed().then(() => pool.end()).catch(e => { console.error(e); pool.end(); process.exit(1); });
