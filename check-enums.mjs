import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const res = await client.query("SELECT pg_type.typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid ORDER BY pg_type.typname, enumsortorder");
const map = {};
for (const row of res.rows) {
  if (!map[row.typname]) map[row.typname] = [];
  map[row.typname].push(row.enumlabel);
}
console.log(JSON.stringify(map, null, 2));
await client.end();
