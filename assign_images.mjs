/**
 * assign_images.mjs
 * Assigns real food images to all seeded recipes using Unsplash API.
 * Uses the Unsplash Source API (no key required) with food-specific search terms.
 */
import { createConnection } from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

// Map common Spanish recipe keywords to English Unsplash search terms
function toEnglishSearchTerm(recipeName) {
  const translations = {
    // Fruits
    'arándanos': 'blueberries bowl', 'plátano': 'banana', 'manzana': 'apple',
    'kiwi': 'kiwi fruit', 'uvas': 'grapes', 'piña': 'pineapple', 'fresas': 'strawberries',
    'naranja': 'orange fruit', 'pera': 'pear fruit', 'melocotón': 'peach fruit',
    'sandía': 'watermelon', 'melón': 'melon', 'mango': 'mango fruit',
    'frambuesas': 'raspberries', 'cerezas': 'cherries', 'higos': 'figs',
    // Nuts
    'pistachos': 'pistachios', 'almendras': 'almonds', 'nueces': 'walnuts',
    'avellanas': 'hazelnuts', 'anacardos': 'cashews',
    // Breakfast
    'tostadas': 'toast breakfast', 'tortitas': 'pancakes', 'gachas': 'oatmeal porridge',
    'granola': 'granola bowl', 'yogur': 'yogurt bowl', 'huevos': 'eggs breakfast',
    'avena': 'oatmeal', 'smoothie': 'smoothie bowl', 'batido': 'smoothie',
    'crepes': 'crepes', 'muesli': 'muesli bowl',
    // Lunch/Dinner
    'pollo': 'chicken dish', 'salmón': 'salmon dish', 'atún': 'tuna dish',
    'ternera': 'beef dish', 'cerdo': 'pork dish', 'cordero': 'lamb dish',
    'pasta': 'pasta dish', 'arroz': 'rice dish', 'quinoa': 'quinoa bowl',
    'ensalada': 'salad bowl', 'sopa': 'soup bowl', 'crema': 'cream soup',
    'lentejas': 'lentil soup', 'garbanzos': 'chickpea dish', 'alubias': 'beans dish',
    'verduras': 'vegetables dish', 'brócoli': 'broccoli dish', 'espinacas': 'spinach dish',
    'tomate': 'tomato dish', 'pimientos': 'peppers dish', 'calabacín': 'zucchini dish',
    'berenjena': 'eggplant dish', 'coliflor': 'cauliflower dish',
    'pizza': 'pizza', 'hamburguesa': 'burger', 'sandwich': 'sandwich',
    'wrap': 'wrap sandwich', 'tacos': 'tacos', 'burrito': 'burrito',
    'paella': 'paella', 'risotto': 'risotto', 'lasaña': 'lasagna',
    'tortilla': 'spanish omelette', 'revuelto': 'scrambled eggs',
    'gazpacho': 'gazpacho soup', 'pisto': 'ratatouille',
    // Snacks
    'hummus': 'hummus dip', 'guacamole': 'guacamole', 'nachos': 'nachos',
    'chips': 'chips snack', 'frutos secos': 'mixed nuts',
    // Desserts
    'chocolate': 'chocolate dessert', 'helado': 'ice cream', 'flan': 'flan dessert',
    'tarta': 'cake dessert', 'brownie': 'brownie', 'galletas': 'cookies',
    'pudding': 'pudding dessert', 'mousse': 'mousse dessert',
    // Drinks
    'café': 'coffee cup', 'té': 'tea cup', 'zumo': 'juice glass',
    'infusión': 'herbal tea',
    // Proteins
    'proteína': 'protein shake', 'whey': 'protein shake',
    // Cooking methods
    'asado': 'roasted', 'a la plancha': 'grilled', 'al vapor': 'steamed',
    'frito': 'fried', 'horneado': 'baked',
  };

  const lower = recipeName.toLowerCase();
  
  // Check for direct keyword matches
  for (const [spanish, english] of Object.entries(translations)) {
    if (lower.includes(spanish)) {
      return english + ' food';
    }
  }
  
  // Fallback: translate common words and use as search
  return recipeName
    .replace(/con /g, 'with ')
    .replace(/de /g, 'of ')
    .replace(/y /g, 'and ')
    + ' food healthy';
}

// Generate Unsplash URL for a recipe
function getUnsplashUrl(recipeName, recipeId) {
  const searchTerm = toEnglishSearchTerm(recipeName);
  const encoded = encodeURIComponent(searchTerm);
  // Use a fixed seed based on recipe ID for consistency (same recipe always gets same image)
  const seed = recipeId % 100;
  return `https://source.unsplash.com/400x300/?${encoded}&sig=${seed}`;
}

