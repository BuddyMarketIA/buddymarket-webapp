import pg from 'pg';
const BATCH_SIZE = 50;
const FALLBACK = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=750';
const FILLER = new Set(['con','de','del','y','al','a','la','el','los','las','en','un','una','toque','estilo','manera','tipo','sabor','aroma','esencia','fusion','explosion','sinfonia','armonia','equilibrio','contraste','textura','tradicional','clasico','clasica','moderno','moderna','especial','delicioso','deliciosa','exquisito','exquisita','irresistible','nutritivo','nutritiva','saludable','reconfortante','refrescante','cada','bocado','para','por','sobre','bajo','entre','desde','proteico','proteica','integral','vital','cremoso','cremosa','crujiente','crocante','tierno','tierna','suave','intenso','intensa','fresco','fresca','frescos','frescas','templado','templada','tibio','tibia','caliente','frio','fria','verde','rojo','roja','dorado','dorada','dulce','salado','salada','picante','acido','acida','ligero','ligera','perfecto','perfecta','ideal','completo','completa','rapido','rapida','facil','sencillo','sencilla','simple','mar','tierra','campo','huerta','bosque','costa']);

function simplify(n) {
  const s = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/:.*$/, '');
  return s.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !FILLER.has(w)).slice(0, 4).join(' ') || 'healthy food plate';
}

async function searchPexels(query) {
  const url = `https://www.pexels.com/en-us/api/v3/search/photos?query=${encodeURIComponent(query)}&per_page=5&page=1`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const resp = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'Accept': 'application/json', 'Secret-Key': 'H2jk9uKnhRmL6WPwh89zBezWvr' } });
    clearTimeout(t);
    if (!resp.ok) return null;
    const d = await resp.json();
    if (d.data && d.data.length > 0) {
      const img = d.data[Math.floor(Math.random() * Math.min(d.data.length, 5))].attributes?.image;
      return img?.medium || img?.large || img?.small || null;
    }
    return null;
  } catch { clearTimeout(t); return null; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Force exit after 3 minutes
setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 180000);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 5000, connectionTimeoutMillis: 10000 });

try {
  const res = await pool.query(`SELECT id, name FROM recipes WHERE "isSeeded"=true AND "deletedAt" IS NULL AND "imageUrl" LIKE '%unsplash%' ORDER BY id ASC LIMIT ${BATCH_SIZE}`);
  if (res.rows.length === 0) { console.log('DONE:0'); await pool.end(); process.exit(0); }
  
  const updates = [];
  let ok = 0;
  for (const rec of res.rows) {
    const q = simplify(rec.name);
    let imageUrl = await searchPexels(q);
    if (!imageUrl) {
      const words = q.split(' ');
      if (words.length > 2) imageUrl = await searchPexels(words.slice(0, 2).join(' ') + ' food');
    }
    updates.push({ id: rec.id, url: imageUrl || FALLBACK });
    if (imageUrl) ok++;
    await sleep(200);
  }
  
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
