/**
 * assign_images2.mjs
 * Assigns highly specific food images to all seeded recipes.
 * Each ingredient/dish type gets its own curated Unsplash photo ID.
 */
import { createConnection } from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

// Curated Unsplash images - specific to each food item
// Format: keyword → [array of Unsplash photo URLs]
const FOOD_IMAGE_MAP = {
  // === FRUITS ===
  'arándanos': [
    'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&h=300&fit=crop', // blueberries
    'https://images.unsplash.com/photo-1425934398893-310a009a77f9?w=400&h=300&fit=crop', // blueberries bowl
  ],
  'fresas': [
    'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop', // strawberries
    'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&h=300&fit=crop', // strawberries bowl
  ],
  'frambuesas': [
    'https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?w=400&h=300&fit=crop', // raspberries
  ],
  'moras': [
    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=300&fit=crop', // blackberries
  ],
  'cerezas': [
    'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=400&h=300&fit=crop', // cherries
  ],
  'mango': [
    'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=300&fit=crop', // mango
    'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&h=300&fit=crop', // mango sliced
  ],
  'piña': [
    'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400&h=300&fit=crop', // pineapple
    'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=400&h=300&fit=crop', // pineapple sliced
  ],
  'kiwi': [
    'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&h=300&fit=crop', // kiwi
    'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&h=300&fit=crop', // kiwi sliced
  ],
  'plátano': [
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop', // banana
    'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&h=300&fit=crop', // banana bunch
  ],
  'manzana': [
    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop', // apple
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&h=300&fit=crop', // apple sliced
  ],
  'pera': [
    'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=400&h=300&fit=crop', // pear
  ],
  'naranja': [
    'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop', // orange
    'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=400&h=300&fit=crop', // orange sliced
  ],
  'uvas': [
    'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=300&fit=crop', // grapes
    'https://images.unsplash.com/photo-1596363505729-4190a9506133?w=400&h=300&fit=crop', // grapes bowl
  ],
  'melocotón': [
    'https://images.unsplash.com/photo-1595124035498-4e39e1d0d0b2?w=400&h=300&fit=crop', // peach
  ],
  'sandía': [
    'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400&h=300&fit=crop', // watermelon
  ],
  'melón': [
    'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=400&h=300&fit=crop', // melon
  ],
  'higos': [
    'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&h=300&fit=crop', // figs
  ],
  'papaya': [
    'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&h=300&fit=crop', // papaya
  ],
  'granada': [
    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=300&fit=crop', // pomegranate
  ],

  // === NUTS ===
  'almendras': [
    'https://images.unsplash.com/photo-1574570173583-e0c3e8083f82?w=400&h=300&fit=crop', // almonds
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop', // nuts bowl
  ],
  'nueces': [
    'https://images.unsplash.com/photo-1563412885-139e4045ec52?w=400&h=300&fit=crop', // walnuts
  ],
  'pistachos': [
    'https://images.unsplash.com/photo-1590080875852-4a46c9d4d2e8?w=400&h=300&fit=crop', // pistachios
  ],
  'avellanas': [
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop', // hazelnuts
  ],
  'anacardos': [
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop', // cashews
  ],
  'frutos secos': [
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop', // mixed nuts
  ],

  // === BREAKFAST ===
  'avena': [
    'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=400&h=300&fit=crop', // oatmeal
    'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400&h=300&fit=crop', // oats bowl
  ],
  'gachas': [
    'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=400&h=300&fit=crop', // porridge
  ],
  'granola': [
    'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=400&h=300&fit=crop', // granola
    'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop', // granola bowl
  ],
  'muesli': [
    'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=400&h=300&fit=crop', // muesli
  ],
  'tortitas': [
    'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=300&fit=crop', // pancakes
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', // pancakes stack
  ],
  'crepes': [
    'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=300&fit=crop', // crepes
  ],
  'tostadas': [
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=300&fit=crop', // toast
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop', // avocado toast
  ],
  'yogur': [
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop', // yogurt
    'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop', // yogurt bowl
  ],
  'smoothie': [
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop', // smoothie
    'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400&h=300&fit=crop', // smoothie bowl
  ],
  'batido': [
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop', // smoothie
    'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=300&fit=crop', // green smoothie
  ],
  'huevos': [
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop', // eggs
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop', // scrambled eggs
  ],
  'revuelto': [
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop', // scrambled eggs
  ],
  'tortilla': [
    'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&h=300&fit=crop', // omelette
  ],

  // === PROTEINS ===
  'pollo': [
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c7?w=400&h=300&fit=crop', // grilled chicken
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop', // chicken dish
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', // chicken meal
  ],
  'salmón': [
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop', // salmon
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop', // salmon dish
  ],
  'atún': [
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop', // tuna
    'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=300&fit=crop', // tuna dish
  ],
  'ternera': [
    'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=400&h=300&fit=crop', // beef steak
    'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop', // beef dish
  ],
  'cerdo': [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', // pork dish
  ],
  'cordero': [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', // lamb
  ],
  'pavo': [
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c7?w=400&h=300&fit=crop', // turkey
  ],
  'merluza': [
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop', // fish
  ],
  'bacalao': [
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop', // cod
  ],
  'gambas': [
    'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=300&fit=crop', // shrimp
  ],
  'langostinos': [
    'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=300&fit=crop', // prawns
  ],

  // === PASTA & GRAINS ===
  'pasta': [
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop', // pasta
    'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&h=300&fit=crop', // spaghetti
  ],
  'espaguetis': [
    'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&h=300&fit=crop', // spaghetti
  ],
  'macarrones': [
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop', // pasta
  ],
  'arroz': [
    'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=300&fit=crop', // rice
    'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=300&fit=crop', // rice bowl
  ],
  'quinoa': [
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&h=300&fit=crop', // quinoa
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', // quinoa bowl
  ],
  'cuscús': [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', // couscous
  ],
  'bulgur': [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', // bulgur
  ],

  // === LEGUMES ===
  'lentejas': [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // lentil soup
  ],
  'garbanzos': [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', // chickpeas
  ],
  'alubias': [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // beans
  ],
  'judías': [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // beans
  ],
  'hummus': [
    'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400&h=300&fit=crop', // hummus
  ],
  'edamame': [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // edamame
  ],

  // === SALADS ===
  'ensalada': [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', // salad
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // green salad
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&h=300&fit=crop', // caesar salad
  ],

  // === SOUPS ===
  'sopa': [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // soup
    'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=400&h=300&fit=crop', // bowl soup
  ],
  'crema': [
    'https://images.unsplash.com/photo-1588566565463-180a5b8f7e6a?w=400&h=300&fit=crop', // cream soup
  ],
  'gazpacho': [
    'https://images.unsplash.com/photo-1588566565463-180a5b8f7e6a?w=400&h=300&fit=crop', // gazpacho
  ],
  'caldo': [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // broth
  ],
  'puchero': [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // stew
  ],
  'estofado': [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // stew
  ],

  // === VEGETABLES ===
  'brócoli': [
    'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&h=300&fit=crop', // broccoli
  ],
  'espinacas': [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // spinach
  ],
  'coliflor': [
    'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&h=300&fit=crop', // cauliflower
  ],
  'calabacín': [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // zucchini
  ],
  'berenjena': [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // eggplant
  ],
  'pimientos': [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // peppers
  ],
  'tomate': [
    'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=300&fit=crop', // tomato
  ],
  'zanahoria': [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // carrot
  ],
  'aguacate': [
    'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=300&fit=crop', // avocado
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop', // avocado toast
  ],
  'espárragos': [
    'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&h=300&fit=crop', // asparagus
  ],

  // === SANDWICHES & WRAPS ===
  'sandwich': [
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop', // sandwich
  ],
  'wrap': [
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop', // wrap
  ],
  'bocadillo': [
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop', // bocadillo
  ],
  'hamburguesa': [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', // burger
  ],
  'pizza': [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', // pizza
  ],

  // === DRINKS ===
  'café': [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop', // coffee
  ],
  'té': [
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop', // tea
  ],
  'infusión': [
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop', // herbal tea
  ],
  'zumo': [
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop', // juice
  ],
  'leche': [
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop', // milk
  ],

  // === DESSERTS ===
  'chocolate': [
    'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=300&fit=crop', // chocolate
  ],
  'brownie': [
    'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=300&fit=crop', // brownie
  ],
  'galletas': [
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop', // cookies
  ],
  'tarta': [
    'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop', // cake
  ],
  'helado': [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop', // ice cream
  ],
  'mousse': [
    'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=300&fit=crop', // mousse
  ],
  'flan': [
    'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop', // flan
  ],
  'pudding': [
    'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=300&fit=crop', // pudding
  ],

  // === SPECIFIC DISHES ===
  'paella': [
    'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=300&fit=crop', // paella
  ],
  'risotto': [
    'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop', // risotto
  ],
  'lasaña': [
    'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=300&fit=crop', // lasagna
  ],
  'pisto': [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // ratatouille
  ],
  'guacamole': [
    'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400&h=300&fit=crop', // guacamole
  ],
  'tacos': [
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop', // tacos
  ],
  'burrito': [
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop', // burrito
  ],
  'ceviche': [
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop', // ceviche
  ],
  'sushi': [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop', // sushi
  ],
  'bowl': [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', // bowl
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', // healthy bowl
  ],
  'proteína': [
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop', // protein shake
  ],
};

