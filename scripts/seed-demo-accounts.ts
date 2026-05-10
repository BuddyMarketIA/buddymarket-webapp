/**
 * seed-demo-accounts.ts
 * Crea cuentas de demo reales y funcionales para presentaciones de BuddyMarket.
 * Ejecutar con: npx tsx scripts/seed-demo-accounts.ts
 */

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../drizzle/schema";

const {
  users, userProfiles, userSubscriptions,
  buddyExperts, buddyMakers,
  companies, companyMembers,
  supportTickets, supportMessages,
} = schema;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL no está definida");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

// ─── Definición de cuentas demo ───────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    key: "admin",
    name: "Admin BuddyMarket",
    email: "admin.demo@buddyoneapp.com",
    password: "BuddyAdmin2025!",
    role: "admin" as const,
    accountType: "user" as const,
    plan: "pro_max" as const,
    description: "Cuenta de administrador de la plataforma. Acceso total al panel /admin.",
    profile: {
      age: 35, gender: "male" as const, height: 180, weight: 78,
      activityLevel: "moderado" as const, mainGoal: "mantenimiento" as const,
      dailyCalorieGoal: 2200,
    },
  },
  {
    key: "user_free",
    name: "Carlos García",
    email: "carlos.demo@buddyoneapp.com",
    password: "BuddyFree2025!",
    role: "user" as const,
    accountType: "user" as const,
    plan: "free" as const,
    description: "Usuario gratuito. Acceso limitado a funciones básicas.",
    profile: {
      age: 28, gender: "male" as const, height: 175, weight: 82,
      activityLevel: "sedentario" as const, mainGoal: "perdida_peso" as const,
      dailyCalorieGoal: 1800,
    },
  },
  {
    key: "user_pro",
    name: "María López",
    email: "maria.demo@buddyoneapp.com",
    password: "BuddyPro2025!",
    role: "user" as const,
    accountType: "user" as const,
    plan: "premium" as const,
    description: "Usuario con plan Premium. Acceso a menús personalizados y BuddyIA.",
    profile: {
      age: 32, gender: "female" as const, height: 165, weight: 62,
      activityLevel: "activo" as const, mainGoal: "tonificacion" as const,
      dailyCalorieGoal: 1900,
    },
  },
  {
    key: "user_promax",
    name: "Alejandro Martínez",
    email: "alejandro.demo@buddyoneapp.com",
    password: "BuddyProMax2025!",
    role: "user" as const,
    accountType: "user" as const,
    plan: "pro_max" as const,
    description: "Usuario Pro Max. Acceso completo a todas las funcionalidades premium.",
    profile: {
      age: 38, gender: "male" as const, height: 182, weight: 88,
      activityLevel: "muy_activo" as const, mainGoal: "ganancia_muscular" as const,
      dailyCalorieGoal: 3000,
    },
  },
  {
    key: "buddyexpert",
    name: "Dra. Laura Sánchez",
    email: "laura.expert@buddyoneapp.com",
    password: "BuddyExpert2025!",
    role: "buddyexpert" as const,
    accountType: "buddyexpert" as const,
    plan: "pro_max" as const,
    description: "Nutricionista certificada. Panel BuddyExpert con planes y clientes.",
    profile: {
      age: 40, gender: "female" as const, height: 168, weight: 60,
      activityLevel: "activo" as const, mainGoal: "mantenimiento" as const,
      dailyCalorieGoal: 2000,
    },
    expertData: {
      displayName: "Dra. Laura Sánchez",
      specialty: "Nutrición clínica, Pérdida de peso, Deporte",
      bio: "Nutricionista con 15 años de experiencia. Especializada en nutrición deportiva y pérdida de peso saludable. Más de 500 pacientes tratados con éxito.",
      rating: 4.9,
      reviewsCount: 127,
      followersCount: 3420,
      verified: true,
      featured: true,
    },
  },
  {
    key: "buddymaker",
    name: "Pablo Cocina",
    email: "pablo.maker@buddyoneapp.com",
    password: "BuddyMaker2025!",
    role: "buddymaker" as const,
    accountType: "buddymaker" as const,
    plan: "pro_max" as const,
    description: "Creador de recetas y contenido. Panel BuddyMaker con recetas y seguidores.",
    profile: {
      age: 29, gender: "male" as const, height: 178, weight: 75,
      activityLevel: "moderado" as const, mainGoal: "mantenimiento" as const,
      dailyCalorieGoal: 2300,
    },
    makerData: {
      displayName: "Pablo Cocina",
      bio: "Chef y creador de contenido gastronómico. Especializado en cocina mediterránea saludable y recetas fitness. Más de 50k seguidores en Instagram.",
      specialty: "Cocina mediterránea saludable",
      instagramHandle: "@pablococinasano",
      youtubeHandle: "@PabloCocina",
      tiktokHandle: "@pablococinasano",
      followersCount: 52400,
      recipesCount: 187,
      rating: 4.8,
      verified: true,
      featured: true,
    },
  },
  {
    key: "empresa_admin",
    name: "Sofía Ruiz",
    email: "sofia.empresa@buddyoneapp.com",
    password: "BuddyEmpresa2025!",
    role: "business" as const,
    accountType: "business" as const,
    plan: "pro_max" as const,
    description: "Administradora del plan empresa TECNOSOLUCIONES. Panel RRHH con licencias y empleados.",
    profile: {
      age: 42, gender: "female" as const, height: 163, weight: 65,
      activityLevel: "sedentario" as const, mainGoal: "mantenimiento" as const,
      dailyCalorieGoal: 1900,
    },
    companyData: {
      name: "TecnoSoluciones S.L.",
      taxId: "B-12345678",
      contactEmail: "sofia.empresa@buddyoneapp.com",
      contactName: "Sofía Ruiz",
      contactPhone: "+34 91 234 5678",
      plan: "business" as const,
      status: "active" as const,
      licensesTotal: 50,
      licensesActive: 23,
      industry: "Tecnología",
      employeeCount: 85,
      accessCode: "TECNOSOLUCIONES2025",
      welcomeMessage: "¡Bienvenido/a al programa de bienestar nutricional de TecnoSoluciones! Tu empresa te ofrece acceso completo a BuddyMarket Pro Max sin coste adicional.",
    },
  },
  {
    key: "empleado",
    name: "Javier Torres",
    email: "javier.empleado@buddyoneapp.com",
    password: "BuddyEmpleado2025!",
    role: "user" as const,
    accountType: "user" as const,
    plan: "pro_max" as const,
    description: "Empleado de TecnoSoluciones con Pro Max activado por código de empresa.",
    profile: {
      age: 31, gender: "male" as const, height: 177, weight: 79,
      activityLevel: "moderado" as const, mainGoal: "perdida_peso" as const,
      dailyCalorieGoal: 2000,
    },
    usedCompanyCode: "TECNOSOLUCIONES2025",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(account: typeof DEMO_ACCOUNTS[0]) {
  const email = account.email.toLowerCase();
  const openId = `email:${email}`;
  const passwordHash = await bcrypt.hash(account.password, 12);

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log(`  ⚠️  Usuario ${email} ya existe (id=${existing[0].id}), actualizando...`);
    await db.update(users).set({
      name: account.name,
      role: account.role,
      accountType: account.accountType,
      passwordHash,
      onboardingCompleted: true,
      registrationStep: "completed",
      updatedAt: new Date(),
    }).where(eq(users.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(users).values({
    openId,
    email,
    name: account.name,
    role: account.role,
    accountType: account.accountType,
    loginMethod: "email",
    passwordHash,
    onboardingCompleted: true,
    registrationStep: "completed",
    active: true,
    lastSignedIn: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning({ id: users.id });

  return result[0].id;
}

async function upsertSubscription(userId: number, plan: "free" | "basic" | "premium" | "pro_max") {
  const existing = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId)).limit(1);
  const periodEnd = new Date();
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  if (existing.length > 0) {
    await db.update(userSubscriptions).set({
      plan,
      manualPlan: plan,
      status: "active",
      manualPlanNote: "Cuenta demo — acceso manual",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    }).where(eq(userSubscriptions.userId, userId));
  } else {
    await db.insert(userSubscriptions).values({
      userId,
      plan,
      manualPlan: plan,
      status: "active",
      manualPlanNote: "Cuenta demo — acceso manual",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

async function upsertProfile(userId: number, profileData: typeof DEMO_ACCOUNTS[0]["profile"]) {
  if (!profileData) return;
  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);

  const values = {
    userId,
    age: profileData.age,
    gender: profileData.gender,
    height: profileData.height,
    weight: profileData.weight,
    activityLevel: profileData.activityLevel,
    mainGoal: profileData.mainGoal,
    dailyCalorieGoal: profileData.dailyCalorieGoal,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(userProfiles).set(values).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ ...values, createdAt: new Date() });
  }
}

async function upsertBuddyExpert(userId: number, expertData: NonNullable<(typeof DEMO_ACCOUNTS[4])["expertData"]>) {
  const existing = await db.select().from(buddyExperts).where(eq(buddyExperts.userId, userId)).limit(1);

  const values = {
    userId,
    displayName: expertData.displayName,
    specialty: expertData.specialty,
    bio: expertData.bio,
    rating: expertData.rating,
    reviewsCount: expertData.reviewsCount,
    followersCount: expertData.followersCount,
    verified: expertData.verified,
    featured: expertData.featured,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(buddyExperts).set(values).where(eq(buddyExperts.userId, userId));
    return existing[0].id;
  } else {
    const result = await db.insert(buddyExperts).values({ ...values, createdAt: new Date() }).returning({ id: buddyExperts.id });
    return result[0].id;
  }
}

async function upsertBuddyMaker(userId: number, makerData: NonNullable<(typeof DEMO_ACCOUNTS[5])["makerData"]>) {
  const existing = await db.select().from(buddyMakers).where(eq(buddyMakers.userId, userId)).limit(1);

  const values = {
    userId,
    displayName: makerData.displayName,
    bio: makerData.bio,
    specialty: makerData.specialty,
    instagramHandle: makerData.instagramHandle,
    youtubeHandle: makerData.youtubeHandle,
    tiktokHandle: makerData.tiktokHandle,
    followersCount: makerData.followersCount,
    recipesCount: makerData.recipesCount,
    rating: makerData.rating,
    verified: makerData.verified,
    featured: makerData.featured,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(buddyMakers).set(values).where(eq(buddyMakers.userId, userId));
    return existing[0].id;
  } else {
    const result = await db.insert(buddyMakers).values({ ...values, createdAt: new Date() }).returning({ id: buddyMakers.id });
    return result[0].id;
  }
}

async function upsertCompany(adminUserId: number, companyData: NonNullable<(typeof DEMO_ACCOUNTS[6])["companyData"]>) {
  const existing = await db.select().from(companies).where(eq(companies.contactEmail, companyData.contactEmail)).limit(1);

  const values = {
    ...companyData,
    adminUserId,
    contractStartAt: new Date(),
    contractEndAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(companies).set(values).where(eq(companies.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(companies).values({ ...values, createdAt: new Date() }).returning({ id: companies.id });
    return result[0].id;
  }
}

async function addCompanyMember(companyId: number, userId: number) {
  const existing = await db.select().from(companyMembers)
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(companyMembers).values({
      companyId,
      userId,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      isActive: true,
    });
  }
}

async function createDemoSupportTicket(userId: number) {
  const existing = await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).limit(1);
  if (existing.length > 0) return;

  const result = await db.insert(supportTickets).values({
    userId,
    subject: "¿Cómo puedo exportar mi plan nutricional?",
    category: "technical",
    priority: "medium",
    status: "open",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning({ id: supportTickets.id });

  await db.insert(supportMessages).values({
    ticketId: result[0].id,
    authorId: userId,
    authorRole: "user",
    message: "Hola, me gustaría saber si es posible exportar mi plan nutricional semanal en formato PDF para compartirlo con mi médico. Gracias.",
    isInternal: false,
    createdAt: new Date(),
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 Iniciando seed de cuentas demo de BuddyMarket...\n");

  const results: Array<{
    key: string; userId: number; name: string; email: string;
    password: string; role: string; plan: string; description: string;
  }> = [];

  let companyId: number | null = null;

  for (const account of DEMO_ACCOUNTS) {
    console.log(`\n📋 Creando cuenta: ${account.name} (${account.key})`);

    try {
      const userId = await upsertUser(account);
      console.log(`  ✅ Usuario creado/actualizado (id=${userId})`);

      await upsertSubscription(userId, account.plan);
      console.log(`  ✅ Suscripción ${account.plan} activada`);

      if (account.profile) {
        await upsertProfile(userId, account.profile);
        console.log(`  ✅ Perfil nutricional creado`);
      }

      if ("expertData" in account && account.expertData) {
        const expertId = await upsertBuddyExpert(userId, account.expertData);
        console.log(`  ✅ Perfil BuddyExpert creado (id=${expertId})`);
      }

      if ("makerData" in account && account.makerData) {
        const makerId = await upsertBuddyMaker(userId, account.makerData);
        console.log(`  ✅ Perfil BuddyMaker creado (id=${makerId})`);
      }

      if ("companyData" in account && account.companyData) {
        companyId = await upsertCompany(userId, account.companyData);
        console.log(`  ✅ Empresa ${account.companyData.name} creada (id=${companyId})`);
        await addCompanyMember(companyId, userId);
        console.log(`  ✅ Admin añadido como miembro de la empresa`);
      }

      if ("usedCompanyCode" in account && account.usedCompanyCode && companyId) {
        await addCompanyMember(companyId, userId);
        await db.update(users).set({
          usedReferralCode: account.usedCompanyCode,
          updatedAt: new Date(),
        }).where(eq(users.id, userId));
        console.log(`  ✅ Empleado vinculado a empresa con código ${account.usedCompanyCode}`);
      }

      if (account.key === "user_free") {
        await createDemoSupportTicket(userId);
        console.log(`  ✅ Ticket de soporte demo creado`);
      }

      results.push({
        key: account.key,
        userId,
        name: account.name,
        email: account.email,
        password: account.password,
        role: account.role,
        plan: account.plan,
        description: account.description,
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Error creando ${account.key}:`, message);
    }
  }

  console.log("\n\n✅ SEED COMPLETADO — Resumen de cuentas creadas:\n");
  console.log("═".repeat(80));
  for (const r of results) {
    console.log(`\n👤 ${r.name} [${r.key}]`);
    console.log(`   Email:       ${r.email}`);
    console.log(`   Contraseña:  ${r.password}`);
    console.log(`   Rol:         ${r.role} | Plan: ${r.plan}`);
    console.log(`   Descripción: ${r.description}`);
  }
  console.log("\n" + "═".repeat(80));

  await pool.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
