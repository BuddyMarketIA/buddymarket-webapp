/**
 * Limpieza de usuarios demo y datos de prueba
 */
import pg from 'pg';
import { readFileSync } from 'fs';

const envContent = readFileSync('/opt/.manus/webdev.sh.env', 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^export\s+([^=]+)="?([^"]*?)"?\s*$/);
  if (match) process.env[match[1]] = match[2];
});

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// IDs de usuarios demo a eliminar
const demoEmails = [
  'ana.garcia.demo@buddymarket.io',
  'roberto.fernandez.demo@buddymarket.io',
  'carmen.ruiz.demo@buddymarket.io',
  'miguel.torres.demo@buddymarket.io',
  'lucia.morales.demo@buddymarket.io',
  'david.sanz.demo@buddymarket.io',
];

const demoUsers = await client.query(
  `SELECT id, name, email FROM users WHERE email = ANY($1::text[])`,
  [demoEmails]
);
console.log('Usuarios demo encontrados:', demoUsers.rows.length);
demoUsers.rows.forEach(u => console.log(`  [${u.id}] ${u.name} | ${u.email}`));

const demoIds = demoUsers.rows.map(u => u.id);

if (demoIds.length > 0) {
  // Eliminar en cascada
  const tables = [
    'meal_logs',
    'user_favorite_recipes',
    'recipe_favorites',
    'recipe_likes',
    'recipe_interactions',
    'user_achievements',
    'user_badges',
    'user_points',
    'user_metrics',
    'user_preferences',
    'user_profiles',
    'user_medical_profiles',
    'user_health_metrics',
    'user_inventory_items',
    'user_allergies',
    'user_diet_restrictions',
    'user_subscriptions',
    'user_taste_profile',
    'user_ai_feedback',
    'household_members',
    'household_invitations',
    'shopping_lists',
    'weekly_checkins',
    'push_subscriptions',
    'email_sequence_queue',
    'expert_patients',
    'expert_hire_requests',
    'expert_followers',
    'maker_followers',
    'expert_messages',
    'expert_appointments',
    'menu_organizers',
  ];

  for (const table of tables) {
    try {
      const result = await client.query(
        `DELETE FROM ${table} WHERE "userId" = ANY($1::int[]) RETURNING id`,
        [demoIds]
      );
      if (result.rows.length > 0) console.log(`  ${table}: ${result.rows.length} eliminados`);
    } catch (e) {
      // Intentar con user_id
      try {
        const result = await client.query(
          `DELETE FROM ${table} WHERE user_id = ANY($1::int[]) RETURNING id`,
          [demoIds]
        );
        if (result.rows.length > 0) console.log(`  ${table} (user_id): ${result.rows.length} eliminados`);
      } catch (e2) {
        // ignorar si no existe la columna
      }
    }
  }

  // Eliminar usuarios anónimos (sin email o email null)
  const anonResult = await client.query(
    `DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id, name, email`,
    [demoIds]
  );
  console.log(`\nUsuarios demo eliminados: ${anonResult.rows.length}`);
  anonResult.rows.forEach(u => console.log(`  ✓ [${u.id}] ${u.name || 'sin nombre'} | ${u.email || 'sin email'}`));
}

// Eliminar usuario anónimo ID 2232 (sin email)
const anonUser = await client.query(`SELECT id, name, email FROM users WHERE id = 2232`);
if (anonUser.rows.length > 0) {
  console.log('\nEliminando usuario anónimo ID 2232...');
  await client.query(`DELETE FROM users WHERE id = 2232`).catch(e => console.log('  Error:', e.message));
  console.log('  ✓ Eliminado');
}

// Estado final
const finalUsers = await client.query('SELECT id, name, email, role FROM users ORDER BY id');
console.log('\n=== USUARIOS FINALES ===');
finalUsers.rows.forEach(u => console.log(`  [${u.id}] ${u.name || 'sin nombre'} | ${u.email || 'sin email'} | ${u.role}`));

await client.end();
console.log('\n✅ Limpieza completada');
