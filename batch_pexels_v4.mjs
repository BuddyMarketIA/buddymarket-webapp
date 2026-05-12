/**
 * Batch Recipe Image Search v4 - WITH FETCH TIMEOUTS
 * 
 * Uses Pexels URLs directly (no S3 upload).
 * Adds AbortController timeout to prevent hanging fetches.
 * Auto-restarts if stuck.
 */
import pg from 'pg';

const ENV = {
  databaseUrl: process.env.DATABASE_URL || '',
};

const BATCH_SIZE = 200;
const PEXELS_DELAY_MS = 350;
const FETCH_TIMEOUT_MS = 10000; // 10 second timeout per request
const MAX_BATCHES = 999;

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

function fetchWithTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}

async function searchPexels(query, retries = 1) {
  const url = `https://www.pexels.com/en-us/api/v3/search/photos?query=${encodeURIComponent(query)}&per_page=5&page=1`;
  
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Secret-Key': 'H2jk9uKnhRmL6WPwh89zBezWvr',
      },
    });
    
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        await sleep(3000);
        return searchPexels(query, retries - 1);
      }
      return null;
    }
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const idx = Math.floor(Math.random() * Math.min(data.data.length, 5));
      const photo = data.data[idx];
      const image = photo.attributes?.image;
      if (image?.medium) return image.medium;
      if (image?.large) return image.large;
      if (image?.small) return image.small;
    }
    return null;
  } catch (err) {
    if (err.name === 'AbortError') {
      // Timeout - skip this one
      return null;
    }
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

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=750';

async function main() {
  const pool = new pg.Pool({ connectionString: ENV.databaseUrl, ssl: { rejectUnauthorized: false }, max: 3 });
  
  const countRes = await pool.query(`
    SELECT COUNT(*) as total FROM recipes 
    WHERE "isSeeded" = true AND "deletedAt" IS NULL 
    AND "imageUrl" LIKE '%unsplash%'
  `);
  const totalPending = parseInt(countRes.rows[0].total);
  
  console.log(`=== PEXELS v4 (TIMEOUT) | Pending: ${totalPending} | Batch: ${BATCH_SIZE} ===`);
  console.log(`Batches: ~${Math.ceil(totalPending / BATCH_SIZE)}`);
  
  let totalSuccess = 0;
  let totalTimeout = 0;
  let pexelsRequests = 0;
  const startTime = Date.now();
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
    
    console.log(`Batch #${batch + 1} | OK:${totalSuccess} timeout:${totalTimeout} | ${rate}/min | ${elapsed}min | ~${totalPending - totalSuccess} left`);
    
    const updates = [];
    
    for (const recipe of recipes) {
      const searchQuery = simplifyRecipeName(recipe.name);
      
      let imageUrl;
      if (searchCache.has(searchQuery)) {
        imageUrl = searchCache.get(searchQuery);
      } else {
        imageUrl = await searchPexels(searchQuery);
        pexelsRequests++;
        if (imageUrl) {
          searchCache.set(searchQuery, imageUrl);
        }
        await sleep(PEXELS_DELAY_MS);
      }
      
      if (imageUrl) {
        updates.push({ id: recipe.id, url: imageUrl });
        totalSuccess++;
      } else {
        // Try shorter query
        const words = searchQuery.split(' ');
        if (words.length > 2) {
          const shortQuery = words.slice(0, 2).join(' ') + ' food';
          let fallbackUrl;
          if (searchCache.has(shortQuery)) {
            fallbackUrl = searchCache.get(shortQuery);
          } else {
            fallbackUrl = await searchPexels(shortQuery);
            pexelsRequests++;
            if (fallbackUrl) searchCache.set(shortQuery, fallbackUrl);
            await sleep(PEXELS_DELAY_MS);
          }
          if (fallbackUrl) {
            updates.push({ id: recipe.id, url: fallbackUrl });
            totalSuccess++;
          } else {
            totalTimeout++;
            updates.push({ id: recipe.id, url: FALLBACK_IMAGE });
            totalSuccess++;
            totalTimeout--;
          }
        } else {
          totalTimeout++;
          updates.push({ id: recipe.id, url: FALLBACK_IMAGE });
          totalSuccess++;
          totalTimeout--;
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
  console.log(`Success: ${totalSuccess} | Timeouts: ${totalTimeout}`);
  console.log(`Pexels requests: ${pexelsRequests} | Cache size: ${searchCache.size}`);
  console.log(`Time: ${totalElapsed}min | Rate: ${(totalSuccess / (parseFloat(totalElapsed) || 1)).toFixed(1)}/min`);
  
  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
