import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const LAURA_ID = 3408; // laura.expert@buddymarket.io - Dra. Laura Sánchez

// Check existing application
const appRes = await client.query(`SELECT * FROM buddy_applications WHERE "userId" = $1`, [LAURA_ID]);
console.log('EXISTING APPS:', JSON.stringify(appRes.rows, null, 2));

if (appRes.rows.length === 0) {
  // Create approved expert application
  const insertRes = await client.query(`
    INSERT INTO buddy_applications ("userId", type, status, "displayName", bio, specialty, "appliedAt", "updatedAt")
    VALUES ($1, 'expert', 'approved', 'Dra. Laura Sánchez', 'Nutricionista especializada en nutrición deportiva y pérdida de peso', 'Nutrición clínica', NOW(), NOW())
    RETURNING id, "userId", status
  `, [LAURA_ID]);
  console.log('CREATED APP:', JSON.stringify(insertRes.rows[0]));
} else {
  // Update to approved
  const updateRes = await client.query(`
    UPDATE buddy_applications SET status = 'approved', "updatedAt" = NOW()
    WHERE "userId" = $1
    RETURNING id, "userId", status
  `, [LAURA_ID]);
  console.log('UPDATED APP:', JSON.stringify(updateRes.rows[0]));
}

// Check buddy_experts profile
const expertRes = await client.query(`SELECT * FROM buddy_experts WHERE "userId" = $1`, [LAURA_ID]);
console.log('EXISTING EXPERT PROFILE:', JSON.stringify(expertRes.rows, null, 2));

if (expertRes.rows.length === 0) {
  // Create expert profile
  const insertExpertRes = await client.query(`
    INSERT INTO buddy_experts ("userId", "displayName", specialty, bio, category, verified, featured, "followersCount", "plansCount", rating, "reviewsCount", "createdAt", "updatedAt")
    VALUES ($1, 'Dra. Laura Sánchez', 'Nutrición clínica', 'Nutricionista especializada en nutrición deportiva y pérdida de peso', 'bienestar', true, true, 0, 0, 5.0, 0, NOW(), NOW())
    RETURNING id, "userId", "displayName"
  `, [LAURA_ID]);
  console.log('CREATED EXPERT PROFILE:', JSON.stringify(insertExpertRes.rows[0]));
}

console.log('\n✅ laura.expert@buddymarket.io (id=3408) is now an approved BuddyExpert!');
await client.end();
