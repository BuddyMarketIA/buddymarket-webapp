/**
 * Seed script: Guillermo V. Rodríguez — BuddyExpert
 * Nutricionista | Personal Eating Trainer©
 * Colegiado CODINMA - MAD00021 - PERSONALeatY©
 */
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── 1. Crear usuario de Guillermo ────────────────────────────────────────────
const GUILLERMO_EMAIL = "guillermo.vrodriguez@personaleatY.com";

const [existingUser] = await conn.query(
  "SELECT id FROM users WHERE email = ?",
  [GUILLERMO_EMAIL]
);

let guillermoUserId;
if (existingUser.length > 0) {
  guillermoUserId = existingUser[0].id;
  console.log(`✓ Usuario Guillermo ya existe (id=${guillermoUserId})`);
} else {
  const [result] = await conn.query(
    `INSERT INTO users (openId, name, email, role, accountType, registrationStep, onboardingCompleted, active, createdAt, updatedAt)
     VALUES (?, ?, ?, 'buddyexpert', 'buddyexpert', 'completed', true, true, NOW(), NOW())`,
    [`guillermo_expert_${Date.now()}`, "Guillermo V. Rodríguez", GUILLERMO_EMAIL]
  );
  guillermoUserId = result.insertId;
  console.log(`✓ Usuario Guillermo creado (id=${guillermoUserId})`);
}

// ─── 2. Crear perfil BuddyExpert ─────────────────────────────────────────────
const [existingExpert] = await conn.query(
  "SELECT id FROM buddy_experts WHERE userId = ?",
  [guillermoUserId]
);

let guillermoExpertId;
if (existingExpert.length > 0) {
  guillermoExpertId = existingExpert[0].id;
  await conn.query(
    `UPDATE buddy_experts SET
      displayName = ?,
      specialty = ?,
      bio = ?,
      avatarUrl = ?,
      coverUrl = ?,
      instagramHandle = ?,
      websiteUrl = ?,
      category = ?,
      verified = true,
      featured = true,
      followersCount = 847,
      plansCount = 4,
      rating = 4.9,
      reviewsCount = 132,
      updatedAt = NOW()
    WHERE id = ?`,
    [
      "Guillermo V. Rodríguez",
      "Nutricionista | Personal Eating Trainer©",
      `Nutricionista colegiado (CODINMA - MAD00021) y creador del método PERSONALeatY©. Más de 10 años ayudando a personas a alcanzar sus objetivos de peso y salud a través de menús semanales personalizados, sin dietas restrictivas ni pasar hambre.

Mi enfoque se basa en la educación nutricional real: aprenderás a comer bien para siempre, no solo durante unas semanas. Trabajo con sesiones online semanales donde revisamos tu evolución, ajustamos el menú y resolvemos todas tus dudas.

✓ Colegiado CODINMA - MAD00021
✓ Método PERSONALeatY© certificado
✓ +847 clientes satisfechos
✓ Especialista en control de peso y nutrición equilibrada`,
      "https://api.dicebear.com/7.x/avataaars/svg?seed=guillermo&backgroundColor=b6e3f4&clothingColor=3c4f5c",
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",
      "guillermoVRodriguez",
      "https://personaleatY.com",
      "perdida_peso",
      guillermoExpertId,
    ]
  );
  console.log(`✓ Perfil BuddyExpert actualizado (id=${guillermoExpertId})`);
} else {
  const [result] = await conn.query(
    `INSERT INTO buddy_experts (
      userId, displayName, specialty, bio, avatarUrl, coverUrl,
      instagramHandle, websiteUrl, category, verified, featured,
      followersCount, plansCount, rating, reviewsCount,
      stripeOnboardingCompleted, commissionRate, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, true, 847, 4, 4.9, 132, false, 0.20, NOW(), NOW())`,
    [
      guillermoUserId,
      "Guillermo V. Rodríguez",
      "Nutricionista | Personal Eating Trainer©",
      `Nutricionista colegiado (CODINMA - MAD00021) y creador del método PERSONALeatY©. Más de 10 años ayudando a personas a alcanzar sus objetivos de peso y salud a través de menús semanales personalizados, sin dietas restrictivas ni pasar hambre.

Mi enfoque se basa en la educación nutricional real: aprenderás a comer bien para siempre, no solo durante unas semanas. Trabajo con sesiones online semanales donde revisamos tu evolución, ajustamos el menú y resolvemos todas tus dudas.

✓ Colegiado CODINMA - MAD00021
✓ Método PERSONALeatY© certificado
✓ +847 clientes satisfechos
✓ Especialista en control de peso y nutrición equilibrada`,
      "https://api.dicebear.com/7.x/avataaars/svg?seed=guillermo&backgroundColor=b6e3f4&clothingColor=3c4f5c",
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",
      "guillermoVRodriguez",
      "https://personaleatY.com",
      "perdida_peso",
    ]
  );
  guillermoExpertId = result.insertId;
  console.log(`✓ Perfil BuddyExpert creado (id=${guillermoExpertId})`);
}

