import pg from 'pg';
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// The owner is user id=1 (Luis Maria Cabello de los Cobos, admin)
// Check if they have a buddy_application
const appRes = await client.query(`SELECT * FROM buddy_applications WHERE "userId" = 1`);
console.log('EXISTING APPS:', JSON.stringify(appRes.rows, null, 2));

if (appRes.rows.length === 0) {
  // Create an approved expert application for the owner
  const insertRes = await client.query(`
    INSERT INTO buddy_applications ("userId", type, status, "displayName", bio, specialty, "appliedAt", "updatedAt")
    VALUES (1, 'expert', 'approved', 'Luis Maria Cabello de los Cobos', 'Nutricionista y fundador de BuddyMarket', 'Nutrición clínica', NOW(), NOW())
    RETURNING *
  `);
  console.log('CREATED APP:', JSON.stringify(insertRes.rows[0], null, 2));
} else {
  // Update existing to approved
  const updateRes = await client.query(`
    UPDATE buddy_applications SET status = 'approved', "updatedAt" = NOW()
    WHERE "userId" = 1
    RETURNING *
  `);
  console.log('UPDATED APP:', JSON.stringify(updateRes.rows[0], null, 2));
}

// Also check buddy_experts table
const expertColRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='buddy_experts' LIMIT 20`);
console.log('BUDDY_EXPERTS COLUMNS:', expertColRes.rows.map(r => r.column_name));

const expertRes = await client.query(`SELECT * FROM buddy_experts WHERE "userId" = 1`);
console.log('BUDDY_EXPERTS:', JSON.stringify(expertRes.rows, null, 2));

await client.end();
