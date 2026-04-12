/**
 * seed-demo-accounts.mjs
 * Crea cuentas de demo reales y funcionales para presentaciones de BuddyMarket.
 * Ejecutar con: node scripts/seed-demo-accounts.mjs
 *
 * Valores de enum correctos (verificados contra la BD):
 * - activityLevel: sedentary, light, moderate, active, very_active
 * - mainGoal: lose_weight, gain_muscle, maintain, improve_health, eat_healthier
 * - gender: male, female, other
 * - plan: free, basic, premium, pro_max
 * - role: user, admin, buddyexpert, buddymaker, business
 * - accountType: user, buddymaker, buddyexpert, business
 */

import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── Definición de cuentas demo ───────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    key: "admin",
    name: "Admin BuddyMarket",
    email: "admin.demo@buddymarket.io",
    password: "BuddyAdmin2025!",
    role: "admin",
    accountType: "user",
    plan: "pro_max",
    description: "Cuenta de administrador de la plataforma. Acceso total al panel /admin.",
    profile: {
      age: 35, gender: "male", height: 180, weight: 78,
      activityLevel: "moderate", mainGoal: "maintain",
      dailyCalorieGoal: 2200,
    },
  },
  {
    key: "user_free",
    name: "Carlos García",
    email: "carlos.demo@buddymarket.io",
    password: "BuddyFree2025!",
    role: "user",
    accountType: "user",
    plan: "free",
    description: "Usuario gratuito. Acceso limitado a funciones básicas.",
    profile: {
      age: 28, gender: "male", height: 175, weight: 82,
      activityLevel: "sedentary", mainGoal: "lose_weight",
      dailyCalorieGoal: 1800,
    },
    createSupportTicket: true,
  },
  {
    key: "user_pro",
    name: "María López",
    email: "maria.demo@buddymarket.io",
    password: "BuddyPro2025!",
    role: "user",
    accountType: "user",
    plan: "premium",
    description: "Usuario con plan Premium. Acceso a menús personalizados y BuddyIA.",
    profile: {
      age: 32, gender: "female", height: 165, weight: 62,
      activityLevel: "active", mainGoal: "improve_health",
      dailyCalorieGoal: 1900,
    },
  },
  {
    key: "user_promax",
    name: "Alejandro Martínez",
    email: "alejandro.demo@buddymarket.io",
    password: "BuddyProMax2025!",
    role: "user",
    accountType: "user",
    plan: "pro_max",
    description: "Usuario Pro Max. Acceso completo a todas las funcionalidades premium.",
    profile: {
      age: 38, gender: "male", height: 182, weight: 88,
      activityLevel: "very_active", mainGoal: "gain_muscle",
      dailyCalorieGoal: 3000,
    },
  },
  {
    key: "buddyexpert",
    name: "Dra. Laura Sánchez",
    email: "laura.expert@buddymarket.io",
    password: "BuddyExpert2025!",
    role: "buddyexpert",
    accountType: "buddyexpert",
    plan: "pro_max",
    description: "Nutricionista certificada. Panel BuddyExpert con planes y clientes.",
    profile: {
      age: 40, gender: "female", height: 168, weight: 60,
      activityLevel: "active", mainGoal: "maintain",
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
    email: "pablo.maker@buddymarket.io",
    password: "BuddyMaker2025!",
    role: "buddymaker",
    accountType: "buddymaker",
    plan: "pro_max",
    description: "Creador de recetas y contenido. Panel BuddyMaker con recetas y seguidores.",
    profile: {
      age: 29, gender: "male", height: 178, weight: 75,
      activityLevel: "moderate", mainGoal: "maintain",
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
    email: "sofia.empresa@buddymarket.io",
    password: "BuddyEmpresa2025!",
    role: "business",
    accountType: "business",
    plan: "pro_max",
    description: "Administradora del plan empresa TECNOSOLUCIONES. Panel RRHH con licencias y empleados.",
    profile: {
      age: 42, gender: "female", height: 163, weight: 65,
      activityLevel: "sedentary", mainGoal: "maintain",
      dailyCalorieGoal: 1900,
    },
    companyData: {
      name: "TecnoSoluciones S.L.",
      taxId: "B-12345678",
      contactEmail: "sofia.empresa@buddymarket.io",
      contactName: "Sofía Ruiz",
      contactPhone: "+34 91 234 5678",
      plan: "business",
      status: "active",
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
    email: "javier.empleado@buddymarket.io",
    password: "BuddyEmpleado2025!",
    role: "user",
    accountType: "user",
    plan: "pro_max",
    description: "Empleado de TecnoSoluciones con Pro Max activado por código de empresa.",
    profile: {
      age: 31, gender: "male", height: 177, weight: 79,
      activityLevel: "moderate", mainGoal: "lose_weight",
      dailyCalorieGoal: 2000,
    },
    usedCompanyCode: "TECNOSOLUCIONES2025",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(account) {
  const email = account.email.toLowerCase();
  const openId = `email:${email}`;
  const passwordHash = await bcrypt.hash(account.password, 12);

  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    console.log(`  ⚠️  Usuario ${email} ya existe (id=${userId}), actualizando...`);
    await pool.query(
      `UPDATE users SET name=$1, role=$2, "accountType"=$3, "passwordHash"=$4,
       "onboardingCompleted"=true, "registrationStep"='completed', "updatedAt"=NOW()
       WHERE id=$5`,
      [account.name, account.role, account.accountType, passwordHash, userId]
    );
    return userId;
  }

  const result = await pool.query(
    `INSERT INTO users ("openId", email, name, role, "accountType", "loginMethod", "passwordHash",
     "onboardingCompleted", "registrationStep", active, "lastSignedIn", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 'email', $6, true, 'completed', true, NOW(), NOW(), NOW())
     RETURNING id`,
    [openId, email, account.name, account.role, account.accountType, passwordHash]
  );
  return result.rows[0].id;
}

async function upsertSubscription(userId, plan) {
  const periodEnd = new Date();
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const existing = await pool.query(
    'SELECT id FROM user_subscriptions WHERE "userId" = $1 LIMIT 1',
    [userId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE user_subscriptions SET plan=$1::plan, "manualPlan"=$2::"manualPlan", status='active',
       "manualPlanNote"='Cuenta demo — acceso manual',
       "currentPeriodStart"=NOW(), "currentPeriodEnd"=$3, "updatedAt"=NOW()
       WHERE "userId"=$4`,
      [plan, plan, periodEnd, userId]
    );
  } else {
    await pool.query(
      `INSERT INTO user_subscriptions ("userId", plan, "manualPlan", status, "manualPlanNote",
       "currentPeriodStart", "currentPeriodEnd", "createdAt", "updatedAt")
       VALUES ($1, $2::plan, $3::"manualPlan", 'active', 'Cuenta demo — acceso manual', NOW(), $4, NOW(), NOW())`,
      [userId, plan, plan, periodEnd]
    );
  }
}

async function upsertProfile(userId, profileData) {
  const existing = await pool.query(
    'SELECT id FROM user_profiles WHERE "userId" = $1 LIMIT 1',
    [userId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE user_profiles SET age=$1, gender=$2, height=$3, weight=$4,
       "activityLevel"=$5, "mainGoal"=$6, "dailyCalorieGoal"=$7, "updatedAt"=NOW()
       WHERE "userId"=$8`,
      [profileData.age, profileData.gender, profileData.height, profileData.weight,
       profileData.activityLevel, profileData.mainGoal, profileData.dailyCalorieGoal, userId]
    );
  } else {
    await pool.query(
      `INSERT INTO user_profiles ("userId", age, gender, height, weight,
       "activityLevel", "mainGoal", "dailyCalorieGoal", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [userId, profileData.age, profileData.gender, profileData.height, profileData.weight,
       profileData.activityLevel, profileData.mainGoal, profileData.dailyCalorieGoal]
    );
  }
}

async function upsertBuddyExpert(userId, expertData) {
  const existing = await pool.query(
    'SELECT id FROM buddy_experts WHERE "userId" = $1 LIMIT 1',
    [userId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE buddy_experts SET "displayName"=$1, specialty=$2, bio=$3, rating=$4,
       "reviewsCount"=$5, "followersCount"=$6, verified=$7, featured=$8, "updatedAt"=NOW()
       WHERE "userId"=$9`,
      [expertData.displayName, expertData.specialty, expertData.bio, expertData.rating,
       expertData.reviewsCount, expertData.followersCount, expertData.verified, expertData.featured, userId]
    );
    return existing.rows[0].id;
  } else {
    const result = await pool.query(
      `INSERT INTO buddy_experts ("userId", "displayName", specialty, bio, rating,
       "reviewsCount", "followersCount", verified, featured, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id`,
      [userId, expertData.displayName, expertData.specialty, expertData.bio, expertData.rating,
       expertData.reviewsCount, expertData.followersCount, expertData.verified, expertData.featured]
    );
    return result.rows[0].id;
  }
}

async function upsertBuddyMaker(userId, makerData) {
  const existing = await pool.query(
    'SELECT id FROM buddy_makers WHERE "userId" = $1 LIMIT 1',
    [userId]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE buddy_makers SET "displayName"=$1, bio=$2, specialty=$3,
       "instagramHandle"=$4, "youtubeHandle"=$5, "tiktokHandle"=$6,
       "followersCount"=$7, "recipesCount"=$8, rating=$9, verified=$10, featured=$11, "updatedAt"=NOW()
       WHERE "userId"=$12`,
      [makerData.displayName, makerData.bio, makerData.specialty,
       makerData.instagramHandle, makerData.youtubeHandle, makerData.tiktokHandle,
       makerData.followersCount, makerData.recipesCount, makerData.rating,
       makerData.verified, makerData.featured, userId]
    );
    return existing.rows[0].id;
  } else {
    const result = await pool.query(
      `INSERT INTO buddy_makers ("userId", "displayName", bio, specialty,
       "instagramHandle", "youtubeHandle", "tiktokHandle",
       "followersCount", "recipesCount", rating, verified, featured, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING id`,
      [userId, makerData.displayName, makerData.bio, makerData.specialty,
       makerData.instagramHandle, makerData.youtubeHandle, makerData.tiktokHandle,
       makerData.followersCount, makerData.recipesCount, makerData.rating,
       makerData.verified, makerData.featured]
    );
    return result.rows[0].id;
  }
}

async function upsertCompany(adminUserId, companyData) {
  const existing = await pool.query(
    'SELECT id FROM companies WHERE "contactEmail" = $1 LIMIT 1',
    [companyData.contactEmail]
  );

  const contractEnd = new Date();
  contractEnd.setFullYear(contractEnd.getFullYear() + 1);

  if (existing.rows.length > 0) {
    const companyId = existing.rows[0].id;
    await pool.query(
      `UPDATE companies SET name=$1, "taxId"=$2, "contactName"=$3, "contactPhone"=$4,
       plan=$5, status=$6, "licensesTotal"=$7, "licensesActive"=$8,
       industry=$9, "employeeCount"=$10, "accessCode"=$11, "welcomeMessage"=$12,
       "adminUserId"=$13, "contractEndAt"=$14, "updatedAt"=NOW()
       WHERE id=$15`,
      [companyData.name, companyData.taxId, companyData.contactName, companyData.contactPhone,
       companyData.plan, companyData.status, companyData.licensesTotal, companyData.licensesActive,
       companyData.industry, companyData.employeeCount, companyData.accessCode, companyData.welcomeMessage,
       adminUserId, contractEnd, companyId]
    );
    return companyId;
  } else {
    const result = await pool.query(
      `INSERT INTO companies (name, "taxId", "contactEmail", "contactName", "contactPhone",
       plan, status, "licensesTotal", "licensesActive", industry, "employeeCount",
       "accessCode", "welcomeMessage", "adminUserId", "contractStartAt", "contractEndAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), $15, NOW(), NOW())
       RETURNING id`,
      [companyData.name, companyData.taxId, companyData.contactEmail, companyData.contactName, companyData.contactPhone,
       companyData.plan, companyData.status, companyData.licensesTotal, companyData.licensesActive,
       companyData.industry, companyData.employeeCount, companyData.accessCode, companyData.welcomeMessage,
       adminUserId, contractEnd]
    );
    return result.rows[0].id;
  }
}

async function addCompanyMember(companyId, userId) {
  const existing = await pool.query(
    'SELECT id FROM company_members WHERE "companyId"=$1 AND "userId"=$2 LIMIT 1',
    [companyId, userId]
  );
  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO company_members ("companyId", "userId", "joinedAt", "lastActiveAt", "isActive")
       VALUES ($1, $2, NOW(), NOW(), true)`,
      [companyId, userId]
    );
  }
}

async function createDemoSupportTicket(userId) {
  const existing = await pool.query(
    'SELECT id FROM support_tickets WHERE "userId"=$1 LIMIT 1',
    [userId]
  );
  if (existing.rows.length > 0) return;

  const result = await pool.query(
    `INSERT INTO support_tickets ("userId", subject, category, priority, status, "createdAt", "updatedAt")
     VALUES ($1, $2, 'technical', 'medium', 'open', NOW(), NOW())
     RETURNING id`,
    [userId, "¿Cómo puedo exportar mi plan nutricional?"]
  );

  await pool.query(
    `INSERT INTO support_messages ("ticketId", "authorId", "authorRole", message, "isInternal", "createdAt")
     VALUES ($1, $2, 'user', $3, false, NOW())`,
    [result.rows[0].id, userId,
     "Hola, me gustaría saber si es posible exportar mi plan nutricional semanal en formato PDF para compartirlo con mi médico. Gracias."]
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 Iniciando seed de cuentas demo de BuddyMarket...\n");

  const results = [];
  let companyId = null;

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

      if (account.expertData) {
        const expertId = await upsertBuddyExpert(userId, account.expertData);
        console.log(`  ✅ Perfil BuddyExpert creado (id=${expertId})`);
      }

      if (account.makerData) {
        const makerId = await upsertBuddyMaker(userId, account.makerData);
        console.log(`  ✅ Perfil BuddyMaker creado (id=${makerId})`);
      }

      if (account.companyData) {
        companyId = await upsertCompany(userId, account.companyData);
        console.log(`  ✅ Empresa ${account.companyData.name} creada (id=${companyId})`);
        await addCompanyMember(companyId, userId);
        console.log(`  ✅ Admin añadido como miembro de la empresa`);
      }

      if (account.usedCompanyCode && companyId) {
        await addCompanyMember(companyId, userId);
        await pool.query(
          `UPDATE users SET "usedReferralCode"=$1, "updatedAt"=NOW() WHERE id=$2`,
          [account.usedCompanyCode, userId]
        );
        console.log(`  ✅ Empleado vinculado a empresa con código ${account.usedCompanyCode}`);
      }

      if (account.createSupportTicket) {
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

    } catch (err) {
      console.error(`  ❌ Error creando ${account.key}:`, err.message);
      if (err.detail) console.error(`     Detalle:`, err.detail);
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
  return results;
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
