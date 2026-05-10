import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema.js";
import { eq, isNull, isNotNull } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error("No DATABASE_URL"); process.exit(1); }

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  // List all buddyexperts
  const experts = await db.select({
    id: schema.buddyExperts.id,
    userId: schema.buddyExperts.userId,
    displayName: schema.buddyExperts.displayName,
    email: schema.buddyExperts.email,
    isVerified: schema.buddyExperts.isVerified,
    isActive: schema.buddyExperts.isActive,
    specialty: schema.buddyExperts.specialty,
    createdAt: schema.buddyExperts.createdAt,
  }).from(schema.buddyExperts);
  
  console.log("\n=== BUDDYEXPERTS EN LA BD ===");
  console.log(`Total: ${experts.length}`);
  for (const e of experts) {
    console.log(`  ID:${e.id} userId:${e.userId} name:"${e.displayName}" email:"${e.email}" verified:${e.isVerified} active:${e.isActive}`);
  }

  // List users with buddyexpert role
  const expertUsers = await db.select({
    id: schema.users.id,
    name: schema.users.name,
    email: schema.users.email,
    role: schema.users.role,
    accountType: schema.users.accountType,
    deletedAt: schema.users.deletedAt,
  }).from(schema.users)
    .where(eq(schema.users.role, "buddyexpert"));
  
  console.log("\n=== USUARIOS CON ROL BUDDYEXPERT ===");
  console.log(`Total: ${expertUsers.length}`);
  for (const u of expertUsers) {
    console.log(`  ID:${u.id} name:"${u.name}" email:"${u.email}" deleted:${u.deletedAt ? "SÍ" : "no"}`);
  }

  // Check for demo/test data
  const demoUsers = await db.select({
    id: schema.users.id,
    name: schema.users.name,
    email: schema.users.email,
    deletedAt: schema.users.deletedAt,
  }).from(schema.users);
  
  const testUsers = demoUsers.filter(u => 
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

  await client.end();
}

main().catch(console.error);
