import mysql from 'mysql2/promise';

const pool = mysql.createPool(process.env.DATABASE_URL);
const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM ingredients');
console.log('Current ingredients:', rows[0].cnt);
const [cats] = await pool.query('SELECT category, COUNT(*) as cnt FROM ingredients GROUP BY category ORDER BY cnt DESC LIMIT 15');
console.log('By category:', JSON.stringify(cats, null, 2));
await pool.end();
