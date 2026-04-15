import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const result = await pool.query(
  `SELECT id, email, name, role, 
   "passwordHash" IS NOT NULL as has_password, 
   "openId", "loginMethod", "accountType", "registrationStep", 
   "onboardingCompleted", "active", "emailVerifiedAt"
   FROM users WHERE email = $1`,
  ['guillermo@buddymarket.io']
);
console.log(JSON.stringify(result.rows, null, 2));
await pool.end();