// Default food images by meal time
const MEAL_TIME_DEFAULTS = {
  'desayuno': [
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=400&h=300&fit=crop',
  ],
  'media_manana': [
    'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop',
  ],
  'comida': [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  ],
  'merienda': [
    'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop',
  ],
  'cena': [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
  ],
};

function getImageForRecipe(recipeName, mealTime, recipeId) {
  const lower = recipeName.toLowerCase();
  
  // Try to find a specific match in the food image map
  // Sort by keyword length (longer = more specific) for better matching
  const sortedKeys = Object.keys(FOOD_IMAGE_MAP).sort((a, b) => b.length - a.length);
  
  for (const keyword of sortedKeys) {
    if (lower.includes(keyword)) {
      const images = FOOD_IMAGE_MAP[keyword];
      return images[recipeId % images.length];
    }
  }
  
  // Fall back to meal time defaults
  const defaults = MEAL_TIME_DEFAULTS[mealTime] || MEAL_TIME_DEFAULTS['comida'];
  return defaults[recipeId % defaults.length];
}

async function main() {
  if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
  const conn = await createConnection(DATABASE_URL);
  console.log('Connected to database');

  const [recipes] = await conn.execute(
    'SELECT id, name, mealTime FROM recipes WHERE isSeeded = 1 ORDER BY id'
  );
  
  console.log(`Processing ${recipes.length} recipes with specific images...`);
  
  let updated = 0;
  
  for (const recipe of recipes) {
    const imageUrl = getImageForRecipe(recipe.name, recipe.mealTime, recipe.id);
    await conn.execute('UPDATE recipes SET imageUrl = ? WHERE id = ?', [imageUrl, recipe.id]);
    updated++;
    if (updated % 50 === 0) console.log(`Updated ${updated}/${recipes.length}...`);
  }

  console.log(`\n✅ Done! Updated ${updated} recipes with specific food images.`);
  
  // Show sample results
  const [samples] = await conn.execute(
    'SELECT id, name, mealTime, imageUrl FROM recipes WHERE isSeeded = 1 ORDER BY id LIMIT 15'
  );
  console.log('\nSample results:');
  samples.forEach(r => console.log(`  ${r.name} (${r.mealTime}) → ${r.imageUrl?.substring(0, 70)}`));
  
  await conn.end();
}

main().catch(console.error);
