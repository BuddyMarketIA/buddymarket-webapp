import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

// Load .env.local
const envContent = readFileSync('/home/ubuntu/buddymarket-webapp/.env.local', 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const url = envVars.DATABASE_URL || '';
const m = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!m) { console.log('No DB URL found'); process.exit(1); }

const conn = await createConnection({
  host: m[3], port: parseInt(m[4]), user: m[1], password: m[2], database: m[5],
  ssl: { rejectUnauthorized: false }
});

try {
  const [c] = await conn.execute('SELECT COUNT(*) as c FROM carrefour_products');
  const [l] = await conn.execute('SELECT COUNT(*) as c FROM lidl_products');
  const [me] = await conn.execute('SELECT COUNT(*) as c FROM mercadona_products');
  console.log('Carrefour:', c[0].c, '| Lidl:', l[0].c, '| Mercadona:', me[0].c);
  
  // Check if alcampo table exists
  const [tables] = await conn.execute("SHOW TABLES LIKE 'alcampo%'");
  console.log('Alcampo tables:', JSON.stringify(tables));
} finally {
  await conn.end();
}
