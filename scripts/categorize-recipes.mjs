/**
 * Script to categorize existing seeded recipes with cuisineType and cookingMethod
 * Uses AI to analyze recipe names and assign appropriate categories
 * Run: node scripts/categorize-recipes.mjs
 */

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

const DB_URL = process.env.DATABASE_URL;

// Parse MySQL connection URL
function parseDbUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error("Invalid DATABASE_URL format");
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5].split("?")[0],
    ssl: { rejectUnauthorized: false },
  };
}

// Categorization rules based on recipe name keywords
function categorizeRecipe(name) {
  const n = name.toLowerCase();

  // Cuisine type detection
  let cuisineType = "española";

  if (n.includes("sushi") || n.includes("ramen") || n.includes("miso") || n.includes("teriyaki") || n.includes("edamame") || n.includes("tempura") || n.includes("yakitori") || n.includes("onigiri") || n.includes("udon") || n.includes("gyoza") || n.includes("pad thai") || n.includes("curry") || n.includes("thai") || n.includes("wok") || n.includes("noodle") || n.includes("bok choy") || n.includes("tofu") || n.includes("mango sticky") || n.includes("kimchi") || n.includes("bibimbap")) {
    cuisineType = "asiatica";
  } else if (n.includes("pasta") || n.includes("pizza") || n.includes("risotto") || n.includes("lasaña") || n.includes("lasagna") || n.includes("pesto") || n.includes("carbonara") || n.includes("bolognesa") || n.includes("gnocchi") || n.includes("focaccia") || n.includes("tiramisu") || n.includes("bruschetta") || n.includes("caprese") || n.includes("minestrone") || n.includes("ossobuco") || n.includes("polenta") || n.includes("arancini") || n.includes("italiana") || n.includes("italiano")) {
    cuisineType = "italiana";
  } else if (n.includes("taco") || n.includes("burrito") || n.includes("quesadilla") || n.includes("guacamole") || n.includes("enchilada") || n.includes("fajita") || n.includes("nachos") || n.includes("salsa verde") || n.includes("mexicana") || n.includes("mexicano") || n.includes("chipotle") || n.includes("jalapeño")) {
    cuisineType = "mexicana";
  } else if (n.includes("burger") || n.includes("hamburguesa") || n.includes("hot dog") || n.includes("bbq") || n.includes("barbacoa") || n.includes("pancake") || n.includes("waffle") || n.includes("brownie") || n.includes("cheesecake") || n.includes("muffin") || n.includes("bagel") || n.includes("bagels") || n.includes("smoothie bowl") || n.includes("granola")) {
    cuisineType = "americana";
  } else if (n.includes("hummus") || n.includes("falafel") || n.includes("shawarma") || n.includes("kebab") || n.includes("cuscús") || n.includes("couscous") || n.includes("taboulé") || n.includes("tabbouleh") || n.includes("baba") || n.includes("pita") || n.includes("tzatziki") || n.includes("moussaka") || n.includes("árabe") || n.includes("arabe")) {
    cuisineType = "arabe";
  } else if (n.includes("gazpacho") || n.includes("paella") || n.includes("tortilla española") || n.includes("croqueta") || n.includes("cocido") || n.includes("fabada") || n.includes("pisto") || n.includes("salmorejo") || n.includes("patatas bravas") || n.includes("pulpo") || n.includes("jamón") || n.includes("jamon") || n.includes("chorizo") || n.includes("manchego") || n.includes("horchata") || n.includes("crema catalana") || n.includes("churro") || n.includes("empanada") || n.includes("gambas al ajillo") || n.includes("albondigas") || n.includes("albóndigas") || n.includes("cochinillo") || n.includes("callos")) {
    cuisineType = "española";
  } else if (n.includes("crêpe") || n.includes("crepe") || n.includes("quiche") || n.includes("ratatouille") || n.includes("bouillabaisse") || n.includes("croissant") || n.includes("baguette") || n.includes("francesa") || n.includes("francés") || n.includes("vichyssoise") || n.includes("soufflé") || n.includes("souffle") || n.includes("crème brûlée") || n.includes("creme brulee")) {
    cuisineType = "francesa";
  } else if (n.includes("shakshuka") || n.includes("tagine") || n.includes("tajine") || n.includes("marroquí") || n.includes("marroqui") || n.includes("ras el hanout") || n.includes("chermoula")) {
    cuisineType = "africana";
  } else if (n.includes("mediterráne") || n.includes("mediterranea") || n.includes("griego") || n.includes("griega") || n.includes("griega") || n.includes("tzatziki") || n.includes("souvlaki") || n.includes("spanakopita") || n.includes("baklava")) {
    cuisineType = "mediterranea";
  } else if (n.includes("açaí") || n.includes("acai") || n.includes("brigadeiro") || n.includes("ceviche") || n.includes("peruana") || n.includes("peruano") || n.includes("colombiana") || n.includes("colombiano") || n.includes("argentina") || n.includes("argentino") || n.includes("chimichurri") || n.includes("asado")) {
    cuisineType = "latinoamericana";
  }

  // Cooking method detection
  let cookingMethod = "plancha";

  if (n.includes("airfryer") || n.includes("air fryer") || n.includes("freidora de aire") || n.includes("air-fryer")) {
    cookingMethod = "airfryer";
  } else if (n.includes("horno") || n.includes("horneado") || n.includes("asado al horno") || n.includes("gratinado") || n.includes("baked") || n.includes("roasted") || n.includes("pizza") || n.includes("lasaña") || n.includes("lasagna") || n.includes("quiche") || n.includes("soufflé") || n.includes("brownie") || n.includes("muffin") || n.includes("focaccia") || n.includes("pan de") || n.includes("bizcocho") || n.includes("galletas") || n.includes("magdalena") || n.includes("tarta") || n.includes("pastel") || n.includes("cake")) {
    cookingMethod = "horno";
  } else if (n.includes("microondas") || n.includes("microwave")) {
    cookingMethod = "microondas";
  } else if (n.includes("sin cocción") || n.includes("sin coccion") || n.includes("crudo") || n.includes("cruda") || n.includes("raw") || n.includes("ensalada") || n.includes("gazpacho") || n.includes("salmorejo") || n.includes("ceviche") || n.includes("carpaccio") || n.includes("tartar") || n.includes("sashimi") || n.includes("smoothie") || n.includes("batido") || n.includes("zumo") || n.includes("jugo") || n.includes("overnight") || n.includes("granola") || n.includes("bowl de") || n.includes("açaí") || n.includes("acai") || n.includes("yogur") || n.includes("yogurt") || n.includes("fruta") || n.includes("frutas") || n.includes("tostada con") || n.includes("hummus") || n.includes("guacamole") || n.includes("taboulé") || n.includes("tabbouleh")) {
    cookingMethod = "sin_coccion";
  } else if (n.includes("wok") || n.includes("stir fry") || n.includes("salteado") || n.includes("salteada")) {
    cookingMethod = "wok";
  } else if (n.includes("vapor") || n.includes("steamed") || n.includes("al vapor")) {
    cookingMethod = "vaporizador";
  } else if (n.includes("olla") || n.includes("cocido") || n.includes("estofado") || n.includes("guiso") || n.includes("sopa") || n.includes("caldo") || n.includes("crema de") || n.includes("potaje") || n.includes("fabada") || n.includes("lentejas") || n.includes("garbanzos con") || n.includes("ramen") || n.includes("minestrone") || n.includes("bouillabaisse") || n.includes("curry") || n.includes("risotto") || n.includes("arroz con") || n.includes("paella") || n.includes("fideuá") || n.includes("fideua")) {
    cookingMethod = "olla";
  } else if (n.includes("plancha") || n.includes("sartén") || n.includes("sarten") || n.includes("frito") || n.includes("frita") || n.includes("fritas") || n.includes("fritos") || n.includes("tortilla") || n.includes("crepe") || n.includes("crêpe") || n.includes("pancake") || n.includes("waffle") || n.includes("scrambled") || n.includes("revuelto") || n.includes("huevos") || n.includes("hamburguesa") || n.includes("burger") || n.includes("salmón") || n.includes("salmon") || n.includes("pollo a la") || n.includes("filete") || n.includes("pechuga") || n.includes("ternera") || n.includes("cerdo") || n.includes("gambas") || n.includes("calamares") || n.includes("sepia") || n.includes("atún") || n.includes("atun") || n.includes("merluza") || n.includes("dorada") || n.includes("lubina")) {
    cookingMethod = "plancha";
  }

  return { cuisineType, cookingMethod };
}

