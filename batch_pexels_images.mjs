/**
 * Batch Recipe Image Search via Pexels Public API v3
 * 
 * Strategy:
 * 1. Get pending recipes (those with Unsplash URLs)
 * 2. Extract a short searchable English term from each recipe name
 * 3. Search Pexels for that term
 * 4. Download the best image, upload to S3, update DB
 * 5. Process in batches of 100, with delay between Pexels requests
 */
import pg from 'pg';

const ENV = {
  forgeApiUrl: (process.env.BUILT_IN_FORGE_API_URL || '').replace(/\/+$/, ''),
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
};

const BATCH_SIZE = 100;
const PEXELS_DELAY_MS = 600;
const MAX_BATCHES = 999;

// --- Normalize text: remove accents ---
function norm(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// --- Keyword extraction from Spanish recipe names ---
const FOOD_MAP = [
  // Proteins
  ['salmon', 'salmon'], ['pollo', 'chicken'], ['pavo', 'turkey'],
  ['ternera', 'beef'], ['cerdo', 'pork'], ['cordero', 'lamb'],
  ['atun', 'tuna'], ['bacalao', 'cod'], ['merluza', 'hake'],
  ['gambas', 'shrimp'], ['langostinos', 'shrimp'], ['calamares', 'squid'],
  ['pulpo', 'octopus'], ['mejillones', 'mussels'], ['sardinas', 'sardines'],
  ['lubina', 'sea bass'], ['dorada', 'sea bream'], ['trucha', 'trout'],
  ['huevo', 'egg'], ['tofu', 'tofu'], ['tempeh', 'tempeh'],
  ['seitan', 'seitan'], ['lomo', 'loin'], ['pechuga', 'chicken breast'],
  ['jamon', 'ham'],
  // Grains & legumes
  ['quinoa', 'quinoa'], ['arroz', 'rice'], ['pasta', 'pasta'],
  ['lentejas', 'lentils'], ['garbanzos', 'chickpeas'], ['alubias', 'beans'],
  ['judias', 'beans'], ['avena', 'oats'], ['mijo', 'millet'],
  ['cuscus', 'couscous'], ['espelta', 'spelt'], ['bulgur', 'bulgur'],
  ['trigo', 'wheat'],
  // Vegetables
  ['espinacas', 'spinach'], ['brocoli', 'broccoli'], ['calabacin', 'zucchini'],
  ['calabaza', 'pumpkin'], ['berenjena', 'eggplant'], ['pimiento', 'pepper'],
  ['tomate', 'tomato'], ['aguacate', 'avocado'], ['pepino', 'cucumber'],
  ['zanahoria', 'carrot'], ['batata', 'sweet potato'], ['boniato', 'sweet potato'],
  ['patata', 'potato'], ['champinones', 'mushrooms'], ['setas', 'mushrooms'],
  ['kale', 'kale'], ['nopal', 'cactus'], ['alcachofa', 'artichoke'],
  ['coliflor', 'cauliflower'], ['remolacha', 'beet'], ['edamame', 'edamame'],
  ['esparragos', 'asparagus'], ['guisantes', 'peas'], ['maiz', 'corn'],
  ['cebolla', 'onion'], ['ajo', 'garlic'], ['puerro', 'leek'],
  // Fruits & nuts
  ['manzana', 'apple'], ['platano', 'banana'], ['fresas', 'strawberries'],
  ['frambuesa', 'raspberry'], ['arandanos', 'blueberries'],
  ['almendra', 'almond'], ['nueces', 'walnuts'], ['pistachos', 'pistachios'],
  ['cacao', 'chocolate'], ['chocolate', 'chocolate'], ['coco', 'coconut'],
  ['mango', 'mango'], ['pina', 'pineapple'], ['naranja', 'orange'],
  ['limon', 'lemon'], ['melocoton', 'peach'], ['pera', 'pear'],
  ['higos', 'figs'], ['datiles', 'dates'],
  // Dairy
  ['yogur', 'yogurt'], ['queso', 'cheese'], ['ricotta', 'ricotta'],
  ['mozzarella', 'mozzarella'],
  // Seeds & extras
  ['chia', 'chia'], ['linaza', 'flaxseed'], ['semillas', 'seeds'],
];

const DISH_MAP = [
  ['ensalada', 'salad'], ['sopa', 'soup'], ['crema de', 'cream soup'],
  ['guiso', 'stew'], ['estofado', 'stew'], ['tazon', 'bowl'],
  ['bowl', 'bowl'], ['wrap', 'wrap'], ['rollitos', 'spring rolls'],
  ['bocaditos', 'bites'], ['tostadas', 'toast'], ['tortilla', 'omelette'],
  ['revuelto', 'scrambled eggs'], ['smoothie', 'smoothie'], ['batido', 'smoothie'],
  ['mousse', 'mousse'], ['pudding', 'pudding'], ['pudin', 'pudding'],
  ['crumble', 'crumble'], ['muffins', 'muffins'], ['galletas', 'cookies'],
  ['pancakes', 'pancakes'], ['tortitas', 'pancakes'], ['crepes', 'crepes'],
  ['risotto', 'risotto'], ['curry', 'curry'], ['wok', 'stir fry'],
  ['salteado', 'stir fry'], ['hamburguesa', 'burger'], ['pizza', 'pizza'],
  ['lasana', 'lasagna'], ['paella', 'paella'], ['ceviche', 'ceviche'],
  ['tacos', 'tacos'], ['burritos', 'burritos'], ['fajitas', 'fajitas'],
  ['hummus', 'hummus'], ['dip', 'dip'], ['copa', 'parfait'],
  ['barritas', 'energy bars'], ['bolitas', 'energy balls'],
  ['porridge', 'porridge'], ['overnight', 'overnight oats'],
  ['granola', 'granola'], ['gazpacho', 'gazpacho'],
  ['fideos', 'noodles'], ['tallarines', 'noodles'],
  ['filete', 'fillet'], ['pure', 'puree'], ['croquetas', 'croquettes'],
  ['empanadas', 'empanadas'], ['albondigas', 'meatballs'],
  ['brochetas', 'skewers'], ['pinchitos', 'skewers'],
  ['tartar', 'tartare'], ['carpaccio', 'carpaccio'],
  ['canapes', 'canapes'], ['bruschetta', 'bruschetta'],
  ['merienda', 'snack'], ['desayuno', 'breakfast'],
];

const COOKING_MAP = [
  ['al horno', 'baked'], ['asado', 'roasted'], ['asada', 'roasted'],
  ['a la plancha', 'grilled'], ['plancha', 'grilled'],
  ['frito', 'fried'], ['frita', 'fried'],
  ['al vapor', 'steamed'], ['crujiente', 'crispy'], ['crocante', 'crispy'],
  ['gratinado', 'gratin'], ['poche', 'poached'],
];

function extractSearchTerms(recipeName) {
  const normalized = norm(recipeName);
  
  let dishType = '';
  let mainIngredients = [];
  let cookingMethod = '';
  
  // Find dish type
  for (const [es, en] of DISH_MAP) {
    if (normalized.includes(norm(es))) {
      dishType = en;
      break;
    }
  }
  
  // Find cooking method
  for (const [es, en] of COOKING_MAP) {
    if (normalized.includes(norm(es))) {
      cookingMethod = en;
      break;
    }
  }
  
  // Find main ingredients (max 2)
  for (const [es, en] of FOOD_MAP) {
    if (normalized.includes(norm(es)) && !mainIngredients.includes(en)) {
      mainIngredients.push(en);
      if (mainIngredients.length >= 2) break;
    }
  }
  
  // Build search query
  const parts = [];
  if (cookingMethod) parts.push(cookingMethod);
  if (mainIngredients.length > 0) parts.push(...mainIngredients);
  if (dishType) parts.push(dishType);
  
  if (parts.length === 0) {
    return null; // Skip - can't determine what to search
  }
  
  // Add "food" to help Pexels find food photos
  return parts.join(' ') + ' food';
}

// --- Pexels Search ---
let pexelsRequestCount = 0;

async function searchPexels(query, retries = 2) {
  const url = `https://www.pexels.com/en-us/api/v3/search/photos?query=${encodeURIComponent(query)}&per_page=1&page=1`;
  
  try {
    pexelsRequestCount++;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Secret-Key': 'H2jk9uKnhRmL6WPwh89zBezWvr',
      },
    });
    
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        console.log(`  Rate limited, waiting 10s...`);
        await sleep(10000);
        return searchPexels(query, retries - 1);
      }
      return null;
    }
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const photo = data.data[0];
      const image = photo.attributes?.image;
      if (image?.medium) {
        return {
          url: image.medium, // Use medium size (750px wide) - good enough for recipe cards
          description: photo.attributes?.description || '',
        };
      }
    }
    return null;
  } catch (err) {
    if (retries > 0) {
      await sleep(2000);
      return searchPexels(query, retries - 1);
    }
    return null;
  }
}

