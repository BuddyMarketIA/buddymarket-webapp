/**
 * Seed script: BuddyExperts — PostgreSQL version
 * Crea 4 expertos de ejemplo con planes y reseñas
 */
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const EXPERTS = [
  {
    email: "guillermo.vrodriguez@personaleatY.com",
    name: "Guillermo V. Rodríguez",
    openId: `guillermo_expert_seed`,
    expert: {
      displayName: "Guillermo V. Rodríguez",
      specialty: "Nutricionista | Personal Eating Trainer©",
      bio: `Nutricionista colegiado (CODINMA - MAD00021) y creador del método PERSONALeatY©. Más de 10 años ayudando a personas a alcanzar sus objetivos de peso y salud a través de menús semanales personalizados, sin dietas restrictivas ni pasar hambre.\n\nMi enfoque se basa en la educación nutricional real: aprenderás a comer bien para siempre, no solo durante unas semanas. Trabajo con sesiones online semanales donde revisamos tu evolución, ajustamos el menú y resolvemos todas tus dudas.\n\n✓ Colegiado CODINMA - MAD00021\n✓ Método PERSONALeatY© certificado\n✓ +847 clientes satisfechos\n✓ Especialista en control de peso y nutrición equilibrada`,
      avatarUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80",
      coverUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",
      instagramHandle: "guillermoVRodriguez",
      websiteUrl: "https://personaleatY.com",
      category: "perdida_peso",
      verified: true,
      featured: true,
      followersCount: 847,
      plansCount: 4,
      rating: 4.9,
      reviewsCount: 132,
    },
    plans: [
      {
        title: "Plan Pérdida de Peso Sostenible — 8 semanas",
        description: "El plan más completo para perder peso de forma sostenible. Menús semanales personalizados, guías de compra y soporte semanal por videollamada. Sin pasar hambre, sin dietas milagro.",
        coverUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        category: "perdida_peso",
        durationWeeks: 8,
        dailyCalories: 1600,
        dailyMeals: 5,
        level: "principiante",
        isPublic: true,
        isFeatured: true,
        copiesCount: 312,
        likesCount: 289,
        price: 150,
      },
      {
        title: "Plan Proteico para Definición — 4 semanas",
        description: "Diseñado para mantener masa muscular mientras reduces grasa corporal. Alto en proteína, moderado en carbohidratos y bajo en grasas saturadas.",
        coverUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
        category: "definicion",
        durationWeeks: 4,
        dailyCalories: 1800,
        dailyMeals: 5,
        level: "intermedio",
        isPublic: true,
        isFeatured: false,
        copiesCount: 187,
        likesCount: 164,
        price: 120,
      },
      {
        title: "Menú Mediterráneo Equilibrado — Gratis",
        description: "Una semana de menú mediterráneo completo y equilibrado. Ideal para empezar a comer mejor sin complicaciones. ¡Completamente gratis!",
        coverUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
        category: "dieta_equilibrada",
        durationWeeks: 1,
        dailyCalories: 2000,
        dailyMeals: 4,
        level: "principiante",
        isPublic: true,
        isFeatured: false,
        copiesCount: 1247,
        likesCount: 1089,
        price: 0,
      },
      {
        title: "Plan Vegetal con Proteína — 4 semanas",
        description: "Menú basado en vegetales, legumbres y proteínas de calidad. Antiinflamatorio, rico en antioxidantes y lleno de sabor. Perfecto para quienes quieren reducir el consumo de carne.",
        coverUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
        category: "vegano",
        durationWeeks: 4,
        dailyCalories: 1700,
        dailyMeals: 5,
        level: "intermedio",
        isPublic: true,
        isFeatured: false,
        copiesCount: 203,
        likesCount: 178,
        price: 130,
      },
    ],
    reviews: [
      { rating: 5, comment: "Guillermo es increíble. Llevo 2 meses con él y he bajado 7 kilos sin pasar hambre. Los menús son variados y muy fáciles de seguir. 100% recomendable." },
      { rating: 5, comment: "El mejor nutricionista con el que he trabajado. Muy cercano, siempre disponible y los menús se adaptan perfectamente a mi vida." },
      { rating: 5, comment: "Empecé con el plan proteico y en 3 semanas ya noté la diferencia. Muy profesional y los resultados hablan por sí solos." },
      { rating: 4, comment: "Muy buen plan, fácil de seguir. Guillermo explica muy bien el por qué de cada alimento." },
      { rating: 5, comment: "Las pautas de Semana Santa me salvaron la vida. Por primera vez en años no volví con kilos de más. ¡Gracias Guillermo!" },
    ],
  },
  {
    email: "laura.fitness@buddymarket.com",
    name: "Laura Martínez",
    openId: `laura_expert_seed`,
    expert: {
      displayName: "Laura Martínez",
      specialty: "Dietista-Nutricionista Deportiva",
      bio: `Dietista-Nutricionista especializada en nutrición deportiva y rendimiento. Trabajo con atletas amateur y profesionales para optimizar su alimentación y mejorar sus marcas.\n\nGraduada en Nutrición Humana y Dietética por la UAM, con máster en Nutrición Deportiva. Colaboro con varios clubs de atletismo y triatlón en Madrid.\n\n✓ Colegiada CODINMA\n✓ Especialista en nutrición deportiva\n✓ +500 deportistas asesorados\n✓ Planes adaptados a cada deporte y objetivo`,
      avatarUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&q=80",
      coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80",
      instagramHandle: "lauramartinez_nutricion",
      websiteUrl: null,
      category: "rendimiento",
      verified: true,
      featured: true,
      followersCount: 623,
      plansCount: 3,
      rating: 4.8,
      reviewsCount: 89,
    },
    plans: [
      {
        title: "Nutrición para Corredores — 6 semanas",
        description: "Plan nutricional completo para corredores de fondo y medio fondo. Incluye estrategias de carga de carbohidratos, hidratación y recuperación post-entreno.",
        coverUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80",
        category: "rendimiento",
        durationWeeks: 6,
        dailyCalories: 2400,
        dailyMeals: 5,
        level: "intermedio",
        isPublic: true,
        isFeatured: true,
        copiesCount: 234,
        likesCount: 198,
        price: 140,
      },
      {
        title: "Plan Ganancia Muscular Limpia — 8 semanas",
        description: "Diseñado para maximizar la ganancia de masa muscular minimizando el aumento de grasa. Superávit calórico controlado con alta densidad proteica.",
        coverUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
        category: "ganancia_muscular",
        durationWeeks: 8,
        dailyCalories: 2800,
        dailyMeals: 6,
        level: "avanzado",
        isPublic: true,
        isFeatured: false,
        copiesCount: 156,
        likesCount: 134,
        price: 160,
      },
      {
        title: "Semana de Carga — Plan Gratis",
        description: "Protocolo de carga de carbohidratos para los 7 días previos a una competición. Incluye pautas de hidratación y timing de nutrientes.",
        coverUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
        category: "rendimiento",
        durationWeeks: 1,
        dailyCalories: 2600,
        dailyMeals: 5,
        level: "intermedio",
        isPublic: true,
        isFeatured: false,
        copiesCount: 892,
        likesCount: 756,
        price: 0,
      },
    ],
    reviews: [
      { rating: 5, comment: "Laura me ayudó a preparar mi primer maratón. Gracias a su plan llegué al kilómetro 42 con energía. ¡Increíble profesional!" },
      { rating: 5, comment: "Muy buena nutricionista deportiva. Sabe perfectamente qué necesita un triatleta. Muy recomendable." },
      { rating: 4, comment: "Buen plan, bien estructurado. Me gustaría más variedad en los desayunos pre-entreno." },
    ],
  },
  {
    email: "carlos.vegano@buddymarket.com",
    name: "Carlos Herrera",
    openId: `carlos_expert_seed`,
    expert: {
      displayName: "Carlos Herrera",
      specialty: "Nutricionista Plant-Based",
      bio: `Nutricionista especializado en alimentación plant-based y vegana. Demuestro cada día que una dieta basada en plantas puede ser completa, deliciosa y sostenible.\n\nLlevo más de 8 años siguiendo una alimentación vegana y 5 años asesorando a personas que quieren hacer la transición de forma saludable y sin carencias.\n\n✓ Máster en Nutrición Clínica\n✓ Especialista en dietas plant-based\n✓ Autor del libro "Come Verde, Vive Mejor"\n✓ +400 transiciones exitosas al veganismo`,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
      coverUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80",
      instagramHandle: "carlosherrera_plantbased",
      websiteUrl: null,
      category: "vegano",
      verified: true,
      featured: false,
      followersCount: 412,
      plansCount: 3,
      rating: 4.7,
      reviewsCount: 67,
    },
    plans: [
      {
        title: "Transición al Veganismo — 4 semanas",
        description: "El plan más completo para hacer la transición al veganismo de forma gradual y sin carencias. Incluye suplementación recomendada y guías de compra en supermercados.",
        coverUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        category: "vegano",
        durationWeeks: 4,
        dailyCalories: 1900,
        dailyMeals: 4,
        level: "principiante",
        isPublic: true,
        isFeatured: true,
        copiesCount: 445,
        likesCount: 389,
        price: 110,
      },
      {
        title: "Vegano Deportivo — 6 semanas",
        description: "Para deportistas que siguen o quieren seguir una dieta vegana. Alto en proteína vegetal, con estrategias para maximizar la recuperación y el rendimiento.",
        coverUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
        category: "rendimiento",
        durationWeeks: 6,
        dailyCalories: 2500,
        dailyMeals: 5,
        level: "avanzado",
        isPublic: true,
        isFeatured: false,
        copiesCount: 178,
        likesCount: 156,
        price: 140,
      },
      {
        title: "7 días Plant-Based — Gratis",
        description: "Una semana de menús plant-based completos y equilibrados. Demuestra que comer vegano puede ser delicioso y nutritivo. Sin restricciones, sin carencias.",
        coverUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
        category: "vegano",
        durationWeeks: 1,
        dailyCalories: 1900,
        dailyMeals: 4,
        level: "principiante",
        isPublic: true,
        isFeatured: false,
        copiesCount: 1567,
        likesCount: 1234,
        price: 0,
      },
    ],
    reviews: [
      { rating: 5, comment: "Carlos me ayudó a hacer la transición al veganismo sin carencias. Llevo 6 meses y me siento mejor que nunca." },
      { rating: 5, comment: "Muy buen plan, muy completo. Las recetas son deliciosas y fáciles de preparar." },
      { rating: 4, comment: "Buen profesional. Me gustaría más opciones para comer fuera de casa." },
    ],
  },
  {
    email: "sofia.bienestar@buddymarket.com",
    name: "Sofía Ruiz",
    openId: `sofia_expert_seed`,
    expert: {
      displayName: "Sofía Ruiz",
      specialty: "Nutricionista Integrativa y Bienestar",
      bio: `Nutricionista integrativa especializada en el bienestar global: alimentación consciente, gestión del estrés y hábitos saludables sostenibles.\n\nMi enfoque combina la nutrición clínica con técnicas de mindfulness y psicología del comportamiento alimentario. Creo firmemente que la salud empieza en la mente.\n\n✓ Graduada en Nutrición y Dietética\n✓ Máster en Psiconutrición\n✓ Certificada en Mindful Eating\n✓ +300 pacientes con mejora del bienestar`,
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
      coverUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",
      instagramHandle: "sofiaruiz_bienestar",
      websiteUrl: null,
      category: "bienestar",
      verified: true,
      featured: false,
      followersCount: 289,
      plansCount: 2,
      rating: 4.9,
      reviewsCount: 54,
    },
    plans: [
      {
        title: "Reset Nutricional — 3 semanas",
        description: "Un programa de reset completo para recuperar el equilibrio nutricional. Antiinflamatorio, rico en antioxidantes y diseñado para mejorar la energía, el sueño y el estado de ánimo.",
        coverUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
        category: "bienestar",
        durationWeeks: 3,
        dailyCalories: 1800,
        dailyMeals: 4,
        level: "principiante",
        isPublic: true,
        isFeatured: true,
        copiesCount: 267,
        likesCount: 234,
        price: 120,
      },
      {
        title: "Alimentación Antiinflamatoria — Gratis",
        description: "Guía de 5 días con menús antiinflamatorios. Incluye lista de alimentos a incluir y evitar, y recetas fáciles y deliciosas.",
        coverUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        category: "bienestar",
        durationWeeks: 1,
        dailyCalories: 1700,
        dailyMeals: 4,
        level: "principiante",
        isPublic: true,
        isFeatured: false,
        copiesCount: 789,
        likesCount: 678,
        price: 0,
      },
    ],
    reviews: [
      { rating: 5, comment: "Sofía cambió mi relación con la comida. Ya no como por ansiedad y me siento mucho mejor conmigo misma." },
      { rating: 5, comment: "El reset nutricional fue justo lo que necesitaba. Más energía, mejor sueño y sin hinchazón. ¡Gracias!" },
      { rating: 5, comment: "Muy profesional y cercana. Sus planes son muy fáciles de seguir y los resultados se notan rápido." },
    ],
  },
];

