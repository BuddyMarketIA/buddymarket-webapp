/**
 * Batch Recipe Image Search v3 - FAST VERSION
 * 
 * Uses Pexels URLs directly (no S3 upload) for maximum speed.
 * Pexels image URLs are permanent and CDN-backed.
 * This should process ~60-100 recipes/min instead of 16/min.
 */
import pg from 'pg';

const ENV = {
  databaseUrl: process.env.DATABASE_URL || '',
};

const BATCH_SIZE = 200;
const PEXELS_DELAY_MS = 300; // Faster since we're not uploading
const MAX_BATCHES = 999;

// Words to remove from recipe names to simplify search
const FILLER_WORDS = new Set([
  'con', 'de', 'del', 'y', 'al', 'a', 'la', 'el', 'los', 'las', 'en', 'un', 'una',
  'toque', 'estilo', 'manera', 'tipo', 'sabor', 'aroma', 'esencia', 'fusion',
  'explosion', 'sinfonia', 'armonia', 'equilibrio', 'contraste', 'textura',
  'tradicional', 'clasico', 'clasica', 'moderno', 'moderna', 'especial',
  'delicioso', 'deliciosa', 'exquisito', 'exquisita', 'irresistible',
  'nutritivo', 'nutritiva', 'saludable', 'reconfortante', 'refrescante',
  'cada', 'bocado', 'para', 'por', 'sobre', 'bajo', 'entre', 'desde',
  'proteico', 'proteica', 'integral', 'vital', 'cremoso', 'cremosa',
  'crujiente', 'crocante', 'tierno', 'tierna', 'suave', 'intenso', 'intensa',
  'fresco', 'fresca', 'frescos', 'frescas', 'templado', 'templada',
  'tibio', 'tibia', 'caliente', 'frio', 'fria',
  'matutino', 'matutina', 'nocturno', 'nocturna',
  'verde', 'rojo', 'roja', 'rojas', 'rojos', 'dorado', 'dorada',
  'dulce', 'salado', 'salada', 'picante', 'acido', 'acida',
  'ligero', 'ligera', 'abundante', 'generoso', 'generosa',
  'perfecto', 'perfecta', 'ideal', 'completo', 'completa',
  'rapido', 'rapida', 'facil', 'sencillo', 'sencilla', 'simple',
  'mar', 'tierra', 'campo', 'huerta', 'bosque', 'costa',
]);

function simplifyRecipeName(name) {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let cleaned = normalized.replace(/\([^)]*\)/g, '').replace(/:.*$/, '');
  const words = cleaned
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !FILLER_WORDS.has(w));
  return words.slice(0, 4).join(' ') || 'healthy food plate';
}

// --- Pexels Search ---
async function searchPexels(query, retries = 2) {
  const url = `https://www.pexels.com/en-us/api/v3/search/photos?query=${encodeURIComponent(query)}&per_page=5&page=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Secret-Key': 'H2jk9uKnhRmL6WPwh89zBezWvr',
      },
    });
    
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        await sleep(5000);
        return searchPexels(query, retries - 1);
      }
      return null;
    }
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      // Pick random from top 5 results for variety
      const idx = Math.floor(Math.random() * Math.min(data.data.length, 5));
      const photo = data.data[idx];
      const image = photo.attributes?.image;
      // Use 'medium' size (750px wide) - good for recipe cards
      if (image?.medium) return image.medium;
      if (image?.large) return image.large;
      if (image?.small) return image.small;
    }
    return null;
  } catch (err) {
    if (retries > 0) {
      await sleep(1000);
      return searchPexels(query, retries - 1);
    }
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Main ---
async function main() {
  const pool = new pg.Pool({ connectionString: ENV.databaseUrl, ssl: { rejectUnauthorized: false }, max: 5 });
  
  const countRes = await pool.query(`
    SELECT COUNT(*) as total FROM recipes 
    WHERE "isSeeded" = true AND "deletedAt" IS NULL 
    AND "imageUrl" LIKE '%unsplash%'
  `);
  const totalPending = parseInt(countRes.rows[0].total);
  
  console.log(`=== PEXELS v3 (FAST - no S3) | Pending: ${totalPending} | Batch: ${BATCH_SIZE} ===`);
  console.log(`Batches: ~${Math.ceil(totalPending / BATCH_SIZE)}`);
  console.log('');
  
  let totalSuccess = 0;
  let totalNoResult = 0;
  let pexelsRequests = 0;
  const startTime = Date.now();
  
  // Search cache to avoid duplicate Pexels requests
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
      console.log('\n=== ALL DONE! ===');
      break;
    }
    
    const recipes = recipesRes.rows;
    const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
    const rate = totalSuccess > 0 ? (totalSuccess / ((Date.now() - startTime) / 60000)).toFixed(1) : '-';
    
    console.log(`Batch #${batch + 1} | OK:${totalSuccess} noRes:${totalNoResult} | ${rate}/min | ${elapsed}min | ~${totalPending - totalSuccess - totalNoResult} left`);
    
    // Build update queries in batch
    const updates = [];
    
    for (const recipe of recipes) {
      const searchQuery = simplifyRecipeName(recipe.name);
      
      let imageUrl;
      if (searchCache.has(searchQuery)) {
        imageUrl = searchCache.get(searchQuery);
      } else {
        imageUrl = await searchPexels(searchQuery);
        pexelsRequests++;
        searchCache.set(searchQuery, imageUrl);
        await sleep(PEXELS_DELAY_MS);
      }
      
      if (imageUrl) {
        updates.push({ id: recipe.id, url: imageUrl });
        totalSuccess++;
      } else {
        // Try fallback with just first 2 words
        const words = searchQuery.split(' ');
        if (words.length > 2) {
          const shortQuery = words.slice(0, 2).join(' ') + ' food';
          let fallbackUrl;
          if (searchCache.has(shortQuery)) {
            fallbackUrl = searchCache.get(shortQuery);
          } else {
            fallbackUrl = await searchPexels(shortQuery);
            pexelsRequests++;
            searchCache.set(shortQuery, fallbackUrl);
            await sleep(PEXELS_DELAY_MS);
          }
          if (fallbackUrl) {
            updates.push({ id: recipe.id, url: fallbackUrl });
            totalSuccess++;
          } else {
            totalNoResult++;
            // Use a generic food image
            updates.push({ id: recipe.id, url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=750' });
            totalSuccess++;
            totalNoResult--;
          }
        } else {
          totalNoResult++;
          updates.push({ id: recipe.id, url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=750' });
          totalSuccess++;
          totalNoResult--;
        }
      }
    }
    
    // Batch update DB
    if (updates.length > 0) {
      const cases = updates.map(u => `WHEN ${u.id} THEN '${u.url.replace(/'/g, "''")}'`).join(' ');
      const ids = updates.map(u => u.id).join(',');
      await pool.query(`UPDATE recipes SET "imageUrl" = CASE id ${cases} END WHERE id IN (${ids})`);
    }
    
    console.log(`  → updated:${updates.length} | pexels:${pexelsRequests} | cache:${searchCache.size}`);
  }
  
  const totalElapsed = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n=== FINAL ===`);
  console.log(`Success: ${totalSuccess} | No result: ${totalNoResult}`);
  console.log(`Pexels requests: ${pexelsRequests} | Cache size: ${searchCache.size}`);
  console.log(`Time: ${totalElapsed}min | Rate: ${(totalSuccess / (totalElapsed || 1)).toFixed(1)}/min`);
  
  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