// ─── 3. Eliminar planes anteriores de Guillermo ───────────────────────────────
await conn.query("DELETE FROM expert_plans WHERE expertId = ?", [guillermoExpertId]);
await conn.query("DELETE FROM expert_menus WHERE expertId = ?", [guillermoExpertId]);
console.log("✓ Planes y menús anteriores eliminados");

// ─── 4. Insertar los 4 planes ─────────────────────────────────────────────────

// PLAN 1: Menú Equilibrado (basado en Luis.pdf)
const [plan1] = await conn.query(
  `INSERT INTO expert_plans (
    expertId, title, description, coverUrl, category,
    durationWeeks, dailyCalories, dailyMeals, level,
    tags, isPublic, isFeatured, price, copiesCount, likesCount,
    createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, true, 150.00, 89, 214, NOW(), NOW())`,
  [
    guillermoExpertId,
    "Plan Equilibrado — Menú Semanal Personalizado",
    `Mi plan estrella: un menú semanal completo y equilibrado diseñado para perder peso sin pasar hambre. Incluye 5 comidas al día con opciones variadas y fáciles de preparar.

🍽️ QUÉ INCLUYE:
• Menú semanal completo (desayuno, media mañana, comida, merienda y cena)
• Sesión online semanal de seguimiento y ajuste
• Pautas de hidratación y hábitos saludables
• Opciones de sustitución para cada comida
• Acceso directo por WhatsApp para dudas

📋 METODOLOGÍA PERSONALeatY©:
El menú combina proteínas de calidad (pescado, pollo, legumbres), hidratos de carbono complejos (pan integral, avena, arroz) y grasas saludables (aceite de oliva, frutos secos, aguacate). Sin contar calorías, sin pesarte la comida.

✓ Resultados medios: -3 a -5 kg en el primer mes
✓ Sin efecto rebote
✓ Adaptado a tus gustos e intolerancias`,
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    "perdida_peso",
    4,
    1800,
    5,
    "principiante",
    JSON.stringify(["equilibrado", "sin restricciones", "5 comidas", "sesión online", "WhatsApp", "PERSONALeatY"]),
  ]
);
const plan1Id = plan1.insertId;
console.log(`✓ Plan 1 creado (id=${plan1Id}): Plan Equilibrado`);

