import pg from 'pg';
const { Client } = pg;

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('No DATABASE_URL');
  process.exit(1);
}

const client = new Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
const res = await client.query(
  `SELECT id, name, "imageUrl", category FROM recipes ORDER BY name`
);
console.log(JSON.stringify(res.rows, null, 2));
await client.end();
