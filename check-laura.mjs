import { config } from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

config({ path: '/home/ubuntu/buddymarket-webapp/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const r = await pool.query(
  'SELECT id, email, name, "passwordHash", "loginMethod", "openId" FROM users WHERE email = $1',
  ['lauraexpert@buddymarket.io']
);
console.log('User:', JSON.stringify(r.rows[0], null, 2));
await pool.end();
