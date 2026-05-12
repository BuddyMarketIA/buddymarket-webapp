/**
 * Single batch processor - processes exactly 200 recipes then exits.
 * Designed to be called in a loop by a bash script to avoid hanging.
 */
import pg from 'pg';

const BATCH_SIZE = 200;
const PEXELS_DELAY_MS = 300;
const FETCH_TIMEOUT_MS = 8000;
const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=750';

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
  'verde', 'rojo', 'roja', 'dorado', 'dorada',
  'dulce', 'salado', 'salada', 'picante', 'acido', 'acida',
  'ligero', 'ligera', 'perfecto', 'perfecta', 'ideal', 'completo', 'completa',
  'rapido', 'rapida', 'facil', 'sencillo', 'sencilla', 'simple',
  'mar', 'tierra', 'campo', 'huerta', 'bosque', 'costa',
]);

function simplifyRecipeName(name) {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let cleaned = normalized.replace(/\([^)]*\)/g, '').replace(/:.*$/, '');
  const words = cleaned.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 2 && !FILLER_WORDS.has(w));
  return words.slice(0, 4).join(' ') || 'healthy food plate';
}

function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

async function searchPexels(query) {
  const url = `https://www.pexels.com/en-us/api/v3/search/photos?query=${encodeURIComponent(query)}&per_page=5&page=1`;
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Secret-Key': 'H2jk9uKnhRmL6WPwh89zBezWvr',
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const idx = Math.floor(Math.random() * Math.min(data.data.length, 5));
      const image = data.data[idx].attributes?.image;
      return image?.medium || image?.large || image?.small || null;
    }
    return null;
  } catch { return null; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const recipesRes = await pool.query(`
      SELECT id, name FROM recipes 
      WHERE "isSeeded" = true AND "deletedAt" IS NULL 
      AND "imageUrl" LIKE '%unsplash%'
      ORDER BY id ASC LIMIT $1
    `, [BATCH_SIZE]);

    if (recipesRes.rows.length === 0) {
      console.log('DONE:0');
      await pool.end();
      process.exit(0);
    }

    const recipes = recipesRes.rows;
    const updates = [];
    let ok = 0;

    for (const recipe of recipes) {
      const query = simplifyRecipeName(recipe.name);
      let imageUrl = await searchPexels(query);
      
      if (!imageUrl) {
        const words = query.split(' ');
        if (words.length > 2) {
          imageUrl = await searchPexels(words.slice(0, 2).join(' ') + ' food');
        }
      }
      
      updates.push({ id: recipe.id, url: imageUrl || FALLBACK_IMAGE });
      if (imageUrl) ok++;
      await sleep(PEXELS_DELAY_MS);
    }

    // Batch update
    if (updates.length > 0) {
      const cases = updates.map(u => `WHEN ${u.id} THEN '${u.url.replace(/'/g, "''")}'`).join(' ');
      const ids = updates.map(u => u.id).join(',');
      await pool.query(`UPDATE recipes SET "imageUrl" = CASE id ${cases} END WHERE id IN (${ids})`);
    }

    console.log(`OK:${updates.length} pexels:${ok} fallback:${updates.length - ok}`);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('ERR:', err.message);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

// Force exit after 5 minutes no matter what
setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 300000);

main();
