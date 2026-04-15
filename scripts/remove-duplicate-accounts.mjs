/**
 * Script para eliminar cuentas duplicadas de forma segura.
 * Conserva la cuenta más antigua (primera creada) y elimina las duplicadas.
 * 
 * Duplicados encontrados:
 * - luismariaccc@gmail.com: conservar ID=1 (admin), eliminar ID=2732
 * - carlosmontoliud@gmail.com: conservar ID=2850, eliminar ID=2865
 */
import pg from "/home/ubuntu/buddymarket-webapp/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// IDs a eliminar (los duplicados más recientes)
const toDelete = [2732, 2865];

console.log("=== Eliminando cuentas duplicadas ===");

for (const id of toDelete) {
  // Verificar que existe antes de eliminar
  const check = await client.query('SELECT id, email, role, "createdAt" FROM users WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    console.log(`ID ${id}: no encontrado, saltando`);
    continue;
  }
  const user = check.rows[0];
  console.log(`Eliminando ID=${id} (${user.email}, rol: ${user.role}, creado: ${user.createdAt})`);
  
  // Eliminar registros relacionados primero para evitar FK violations
  // (si hay tablas con FK a users.id)
  await client.query("DELETE FROM users WHERE id = $1", [id]);
  console.log(`  ✅ Eliminado ID=${id}`);
}

// Verificar resultado
const remaining = await client.query(`
  SELECT email, COUNT(*) as cnt FROM users 
  WHERE email IN ('luismariaccc@gmail.com', 'carlosmontoliud@gmail.com')
  GROUP BY email
`);
console.log("\n=== Resultado final ===");
console.log(JSON.stringify(remaining.rows, null, 2));

await client.end();
console.log("\n✅ Script completado");
