// Script para limpiar BuddyExperts falsos de la BD
// - Eliminar ID 6 (Guillermo) — borrar completamente
// - Eliminar ID 7 (BuddyMarket IA) — borrar completamente
// - Eliminar ID 8 (Luis Maria) — quitar solo el perfil buddyexpert (mantener cuenta usuario)

import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  try {
    const envFile = readFileSync(join(__dirname, "../.env"), "utf8");
    const match = envFile.match(/DATABASE_URL=(.+)/);
    if (match) DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, "");
  } catch (e) {}
}

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const { Client } = pg;
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("Conectado a la BD");

// 1. Ver estado actual
const { rows: experts } = await client.query(
  'SELECT id, "userId", "displayName" FROM buddy_experts ORDER BY id'
);
console.log("\nEstado actual de buddy_experts:");
console.table(experts);

// 2. Eliminar ID 6 (Guillermo) completamente
console.log("\n--- Eliminando ID 6 (Guillermo) ---");
const del6 = await client.query("DELETE FROM buddy_experts WHERE id = 6");
console.log("Filas eliminadas: " + del6.rowCount);

// 3. Eliminar ID 7 (BuddyMarket IA) completamente
console.log("\n--- Eliminando ID 7 (BuddyMarket IA) ---");
const del7 = await client.query("DELETE FROM buddy_experts WHERE id = 7");
console.log("Filas eliminadas: " + del7.rowCount);

// 4. Eliminar ID 8 (Luis Maria) — solo el perfil expert, mantener cuenta usuario
console.log("\n--- Eliminando ID 8 (Luis Maria) del perfil expert ---");
const del8 = await client.query("DELETE FROM buddy_experts WHERE id = 8");
console.log("Filas eliminadas: " + del8.rowCount);

// 5. También quitar el rol buddyexpert del usuario ID 1 (Luis Maria) si tiene ese rol
console.log("\n--- Verificando rol del usuario ID 1 (Luis Maria) ---");
const { rows: user1 } = await client.query(
  "SELECT id, name, email, role FROM users WHERE id = 1"
);
console.table(user1);

if (user1.length > 0 && user1[0].role === "buddyexpert") {
  console.log("Cambiando rol de buddyexpert a user...");
  const updateRole = await client.query(
    "UPDATE users SET role = 'user' WHERE id = 1"
  );
  console.log("Filas actualizadas: " + updateRole.rowCount);
} else if (user1.length > 0) {
  console.log("Rol actual: " + user1[0].role + " - no necesita cambio");
}

// 6. Estado final
const { rows: finalExperts } = await client.query(
  'SELECT id, "userId", "displayName" FROM buddy_experts ORDER BY id'
);
console.log("\nEstado FINAL de buddy_experts:");
console.table(finalExperts);

await client.end();
console.log("\nLimpieza completada con exito");
