/**
 * Script to assign real food images to recipes using direct Unsplash CDN URLs.
 * Uses a curated catalog of food photography images per category.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Curated catalog of direct Unsplash image URLs by food category
// Format: https://images.unsplash.com/photo-{id}?w=400&h=300&fit=crop&auto=format
const FOOD_IMAGES = {
  smoothie: [
    "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400&h=300&fit=crop&auto=format",
  ],
  avena: [
    "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop&auto=format",
  ],
  tostada: [
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&h=300&fit=crop&auto=format",
  ],
  huevo: [
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1607690424560-35d967d6ad7b?w=400&h=300&fit=crop&auto=format",
  ],
  yogur: [
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop&auto=format",
  ],
  pancake: [
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=300&fit=crop&auto=format",
  ],
  granola: [
    "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400&h=300&fit=crop&auto=format",
  ],
  fruta: [
    "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop&auto=format",
  ],
  ensalada: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=400&h=300&fit=crop&auto=format",
  ],
  sopa: [
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=400&h=300&fit=crop&auto=format",
  ],
  pollo: [
    "https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400&h=300&fit=crop&auto=format",
  ],
  carne: [
    "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&auto=format",
  ],
  salmon: [
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop&auto=format",
  ],
  pescado: [
    "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=300&fit=crop&auto=format",
  ],
  gambas: [
    "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1559742811-822873691df8?w=400&h=300&fit=crop&auto=format",
  ],
  pasta: [
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=400&h=300&fit=crop&auto=format",
  ],
  arroz: [
    "https://images.unsplash.com/photo-1536304993881-ff86e0c9b3e0?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=300&fit=crop&auto=format",
  ],
  legumbre: [
    "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&auto=format",
  ],
  verdura: [
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop&auto=format",
  ],
  sandwich: [
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&h=300&fit=crop&auto=format",
  ],
  pizza: [
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&auto=format",
  ],
  burger: [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop&auto=format",
  ],
  curry: [
    "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&auto=format",
  ],
  wok: [
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop&auto=format",
  ],
  postre: [
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop&auto=format",
  ],
  snack: [
    "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&auto=format",
  ],
  default: [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop&auto=format",
  ],
};

function getImageUrl(recipeName, recipeId) {
  const name = recipeName.toLowerCase();
  
  let category = "default";
  if (/smoothie|batido|licuado/.test(name)) category = "smoothie";
  else if (/avena|porridge|oatmeal|granola|muesli/.test(name)) category = "avena";
  else if (/tostada|toast/.test(name)) category = "tostada";
  else if (/huevo|egg|tortilla francesa|revuelto/.test(name)) category = "huevo";
  else if (/yogur|yogurt/.test(name)) category = "yogur";
  else if (/pancake|crepe|tortita/.test(name)) category = "pancake";
  else if (/fruta|macedonia|berry|arándano|fresa|mango/.test(name)) category = "fruta";
  else if (/ensalada|salad/.test(name)) category = "ensalada";
  else if (/sopa|soup|caldo|crema de/.test(name)) category = "sopa";
  else if (/pollo|chicken|alita|nugget/.test(name)) category = "pollo";
  else if (/ternera|beef|res|filete|chuletón|costilla|hamburguesa/.test(name)) category = "carne";
  else if (/salmón|salmon/.test(name)) category = "salmon";
  else if (/gambas|shrimp|langostino|marisco/.test(name)) category = "gambas";
  else if (/pescado|merluza|bacalao|atún|tuna|dorada|lubina|trucha/.test(name)) category = "pescado";
  else if (/pasta|espagueti|spaghetti|penne|macarrón|fettuccine|lasaña/.test(name)) category = "pasta";
  else if (/arroz|rice|risotto|paella/.test(name)) category = "arroz";
  else if (/lentejas|garbanzos|judías|alubias|legumbre/.test(name)) category = "legumbre";
  else if (/verdura|brócoli|espinaca|calabacín|berenjena|pimiento|zanahoria/.test(name)) category = "verdura";
  else if (/bocadillo|sandwich|wrap|pita/.test(name)) category = "sandwich";
  else if (/pizza/.test(name)) category = "pizza";
  else if (/hamburguesa|burger/.test(name)) category = "burger";
  else if (/curry/.test(name)) category = "curry";
  else if (/wok|salteado|stir.fry/.test(name)) category = "wok";
  else if (/postre|tarta|cake|bizcocho|brownie|galleta|muffin|donut/.test(name)) category = "postre";
  else if (/snack|chips|frutos secos|nuez|almendra/.test(name)) category = "snack";
  
  const images = FOOD_IMAGES[category] || FOOD_IMAGES.default;
  // Use recipe ID to pick a consistent image from the category
  return images[recipeId % images.length];
}

// Fetch all recipes
const [recipes] = await connection.execute(
  "SELECT id, name, category FROM recipes ORDER BY id"
);

console.log(`Updating ${recipes.length} recipes with direct Unsplash images...`);

let updated = 0;
for (const recipe of recipes) {
  const imageUrl = getImageUrl(recipe.name, recipe.id);
  
  await connection.execute(
    "UPDATE recipes SET imageUrl = ? WHERE id = ?",
    [imageUrl, recipe.id]
  );
  updated++;
  
  if (updated % 20 === 0) {
    console.log(`  Updated ${updated}/${recipes.length} recipes...`);
  }
}

console.log(`\n✅ Updated ${updated} recipes with direct Unsplash CDN images`);
await connection.end();
