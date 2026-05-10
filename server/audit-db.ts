import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../drizzle/schema";
const { buddyExperts, users } = schema;
import { eq } from "drizzle-orm";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  // List all buddyexperts
  const experts = await db.select({
    id: buddyExperts.id,
    userId: buddyExperts.userId,
    displayName: buddyExperts.displayName,
    email: buddyExperts.email,
    isVerified: buddyExperts.isVerified,
    isActive: buddyExperts.isActive,
  }).from(buddyExperts);
  
  console.log("\n=== BUDDYEXPERTS EN LA BD ===");
  console.log(`Total: ${experts.length}`);
  for (const e of experts) {
    console.log(`  ID:${e.id} userId:${e.userId} name:"${e.displayName}" email:"${e.email}" verified:${e.isVerified} active:${e.isActive}`);
  }

  // List users with buddyexpert role
  const expertUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    deletedAt: users.deletedAt,
  }).from(users).where(eq(users.role, "buddyexpert"));
  
  console.log("\n=== USUARIOS CON ROL BUDDYEXPERT ===");
  for (const u of expertUsers) {
    console.log(`  ID:${u.id} name:"${u.name}" email:"${u.email}" deleted:${u.deletedAt ? "SÍ" : "no"}`);
  }

  // All users to check for test data
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    deletedAt: users.deletedAt,
  }).from(users);
  
  const testUsers = allUsers.filter(u => 
    u.email?.includes('demo') || 
    u.email?.includes('test') || 
    u.email?.includes('prueba') ||
    u.name?.toLowerCase().includes('test') ||
    u.name?.toLowerCase().includes('demo')
  );
  
  console.log("\n=== USUARIOS CON DATOS DE PRUEBA ===");
  console.log(`Total: ${testUsers.length}`);
  for (const u of testUsers) {
    console.log(`  ID:${u.id} name:"${u.name}" email:"${u.email}" deleted:${u.deletedAt ? "SÍ" : "no"}`);
  }

  console.log(`\nTotal usuarios: ${allUsers.length}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