// PLAN 2: Dieta de Proteínas (basado en Luis3.pdf)
const [plan2] = await conn.query(
  `INSERT INTO expert_plans (
    expertId, title, description, coverUrl, category,
    durationWeeks, dailyCalories, dailyMeals, level,
    tags, isPublic, isFeatured, price, copiesCount, likesCount,
    createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, false, 150.00, 54, 143, NOW(), NOW())`,
  [
    guillermoExpertId,
    "Plan Proteico — Definición y Control de Peso",
    `Diseñado para quienes quieren acelerar la pérdida de grasa manteniendo la masa muscular. Alto en proteínas, bajo en hidratos refinados, con 5 comidas al día.

🥩 QUÉ INCLUYE:
• Menú semanal alto en proteínas (pollo, pescado, huevos, carnes magras)
• Sesión online semanal de seguimiento
• Guía de suplementación básica (proteína, creatina)
• Pautas para días de entrenamiento vs. descanso
• Acceso directo por WhatsApp para dudas

📋 ESTRUCTURA DEL MENÚ:
Desayuno: Té verde + kiwi + tostada multicereales con tortilla y pavo
Media mañana/tarde: Yogur sin azúcar + almendras / Infusión + jamón
Comidas: Proteína animal + verduras (pollo con brócoli, merluza al horno, bistec con pimientos...)
Cenas: Ligeras y proteicas (brochetas, pollo a la plancha, tortilla de atún...)

✓ Ideal para personas que hacen ejercicio
✓ Resultados visibles en 2-3 semanas
✓ Sin sensación de hambre gracias a la saciedad proteica`,
    "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
    "definicion",
    4,
    1600,
    5,
    "intermedio",
    JSON.stringify(["alto en proteínas", "definición", "masa muscular", "ejercicio", "sesión online", "PERSONALeatY"]),
  ]
);
const plan2Id = plan2.insertId;
console.log(`✓ Plan 2 creado (id=${plan2Id}): Plan Proteico`);

// PLAN 3: Plan Vegetal (basado en Luis2.pdf)
const [plan3] = await conn.query(
  `INSERT INTO expert_plans (
    expertId, title, description, coverUrl, category,
    durationWeeks, dailyCalories, dailyMeals, level,
    tags, isPublic, isFeatured, price, copiesCount, likesCount,
    createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, false, 150.00, 37, 98, NOW(), NOW())`,
  [
    guillermoExpertId,
    "Plan Vegetal — Nutrición Plant-Based con Proteína",
    `Un menú semanal basado en vegetales, legumbres y proteínas de calidad. Perfecto para quienes quieren reducir el consumo de carne sin renunciar a una nutrición completa.

🥦 QUÉ INCLUYE:
• Menú semanal plant-based con proteína completa
• Sesión online semanal de seguimiento
• Guía de combinación de proteínas vegetales
• Recetas con quinoa, lentejas, tofu, brócoli y más
• Acceso directo por WhatsApp para dudas

📋 ESTRUCTURA DEL MENÚ:
Desayuno: Té verde + tostada de centeno con AOVE + zumo de manzana, zanahoria y apio con chía
Media mañana/tarde: Yogur + frutos secos / Fruta de temporada
Comidas: Base vegetal (ensalada de espinacas con lentejas, quinoa con rúcula y pollo, brócoli al vapor...)
Cenas: Ligeras y variadas (tortilla francesa, hamburguesa de ternera, tofu con tomate...)

✓ Gazpacho como comodín para controlar el hambre
✓ Ideal para personas con colesterol o problemas digestivos
✓ Menú antiinflamatorio y lleno de antioxidantes`,
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
    "bienestar",
    4,
    1700,
    5,
    "principiante",
    JSON.stringify(["plant-based", "vegetal", "legumbres", "antiinflamatorio", "sesión online", "PERSONALeatY"]),
  ]
);
const plan3Id = plan3.insertId;
console.log(`✓ Plan 3 creado (id=${plan3Id}): Plan Vegetal`);

