/**
 * seed-recipes-v3.mjs
 * Segunda tanda: 80+ recetas adicionales de alta calidad
 */
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const ADMIN_USER_ID = 1;

const IMG = {
  ensalada: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  salmon: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
  pasta: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80',
  arroz: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
  pollo: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80',
  curry: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
  sopa: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
  bowl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  batido: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
  huevos: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80',
  tostada: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80',
  porridge: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&q=80',
  carne: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
  pescado: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  verduras: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80',
  legumbres: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  postre: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  wrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
  smoothie: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&q=80',
  granola: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80',
  pancakes: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  quinoa: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  aguacate: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80',
  risotto: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
  tacos: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  stir_fry: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
  general: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
};

const R = (name, mealTime, difficulty, prepTime, cookTime, servings, cal, prot, carbs, fats, fiber, category, cuisine, allergens, tags, imgKey, ingredients, instructions) => ({
  name, mealTime, difficulty, prepTime, cookTime, servings, cal, prot, carbs, fats, fiber, category, cuisine, allergens, tags, imgKey, ingredients, instructions
});

const RECIPES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // DESAYUNOS ADICIONALES
  // ═══════════════════════════════════════════════════════════════════════════
  R('Tostadas con ricotta y miel de abeja', 'desayuno', 'easy', 5, 3, 1, 320, 14, 38, 12, 2, 'Desayunos saludables', 'italiana', ['gluten','lacteos'], ['dulce','proteica','rapida'], 'tostada',
    [{name:'Pan de masa madre',amount:2,unit:'rebanadas',category:'cereales'},{name:'Ricotta',amount:80,unit:'g',category:'lacteos'},{name:'Miel',amount:1,unit:'cucharada',category:'endulzantes'},{name:'Nueces',amount:15,unit:'g',category:'frutos_secos'},{name:'Canela',amount:0.5,unit:'cucharadita',category:'especias'}],
    [{step:1,text:'Tuesta el pan de masa madre hasta que esté dorado.'},{step:2,text:'Extiende la ricotta generosamente sobre cada tostada.'},{step:3,text:'Añade un hilo de miel por encima.'},{step:4,text:'Espolvorea las nueces troceadas y la canela.'},{step:5,text:'Sirve inmediatamente.'}]),

  R('Avena con manzana y canela al microondas', 'desayuno', 'easy', 2, 3, 1, 290, 9, 52, 5, 7, 'Desayunos saludables', 'española', ['gluten'], ['rapida','fibra','sin_azucar','vegana'], 'porridge',
    [{name:'Copos de avena',amount:60,unit:'g',category:'cereales'},{name:'Leche vegetal',amount:200,unit:'ml',category:'lacteos'},{name:'Manzana',amount:0.5,unit:'unidad',category:'frutas'},{name:'Canela',amount:1,unit:'cucharadita',category:'especias'},{name:'Miel',amount:1,unit:'cucharadita',category:'endulzantes'}],
    [{step:1,text:'Mezcla la avena con la leche vegetal en un bol apto para microondas.'},{step:2,text:'Añade la manzana rallada y la canela.'},{step:3,text:'Cocina en el microondas a máxima potencia 2 minutos. Remueve.'},{step:4,text:'Cocina 1 minuto más.'},{step:5,text:'Añade un hilo de miel y sirve.'}]),

  R('Tortitas de espinacas y queso feta', 'desayuno', 'medium', 10, 15, 2, 300, 16, 28, 14, 3, 'Huevos', 'mediterránea', ['gluten','huevos','lacteos'], ['vegetariana','proteica','salada'], 'huevos',
    [{name:'Harina',amount:80,unit:'g',category:'cereales'},{name:'Huevos',amount:2,unit:'unidades',category:'proteinas'},{name:'Espinacas frescas',amount:60,unit:'g',category:'verduras'},{name:'Queso feta',amount:50,unit:'g',category:'lacteos'},{name:'Leche',amount:100,unit:'ml',category:'lacteos'},{name:'Levadura',amount:0.5,unit:'cucharadita',category:'otros'}],
    [{step:1,text:'Tritura las espinacas con la leche y los huevos.'},{step:2,text:'Mezcla con la harina y la levadura hasta obtener una masa sin grumos.'},{step:3,text:'Incorpora el queso feta desmenuzado.'},{step:4,text:'Cocina en sartén antiadherente porciones de masa 2-3 minutos por lado.'},{step:5,text:'Sirve caliente con yogur griego o crema agria.'}]),

  R('Bol de proteínas con frutos rojos', 'desayuno', 'easy', 5, 0, 1, 350, 28, 38, 8, 5, 'Desayunos saludables', 'americana', ['lacteos','frutos_secos'], ['proteica','fitness','post_entreno'], 'smoothie',
    [{name:'Proteína de suero fresa',amount:30,unit:'g',category:'suplementos'},{name:'Yogur griego',amount:150,unit:'g',category:'lacteos'},{name:'Fresas',amount:80,unit:'g',category:'frutas'},{name:'Arándanos',amount:40,unit:'g',category:'frutas'},{name:'Granola',amount:30,unit:'g',category:'cereales'},{name:'Semillas de chía',amount:1,unit:'cucharada',category:'semillas'}],
    [{step:1,text:'Mezcla la proteína en polvo con el yogur griego hasta que esté homogéneo.'},{step:2,text:'Vierte en un bol.'},{step:3,text:'Coloca las fresas cortadas y los arándanos.'},{step:4,text:'Añade la granola y las semillas de chía.'},{step:5,text:'Sirve inmediatamente.'}]),

  R('Tostada de mantequilla de almendras y plátano', 'desayuno', 'easy', 5, 3, 1, 360, 12, 48, 16, 5, 'Desayunos saludables', 'americana', ['gluten','frutos_secos'], ['energia','vegana','rapida'], 'tostada',
    [{name:'Pan integral',amount:2,unit:'rebanadas',category:'cereales'},{name:'Mantequilla de almendras',amount:2,unit:'cucharadas',category:'frutos_secos'},{name:'Plátano',amount:1,unit:'unidad',category:'frutas'},{name:'Semillas de chía',amount:1,unit:'cucharadita',category:'semillas'},{name:'Canela',amount:0.5,unit:'cucharadita',category:'especias'}],
    [{step:1,text:'Tuesta el pan integral.'},{step:2,text:'Extiende la mantequilla de almendras sobre cada rebanada.'},{step:3,text:'Coloca el plátano en rodajas.'},{step:4,text:'Espolvorea las semillas de chía y la canela.'},{step:5,text:'Sirve inmediatamente.'}]),

  R('Huevos benedictinos con espinacas', 'desayuno', 'hard', 20, 15, 2, 480, 24, 28, 28, 3, 'Huevos', 'americana', ['huevos','gluten','lacteos'], ['especial','fin_de_semana','brunch'], 'huevos',
    [{name:'Muffins ingleses',amount:2,unit:'unidades',category:'cereales'},{name:'Huevos',amount:4,unit:'unidades',category:'proteinas'},{name:'Espinacas baby',amount:60,unit:'g',category:'verduras'},{name:'Yemas de huevo',amount:2,unit:'unidades',category:'proteinas'},{name:'Mantequilla',amount:80,unit:'g',category:'lacteos'},{name:'Zumo de limón',amount:1,unit:'cucharada',category:'condimentos'}],
    [{step:1,text:'Para la salsa holandesa: bate las yemas con el zumo de limón al baño maría hasta que espesen. Añade la mantequilla derretida poco a poco sin dejar de batir.'},{step:2,text:'Saltea las espinacas con ajo y sal. Reserva.'},{step:3,text:'Pocha los huevos en agua con vinagre 3 minutos.'},{step:4,text:'Tuesta los muffins ingleses.'},{step:5,text:'Monta: muffin, espinacas, huevo pochado y salsa holandesa.'}]),

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIA MAÑANA ADICIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  R('Dátiles rellenos de queso crema y nueces', 'media_manana', 'easy', 10, 0, 2, 200, 4, 30, 8, 3, 'Snacks saludables', 'mediterranea', ['lacteos','frutos_secos'], ['dulce','sin_gluten','energia','rapido'], 'postre',
    [{name:'Dátiles medjool',amount:8,unit:'unidades',category:'frutas'},{name:'Queso crema',amount:40,unit:'g',category:'lacteos'},{name:'Nueces',amount:20,unit:'g',category:'frutos_secos'},{name:'Canela',amount:0.5,unit:'cucharadita',category:'especias'}],
    [{step:1,text:'Abre los dátiles por la mitad y retira el hueso.'},{step:2,text:'Rellena cada dátil con media cucharadita de queso crema.'},{step:3,text:'Coloca un trozo de nuez encima.'},{step:4,text:'Espolvorea canela y sirve.'}]),

  R('Edamame con sal marina', 'media_manana', 'easy', 2, 5, 2, 150, 12, 12, 5, 5, 'Snacks saludables', 'asiatica', ['soja'], ['vegano','sin_gluten','proteina_vegetal','rapido'], 'legumbres',
    [{name:'Edamame congelado',amount:200,unit:'g',category:'legumbres'},{name:'Sal marina en escamas',amount:1,unit:'al gusto',category:'condimentos'},{name:'Aceite de sésamo',amount:0.5,unit:'cucharadita',category:'grasas'}],
    [{step:1,text:'Cuece el edamame en agua hirviendo con sal durante 5 minutos.'},{step:2,text:'Escurre y coloca en un bol.'},{step:3,text:'Añade unas gotas de aceite de sésamo y sal marina en escamas.'},{step:4,text:'Sirve caliente o a temperatura ambiente.'}]),

  R('Rollitos de jamón serrano y melón', 'media_manana', 'easy', 10, 0, 2, 160, 14, 12, 6, 1, 'Snacks saludables', 'española', [], ['sin_gluten','tradicional','verano','rapido'], 'general',
    [{name:'Jamón serrano',amount:80,unit:'g',category:'proteinas'},{name:'Melón',amount:200,unit:'g',category:'frutas'},{name:'Menta fresca',amount:5,unit:'hojas',category:'hierbas'}],
    [{step:1,text:'Corta el melón en tiras o bolas.'},{step:2,text:'Envuelve cada trozo de melón con una loncha de jamón serrano.'},{step:3,text:'Pincha con un palillo y decora con hojas de menta.'},{step:4,text:'Sirve frío.'}]),

  R('Galletas de avena y plátano sin azúcar', 'media_manana', 'easy', 10, 15, 12, 80, 2, 14, 2, 2, 'Snacks saludables', 'americana', ['gluten'], ['sin_azucar','vegana','fitness','para_llevar'], 'granola',
    [{name:'Copos de avena',amount:200,unit:'g',category:'cereales'},{name:'Plátanos maduros',amount:2,unit:'unidades',category:'frutas'},{name:'Canela',amount:1,unit:'cucharadita',category:'especias'},{name:'Extracto de vainilla',amount:1,unit:'cucharadita',category:'condimentos'},{name:'Pepitas de chocolate negro',amount:30,unit:'g',category:'otros'}],
    [{step:1,text:'Precalienta el horno a 175°C.'},{step:2,text:'Aplasta los plátanos hasta hacer un puré.'},{step:3,text:'Mezcla con la avena, la canela y la vainilla.'},{step:4,text:'Incorpora las pepitas de chocolate.'},{step:5,text:'Forma galletas y hornea 12-15 minutos hasta que estén doradas.'}]),

  // ═══════════════════════════════════════════════════════════════════════════
  // COMIDAS ADICIONALES
  // ═══════════════════════════════════════════════════════════════════════════
  R('Ensalada de garbanzos con verduras asadas', 'comida', 'easy', 15, 25, 2, 380, 16, 48, 14, 12, 'Ensaladas', 'mediterranea', ['sesamo'], ['vegana','sin_gluten','fibra','proteina_vegetal'], 'ensalada',
    [{name:'Garbanzos cocidos',amount:300,unit:'g',category:'legumbres'},{name:'Pimiento rojo',amount:1,unit:'unidad',category:'verduras'},{name:'Calabacín',amount:1,unit:'unidad',category:'verduras'},{name:'Cebolla roja',amount:0.5,unit:'unidad',category:'verduras'},{name:'Espinacas',amount:60,unit:'g',category:'verduras'},{name:'Tahini',amount:2,unit:'cucharadas',category:'semillas'},{name:'Zumo de limón',amount:2,unit:'cucharadas',category:'condimentos'},{name:'Comino',amount:1,unit:'cucharadita',category:'especias'}],
    [{step:1,text:'Asa el pimiento, el calabacín y la cebolla con aceite a 200°C durante 20 minutos.'},{step:2,text:'Mezcla el tahini con el zumo de limón, el comino y agua para hacer el aliño.'},{step:3,text:'Mezcla los garbanzos con las verduras asadas y las espinacas.'},{step:4,text:'Aliña con la salsa de tahini.'},{step:5,text:'Sirve a temperatura ambiente.'}]),

  R('Fideos soba con verduras y salsa de sésamo', 'comida', 'medium', 15, 10, 2, 420, 16, 62, 12, 5, 'Pastas', 'asiatica', ['gluten','soja','sesamo'], ['asiatica','vegana','rapida'], 'pasta',
    [{name:'Fideos soba',amount:200,unit:'g',category:'cereales'},{name:'Zanahoria',amount:1,unit:'unidad',category:'verduras'},{name:'Pepino',amount:0.5,unit:'unidad',category:'verduras'},{name:'Edamame',amount:80,unit:'g',category:'legumbres'},{name:'Cebolleta',amount:2,unit:'unidades',category:'verduras'},{name:'Salsa de soja',amount:3,unit:'cucharadas',category:'condimentos'},{name:'Aceite de sésamo',amount:2,unit:'cucharadas',category:'grasas'},{name:'Jengibre rallado',amount:1,unit:'cucharadita',category:'especias'},{name:'Semillas de sésamo',amount:1,unit:'cucharada',category:'semillas'}],
    [{step:1,text:'Cuece los fideos soba según las instrucciones. Enfría bajo agua fría.'},{step:2,text:'Prepara el aliño: mezcla la salsa de soja, el aceite de sésamo y el jengibre.'},{step:3,text:'Corta la zanahoria y el pepino en juliana.'},{step:4,text:'Mezcla los fideos con las verduras y el edamame.'},{step:5,text:'Aliña con la salsa y decora con semillas de sésamo y cebolleta picada.'}]),

  R('Hamburguesa de lentejas con boniato', 'comida', 'medium', 20, 25, 2, 440, 18, 62, 12, 14, 'Legumbres', 'americana', ['gluten','huevos'], ['vegana','proteina_vegetal','fibra','saludable'], 'legumbres',
    [{name:'Lentejas cocidas',amount:250,unit:'g',category:'legumbres'},{name:'Boniato',amount:150,unit:'g',category:'verduras'},{name:'Cebolla',amount:0.5,unit:'unidad',category:'verduras'},{name:'Ajo',amount:2,unit:'dientes',category:'verduras'},{name:'Comino',amount:1,unit:'cucharadita',category:'especias'},{name:'Pan rallado',amount:30,unit:'g',category:'cereales'},{name:'Pan integral',amount:2,unit:'unidades',category:'cereales'},{name:'Lechuga',amount:2,unit:'hojas',category:'verduras'},{name:'Tomate',amount:1,unit:'unidad',category:'verduras'}],
    [{step:1,text:'Cuece el boniato al vapor 15 minutos. Aplasta junto con las lentejas.'},{step:2,text:'Sofríe la cebolla y el ajo. Añade a la mezcla con el comino y el pan rallado.'},{step:3,text:'Forma hamburguesas y refrigera 30 minutos.'},{step:4,text:'Cocina en sartén con aceite 4 minutos por lado.'},{step:5,text:'Sirve en pan integral con lechuga y tomate.'}]),

  R('Lubina al vapor con jengibre y soja', 'comida', 'medium', 10, 15, 2, 280, 38, 6, 10, 1, 'Pescados', 'asiatica', ['pescado','soja'], ['sin_gluten','ligero','proteico','asiatico'], 'pescado',
    [{name:'Lubina entera',amount:600,unit:'g',category:'proteinas'},{name:'Jengibre fresco',amount:3,unit:'cm',category:'especias'},{name:'Salsa de soja',amount:3,unit:'cucharadas',category:'condimentos'},{name:'Aceite de sésamo',amount:1,unit:'cucharada',category:'grasas'},{name:'Cebolleta',amount:2,unit:'unidades',category:'verduras'},{name:'Cilantro fresco',amount:10,unit:'g',category:'hierbas'}],
    [{step:1,text:'Limpia la lubina y haz cortes en el lomo.'},{step:2,text:'Rellena los cortes con rodajas de jengibre.'},{step:3,text:'Cuece al vapor 12-15 minutos.'},{step:4,text:'Calienta la salsa de soja con el aceite de sésamo.'},{step:5,text:'Sirve la lubina con la salsa caliente por encima, cebolleta y cilantro.'}]),

  R('Lasaña de verduras y ricotta', 'comida', 'hard', 30, 45, 6, 420, 20, 48, 16, 5, 'Pastas', 'italiana', ['gluten','lacteos','huevos'], ['italiana','vegetariana','especial','familiar'], 'pasta',
    [{name:'Placas de lasaña',amount:12,unit:'unidades',category:'cereales'},{name:'Ricotta',amount:250,unit:'g',category:'lacteos'},{name:'Espinacas',amount:200,unit:'g',category:'verduras'},{name:'Calabacín',amount:2,unit:'unidades',category:'verduras'},{name:'Tomate triturado',amount:400,unit:'g',category:'verduras'},{name:'Mozzarella',amount:150,unit:'g',category:'lacteos'},{name:'Parmesano',amount:50,unit:'g',category:'lacteos'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Ajo',amount:2,unit:'dientes',category:'verduras'}],
    [{step:1,text:'Sofríe la cebolla y el ajo. Añade el tomate triturado y cocina 15 minutos para la salsa.'},{step:2,text:'Saltea el calabacín y las espinacas. Mezcla con la ricotta y sazona.'},{step:3,text:'Cuece las placas de lasaña según instrucciones.'},{step:4,text:'Monta capas: salsa, placas, relleno de verduras, salsa, placas... Termina con salsa y mozzarella.'},{step:5,text:'Hornea a 180°C durante 35 minutos. Gratina 5 minutos más.'}]),

  R('Pollo tikka masala', 'comida', 'medium', 20, 35, 3, 480, 38, 36, 18, 4, 'Carnes', 'asiatica', ['lacteos'], ['asiatico','especiado','sin_gluten','reconfortante'], 'curry',
    [{name:'Pechuga de pollo',amount:500,unit:'g',category:'proteinas'},{name:'Yogur natural',amount:150,unit:'g',category:'lacteos'},{name:'Tomate triturado',amount:400,unit:'g',category:'verduras'},{name:'Nata',amount:100,unit:'ml',category:'lacteos'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Ajo',amount:3,unit:'dientes',category:'verduras'},{name:'Jengibre',amount:2,unit:'cm',category:'especias'},{name:'Garam masala',amount:2,unit:'cucharadas',category:'especias'},{name:'Cúrcuma',amount:1,unit:'cucharadita',category:'especias'},{name:'Arroz basmati',amount:200,unit:'g',category:'cereales'}],
    [{step:1,text:'Marina el pollo con yogur, garam masala y cúrcuma durante 1 hora mínimo.'},{step:2,text:'Asa el pollo marinado en el horno a 220°C durante 15 minutos.'},{step:3,text:'Sofríe la cebolla, el ajo y el jengibre. Añade el tomate y cocina 10 minutos.'},{step:4,text:'Añade la nata y el pollo asado. Cocina 10 minutos más.'},{step:5,text:'Sirve con arroz basmati y pan naan.'}]),

  R('Ensalada de pasta con atún y verduras', 'comida', 'easy', 15, 10, 3, 420, 24, 52, 12, 4, 'Ensaladas', 'mediterránea', ['gluten','pescado'], ['rapida','proteica','para_llevar','verano'], 'ensalada',
    [{name:'Pasta fusilli',amount:200,unit:'g',category:'cereales'},{name:'Atún en aceite',amount:160,unit:'g',category:'proteinas'},{name:'Tomates cherry',amount:150,unit:'g',category:'verduras'},{name:'Pimiento verde',amount:1,unit:'unidad',category:'verduras'},{name:'Aceitunas',amount:60,unit:'g',category:'verduras'},{name:'Cebolla roja',amount:0.25,unit:'unidad',category:'verduras'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Vinagre de vino',amount:1,unit:'cucharada',category:'condimentos'}],
    [{step:1,text:'Cuece la pasta al dente. Enfría bajo agua fría.'},{step:2,text:'Escurre el atún y desmenuza.'},{step:3,text:'Corta los tomates cherry por la mitad, el pimiento en dados y la cebolla en juliana fina.'},{step:4,text:'Mezcla todos los ingredientes.'},{step:5,text:'Aliña con aceite de oliva, vinagre, sal y pimienta. Refrigera 30 minutos antes de servir.'}]),

  R('Salmón teriyaki con arroz integral', 'comida', 'medium', 10, 20, 2, 520, 38, 52, 16, 3, 'Pescados', 'asiatica', ['pescado','soja'], ['asiatico','omega3','sin_gluten'], 'salmon',
    [{name:'Lomo de salmón',amount:400,unit:'g',category:'proteinas'},{name:'Salsa de soja',amount:3,unit:'cucharadas',category:'condimentos'},{name:'Miel',amount:2,unit:'cucharadas',category:'endulzantes'},{name:'Ajo',amount:2,unit:'dientes',category:'verduras'},{name:'Jengibre',amount:1,unit:'cm',category:'especias'},{name:'Aceite de sésamo',amount:1,unit:'cucharadita',category:'grasas'},{name:'Arroz integral',amount:200,unit:'g',category:'cereales'},{name:'Brócoli',amount:150,unit:'g',category:'verduras'}],
    [{step:1,text:'Prepara la salsa teriyaki: mezcla la soja, la miel, el ajo picado, el jengibre y el aceite de sésamo.'},{step:2,text:'Marina el salmón en la salsa 15 minutos.'},{step:3,text:'Cuece el arroz integral y el brócoli al vapor.'},{step:4,text:'Cocina el salmón en una sartén caliente 4 minutos por lado. Añade el resto de la marinada y glasa.'},{step:5,text:'Sirve con el arroz y el brócoli.'}]),

  R('Gazpacho de remolacha y naranja', 'comida', 'easy', 15, 0, 4, 110, 3, 18, 3, 4, 'Sopas y cremas', 'española', [], ['vegano','sin_gluten','antioxidantes','verano','ligero'], 'sopa',
    [{name:'Remolacha cocida',amount:400,unit:'g',category:'verduras'},{name:'Naranja',amount:1,unit:'unidad',category:'frutas'},{name:'Pepino',amount:0.5,unit:'unidad',category:'verduras'},{name:'Vinagre de manzana',amount:1,unit:'cucharada',category:'condimentos'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Yogur griego',amount:2,unit:'cucharadas',category:'lacteos'}],
    [{step:1,text:'Tritura la remolacha con el zumo de naranja, el pepino y el vinagre.'},{step:2,text:'Añade el aceite de oliva y tritura hasta obtener una textura fina.'},{step:3,text:'Sazona con sal y pimienta. Refrigera al menos 1 hora.'},{step:4,text:'Sirve con una cucharada de yogur griego y un hilo de aceite de oliva.'}]),

  R('Costillas de cerdo al horno con miel y mostaza', 'comida', 'medium', 15, 90, 4, 580, 42, 18, 36, 1, 'Carnes', 'americana', [], ['sin_gluten','especial','festivo','fin_de_semana'], 'carne',
    [{name:'Costillas de cerdo',amount:1.2,unit:'kg',category:'carnes'},{name:'Miel',amount:3,unit:'cucharadas',category:'endulzantes'},{name:'Mostaza de Dijon',amount:2,unit:'cucharadas',category:'condimentos'},{name:'Ajo en polvo',amount:1,unit:'cucharadita',category:'especias'},{name:'Pimentón ahumado',amount:1,unit:'cucharadita',category:'especias'},{name:'Vinagre de manzana',amount:2,unit:'cucharadas',category:'condimentos'}],
    [{step:1,text:'Precalienta el horno a 150°C.'},{step:2,text:'Mezcla la miel, la mostaza, el ajo en polvo, el pimentón y el vinagre.'},{step:3,text:'Unta las costillas con la mitad de la salsa. Envuelve en papel de aluminio.'},{step:4,text:'Hornea 1 hora y 30 minutos.'},{step:5,text:'Destapa, unta con el resto de la salsa y sube a 220°C 15 minutos para glasear.'}]),

  R('Musaka griega de berenjenas', 'comida', 'hard', 30, 60, 6, 480, 24, 28, 28, 5, 'Carnes', 'griega', ['gluten','lacteos','huevos'], ['griega','especial','familiar','reconfortante'], 'carne',
    [{name:'Berenjenas',amount:3,unit:'unidades',category:'verduras'},{name:'Carne picada de cordero',amount:400,unit:'g',category:'carnes'},{name:'Tomate triturado',amount:300,unit:'g',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Canela',amount:1,unit:'cucharadita',category:'especias'},{name:'Leche',amount:500,unit:'ml',category:'lacteos'},{name:'Mantequilla',amount:40,unit:'g',category:'lacteos'},{name:'Harina',amount:40,unit:'g',category:'cereales'},{name:'Queso kefalotyri',amount:80,unit:'g',category:'lacteos'}],
    [{step:1,text:'Corta las berenjenas en rodajas, sala y deja reposar 30 minutos. Asa en el horno.'},{step:2,text:'Sofríe la cebolla y la carne. Añade el tomate y la canela. Cocina 15 minutos.'},{step:3,text:'Prepara la bechamel: derrite la mantequilla, añade la harina y luego la leche caliente. Remueve hasta espesar.'},{step:4,text:'Monta capas: berenjenas, carne, berenjenas, bechamel. Espolvorea queso.'},{step:5,text:'Hornea a 180°C durante 45 minutos hasta que esté dorado.'}]),

  R('Tacos de pescado con col y limón', 'comida', 'medium', 20, 15, 2, 380, 28, 42, 12, 5, 'Pescados', 'mexicana', ['gluten','pescado'], ['mexicana','ligero','verano'], 'tacos',
    [{name:'Filetes de merluza',amount:300,unit:'g',category:'proteinas'},{name:'Tortillas de maíz',amount:6,unit:'unidades',category:'cereales'},{name:'Col lombarda',amount:100,unit:'g',category:'verduras'},{name:'Lima',amount:2,unit:'unidades',category:'frutas'},{name:'Cilantro',amount:15,unit:'g',category:'hierbas'},{name:'Crema agria',amount:50,unit:'g',category:'lacteos'},{name:'Jalapeño',amount:1,unit:'unidad',category:'verduras'},{name:'Comino',amount:1,unit:'cucharadita',category:'especias'}],
    [{step:1,text:'Sazona el pescado con comino, sal y pimienta. Cocina a la plancha 3-4 minutos por lado.'},{step:2,text:'Prepara el coleslaw: mezcla la col lombarda con zumo de lima, sal y cilantro.'},{step:3,text:'Mezcla la crema agria con zumo de lima y jalapeño picado.'},{step:4,text:'Calienta las tortillas.'},{step:5,text:'Monta los tacos: tortilla, pescado, coleslaw y salsa de crema.'}]),

  R('Risotto de espárragos y limón', 'comida', 'hard', 10, 30, 2, 480, 14, 72, 16, 4, 'Arroces', 'italiana', ['lacteos','gluten'], ['italiana','vegetariana','primavera','especial'], 'risotto',
    [{name:'Arroz arborio',amount:200,unit:'g',category:'cereales'},{name:'Espárragos verdes',amount:200,unit:'g',category:'verduras'},{name:'Caldo de verduras caliente',amount:800,unit:'ml',category:'caldos'},{name:'Vino blanco',amount:100,unit:'ml',category:'bebidas'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Mantequilla',amount:40,unit:'g',category:'lacteos'},{name:'Parmesano',amount:60,unit:'g',category:'lacteos'},{name:'Limón',amount:1,unit:'unidad',category:'frutas'}],
    [{step:1,text:'Corta los espárragos en trozos. Blanquea las puntas 2 minutos. Tritura los tallos con un poco de caldo.'},{step:2,text:'Sofríe la cebolla en mantequilla. Añade el arroz y tuesta 2 minutos.'},{step:3,text:'Vierte el vino y deja evaporar. Añade el caldo cazo a cazo removiendo constantemente.'},{step:4,text:'A los 15 minutos, añade el puré de espárragos y las puntas.'},{step:5,text:'Retira del fuego. Añade mantequilla, parmesano y ralladura de limón. Remueve vigorosamente.'}]),

  R('Pollo al curry verde tailandés', 'comida', 'medium', 15, 25, 3, 460, 36, 32, 20, 4, 'Carnes', 'asiatica', ['lacteos'], ['asiatico','especiado','sin_gluten','exotico'], 'curry',
    [{name:'Pechuga de pollo',amount:500,unit:'g',category:'proteinas'},{name:'Leche de coco',amount:400,unit:'ml',category:'lacteos'},{name:'Pasta de curry verde',amount:2,unit:'cucharadas',category:'condimentos'},{name:'Pimiento verde',amount:1,unit:'unidad',category:'verduras'},{name:'Berenjena tailandesa',amount:150,unit:'g',category:'verduras'},{name:'Albahaca tailandesa',amount:10,unit:'hojas',category:'hierbas'},{name:'Salsa de pescado',amount:2,unit:'cucharadas',category:'condimentos'},{name:'Arroz jazmín',amount:200,unit:'g',category:'cereales'}],
    [{step:1,text:'Sofríe la pasta de curry verde en un poco de aceite 1 minuto.'},{step:2,text:'Añade la leche de coco y lleva a ebullición.'},{step:3,text:'Incorpora el pollo en dados y cocina 10 minutos.'},{step:4,text:'Añade el pimiento, la berenjena y la salsa de pescado. Cocina 10 minutos más.'},{step:5,text:'Añade la albahaca tailandesa y sirve con arroz jazmín.'}]),

  R('Ensalada de rúcula con pera y gorgonzola', 'comida', 'easy', 10, 0, 2, 320, 10, 28, 20, 3, 'Ensaladas', 'italiana', ['lacteos','frutos_secos'], ['vegetariana','italiana','elegante','sin_gluten'], 'ensalada',
    [{name:'Rúcula',amount:80,unit:'g',category:'verduras'},{name:'Pera conferencia',amount:1,unit:'unidad',category:'frutas'},{name:'Gorgonzola',amount:60,unit:'g',category:'lacteos'},{name:'Nueces',amount:30,unit:'g',category:'frutos_secos'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Vinagre balsámico',amount:1,unit:'cucharada',category:'condimentos'},{name:'Miel',amount:1,unit:'cucharadita',category:'endulzantes'}],
    [{step:1,text:'Lava y seca la rúcula.'},{step:2,text:'Corta la pera en láminas finas.'},{step:3,text:'Tuesta las nueces en una sartén seca 3 minutos.'},{step:4,text:'Prepara el aliño: mezcla el aceite, el vinagre balsámico y la miel.'},{step:5,text:'Monta la ensalada con la rúcula, la pera, el gorgonzola desmenuzado y las nueces. Aliña y sirve.'}]),

  R('Goulash húngaro de ternera', 'comida', 'medium', 20, 90, 4, 480, 36, 28, 22, 4, 'Carnes', 'europea', ['gluten'], ['reconfortante','invierno','especiado','tradicional'], 'carne',
    [{name:'Ternera para guisar',amount:600,unit:'g',category:'carnes'},{name:'Cebolla',amount:2,unit:'unidades',category:'verduras'},{name:'Pimiento rojo',amount:2,unit:'unidades',category:'verduras'},{name:'Tomate triturado',amount:200,unit:'g',category:'verduras'},{name:'Pimentón dulce húngaro',amount:3,unit:'cucharadas',category:'especias'},{name:'Caldo de carne',amount:500,unit:'ml',category:'caldos'},{name:'Patatas',amount:300,unit:'g',category:'verduras'},{name:'Comino',amount:1,unit:'cucharadita',category:'especias'}],
    [{step:1,text:'Dora la ternera en dados en aceite por todos lados. Reserva.'},{step:2,text:'Sofríe la cebolla y el pimiento hasta que estén tiernos.'},{step:3,text:'Añade el pimentón y el comino. Sofríe 1 minuto.'},{step:4,text:'Incorpora la carne, el tomate y el caldo. Cocina a fuego lento 60 minutos.'},{step:5,text:'Añade las patatas en cubos y cocina 20 minutos más. Sirve con pan o pasta.'}]),

  R('Stir fry de tofu y verduras', 'comida', 'medium', 15, 15, 2, 320, 18, 28, 16, 6, 'Legumbres', 'asiatica', ['soja','sesamo'], ['vegano','sin_gluten','proteina_vegetal','asiatico'], 'stir_fry',
    [{name:'Tofu firme',amount:300,unit:'g',category:'proteinas'},{name:'Brócoli',amount:150,unit:'g',category:'verduras'},{name:'Zanahoria',amount:1,unit:'unidad',category:'verduras'},{name:'Pimiento rojo',amount:1,unit:'unidad',category:'verduras'},{name:'Champiñones',amount:100,unit:'g',category:'verduras'},{name:'Salsa de soja',amount:3,unit:'cucharadas',category:'condimentos'},{name:'Aceite de sésamo',amount:2,unit:'cucharadas',category:'grasas'},{name:'Ajo',amount:2,unit:'dientes',category:'verduras'},{name:'Jengibre',amount:1,unit:'cm',category:'especias'}],
    [{step:1,text:'Prensa el tofu para eliminar el exceso de agua. Córtalo en dados y dóralo en aceite hasta que esté crujiente.'},{step:2,text:'Retira el tofu y en el mismo wok sofríe el ajo y el jengibre.'},{step:3,text:'Añade las verduras más duras primero (zanahoria, brócoli) y luego las más blandas.'},{step:4,text:'Añade la salsa de soja y el aceite de sésamo.'},{step:5,text:'Incorpora el tofu y saltea todo junto 2 minutos. Sirve con arroz o fideos.'}]),

  // ═══════════════════════════════════════════════════════════════════════════
  // CENAS ADICIONALES
  // ═══════════════════════════════════════════════════════════════════════════
  R('Sopa minestrone italiana', 'cena', 'easy', 20, 30, 4, 280, 12, 42, 6, 10, 'Sopas y cremas', 'italiana', ['gluten'], ['italiana','vegana','fibra','reconfortante'], 'sopa',
    [{name:'Tomate triturado',amount:400,unit:'g',category:'verduras'},{name:'Judías blancas',amount:200,unit:'g',category:'legumbres'},{name:'Zanahoria',amount:2,unit:'unidades',category:'verduras'},{name:'Apio',amount:2,unit:'tallos',category:'verduras'},{name:'Calabacín',amount:1,unit:'unidad',category:'verduras'},{name:'Pasta pequeña',amount:80,unit:'g',category:'cereales'},{name:'Caldo de verduras',amount:1.2,unit:'litros',category:'caldos'},{name:'Albahaca fresca',amount:10,unit:'hojas',category:'hierbas'},{name:'Parmesano',amount:30,unit:'g',category:'lacteos'}],
    [{step:1,text:'Sofríe la cebolla, el apio y la zanahoria en aceite durante 8 minutos.'},{step:2,text:'Añade el calabacín y el tomate triturado. Cocina 5 minutos.'},{step:3,text:'Incorpora el caldo y las judías blancas. Lleva a ebullición.'},{step:4,text:'Añade la pasta y cocina según el tiempo indicado en el paquete.'},{step:5,text:'Sirve con albahaca fresca y parmesano rallado.'}]),

  R('Pollo asado al romero con patatas', 'cena', 'easy', 15, 60, 4, 520, 42, 28, 26, 3, 'Carnes', 'española', [], ['sin_gluten','tradicional','familiar','domingo'], 'pollo',
    [{name:'Pollo entero',amount:1.5,unit:'kg',category:'carnes'},{name:'Patatas',amount:600,unit:'g',category:'verduras'},{name:'Romero fresco',amount:4,unit:'ramitas',category:'hierbas'},{name:'Ajo',amount:6,unit:'dientes',category:'verduras'},{name:'Limón',amount:1,unit:'unidad',category:'frutas'},{name:'Aceite de oliva',amount:3,unit:'cucharadas',category:'grasas'},{name:'Vino blanco',amount:100,unit:'ml',category:'bebidas'}],
    [{step:1,text:'Precalienta el horno a 200°C.'},{step:2,text:'Rellena el pollo con el limón cortado, el romero y 3 dientes de ajo.'},{step:3,text:'Unta el pollo con aceite, sal y pimienta.'},{step:4,text:'Coloca las patatas en cubos alrededor con el ajo restante y el vino blanco.'},{step:5,text:'Hornea 60-70 minutos regando con los jugos cada 20 minutos.'}]),

  R('Ensalada de espinacas con salmón ahumado', 'cena', 'easy', 10, 0, 2, 320, 24, 12, 20, 4, 'Ensaladas', 'española', ['pescado','lacteos'], ['proteica','omega3','ligera','rapida'], 'ensalada',
    [{name:'Espinacas baby',amount:120,unit:'g',category:'verduras'},{name:'Salmón ahumado',amount:120,unit:'g',category:'proteinas'},{name:'Queso de cabra',amount:60,unit:'g',category:'lacteos'},{name:'Nueces',amount:30,unit:'g',category:'frutos_secos'},{name:'Tomates cherry',amount:100,unit:'g',category:'verduras'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Zumo de limón',amount:1,unit:'cucharada',category:'condimentos'}],
    [{step:1,text:'Lava y seca las espinacas.'},{step:2,text:'Corta los tomates cherry por la mitad.'},{step:3,text:'Desmenuza el queso de cabra.'},{step:4,text:'Prepara el aliño con aceite de oliva, zumo de limón, sal y pimienta.'},{step:5,text:'Monta la ensalada con todos los ingredientes y aliña justo antes de servir.'}]),

  R('Crema de guisantes con menta', 'cena', 'easy', 10, 20, 4, 180, 10, 26, 5, 8, 'Sopas y cremas', 'española', ['lacteos'], ['vegana','sin_gluten','ligera','primavera'], 'sopa',
    [{name:'Guisantes congelados',amount:500,unit:'g',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Caldo de verduras',amount:600,unit:'ml',category:'caldos'},{name:'Menta fresca',amount:15,unit:'hojas',category:'hierbas'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Yogur griego',amount:2,unit:'cucharadas',category:'lacteos'}],
    [{step:1,text:'Sofríe la cebolla en aceite hasta que esté transparente.'},{step:2,text:'Añade los guisantes y el caldo. Cocina 10 minutos.'},{step:3,text:'Añade la menta fresca y tritura hasta obtener una crema fina.'},{step:4,text:'Ajusta la consistencia con más caldo si es necesario.'},{step:5,text:'Sirve con una cucharada de yogur griego y hojas de menta fresca.'}]),

  R('Sepia a la plancha con alioli', 'cena', 'easy', 10, 10, 2, 280, 32, 6, 14, 0, 'Pescados', 'española', ['marisco','huevos'], ['sin_gluten','ligero','proteico','español'], 'pescado',
    [{name:'Sepia limpia',amount:400,unit:'g',category:'proteinas'},{name:'Ajo',amount:3,unit:'dientes',category:'verduras'},{name:'Perejil',amount:10,unit:'g',category:'hierbas'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'},{name:'Limón',amount:1,unit:'unidad',category:'frutas'},{name:'Mayonesa',amount:3,unit:'cucharadas',category:'salsas'}],
    [{step:1,text:'Limpia la sepia y córtala en trozos. Seca bien con papel de cocina.'},{step:2,text:'Calienta la plancha a fuego fuerte. Cocina la sepia 3-4 minutos por lado.'},{step:3,text:'Sazona con sal y pimienta.'},{step:4,text:'Para el alioli: mezcla la mayonesa con ajo picado muy fino y zumo de limón.'},{step:5,text:'Sirve la sepia con el alioli, perejil picado y gajos de limón.'}]),

  R('Berenjenas rellenas de carne y tomate', 'cena', 'medium', 20, 40, 2, 380, 24, 22, 20, 6, 'Verduras', 'española', ['lacteos'], ['sin_gluten','tradicional','familiar'], 'verduras',
    [{name:'Berenjenas',amount:2,unit:'unidades',category:'verduras'},{name:'Carne picada mixta',amount:250,unit:'g',category:'carnes'},{name:'Tomate triturado',amount:200,unit:'g',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Queso mozzarella',amount:80,unit:'g',category:'lacteos'},{name:'Ajo',amount:2,unit:'dientes',category:'verduras'},{name:'Orégano',amount:1,unit:'cucharadita',category:'especias'}],
    [{step:1,text:'Corta las berenjenas por la mitad y vacía la pulpa. Hornea las mitades 15 minutos a 180°C.'},{step:2,text:'Sofríe la cebolla y el ajo. Añade la carne y dórala.'},{step:3,text:'Añade la pulpa de berenjena picada y el tomate. Cocina 10 minutos.'},{step:4,text:'Rellena las berenjenas con la mezcla de carne.'},{step:5,text:'Cubre con mozzarella y hornea 20 minutos más hasta que el queso esté dorado.'}]),

  R('Sopa de cebolla gratinada', 'cena', 'medium', 15, 50, 4, 320, 12, 38, 12, 4, 'Sopas y cremas', 'francesa', ['gluten','lacteos'], ['francesa','reconfortante','invierno','especial'], 'sopa',
    [{name:'Cebollas',amount:1,unit:'kg',category:'verduras'},{name:'Caldo de carne',amount:1,unit:'litro',category:'caldos'},{name:'Vino blanco',amount:100,unit:'ml',category:'bebidas'},{name:'Pan baguette',amount:4,unit:'rebanadas',category:'cereales'},{name:'Queso gruyère rallado',amount:120,unit:'g',category:'lacteos'},{name:'Mantequilla',amount:30,unit:'g',category:'lacteos'},{name:'Tomillo',amount:2,unit:'ramitas',category:'hierbas'}],
    [{step:1,text:'Carameliza las cebollas en juliana con mantequilla a fuego bajo durante 40 minutos, removiendo ocasionalmente.'},{step:2,text:'Añade el vino blanco y deja evaporar.'},{step:3,text:'Incorpora el caldo y el tomillo. Cocina 10 minutos.'},{step:4,text:'Tuesta las rebanadas de baguette.'},{step:5,text:'Sirve la sopa en cuencos aptos para horno, coloca el pan y el queso encima. Gratina 5 minutos.'}]),

  R('Pulpo a la gallega', 'cena', 'hard', 10, 60, 4, 240, 28, 12, 8, 1, 'Pescados', 'española', ['marisco'], ['sin_gluten','tradicional','española','especial'], 'pescado',
    [{name:'Pulpo cocido',amount:600,unit:'g',category:'proteinas'},{name:'Patatas',amount:400,unit:'g',category:'verduras'},{name:'Pimentón dulce',amount:1,unit:'cucharada',category:'especias'},{name:'Pimentón picante',amount:0.5,unit:'cucharadita',category:'especias'},{name:'Aceite de oliva virgen extra',amount:4,unit:'cucharadas',category:'grasas'},{name:'Sal gruesa',amount:1,unit:'al gusto',category:'condimentos'}],
    [{step:1,text:'Cuece las patatas con piel en agua con sal hasta que estén tiernas. Pela y corta en rodajas.'},{step:2,text:'Calienta el pulpo cocido en agua caliente 5 minutos.'},{step:3,text:'Corta el pulpo en rodajas con tijeras.'},{step:4,text:'Coloca las patatas en una tabla de madera y el pulpo encima.'},{step:5,text:'Espolvorea generosamente con pimentón dulce y un poco de picante. Añade sal gruesa y aceite de oliva.'}]),

  R('Tortilla de patatas con pimiento y chorizo', 'cena', 'medium', 20, 30, 4, 400, 20, 30, 22, 3, 'Huevos', 'española', ['huevos'], ['tradicional','española','sin_gluten','familiar'], 'huevos',
    [{name:'Patatas',amount:500,unit:'g',category:'verduras'},{name:'Huevos',amount:6,unit:'unidades',category:'proteinas'},{name:'Chorizo',amount:80,unit:'g',category:'carnes'},{name:'Pimiento verde',amount:1,unit:'unidad',category:'verduras'},{name:'Cebolla',amount:1,unit:'unidad',category:'verduras'},{name:'Aceite de oliva',amount:150,unit:'ml',category:'grasas'}],
    [{step:1,text:'Confita las patatas, la cebolla y el pimiento en aceite a fuego bajo 20 minutos.'},{step:2,text:'Añade el chorizo en rodajas y sofríe 3 minutos más.'},{step:3,text:'Escurre el aceite y mezcla con los huevos batidos.'},{step:4,text:'Cuaja en una sartén con un poco de aceite, 3 minutos por lado.'},{step:5,text:'Sirve caliente o a temperatura ambiente.'}]),

  R('Merluza en salsa de almendras', 'cena', 'medium', 15, 20, 2, 360, 38, 12, 16, 2, 'Pescados', 'española', ['pescado','frutos_secos'], ['sin_gluten','proteico','tradicional'], 'pescado',
    [{name:'Filetes de merluza',amount:400,unit:'g',category:'proteinas'},{name:'Almendras molidas',amount:50,unit:'g',category:'frutos_secos'},{name:'Caldo de pescado',amount:200,unit:'ml',category:'caldos'},{name:'Vino blanco',amount:100,unit:'ml',category:'bebidas'},{name:'Ajo',amount:3,unit:'dientes',category:'verduras'},{name:'Perejil',amount:10,unit:'g',category:'hierbas'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'}],
    [{step:1,text:'Dora el ajo laminado en aceite. Añade las almendras molidas y tuesta 2 minutos.'},{step:2,text:'Incorpora el vino blanco y deja evaporar.'},{step:3,text:'Añade el caldo y el perejil picado. Cocina 5 minutos.'},{step:4,text:'Coloca los filetes de merluza en la salsa.'},{step:5,text:'Cocina tapado 8-10 minutos hasta que el pescado esté listo.'}]),

  R('Pasta con gambas al ajillo', 'cena', 'medium', 10, 15, 2, 520, 28, 62, 16, 3, 'Pastas', 'española', ['gluten','marisco'], ['rapida','proteica','española'], 'pasta',
    [{name:'Linguini',amount:200,unit:'g',category:'cereales'},{name:'Gambas peladas',amount:200,unit:'g',category:'proteinas'},{name:'Ajo',amount:4,unit:'dientes',category:'verduras'},{name:'Guindilla',amount:1,unit:'unidad',category:'especias'},{name:'Vino blanco',amount:80,unit:'ml',category:'bebidas'},{name:'Aceite de oliva',amount:3,unit:'cucharadas',category:'grasas'},{name:'Perejil',amount:10,unit:'g',category:'hierbas'},{name:'Limón',amount:0.5,unit:'unidad',category:'frutas'}],
    [{step:1,text:'Cuece la pasta al dente. Reserva un poco del agua de cocción.'},{step:2,text:'Sofríe el ajo laminado con la guindilla en aceite hasta que esté dorado.'},{step:3,text:'Añade las gambas y saltea 2 minutos.'},{step:4,text:'Vierte el vino blanco y deja evaporar.'},{step:5,text:'Mezcla con la pasta, añade un poco del agua de cocción, perejil y zumo de limón.'}]),

  R('Verduras al wok con arroz integral', 'cena', 'easy', 15, 20, 2, 340, 10, 58, 8, 8, 'Verduras', 'asiatica', ['soja','sesamo'], ['vegano','sin_gluten','fibra','ligero'], 'stir_fry',
    [{name:'Arroz integral',amount:160,unit:'g',category:'cereales'},{name:'Brócoli',amount:150,unit:'g',category:'verduras'},{name:'Zanahoria',amount:1,unit:'unidad',category:'verduras'},{name:'Pimiento rojo',amount:1,unit:'unidad',category:'verduras'},{name:'Champiñones',amount:100,unit:'g',category:'verduras'},{name:'Salsa de soja',amount:2,unit:'cucharadas',category:'condimentos'},{name:'Aceite de sésamo',amount:1,unit:'cucharada',category:'grasas'},{name:'Ajo',amount:2,unit:'dientes',category:'verduras'}],
    [{step:1,text:'Cuece el arroz integral según las instrucciones.'},{step:2,text:'Calienta el wok a fuego fuerte con aceite de sésamo.'},{step:3,text:'Sofríe el ajo y añade las verduras más duras primero.'},{step:4,text:'Añade la salsa de soja y saltea todo 5 minutos a fuego fuerte.'},{step:5,text:'Sirve sobre el arroz integral.'}]),

  // ═══════════════════════════════════════════════════════════════════════════
  // RECETAS ESPECIALES / CUALQUIERA
  // ═══════════════════════════════════════════════════════════════════════════
  R('Hummus de remolacha', 'cualquiera', 'easy', 15, 0, 6, 160, 6, 18, 7, 5, 'Snacks saludables', 'mediterranea', ['sesamo'], ['vegano','sin_gluten','colorido','antioxidantes'], 'legumbres',
    [{name:'Garbanzos cocidos',amount:300,unit:'g',category:'legumbres'},{name:'Remolacha cocida',amount:150,unit:'g',category:'verduras'},{name:'Tahini',amount:2,unit:'cucharadas',category:'semillas'},{name:'Zumo de limón',amount:2,unit:'cucharadas',category:'condimentos'},{name:'Ajo',amount:1,unit:'diente',category:'verduras'},{name:'Aceite de oliva',amount:2,unit:'cucharadas',category:'grasas'}],
    [{step:1,text:'Tritura los garbanzos con la remolacha, el tahini, el ajo y el zumo de limón.'},{step:2,text:'Añade agua fría poco a poco hasta obtener la textura deseada.'},{step:3,text:'Sazona con sal y pimienta.'},{step:4,text:'Sirve con un hilo de aceite de oliva y sésamo tostado.'}]),

  R('Granola proteica de chocolate y coco', 'cualquiera', 'easy', 10, 25, 8, 240, 8, 28, 12, 4, 'Snacks saludables', 'americana', ['frutos_secos','gluten'], ['sin_azucar','fitness','energia'], 'granola',
    [{name:'Copos de avena',amount:200,unit:'g',category:'cereales'},{name:'Proteína de chocolate',amount:30,unit:'g',category:'suplementos'},{name:'Coco rallado',amount:40,unit:'g',category:'frutos_secos'},{name:'Almendras',amount:60,unit:'g',category:'frutos_secos'},{name:'Aceite de coco',amount:2,unit:'cucharadas',category:'grasas'},{name:'Miel',amount:2,unit:'cucharadas',category:'endulzantes'},{name:'Cacao puro',amount:1,unit:'cucharada',category:'otros'}],
    [{step:1,text:'Precalienta el horno a 160°C.'},{step:2,text:'Mezcla la avena, la proteína, el coco, las almendras y el cacao.'},{step:3,text:'Derrite el aceite de coco con la miel y mezcla con los ingredientes secos.'},{step:4,text:'Extiende en una bandeja y hornea 20-25 minutos removiendo a mitad.'},{step:5,text:'Deja enfriar completamente antes de guardar.'}]),

  R('Smoothie de mango y cúrcuma', 'cualquiera', 'easy', 5, 0, 1, 220, 4, 48, 3, 4, 'Batidos', 'americana', ['lacteos'], ['vegano','sin_gluten','antiinflamatorio','vitaminas'], 'smoothie',
    [{name:'Mango congelado',amount:150,unit:'g',category:'frutas'},{name:'Leche de coco',amount:200,unit:'ml',category:'lacteos'},{name:'Cúrcuma',amount:0.5,unit:'cucharadita',category:'especias'},{name:'Jengibre fresco',amount:1,unit:'cm',category:'especias'},{name:'Pimienta negra',amount:1,unit:'pizca',category:'especias'},{name:'Miel',amount:1,unit:'cucharadita',category:'endulzantes'}],
    [{step:1,text:'Añade todos los ingredientes a la batidora.'},{step:2,text:'Tritura hasta obtener una textura suave y cremosa.'},{step:3,text:'Prueba y ajusta la dulzura con miel.'},{step:4,text:'Sirve inmediatamente con hielo opcional.'}]),
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
  console.log(`\n📊 Insertadas: ${inserted} | Existentes: ${skipped} | Errores: ${errors}`);
}

seed().then(() => pool.end()).catch(e => { console.error(e); pool.end(); process.exit(1); });
