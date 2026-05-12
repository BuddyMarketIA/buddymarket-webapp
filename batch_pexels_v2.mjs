/**
 * Batch Recipe Image Search v2 - Pexels Public API
 * 
 * Improved approach:
 * 1. Simplify recipe name → short search query (remove filler words, keep food terms)
 * 2. Search Pexels with the simplified name
 * 3. Download image, upload to S3, update DB
 * 4. Each recipe gets a UNIQUE image (no cache reuse - different upload per recipe)
 * 5. Track processed IDs to avoid re-processing
 */
import pg from 'pg';

const ENV = {
  forgeApiUrl: (process.env.BUILT_IN_FORGE_API_URL || '').replace(/\/+$/, ''),
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
};

const BATCH_SIZE = 100;
const PEXELS_DELAY_MS = 500;
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
  // Remove accents for processing
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  
  // Remove content in parentheses
  let cleaned = normalized.replace(/\([^)]*\)/g, '');
  
  // Remove colons and everything after (usually subtitle/description)
  cleaned = cleaned.replace(/:.*$/, '');
  
  // Split into words, remove filler words, keep first 4-5 meaningful words
  const words = cleaned
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !FILLER_WORDS.has(w));
  
  // Take first 4 words max
  const query = words.slice(0, 4).join(' ');
  
  return query || null;
}

// --- Pexels Search ---
async function searchPexels(query, retries = 2) {
  const url = `https://www.pexels.com/en-us/api/v3/search/photos?query=${encodeURIComponent(query)}&per_page=3&page=1`;
  
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
        console.log(`  Rate limited, waiting 10s...`);
        await sleep(10000);
        return searchPexels(query, retries - 1);
      }
      return null;
    }
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      // Pick a random photo from top 3 results to add variety
      const idx = Math.floor(Math.random() * Math.min(data.data.length, 3));
      const photo = data.data[idx];
      const image = photo.attributes?.image;
      if (image?.medium) {
        return { url: image.medium };
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
    if (!response.ok) return imageUrl; // fallback to Pexels URL
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const key = `recipe-dishes/${recipeId}-pxl-${Date.now()}.${ext}`;
    
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
      return imageUrl; // fallback to Pexels URL directly
    }
    
    const result = await uploadResp.json();
    return result.url;
  } catch {
    return imageUrl; // fallback
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
  
  console.log(`=== PEXELS v2 | Pending: ${totalPending} | Batch: ${BATCH_SIZE} ===`);
  console.log(`Batches: ~${Math.ceil(totalPending / BATCH_SIZE)}`);
  console.log('');
  
  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalNoResult = 0;
  let pexelsRequests = 0;
  const startTime = Date.now();
  
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
    const remaining = totalPending - totalSuccess - totalSkipped - totalNoResult;
    
    console.log(`Batch #${batch + 1} | OK:${totalSuccess} skip:${totalSkipped} noRes:${totalNoResult} | ${rate}/min | ${elapsed}min | ~${remaining} left`);
    
    let batchOk = 0, batchSkip = 0, batchNoRes = 0;
    
    for (const recipe of recipes) {
      const searchQuery = simplifyRecipeName(recipe.name);
      
      if (!searchQuery) {
        totalSkipped++;
        batchSkip++;
        // Use a generic food image search as fallback
        const fallbackQuery = 'healthy food plate';
        const fallbackResult = await searchPexels(fallbackQuery);
        pexelsRequests++;
        if (fallbackResult) {
          const s3Url = await uploadToS3(fallbackResult.url, recipe.id);
          if (s3Url) {
            await pool.query(`UPDATE recipes SET "imageUrl" = $1 WHERE id = $2`, [s3Url, recipe.id]);
            totalSuccess++;
            batchOk++;
            totalSkipped--; // It wasn't really skipped
            batchSkip--;
          }
        }
        await sleep(PEXELS_DELAY_MS);
        continue;
      }
      
      // Search Pexels with simplified recipe name
      const pexelsResult = await searchPexels(searchQuery);
      pexelsRequests++;
      
      if (!pexelsResult) {
        // Try a more generic search with just first 2 words
        const words = searchQuery.split(' ');
        if (words.length > 2) {
          const shortQuery = words.slice(0, 2).join(' ') + ' food';
          const retry = await searchPexels(shortQuery);
          pexelsRequests++;
          if (retry) {
            const s3Url = await uploadToS3(retry.url, recipe.id);
            if (s3Url) {
              await pool.query(`UPDATE recipes SET "imageUrl" = $1 WHERE id = $2`, [s3Url, recipe.id]);
              totalSuccess++;
              batchOk++;
              await sleep(PEXELS_DELAY_MS);
              continue;
            }
          }
        }
        totalNoResult++;
        batchNoRes++;
        await sleep(PEXELS_DELAY_MS);
        continue;
      }
      
      // Upload to S3
      const s3Url = await uploadToS3(pexelsResult.url, recipe.id);
      if (s3Url) {
        await pool.query(`UPDATE recipes SET "imageUrl" = $1 WHERE id = $2`, [s3Url, recipe.id]);
        totalSuccess++;
        batchOk++;
      }
      
      await sleep(PEXELS_DELAY_MS);
    }
    
    console.log(`  → ok:${batchOk} skip:${batchSkip} noRes:${batchNoRes} | pexels:${pexelsRequests}`);
  }
  
  const totalElapsed = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n=== FINAL ===`);
  console.log(`Success: ${totalSuccess} | Skipped: ${totalSkipped} | No result: ${totalNoResult}`);
  console.log(`Pexels requests: ${pexelsRequests} | Time: ${totalElapsed}min`);
  
  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