// --- S3 Upload ---
async function uploadToS3(imageUrl, recipeId) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const key = `recipe-dishes/${recipeId}-pexels-${Date.now()}.${ext}`;
    
    const uploadUrl = new URL('v1/storage/upload', ENV.forgeApiUrl + '/');
    uploadUrl.searchParams.set('path', key);
    
    const blob = new Blob([buffer], { type: contentType });
    const form = new FormData();
    form.append('file', blob, `${recipeId}.${ext}`);
    
    const uploadResp = await fetch(uploadUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      body: form,
    });
    
    if (!uploadResp.ok) {
      const msg = await uploadResp.text();
      // If storage is also rate limited, just use the Pexels URL directly
      if (uploadResp.status === 429 || msg.includes('exhausted')) {
        return imageUrl; // Fallback: use Pexels URL directly
      }
      return null;
    }
    
    const result = await uploadResp.json();
    return result.url;
  } catch (err) {
    // Fallback: use Pexels URL directly (they're permanent)
    return imageUrl;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Main ---
async function main() {
  const pool = new pg.Pool({ connectionString: ENV.databaseUrl, ssl: { rejectUnauthorized: false }, max: 5 });
  
  // Count pending
  const countRes = await pool.query(`
    SELECT COUNT(*) as total FROM recipes 
    WHERE "isSeeded" = true AND "deletedAt" IS NULL 
    AND "imageUrl" LIKE '%unsplash%'
  `);
  const totalPending = parseInt(countRes.rows[0].total);
  
  console.log(`=== PEXELS IMAGE SEARCH | Pending: ${totalPending} | Batch: ${BATCH_SIZE} ===`);
  console.log(`Total batches: ~${Math.ceil(totalPending / BATCH_SIZE)}`);
  console.log('');
  
  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalNoResult = 0;
  let totalError = 0;
  let processed = 0;
  const startTime = Date.now();
  
  // Cache: avoid searching the same query twice
  const searchCache = new Map();
  
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const recipesRes = await pool.query(`
      SELECT id, name FROM recipes 
      WHERE "isSeeded" = true AND "deletedAt" IS NULL 
      AND "imageUrl" LIKE '%unsplash%'
      ORDER BY id ASC
      LIMIT $1
    `, [BATCH_SIZE]);
    
    if (recipesRes.rows.length === 0) {
      console.log('\n=== ALL RECIPES PROCESSED! ===');
      break;
    }
    
    const recipes = recipesRes.rows;
    const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
    const rate = totalSuccess > 0 ? (totalSuccess / ((Date.now() - startTime) / 60000)).toFixed(1) : '-';
    
    console.log(`Batch #${batch + 1} | ${recipes.length} recipes | OK:${totalSuccess} skip:${totalSkipped} noRes:${totalNoResult} err:${totalError} | ${rate}/min | ${elapsed}min`);
    
    for (const recipe of recipes) {
      processed++;
      const searchQuery = extractSearchTerms(recipe.name);
      
      if (!searchQuery) {
        totalSkipped++;
        // Mark as processed by setting a special URL so we don't retry
        await pool.query(`UPDATE recipes SET "imageUrl" = $1 WHERE id = $2`, 
          ['https://images.unsplash.com/photo-placeholder-skip', recipe.id]);
        continue;
      }
      
      // Check cache
      let pexelsResult;
      if (searchCache.has(searchQuery)) {
        pexelsResult = searchCache.get(searchQuery);
      } else {
        pexelsResult = await searchPexels(searchQuery);
        searchCache.set(searchQuery, pexelsResult);
        await sleep(PEXELS_DELAY_MS);
      }
      
      if (!pexelsResult) {
        totalNoResult++;
        continue;
      }
      
      // Upload to S3 (or fallback to Pexels URL)
      const finalUrl = await uploadToS3(pexelsResult.url, recipe.id);
      
      if (finalUrl) {
        await pool.query(`UPDATE recipes SET "imageUrl" = $1 WHERE id = $2`, [finalUrl, recipe.id]);
        totalSuccess++;
      } else {
        totalError++;
      }
    }
    
    console.log(`  → Done. Pexels requests: ${pexelsRequestCount} | Cache hits saved: ${processed - pexelsRequestCount - totalSkipped}`);
  }
  
  const totalElapsed = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n=== FINAL RESULTS ===`);
  console.log(`Success: ${totalSuccess} | Skipped: ${totalSkipped} | No result: ${totalNoResult} | Errors: ${totalError}`);
  console.log(`Total Pexels requests: ${pexelsRequestCount}`);
  console.log(`Total time: ${totalElapsed} minutes`);
  
  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
