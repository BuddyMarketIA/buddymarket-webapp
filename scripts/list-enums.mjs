import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query(`
  SELECT t.typname, e.enumlabel
  FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
  ORDER BY t.typname, e.enumsortorder
`);
const grouped = {};
r.rows.forEach(row => {
  if (!grouped[row.typname]) grouped[row.typname] = [];
  grouped[row.typname].push(row.enumlabel);
});
Object.entries(grouped).forEach(([k, v]) => console.log(k + ': ' + v.join(', ')));
await pool.end();
