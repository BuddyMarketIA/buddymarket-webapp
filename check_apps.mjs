import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const apps = await pool.query(`
    SELECT ba.id, ba.type, ba.status, ba."userId", ba."displayName", ba."appliedAt",
           u.name as user_name, u.email as user_email
    FROM buddy_applications ba
    LEFT JOIN users u ON u.id = ba."userId"
    ORDER BY ba.id DESC LIMIT 10
  `);
  
  const roles = await pool.query(`
    SELECT rr.id, rr."roleType", rr.status, rr."userId", rr.motivation,
           u.name as user_name, u.email as user_email
    FROM role_requests rr
    LEFT JOIN users u ON u.id = rr."userId"
    ORDER BY rr.id DESC LIMIT 10
  `);
  
  console.log('=== buddy_applications ===');
  console.log(JSON.stringify(apps.rows, null, 2));
  console.log('\n=== role_requests ===');
  console.log(JSON.stringify(roles.rows, null, 2));
} finally {
  await pool.end();
}
