import pg from 'pg';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
console.log('Connecting to DB...');

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  console.log('Connected!');

  // Check if column exists
  const check = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'secondaryRoles'
  `);
  
  if (check.rows.length > 0) {
    console.log('✅ Column secondaryRoles already exists!');
  } else {
    console.log('Adding secondaryRoles column...');
    await client.query(`
      ALTER TABLE "users" ADD COLUMN "secondaryRoles" text[] NOT NULL DEFAULT '{}'
    `);
    console.log('✅ Column secondaryRoles added successfully!');
  }

  // Verify
  const verify = await client.query(`SELECT "secondaryRoles" FROM "users" LIMIT 1`);
  console.log('✅ Verification OK - column works correctly');

} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await client.end();
}