// PLAN 4: Pautas Semana Santa (GRATIS — para ganar seguidores)
const [plan4] = await conn.query(
  `INSERT INTO expert_plans (
    expertId, title, description, coverUrl, category,
    durationWeeks, dailyCalories, dailyMeals, level,
    tags, isPublic, isFeatured, price, copiesCount, likesCount,
    createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, false, 0.00, 312, 487, NOW(), NOW())`,
  [
    guillermoExpertId,
    "Pautas Semana Santa — Disfruta sin arrepentirte 🎉",
    `¡GRATIS! Mi guía especial para Semana Santa: cómo disfrutar de los días festivos sin descontrolar tu alimentación ni perder todo el progreso conseguido.

🌟 QUÉ INCLUYE:
• Pautas para las comidas del Jueves al Domingo
• Estrategias para controlar los excesos sin obsesionarte
• Consejos para el alcohol, los dulces y los postres
• Cómo equilibrar comidas y cenas durante los días festivos
• Trucos para no volver a casa con 3 kilos de más

📋 CLAVES DEL PLAN:
✓ Hacer las 5 comidas al día (¡hay que desayunar!)
✓ Empezar las comidas con un primero ligero (crema, consomé, verdura)
✓ Beber agua antes de comer y durante el día
✓ Si bebes alcohol, solo una copa
✓ No repetir platos, un único postre
✓ Cenar pronto y no picar de madrugada
✓ Caminar después de las comidas copiosas

Este plan es mi regalo para ti. Si quieres un plan personalizado para todo el año, contrata cualquiera de mis planes premium.`,
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
    "dieta_equilibrada",
    1,
    2000,
    5,
    "principiante",
    JSON.stringify(["gratis", "Semana Santa", "festivos", "consejos", "sin restricciones", "PERSONALeatY"]),
  ]
);
const plan4Id = plan4.insertId;
console.log(`✓ Plan 4 creado (id=${plan4Id}): Pautas Semana Santa (GRATIS)`);

// ─── 5. Insertar menús semanales completos ────────────────────────────────────

// Menú Equilibrado (de Luis.pdf)
const menuEquilibrado = {
  days: [
    {
      day: "Lunes",
      meals: {
        desayuno: "Café o té + fruta de temporada + tostada integral con aceite y tomate",
        media_manana: "Yogur sin azúcares añadidos o un puñado de almendras",
        comida: "Bacalao con pimientos al horno",
        merienda: "Fruta entera (plátano o manzana)",
        cena: "Crema de verduras y tortilla francesa",
      },
    },
    {
      day: "Martes",
      meals: {
        desayuno: "Café o té + fruta de temporada + bol de avena con leche o yogur",
        media_manana: "Fruta entera o frutos secos crudos",
        comida: "Menestra de verduras con un huevo cocido y frutos secos",
        merienda: "Lácteo (yogur o queso)",
        cena: "Filete de pollo con espinacas",
      },
    },
    {
      day: "Miércoles",
      meals: {
        desayuno: "Café o té + fruta de temporada + tostada de aguacate (innovación semanal)",
        media_manana: "Pulguita de jamón serrano o pavo",
        comida: "Ensalada de escarola con salmón ahumado, granada, cebolla y queso de Burgos",
        merienda: "Fruta entera",
        cena: "Filetes de lomo adobado con ensalada de tomate",
      },
    },
    {
      day: "Jueves",
      meals: {
        desayuno: "Café o té + fruta de temporada + tostada integral con jamón york",
        media_manana: "Yogur bebido (sin azúcares añadidos)",
        comida: "Alubias pintas con verduras",
        merienda: "Puñado de nueces o cacahuetes tostados",
        cena: "Consomé y salmón ahumado con alcaparras, huevo y cebolla",
      },
    },
    {
      day: "Viernes",
      meals: {
        desayuno: "Café o té + fruta de temporada + galletas integrales",
        media_manana: "Fruta entera",
        comida: "Pollo al horno con patata y zanahoria asada",
        merienda: "Frutos secos crudos",
        cena: "Ensalada de espinacas (con 4 ingredientes a elegir)",
      },
    },
    {
      day: "Sábado",
      meals: {
        desayuno: "Café o té + fruta de temporada + tostada con aceite y tomate",
        media_manana: "Yogur o lácteo",
        comida: "Lomos de dorada a la plancha con ajo",
        merienda: "Fruta entera",
        cena: "Crema de verduras y tortilla francesa",
      },
    },
    {
      day: "Domingo",
      meals: {
        desayuno: "Café o té + fruta de temporada + bol de cereales con leche",
        media_manana: "Pulguita de salmón ahumado o pavo",
        comida: "Pasta (a elegir: espaguetis, macarrones, penne...)",
        merienda: "Fruta entera",
        cena: "Consomé y brochetas de gambas con pimiento rojo, verde y cebolla",
      },
    },
  ],
  notes: "Acompañar cada comida con un vaso de agua. Postre opcional: fruta entera, café o té. No acostarse en las 2 horas posteriores a la cena.",
};

