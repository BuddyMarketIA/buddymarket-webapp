import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const email = 'iabuddymarket@gmail.com';

// Check current state
const { rows } = await client.query(
  'SELECT id, email, name, user_type, role FROM users WHERE email = $1',
  [email]
);

if (rows.length === 0) {
  console.log(`❌ No se encontró ningún usuario con email: ${email}`);
  await client.end();
  process.exit(1);
}

console.log('Usuario encontrado:');
console.table(rows);

// Update user_type to buddyexpert
const result = await client.query(
  "UPDATE users SET user_type = 'buddyexpert' WHERE email = $1",
  [email]
);

console.log(`✅ Actualizado: ${result.rowCount} fila(s) modificada(s)`);

// Verify
const { rows: updated } = await client.query(
  'SELECT id, email, name, user_type, role FROM users WHERE email = $1',
  [email]
);
console.log('Estado actualizado:');
console.table(updated);

await client.end();