// Alternative: use Pexels-style static URLs from a curated food image set
function getCuratedFoodImageUrl(recipeName, recipeId) {
  const lower = recipeName.toLowerCase();
  
  // Curated Unsplash photo IDs for different food categories
  const foodImages = {
    // Breakfast
    desayuno: [
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop', // pancakes
      'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=300&fit=crop', // toast
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', // breakfast
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop', // oatmeal
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', // healthy bowl
    ],
    // Fruits
    frutas: [
      'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop', // fruit bowl
      'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=400&h=300&fit=crop', // berries
      'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop', // apple
      'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&h=300&fit=crop', // strawberries
      'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&h=300&fit=crop', // kiwi
    ],
    // Salads
    ensalada: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', // salad
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // green salad
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', // bowl salad
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&h=300&fit=crop', // caesar salad
    ],
    // Chicken
    pollo: [
      'https://images.unsplash.com/photo-1598103442097-8b74394b95c7?w=400&h=300&fit=crop', // grilled chicken
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop', // chicken dish
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', // chicken meal
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', // roast chicken
    ],
    // Fish/Salmon
    salmón: [
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop', // salmon
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop', // fish dish
      'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=300&fit=crop', // grilled fish
    ],
    // Pasta
    pasta: [
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop', // pasta
      'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&h=300&fit=crop', // spaghetti
      'https://images.unsplash.com/photo-1567608285969-48e4bbe0d399?w=400&h=300&fit=crop', // pasta dish
    ],
    // Rice
    arroz: [
      'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=300&fit=crop', // rice dish
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop', // fried rice
      'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=300&fit=crop', // rice bowl
    ],
    // Soup
    sopa: [
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // soup
      'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=400&h=300&fit=crop', // bowl soup
      'https://images.unsplash.com/photo-1588566565463-180a5b8f7e6a?w=400&h=300&fit=crop', // vegetable soup
    ],
    // Eggs
    huevos: [
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop', // eggs
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop', // scrambled eggs
      'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&h=300&fit=crop', // omelette
    ],
    // Smoothie
    smoothie: [
      'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop', // smoothie
      'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400&h=300&fit=crop', // smoothie bowl
      'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=300&fit=crop', // green smoothie
    ],
    // Yogurt
    yogur: [
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop', // yogurt
      'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop', // yogurt bowl
    ],
    // Oats
    avena: [
      'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop', // oatmeal
      'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400&h=300&fit=crop', // oats bowl
    ],
    // Beef
    ternera: [
      'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=400&h=300&fit=crop', // beef steak
      'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop', // meat dish
    ],
    // Vegetables
    verduras: [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', // vegetables
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', // veggie bowl
    ],
    // Quinoa
    quinoa: [
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&h=300&fit=crop', // quinoa bowl
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', // grain bowl
    ],
    // Legumes
    lentejas: [
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // lentil soup
    ],
    garbanzos: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', // chickpea
    ],
    // Sandwich/Wrap
    sandwich: [
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop', // sandwich
    ],
    wrap: [
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop', // wrap
    ],
    // Nuts/Snacks
    frutos: [
      'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop', // mixed nuts
    ],
    // Tuna
    atún: [
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop', // tuna
    ],
    // Pancakes/Crepes
    tortitas: [
      'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=300&fit=crop', // pancakes
    ],
    crepes: [
      'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=300&fit=crop', // crepes
    ],
    // Toast
    tostadas: [
      'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=300&fit=crop', // toast
    ],
    // Granola
    granola: [
      'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=400&h=300&fit=crop', // granola
    ],
    // Hummus
    hummus: [
      'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400&h=300&fit=crop', // hummus
    ],
    // Broccoli
    brócoli: [
      'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&h=300&fit=crop', // broccoli
    ],
    // Chocolate
    chocolate: [
      'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=300&fit=crop', // chocolate
    ],
    // Default food images
    default: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=400&h=300&fit=crop',
    ],
  };

  // Find matching category
  for (const [keyword, images] of Object.entries(foodImages)) {
    if (keyword !== 'default' && lower.includes(keyword)) {
      const idx = recipeId % images.length;
      return images[idx];
    }
  }
  
  // Default: use recipe ID to pick a consistent default image
  const defaults = foodImages.default;
  return defaults[recipeId % defaults.length];
}

async function main() {
  if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
  const conn = await createConnection(DATABASE_URL);
  console.log('Connected to database');

  // Get all seeded recipes without images
  const [recipes] = await conn.execute(
    'SELECT id, name, mealTime, category FROM recipes WHERE isSeeded = 1 ORDER BY id'
  );
  
  console.log(`Processing ${recipes.length} recipes...`);
  
  let updated = 0;
  const batchSize = 50;
  
  for (let i = 0; i < recipes.length; i += batchSize) {
    const batch = recipes.slice(i, i + batchSize);
    
    for (const recipe of batch) {
      const imageUrl = getCuratedFoodImageUrl(recipe.name, recipe.id);
      await conn.execute(
        'UPDATE recipes SET imageUrl = ? WHERE id = ?',
        [imageUrl, recipe.id]
      );
      updated++;
    }
    
    console.log(`Updated ${Math.min(i + batchSize, recipes.length)}/${recipes.length} recipes...`);
  }

  console.log(`\n✅ Done! Updated ${updated} recipes with real food images.`);
  await conn.end();
}

main().catch(console.error);