async function main() {
  console.log("Connecting to database...");
  const conn = await createConnection(parseDbUrl(DB_URL));

  // Get all seeded recipes
  const [rows] = await conn.execute(
    "SELECT id, name FROM recipes WHERE isSeeded = 1 ORDER BY id"
  );

  console.log(`Found ${rows.length} seeded recipes to categorize`);

  let updated = 0;
  const batchSize = 50;

  for (let i = 0; i < rows.length; i++) {
    const recipe = rows[i];
    const { cuisineType, cookingMethod } = categorizeRecipe(recipe.name);

    await conn.execute(
      "UPDATE recipes SET cuisineType = ?, cookingMethod = ? WHERE id = ?",
      [cuisineType, cookingMethod, recipe.id]
    );

    updated++;
    if (updated % batchSize === 0) {
      console.log(`Updated ${updated}/${rows.length} recipes...`);
    }
  }

  // Print summary
  const [cuisineSummary] = await conn.execute(
    "SELECT cuisineType, COUNT(*) as count FROM recipes WHERE isSeeded = 1 GROUP BY cuisineType ORDER BY count DESC"
  );
  const [methodSummary] = await conn.execute(
    "SELECT cookingMethod, COUNT(*) as count FROM recipes WHERE isSeeded = 1 GROUP BY cookingMethod ORDER BY count DESC"
  );

  console.log("\n=== Cuisine Type Distribution ===");
  cuisineSummary.forEach(r => console.log(`  ${r.cuisineType}: ${r.count}`));

  console.log("\n=== Cooking Method Distribution ===");
  methodSummary.forEach(r => console.log(`  ${r.cookingMethod}: ${r.count}`));

  console.log(`\n✅ Done! Updated ${updated} recipes.`);
  await conn.end();
}

main().catch(console.error);
