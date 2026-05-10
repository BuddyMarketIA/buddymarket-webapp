import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const result = await pool.query(
  'SELECT id, email, name, role, "passwordHash", "openId" FROM users WHERE email = $1',
  ['guillermo@buddymarket.io']
);
console.log(JSON.stringify(result.rows, null, 2));
await pool.end();