await conn.query(
  `INSERT INTO expert_menus (
    expertId, title, description, coverUrl, weekNumber, year,
    category, dailyCalories, isFree, isPublic,
    copiesCount, likesCount, menuData, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, true, 156, 423, ?, NOW(), NOW())`,
  [
    guillermoExpertId,
    "Menú Semanal Equilibrado — Método PERSONALeatY©",
    "Menú completo de 7 días con 5 comidas diarias. Equilibrado, variado y sin pasar hambre. Incluye desayuno, media mañana, comida, merienda y cena.",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    14,
    2025,
    "perdida_peso",
    1800,
    JSON.stringify(menuEquilibrado),
  ]
);
console.log("✓ Menú Equilibrado insertado");

// Menú Proteico (de Luis3.pdf)
const menuProteico = {
  days: [
    {
      day: "Lunes",
      meals: {
        desayuno: "Té verde + kiwi + tostada multicereales con tortilla de huevo y fiambre de pavo",
        media_manana: "Infusión o té + jamón serrano",
        comida: "Consomé y pollo con brócoli",
        merienda: "Yogur sin azúcares + puñado de almendras",
        cena: "Brocheta de gambas con verduras (cherry, cebolla, pimiento)",
      },
    },
    {
      day: "Martes",
      meals: {
        desayuno: "Té verde + kiwi + tostada multicereales con tortilla de huevo y fiambre de pavo",
        media_manana: "Café + fiambre de pavo",
        comida: "Merluza al horno con champiñones",
        merienda: "Infusión + jamón",
        cena: "Pollo a la plancha con espárragos trigueros",
      },
    },
    {
      day: "Miércoles",
      meals: {
        desayuno: "Té verde + kiwi + tostada multicereales con tortilla de huevo y fiambre de pavo",
        media_manana: "Yogur sin azúcares + puñado de almendras",
        comida: "Bistec de ternera a la plancha con pimientos verdes",
        merienda: "Café + fiambre de pavo",
        cena: "Tortilla francesa de 2 huevos con lata de atún",
      },
    },
    {
      day: "Jueves",
      meals: {
        desayuno: "Té verde + kiwi + tostada multicereales con tortilla de huevo y fiambre de pavo",
        media_manana: "Infusión + jamón",
        comida: "Consomé y cinta de lomo a la plancha con canónigos en ensalada",
        merienda: "Yogur sin azúcares + almendras",
        cena: "Lenguado a la plancha con espárragos trigueros",
      },
    },
    {
      day: "Viernes",
      meals: {
        desayuno: "Té verde + kiwi + tostada multicereales con tortilla de huevo y fiambre de pavo",
        media_manana: "Café + fiambre de pavo",
        comida: "Tortilla francesa de 2 huevos con dados de pavo y queso, y espinacas",
        merienda: "Infusión + jamón",
        cena: "Pavo al horno con champiñones",
      },
    },
    {
      day: "Sábado",
      meals: {
        desayuno: "Té verde + kiwi + tostada multicereales con tortilla de huevo y fiambre de pavo",
        media_manana: "Yogur sin azúcares + almendras",
        comida: "Calamares a la plancha con limón y endivias",
        merienda: "Café + pavo",
        cena: "Trucha a la plancha con jamón (o salmón)",
      },
    },
    {
      day: "Domingo",
      meals: {
        desayuno: "Té verde + kiwi + tostada multicereales con tortilla de huevo y fiambre de pavo",
        media_manana: "Infusión + jamón",
        comida: "Menestra de verduras con dados de jamón y huevo escalfado",
        merienda: "Yogur sin azúcares + almendras",
        cena: "Revuelto de setas y ajetes (1-2 huevos)",
      },
    },
  ],
  notes: "Dieta alta en proteínas. Puede producir algo de estreñimiento — el kiwi en el desayuno ayuda a regularlo. Beber mínimo 2 litros de agua al día.",
};

