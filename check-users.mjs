import pg from 'pg';
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// Find the owner user (Luis Maria)
const ownerRes = await client.query(`SELECT id, name, email, role FROM users WHERE name ILIKE '%luis%' OR email ILIKE '%luis%' LIMIT 5`);
console.log('OWNER CANDIDATES:', JSON.stringify(ownerRes.rows, null, 2));

// Check buddy_applications columns
const colRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='buddy_applications' LIMIT 20`);
console.log('BUDDY_APPLICATIONS COLUMNS:', colRes.rows.map(r => r.column_name));

await client.end();
