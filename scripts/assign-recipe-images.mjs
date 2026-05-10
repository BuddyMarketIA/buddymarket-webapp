/**
 * Script to assign real food images to recipes using Unsplash Source API.
 * Maps recipe names to appropriate food photography keywords.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Fetch all recipes without images
const [recipes] = await connection.execute(
  "SELECT id, name, category FROM recipes WHERE imageUrl IS NULL OR imageUrl = '' OR imageUrl LIKE '%placeholder%' OR imageUrl LIKE '%d2%cdn%' ORDER BY id"
);

console.log(`Found ${recipes.length} recipes without proper images`);

// Map recipe name keywords to Unsplash search terms for food photography
function getUnsplashQuery(recipeName, category) {
  const name = recipeName.toLowerCase();
  
  // Specific mappings for common recipe types
  const mappings = [
    // Desayunos / Breakfast
    [/smoothie|batido|licuado/, "smoothie bowl fruit"],
    [/avena|porridge|oatmeal/, "oatmeal breakfast bowl"],
    [/tostada|toast/, "avocado toast breakfast"],
    [/huevo|egg|tortilla/, "scrambled eggs breakfast"],
    [/yogur|yogurt/, "yogurt granola bowl"],
    [/pancake|crepe|tortita/, "pancakes breakfast"],
    [/muesli|granola|cereal/, "granola bowl milk"],
    [/café|coffee|latte/, "coffee breakfast"],
    [/zumo|jugo|naranja|juice/, "fresh orange juice"],
    [/fruta|fruit|macedonia/, "fresh fruit bowl"],
    
    // Ensaladas / Salads
    [/ensalada|salad/, "fresh salad bowl"],
    [/césar|caesar/, "caesar salad"],
    [/caprese/, "caprese salad tomato mozzarella"],
    
    // Sopas / Soups
    [/sopa|soup|caldo|crema/, "soup bowl warm"],
    [/gazpacho/, "gazpacho cold soup"],
    [/minestrone/, "minestrone soup"],
    
    // Carnes / Meats
    [/pollo|chicken/, "grilled chicken plate"],
    [/ternera|beef|res/, "beef steak plate"],
    [/cerdo|pork|lomo/, "pork tenderloin"],
    [/pavo|turkey/, "turkey plate"],
    [/cordero|lamb/, "lamb chops plate"],
    [/hamburguesa|burger/, "burger plate"],
    
    // Pescados / Fish
    [/salmón|salmon/, "salmon fillet plate"],
    [/atún|tuna/, "tuna steak plate"],
    [/merluza|hake|bacalao|cod/, "white fish plate"],
    [/gambas|shrimp|langostino/, "shrimp plate"],
    [/pulpo|octopus/, "octopus plate"],
    
    // Pasta / Rice
    [/pasta|espagueti|spaghetti|penne|macarrón/, "pasta plate italian"],
    [/arroz|rice|risotto/, "rice dish plate"],
    [/paella/, "paella spanish rice"],
    [/fideos/, "noodles soup"],
    
    // Legumbres / Legumes
    [/lentejas|lentil/, "lentil soup bowl"],
    [/garbanzos|chickpea|hummus/, "chickpea dish"],
    [/judías|beans|alubias/, "bean stew"],
    
    // Verduras / Vegetables
    [/verdura|vegetable|vegetal/, "roasted vegetables plate"],
    [/brócoli|broccoli/, "broccoli dish"],
    [/espinaca|spinach/, "spinach salad"],
    [/calabacín|zucchini/, "zucchini dish"],
    [/berenjena|eggplant/, "eggplant dish"],
    
    // Snacks / Postres
    [/snack|aperitivo/, "healthy snack"],
    [/postre|dessert|dulce/, "dessert plate"],
    [/frutos secos|nuts|almendra|nuez/, "mixed nuts bowl"],
    [/chocolate/, "dark chocolate dessert"],
    [/tarta|cake|bizcocho/, "cake slice"],
    
    // Bocadillos / Sandwiches
    [/bocadillo|sandwich|wrap/, "sandwich wrap"],
    [/pita|falafel/, "falafel pita wrap"],
    
    // Wok / Asian
    [/wok|salteado|stir.fry/, "wok stir fry vegetables"],
    [/curry/, "curry dish bowl"],
    [/sushi/, "sushi plate"],
    
    // Mediterranean
    [/mediterráneo|mediterranean/, "mediterranean food plate"],
    [/gazpacho/, "gazpacho soup"],
    
    // Generic fallbacks by category
  ];
  
  for (const [pattern, query] of mappings) {
    if (pattern.test(name)) return query;
  }
  
  // Category-based fallback
  if (category) {
    const cat = category.toLowerCase();
    if (cat.includes("desayuno") || cat.includes("breakfast")) return "healthy breakfast bowl";
    if (cat.includes("almuerzo") || cat.includes("lunch")) return "healthy lunch plate";
    if (cat.includes("comida") || cat.includes("dinner")) return "dinner plate food";
    if (cat.includes("cena")) return "dinner plate healthy";
    if (cat.includes("merienda") || cat.includes("snack")) return "healthy snack food";
    if (cat.includes("postre") || cat.includes("dessert")) return "dessert plate";
    if (cat.includes("ensalada") || cat.includes("salad")) return "salad bowl fresh";
    if (cat.includes("sopa") || cat.includes("soup")) return "soup bowl";
    if (cat.includes("carne") || cat.includes("meat")) return "meat dish plate";
    if (cat.includes("pescado") || cat.includes("fish")) return "fish dish plate";
  }
  
  return "healthy food plate";
}

// Use Unsplash Source (free, no API key needed) with specific dimensions
function buildImageUrl(query, seed) {
  // Use picsum.photos with a seed for consistent images, or unsplash source
  // Unsplash Source: https://source.unsplash.com/featured/400x300/?{query}
  // We'll use a combination approach with a fixed seed per recipe for consistency
  const encodedQuery = encodeURIComponent(query);
  return `https://source.unsplash.com/featured/400x300/?${encodedQuery}&sig=${seed}`;
}

let updated = 0;
for (const recipe of recipes) {
  const query = getUnsplashQuery(recipe.name, recipe.category);
  const imageUrl = buildImageUrl(query, recipe.id);
  
  await connection.execute(
    "UPDATE recipes SET imageUrl = ? WHERE id = ?",
    [imageUrl, recipe.id]
  );
  updated++;
  
  if (updated % 10 === 0) {
    console.log(`  Updated ${updated}/${recipes.length} recipes...`);
  }
}

console.log(`\n✅ Updated ${updated} recipes with Unsplash images`);
await connection.end();