await conn.query(
  `INSERT INTO expert_menus (
    expertId, title, description, coverUrl, weekNumber, year,
    category, dailyCalories, isFree, isPublic,
    copiesCount, likesCount, menuData, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, true, 89, 201, ?, NOW(), NOW())`,
  [
    guillermoExpertId,
    "Menú Semanal Proteico — Definición y Control de Peso",
    "Menú alto en proteínas para acelerar la pérdida de grasa manteniendo músculo. 5 comidas diarias, sin contar calorías.",
    "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
    15,
    2025,
    "definicion",
    1600,
    JSON.stringify(menuProteico),
  ]
);
console.log("✓ Menú Proteico insertado");

// Menú Vegetal (de Luis2.pdf)
const menuVegetal = {
  days: [
    {
      day: "Lunes",
      meals: {
        desayuno: "Té verde + media tostada de centeno con tomate y AOVE + zumo de manzana, zanahoria y apio con chía",
        media_manana: "Yogur + puñado de frutos secos",
        comida: "Ensalada de espinacas con base de lentejas, pimiento, tomate y calabaza",
        merienda: "Par de piezas de fruta de temporada",
        cena: "Tortilla francesa con ensalada de canónigos y ajo salteado",
      },
    },
    {
      day: "Martes",
      meals: {
        desayuno: "Té verde + media tostada de centeno con tomate y AOVE + zumo de manzana, zanahoria y apio con chía",
        media_manana: "Par de piezas de fruta de temporada",
        comida: "Brócoli y calabaza al vapor con pipas de girasol y aceitunas",
        merienda: "Yogur + frutos secos",
        cena: "Hamburguesa de ternera con zanahoria salteada",
      },
    },
    {
      day: "Miércoles",
      meals: {
        desayuno: "Té verde + media tostada de centeno con tomate y AOVE + zumo de manzana, zanahoria y apio con chía",
        media_manana: "Yogur + frutos secos",
        comida: "Ensalada de quinoa, rúcula, granada, pepino, remolacha y pollo a la plancha",
        merienda: "Fruta de temporada",
        cena: "Menestra de verduras",
      },
    },
    {
      day: "Jueves",
      meals: {
        desayuno: "Té verde + media tostada de centeno con tomate y AOVE + zumo de manzana, zanahoria y apio con chía",
        media_manana: "Fruta de temporada",
        comida: "Pescado a la plancha con ensalada de tomate",
        merienda: "Yogur + frutos secos",
        cena: "Verduras a la plancha (calabaza, tomate, berenjena)",
      },
    },
    {
      day: "Viernes",
      meals: {
        desayuno: "Té verde + media tostada de centeno con tomate y AOVE + zumo de manzana, zanahoria y apio con chía",
        media_manana: "Yogur + frutos secos",
        comida: "Arroz blanco con alcachofas y ajos (y aceite)",
        merienda: "Fruta de temporada",
        cena: "Tofu con salsa de tomate, aceitunas negras y ajo",
      },
    },
    {
      day: "Sábado",
      meals: {
        desayuno: "Té verde + media tostada de centeno con tomate y AOVE + zumo de manzana, zanahoria y apio con chía",
        media_manana: "Fruta de temporada",
        comida: "Menestra de verduras con huevo escalfado y semillas de lino",
        merienda: "Yogur + frutos secos",
        cena: "Libre (disfruta sin excesos)",
      },
    },
    {
      day: "Domingo",
      meals: {
        desayuno: "Té verde + media tostada de centeno con tomate y AOVE + zumo de manzana, zanahoria y apio con chía",
        media_manana: "Yogur + frutos secos",
        comida: "Filetes de pollo con pimientos asados",
        merienda: "Fruta de temporada",
        cena: "Ensalada de espinacas, quinoa, salmón ahumado, un huevo y frutos secos",
      },
    },
  ],
  notes: "Comodín: un vaso de gazpacho en comidas o cenas para regular el hambre y controlar la saciedad. Beber agua abundante durante el día.",
};

