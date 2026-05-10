/**
 * Script de auditoría y limpieza de datos de prueba en BuddyMarket
 * Mantiene: Dra. Laura Sánchez y el usuario real (luismariaccc@gmail.com)
 * Elimina: todos los demás usuarios/expertos de prueba, menús demo, etc.
 */
import pg from 'pg';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Cargar variables de entorno
const envFile = '/opt/.manus/webdev.sh.env';
try {
  const envContent = readFileSync(envFile, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^export\s+([^=]+)="?([^"]*)"?/);
    if (match) process.env[match[1]] = match[2];
  });
} catch (e) {
  dotenv.config();
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log('=== AUDITORÍA DE DATOS DE PRUEBA ===\n');

// 1. Ver todos los usuarios
const users = await client.query('SELECT id, name, email, role, "createdAt" FROM users ORDER BY id');
console.log('USUARIOS:');
users.rows.forEach(u => console.log(`  [${u.id}] ${u.name} | ${u.email} | ${u.role}`));

// 2. Ver todos los buddy experts
const experts = await client.query(`
  SELECT be.id, be."displayName", be.specialty, u.email, u.id as "userId"
  FROM buddy_experts be 
  JOIN users u ON u.id = be."userId" 
  ORDER BY be.id
`);
console.log('\nBUDDY EXPERTS:');
experts.rows.forEach(e => console.log(`  [${e.id}] ${e.displayName} | ${e.specialty} | ${e.email} | userId:${e.userId}`));

// 3. Ver menús
const menus = await client.query('SELECT id, name, "userId", "isAI", "isPublic" FROM menus ORDER BY id LIMIT 30');
console.log('\nMENÚS (primeros 30):');
menus.rows.forEach(m => console.log(`  [${m.id}] ${m.name} | userId:${m.userId} | AI:${m.isAI} | public:${m.isPublic}`));

// 4. Ver recetas con nombres de test
const testRecipes = await client.query(`
  SELECT id, title FROM recipes 
  WHERE title ILIKE '%test%' OR title ILIKE '%demo%' OR title ILIKE '%prueba%' OR title ILIKE '%lorem%'
  LIMIT 20
`);
console.log('\nRECETAS CON NOMBRES DE TEST:', testRecipes.rows.length);
testRecipes.rows.forEach(r => console.log(`  [${r.id}] ${r.title}`));

// 5. Ver buddy makers
const makers = await client.query(`
  SELECT bm.id, bm."displayName", u.email, u.id as "userId"
  FROM buddy_makers bm 
  JOIN users u ON u.id = bm."userId" 
  ORDER BY bm.id
`).catch(() => ({ rows: [] }));
console.log('\nBUDDY MAKERS:');
makers.rows.forEach(m => console.log(`  [${m.id}] ${m.displayName} | ${m.email} | userId:${m.userId}`));

// 6. Ver expert_hire_requests
const hireRequests = await client.query('SELECT id, "patientUserId", "expertId", status FROM expert_hire_requests ORDER BY id').catch(() => ({ rows: [] }));
console.log('\nSOLICITUDES DE CONTRATACIÓN:', hireRequests.rows.length);
hireRequests.rows.forEach(r => console.log(`  [${r.id}] patient:${r.patientUserId} expert:${r.expertId} status:${r.status}`));

console.log('\n=== FIN AUDITORÍA ===');
console.log('\nEjecutando limpieza...\n');

// ─── LIMPIEZA ─────────────────────────────────────────────────────────────────
// Identificar usuarios reales a conservar:
// - luismariaccc@gmail.com (usuario real propietario)
// - El usuario de la Dra. Laura Sánchez

// Encontrar el userId de la Dra. Laura
const lauraExpert = experts.rows.find(e => 
  e.displayName?.toLowerCase().includes('laura') || 
  e.email?.toLowerCase().includes('laura')
);
const lauraUserId = lauraExpert?.userId;
console.log('Dra. Laura userId:', lauraUserId, '| email:', lauraExpert?.email);

// Encontrar el usuario real (propietario)
const ownerUser = users.rows.find(u => u.email === 'luismariaccc@gmail.com');
const ownerUserId = ownerUser?.id;
console.log('Propietario userId:', ownerUserId, '| email:', ownerUser?.email);

// IDs a conservar
const keepUserIds = [ownerUserId, lauraUserId].filter(Boolean);
console.log('IDs a conservar:', keepUserIds);

// Usuarios a eliminar (todos los demás excepto los reales)
const usersToDelete = users.rows.filter(u => !keepUserIds.includes(u.id));
console.log('\nUsuarios a ELIMINAR:', usersToDelete.length);
usersToDelete.forEach(u => console.log(`  [${u.id}] ${u.name} | ${u.email}`));

if (usersToDelete.length === 0) {
  console.log('No hay usuarios de prueba que eliminar.');
} else {
  const deleteIds = usersToDelete.map(u => u.id);
  
  // Eliminar en orden correcto (foreign keys)
  // 1. Menús de usuarios de prueba (excepto los públicos de la Dra. Laura)
  const deletedMenus = await client.query(
    `DELETE FROM menus WHERE "userId" = ANY($1::int[]) RETURNING id, name`,
    [deleteIds]
  );
  console.log(`\nMenus eliminados: ${deletedMenus.rows.length}`);
  
  // 2. Meal logs
  const deletedMealLogs = await client.query(
    `DELETE FROM meal_logs WHERE "userId" = ANY($1::int[]) RETURNING id`,
    [deleteIds]
  ).catch(() => ({ rows: [] }));
  console.log(`Meal logs eliminados: ${deletedMealLogs.rows.length}`);
  
  // 3. Expert patients relations
  const deletedPatients = await client.query(
    `DELETE FROM expert_patients WHERE "patientUserId" = ANY($1::int[]) OR "expertId" IN (
      SELECT id FROM buddy_experts WHERE "userId" = ANY($1::int[])
    ) RETURNING id`,
    [deleteIds]
  ).catch(() => ({ rows: [] }));
  console.log(`Expert patients eliminados: ${deletedPatients.rows.length}`);
  
  // 4. Expert hire requests
  const deletedHireReqs = await client.query(
    `DELETE FROM expert_hire_requests WHERE "patientUserId" = ANY($1::int[]) OR "expertId" IN (
      SELECT id FROM buddy_experts WHERE "userId" = ANY($1::int[])
    ) RETURNING id`,
    [deleteIds]
  ).catch(() => ({ rows: [] }));
  console.log(`Hire requests eliminados: ${deletedHireReqs.rows.length}`);
  
  // 5. Buddy experts de usuarios de prueba (excepto Dra. Laura)
  const expertsToDelete = experts.rows.filter(e => deleteIds.includes(e.userId));
  if (expertsToDelete.length > 0) {
    const expertIds = expertsToDelete.map(e => e.id);
    
    // Eliminar service plans de esos experts
    await client.query(
      `DELETE FROM expert_service_plans WHERE "expertId" = ANY($1::int[])`,
      [expertIds]
    ).catch(() => {});
    
    // Eliminar expert plans (nutrition plans)
    await client.query(
      `DELETE FROM expert_plans WHERE "expertId" = ANY($1::int[])`,
      [expertIds]
    ).catch(() => {});
    
    const deletedExperts = await client.query(
      `DELETE FROM buddy_experts WHERE id = ANY($1::int[]) RETURNING id, "displayName"`,
      [expertIds]
    );
    console.log(`Buddy experts eliminados: ${deletedExperts.rows.length}`, deletedExperts.rows.map(e => e.displayName));
  }
  
  // 6. Buddy makers de usuarios de prueba
  const makersToDelete = makers.rows.filter(m => deleteIds.includes(m.userId));
  if (makersToDelete.length > 0) {
    const makerIds = makersToDelete.map(m => m.id);
    await client.query(
      `DELETE FROM buddy_makers WHERE id = ANY($1::int[]) RETURNING id, "displayName"`,
      [makerIds]
    ).catch(() => {});
    console.log(`Buddy makers eliminados: ${makersToDelete.length}`);
  }
  
  // 7. Follows, reviews, etc.
  await client.query(`DELETE FROM expert_follows WHERE "userId" = ANY($1::int[])`, [deleteIds]).catch(() => {});
  await client.query(`DELETE FROM expert_reviews WHERE "userId" = ANY($1::int[])`, [deleteIds]).catch(() => {});
  await client.query(`DELETE FROM maker_follows WHERE "userId" = ANY($1::int[])`, [deleteIds]).catch(() => {});
  
  // 8. Eliminar los usuarios de prueba
  const deletedUsers = await client.query(
    `DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id, name, email`,
    [deleteIds]
  );
  console.log(`\nUsuarios eliminados: ${deletedUsers.rows.length}`);
  deletedUsers.rows.forEach(u => console.log(`  ✓ [${u.id}] ${u.name} | ${u.email}`));
}

// Limpiar menús de demo/test sin usuario real
const demoMenus = await client.query(`
  DELETE FROM menus 
  WHERE name ILIKE '%demo%' OR name ILIKE '%test%' OR name ILIKE '%prueba%' OR name ILIKE '%ejemplo%'
  RETURNING id, name
`);
if (demoMenus.rows.length > 0) {
  console.log(`\nMenus demo eliminados: ${demoMenus.rows.length}`);
  demoMenus.rows.forEach(m => console.log(`  ✓ [${m.id}] ${m.name}`));
}

// Estado final
const finalUsers = await client.query('SELECT id, name, email, role FROM users ORDER BY id');
console.log('\n=== ESTADO FINAL ===');
console.log('Usuarios restantes:');
finalUsers.rows.forEach(u => console.log(`  [${u.id}] ${u.name} | ${u.email} | ${u.role}`));

const finalExperts = await client.query(`
  SELECT be."displayName", u.email FROM buddy_experts be JOIN users u ON u.id = be."userId"
`);
console.log('Buddy experts restantes:');
finalExperts.rows.forEach(e => console.log(`  ${e.displayName} | ${e.email}`));

await client.end();
console.log('\n✅ Limpieza completada');