async function run() {
  let totalExperts = 0;
  let totalPlans = 0;

  for (const expertData of EXPERTS) {
    // 1. Crear o actualizar usuario
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [expertData.email]
    );

    let userId;
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log(`✓ Usuario ${expertData.name} ya existe (id=${userId})`);
    } else {
      const result = await pool.query(
        `INSERT INTO users ("openId", name, email, role, "accountType", "registrationStep", "onboardingCompleted", active, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'admin', 'user', 'completed', true, true, NOW(), NOW())
         RETURNING id`,
        [expertData.openId, expertData.name, expertData.email]
      );
      userId = result.rows[0].id;
      console.log(`✓ Usuario ${expertData.name} creado (id=${userId})`);
    }

    // 2. Crear o actualizar perfil BuddyExpert
    const existingExpert = await pool.query(
      'SELECT id FROM buddy_experts WHERE "userId" = $1',
      [userId]
    );

    let expertId;
    if (existingExpert.rows.length > 0) {
      expertId = existingExpert.rows[0].id;
      await pool.query(
        `UPDATE buddy_experts SET
          "displayName" = $1, specialty = $2, bio = $3, "avatarUrl" = $4, "coverUrl" = $5,
          "instagramHandle" = $6, "websiteUrl" = $7, category = $8, verified = $9, featured = $10,
          "followersCount" = $11, "plansCount" = $12, rating = $13, "reviewsCount" = $14,
          "updatedAt" = NOW()
         WHERE id = $15`,
        [
          expertData.expert.displayName, expertData.expert.specialty, expertData.expert.bio,
          expertData.expert.avatarUrl, expertData.expert.coverUrl, expertData.expert.instagramHandle,
          expertData.expert.websiteUrl, expertData.expert.category, expertData.expert.verified,
          expertData.expert.featured, expertData.expert.followersCount, expertData.expert.plansCount,
          expertData.expert.rating, expertData.expert.reviewsCount, expertId
        ]
      );
      console.log(`  ↳ Perfil BuddyExpert actualizado (id=${expertId})`);
    } else {
      const result = await pool.query(
        `INSERT INTO buddy_experts (
          "userId", "displayName", specialty, bio, "avatarUrl", "coverUrl",
          "instagramHandle", "websiteUrl", category, verified, featured,
          "followersCount", "plansCount", rating, "reviewsCount", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        RETURNING id`,
        [
          userId, expertData.expert.displayName, expertData.expert.specialty, expertData.expert.bio,
          expertData.expert.avatarUrl, expertData.expert.coverUrl, expertData.expert.instagramHandle,
          expertData.expert.websiteUrl, expertData.expert.category, expertData.expert.verified,
          expertData.expert.featured, expertData.expert.followersCount, expertData.expert.plansCount,
          expertData.expert.rating, expertData.expert.reviewsCount
        ]
      );
      expertId = result.rows[0].id;
      console.log(`  ↳ Perfil BuddyExpert creado (id=${expertId})`);
    }
    totalExperts++;

    // 3. Eliminar planes existentes y recrear
    await pool.query('DELETE FROM expert_plans WHERE "expertId" = $1', [expertId]);

    for (const plan of expertData.plans) {
      await pool.query(
        `INSERT INTO expert_plans (
          "expertId", title, description, "coverUrl", category, "durationWeeks",
          "dailyCalories", "dailyMeals", level, "isPublic", "isFeatured",
          "copiesCount", "likesCount", price, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
        [
          expertId, plan.title, plan.description, plan.coverUrl, plan.category,
          plan.durationWeeks, plan.dailyCalories, plan.dailyMeals, plan.level,
          plan.isPublic, plan.isFeatured, plan.copiesCount, plan.likesCount, plan.price
        ]
      );
      totalPlans++;
    }
    console.log(`  ↳ ${expertData.plans.length} planes creados`);

    // 4. Insertar reseñas si la tabla existe
    try {
      await pool.query('DELETE FROM expert_reviews WHERE "expertId" = $1', [expertId]);
      for (const review of expertData.reviews) {
        await pool.query(
          `INSERT INTO expert_reviews ("expertId", "userId", rating, comment, "createdAt")
           VALUES ($1, 1, $2, $3, NOW())`,
          [expertId, review.rating, review.comment]
        );
      }
      console.log(`  ↳ ${expertData.reviews.length} reseñas creadas`);
    } catch (e) {
      console.log(`  ⚠️  Tabla expert_reviews no disponible: ${e.message}`);
    }
  }

  console.log(`\n🎉 Seed completado:`);
  console.log(`   ${totalExperts} BuddyExperts creados`);
  console.log(`   ${totalPlans} planes creados`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