await conn.query(
  `INSERT INTO expert_menus (
    expertId, title, description, coverUrl, weekNumber, year,
    category, dailyCalories, isFree, isPublic,
    copiesCount, likesCount, menuData, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, true, 67, 178, ?, NOW(), NOW())`,
  [
    guillermoExpertId,
    "Menú Semanal Vegetal — Plant-Based con Proteína",
    "Menú basado en vegetales, legumbres y proteínas de calidad. Antiinflamatorio, rico en antioxidantes y lleno de sabor.",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
    16,
    2025,
    "bienestar",
    1700,
    JSON.stringify(menuVegetal),
  ]
);
console.log("✓ Menú Vegetal insertado");

// ─── 6. Actualizar contadores del experto ─────────────────────────────────────
await conn.query(
  "UPDATE buddy_experts SET plansCount = 4 WHERE id = ?",
  [guillermoExpertId]
);

// ─── 7. Añadir algunas reseñas de ejemplo ────────────────────────────────────
// (Si existe la tabla expert_reviews)
const [tables] = await conn.query("SHOW TABLES LIKE 'expert_reviews'");
if (tables.length > 0) {
  await conn.query("DELETE FROM expert_reviews WHERE expertId = ?", [guillermoExpertId]);
  const reviews = [
    { rating: 5, comment: "Guillermo es increíble. Llevo 2 meses con él y he bajado 7 kilos sin pasar hambre. Los menús son variados y muy fáciles de seguir. 100% recomendable." },
    { rating: 5, comment: "El mejor nutricionista con el que he trabajado. Muy cercano, siempre disponible por WhatsApp y los menús se adaptan perfectamente a mi vida." },
    { rating: 5, comment: "Empecé con el plan proteico y en 3 semanas ya noté la diferencia. Muy profesional y los resultados hablan por sí solos." },
    { rating: 4, comment: "Muy buen plan, fácil de seguir. Guillermo explica muy bien el por qué de cada alimento. Le doy 4 estrellas porque me gustaría más variedad en las cenas." },
    { rating: 5, comment: "Las pautas de Semana Santa me salvaron la vida. Por primera vez en años no volví con kilos de más. ¡Gracias Guillermo!" },
  ];
  for (const r of reviews) {
    await conn.query(
      `INSERT INTO expert_reviews (expertId, userId, rating, comment, createdAt)
       VALUES (?, 1, ?, ?, NOW())`,
      [guillermoExpertId, r.rating, r.comment]
    );
  }
  console.log("✓ Reseñas insertadas");
}

await conn.end();
console.log("\n🎉 Perfil de Guillermo V. Rodríguez creado correctamente:");
console.log(`   Usuario ID: ${guillermoUserId}`);
console.log(`   Expert ID: ${guillermoExpertId}`);
console.log(`   Planes: 4 (3 de pago a 150€/mes + 1 gratis)`);
console.log(`   Menús: 3 menús semanales completos`);
