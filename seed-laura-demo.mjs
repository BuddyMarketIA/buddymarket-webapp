/**
 * seed-laura-demo.mjs
 * Carga datos demo completos para la Dra. Laura Sánchez (expertId=5, userId=3408)
 * 6 pacientes con 3+ meses de métricas, menús, notas, citas y chat
 */
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const EXPERT_ID = 5;
const EXPERT_USER_ID = 3408;

// Función helper para fechas relativas al día de hoy
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function weeksAgo(n) { return daysAgo(n * 7); }

// ─── PACIENTES DEMO ──────────────────────────────────────────────────────────
// Usamos usuarios existentes + creamos nuevos
const PATIENTS = [
  {
    name: "Ana García Moreno",
    email: "ana.garcia.demo@buddymarket.io",
    // Paciente activa, pérdida de peso, 14 semanas de seguimiento
    startWeeksAgo: 14,
    status: "active",
    objective: "Pérdida de peso — objetivo -12 kg",
    initialWeight: 78.5,
    currentWeight: 69.2,
    height: 163,
    age: 34,
    notes: "Paciente muy motivada. Trabaja como profesora, horario partido. Intolerante a la lactosa. Sin alergias adicionales. Objetivo: bajar 12 kg en 6 meses para boda de su hermana en octubre.",
    // Progreso semanal de peso (14 semanas)
    weeklyWeights: [78.5, 77.8, 77.2, 76.9, 76.4, 75.8, 75.2, 74.6, 73.9, 73.2, 72.5, 71.8, 70.4, 69.2],
    bodyFatStart: 34.2,
    bodyFatEnd: 29.8,
    waistStart: 88,
    waistEnd: 79,
    adherence: [8, 7, 9, 8, 7, 9, 10, 8, 9, 8, 9, 10, 9, 9],
    energy: [6, 7, 7, 8, 7, 8, 8, 9, 8, 9, 9, 9, 9, 10],
  },
  {
    name: "Roberto Fernández Gil",
    email: "roberto.fernandez.demo@buddymarket.io",
    // Paciente activo, ganancia muscular, 12 semanas
    startWeeksAgo: 12,
    status: "active",
    objective: "Ganancia muscular — hipertrofia controlada",
    initialWeight: 72.0,
    currentWeight: 76.8,
    height: 178,
    age: 28,
    notes: "Deportista amateur. Entrena 4 días/semana en gimnasio. Objetivo: ganar masa muscular sin exceso de grasa. Trabaja en oficina, come fuera a mediodía. Prefiere recetas rápidas para cenar.",
    weeklyWeights: [72.0, 72.4, 72.9, 73.3, 73.8, 74.1, 74.5, 74.9, 75.4, 75.8, 76.3, 76.8],
    bodyFatStart: 16.5,
    bodyFatEnd: 14.8,
    waistStart: 82,
    waistEnd: 80,
    adherence: [7, 8, 8, 9, 8, 9, 9, 8, 9, 10, 9, 10],
    energy: [7, 8, 8, 8, 9, 9, 9, 9, 9, 10, 10, 10],
  },
  {
    name: "Carmen Ruiz Delgado",
    email: "carmen.ruiz.demo@buddymarket.io",
    // Paciente activa, diabetes tipo 2, 16 semanas
    startWeeksAgo: 16,
    status: "active",
    objective: "Control glucémico — diabetes tipo 2",
    initialWeight: 85.3,
    currentWeight: 78.1,
    height: 158,
    age: 52,
    notes: "Diabética tipo 2 diagnosticada hace 3 años. Toma metformina 850mg/12h. HbA1c inicial: 7.8%. Objetivo: bajar HbA1c por debajo de 6.5% y perder peso. Muy comprometida con el seguimiento. Jubilada, tiene tiempo para cocinar.",
    weeklyWeights: [85.3, 84.8, 84.2, 83.7, 83.1, 82.5, 81.9, 81.3, 80.7, 80.1, 79.5, 79.0, 78.5, 78.1, 78.1, 78.1],
    bodyFatStart: 41.2,
    bodyFatEnd: 36.5,
    waistStart: 98,
    waistEnd: 89,
    adherence: [9, 9, 10, 9, 9, 10, 10, 9, 10, 10, 10, 10, 9, 10, 10, 10],
    energy: [5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 9, 9, 9, 10],
  },
  {
    name: "Miguel Ángel Torres Vega",
    email: "miguel.torres.demo@buddymarket.io",
    // Paciente activo, rendimiento deportivo, 10 semanas
    startWeeksAgo: 10,
    status: "active",
    objective: "Rendimiento deportivo — triatlón",
    initialWeight: 68.5,
    currentWeight: 67.2,
    height: 175,
    age: 41,
    notes: "Triatleta amateur. Prepara su primer Ironman en septiembre. Entrena 10-12h/semana. Necesita periodización nutricional: días de carga y descarga. Trabaja como ingeniero, viaja frecuentemente.",
    weeklyWeights: [68.5, 68.2, 67.9, 67.7, 67.5, 67.4, 67.3, 67.2, 67.2, 67.2],
    bodyFatStart: 12.8,
    bodyFatEnd: 11.2,
    waistStart: 78,
    waistEnd: 76,
    adherence: [8, 7, 8, 9, 8, 9, 9, 9, 8, 9],
    energy: [8, 8, 9, 9, 9, 9, 10, 9, 9, 10],
  },
  {
    name: "Lucía Morales Castillo",
    email: "lucia.morales.demo@buddymarket.io",
    // Paciente activa, síndrome de ovario poliquístico, 13 semanas
    startWeeksAgo: 13,
    status: "active",
    objective: "SOP — control hormonal y pérdida de peso",
    initialWeight: 71.2,
    currentWeight: 65.8,
    height: 165,
    age: 26,
    notes: "Diagnosticada con SOP hace 2 años. Resistencia a la insulina leve. Objetivo: dieta antiinflamatoria, baja en azúcares refinados, para mejorar ciclo menstrual y perder peso. Trabaja en marketing, come fuera frecuentemente.",
    weeklyWeights: [71.2, 70.8, 70.3, 69.8, 69.2, 68.7, 68.1, 67.5, 67.0, 66.5, 66.1, 65.9, 65.8],
    bodyFatStart: 30.5,
    bodyFatEnd: 26.2,
    waistStart: 84,
    waistEnd: 76,
    adherence: [7, 8, 8, 9, 8, 9, 9, 9, 10, 9, 10, 9, 10],
    energy: [6, 7, 7, 8, 8, 8, 9, 9, 9, 9, 9, 10, 10],
  },
  {
    name: "David Sanz Herrero",
    email: "david.sanz.demo@buddymarket.io",
    // Paciente activo, colesterol alto, 8 semanas
    startWeeksAgo: 8,
    status: "active",
    objective: "Reducción colesterol LDL — dieta cardioprotectora",
    initialWeight: 89.0,
    currentWeight: 85.5,
    height: 182,
    age: 47,
    notes: "Colesterol LDL: 198 mg/dL. Triglicéridos: 245 mg/dL. Médico le ha dado 3 meses para mejorar con dieta antes de medicación. Trabaja en banca, alto estrés. Fumador ocasional. Le cuesta reducir el consumo de carne roja.",
    weeklyWeights: [89.0, 88.5, 88.0, 87.4, 86.9, 86.3, 85.8, 85.5],
    bodyFatStart: 28.5,
    bodyFatEnd: 26.1,
    waistStart: 102,
    waistEnd: 97,
    adherence: [6, 7, 7, 8, 7, 8, 8, 9],
    energy: [6, 6, 7, 7, 7, 8, 8, 8],
  },
];

// ─── MENÚS SEMANALES DEMO ────────────────────────────────────────────────────
const MENUS_DEMO = [
  {
    title: "Menú Pérdida de Peso — Semana 1",
    description: "Déficit calórico moderado (1500 kcal/día). Rico en proteínas para preservar masa muscular. Sin lactosa.",
    weekData: JSON.stringify({
      monday: { breakfast: "Avena con leche vegetal y frutos rojos (320 kcal)", lunch: "Pechuga de pollo a la plancha con quinoa y verduras asadas (480 kcal)", dinner: "Merluza al horno con brócoli y patata cocida (380 kcal)" },
      tuesday: { breakfast: "Huevos revueltos con espinacas y tostada integral (340 kcal)", lunch: "Ensalada de garbanzos, atún y verduras (450 kcal)", dinner: "Salmón a la plancha con espárragos y arroz integral (420 kcal)" },
      wednesday: { breakfast: "Yogur vegetal con granola sin azúcar y plátano (310 kcal)", lunch: "Lentejas con verduras y arroz (490 kcal)", dinner: "Tortilla de verduras con ensalada verde (360 kcal)" },
      thursday: { breakfast: "Batido proteico de vainilla con avena (300 kcal)", lunch: "Pavo a la plancha con boniato asado y judías verdes (470 kcal)", dinner: "Crema de calabaza con tostadas integrales (350 kcal)" },
      friday: { breakfast: "Tostadas integrales con aguacate y huevo poché (380 kcal)", lunch: "Bacalao al horno con pisto de verduras (440 kcal)", dinner: "Ensalada de pollo, lechuga, tomate y maíz (380 kcal)" },
      saturday: { breakfast: "Tortitas de avena con miel y fruta (360 kcal)", lunch: "Paella de verduras con gambas (520 kcal)", dinner: "Revuelto de champiñones y espárragos (320 kcal)" },
      sunday: { breakfast: "Granola con leche vegetal y fresas (330 kcal)", lunch: "Pollo al horno con patatas y pimientos (510 kcal)", dinner: "Sopa de verduras con pan integral (340 kcal)" },
    }),
    targetCalories: 1500,
    targetProtein: 120,
    targetCarbs: 150,
    targetFat: 50,
  },
  {
    title: "Menú Hipertrofia — Fase de Volumen",
    description: "Superávit calórico controlado (2800 kcal/día). Alto en proteínas. Carbohidratos periworkout.",
    weekData: JSON.stringify({
      monday: { breakfast: "Avena con proteína en polvo, plátano y mantequilla de cacahuete (650 kcal)", lunch: "Arroz con pollo, brócoli y aceite de oliva (750 kcal)", dinner: "Salmón con boniato y ensalada (580 kcal)", snack: "Batido proteico + fruta (320 kcal)" },
      tuesday: { breakfast: "Tortilla de 4 huevos con tostadas integrales y aguacate (620 kcal)", lunch: "Pasta integral con atún, tomate y queso (720 kcal)", dinner: "Ternera magra con arroz y verduras (600 kcal)", snack: "Yogur griego con nueces (280 kcal)" },
      wednesday: { breakfast: "Pancakes proteicos con sirope de arce (580 kcal)", lunch: "Lentejas con arroz y pechuga de pavo (700 kcal)", dinner: "Merluza al horno con patata y espárragos (520 kcal)", snack: "Batido de leche, avena y cacao (350 kcal)" },
    }),
    targetCalories: 2800,
    targetProtein: 180,
    targetCarbs: 320,
    targetFat: 85,
  },
  {
    title: "Menú Control Glucémico — Diabetes T2",
    description: "Bajo índice glucémico. Distribución de carbohidratos en 5 tomas. Sin azúcares añadidos.",
    weekData: JSON.stringify({
      monday: { breakfast: "Avena con canela y nueces (sin azúcar) (280 kcal)", midmorning: "Manzana con almendras (150 kcal)", lunch: "Merluza al vapor con lentejas y verduras (420 kcal)", snack: "Yogur natural sin azúcar con semillas de chía (130 kcal)", dinner: "Pechuga de pollo con brócoli y arroz integral (380 kcal)" },
      tuesday: { breakfast: "Huevos revueltos con espinacas y tostada de centeno (290 kcal)", midmorning: "Pera con nueces (140 kcal)", lunch: "Ensalada de garbanzos, pollo y verduras (440 kcal)", snack: "Queso fresco con tomate (120 kcal)", dinner: "Salmón al horno con espárragos y quinoa (400 kcal)" },
    }),
    targetCalories: 1600,
    targetProtein: 110,
    targetCarbs: 160,
    targetFat: 55,
  },
  {
    title: "Menú Rendimiento Triatlón — Semana de Carga",
    description: "Alta carga de carbohidratos (400g/día). Periodización nutricional. Hidratación y electrolitos.",
    weekData: JSON.stringify({
      monday: { breakfast: "Arroz con leche y plátano (480 kcal)", lunch: "Pasta con atún, tomate y aceite de oliva (680 kcal)", dinner: "Pollo con arroz y verduras (550 kcal)", snack: "Gel energético + plátano (200 kcal)" },
      tuesday: { breakfast: "Porridge de avena con miel y frutos secos (520 kcal)", lunch: "Risotto de verduras con parmesano (650 kcal)", dinner: "Salmón con patata y ensalada (580 kcal)", snack: "Batido de recuperación (280 kcal)" },
    }),
    targetCalories: 2600,
    targetProtein: 150,
    targetCarbs: 400,
    targetFat: 70,
  },
  {
    title: "Menú Antiinflamatorio — SOP",
    description: "Bajo en azúcares refinados. Rico en omega-3 y antioxidantes. Sin gluten ni lácteos.",
    weekData: JSON.stringify({
      monday: { breakfast: "Smoothie bowl de frutas rojas con semillas de lino (320 kcal)", lunch: "Salmón al horno con quinoa y espinacas (480 kcal)", dinner: "Crema de calabaza con semillas de calabaza (350 kcal)" },
      tuesday: { breakfast: "Huevos con aguacate y tostada sin gluten (360 kcal)", lunch: "Ensalada de lentejas, rúcula y nueces (440 kcal)", dinner: "Pollo al curry con arroz integral (420 kcal)" },
    }),
    targetCalories: 1550,
    targetProtein: 105,
    targetCarbs: 145,
    targetFat: 58,
  },
  {
    title: "Menú Cardioprotector — Colesterol",
    description: "Bajo en grasas saturadas. Rico en fibra soluble y esteroles vegetales. Omega-3 diario.",
    weekData: JSON.stringify({
      monday: { breakfast: "Avena con nueces y arándanos (340 kcal)", lunch: "Sardinas al horno con ensalada de legumbres (460 kcal)", dinner: "Sopa de verduras con pan de centeno (380 kcal)" },
      tuesday: { breakfast: "Tostadas de centeno con aguacate y tomate (320 kcal)", lunch: "Lentejas con arroz y verduras (490 kcal)", dinner: "Bacalao al horno con brócoli y patata (420 kcal)" },
    }),
    targetCalories: 1800,
    targetProtein: 100,
    targetCarbs: 200,
    targetFat: 60,
  },
];

async function run() {
  const client = await pool.connect();
  try {
    console.log("🚀 Iniciando seed demo para Dra. Laura Sánchez...\n");

    // 1. Actualizar perfil de la Dra. Laura con más info
    await client.query(`
      UPDATE buddy_experts SET
        bio = $1,
        specialty = $2,
        "avatarUrl" = $3,
        "coverUrl" = $4,
        "instagramHandle" = $5,
        "websiteUrl" = $6,
        "followersCount" = 3420,
        "plansCount" = 6,
        rating = 4.9,
        "reviewsCount" = 127,
        verified = true,
        featured = true,
        "updatedAt" = NOW()
      WHERE id = $7
    `, [
      "Nutricionista clínica y deportiva con más de 15 años de experiencia. Doctora en Ciencias de la Nutrición por la Universidad Complutense de Madrid. Especializada en pérdida de peso, nutrición deportiva, diabetes tipo 2 y síndrome de ovario poliquístico. Más de 500 pacientes tratados con éxito. Colaboradora habitual en medios de comunicación y ponente en congresos de nutrición.",
      "Nutrición Clínica · Nutrición Deportiva · Diabetes · SOP · Pérdida de Peso",
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80",
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",
      "dra.laurasanchez.nutricion",
      "https://www.laurasanchez-nutricion.es",
      EXPERT_ID,
    ]);
    console.log("✅ Perfil de Dra. Laura actualizado");

    // 2. Crear los menús demo de la Dra. Laura
    const menuIds = [];
    for (const menu of MENUS_DEMO) {
      const res = await client.query(`
        INSERT INTO expert_menus ("expertId", title, description, "menuData", "dailyCalories", "isPublic", "isFree", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())
        RETURNING id
      `, [EXPERT_ID, menu.title, menu.description, menu.weekData, menu.targetCalories]);
      if (res.rows.length > 0) {
        menuIds.push(res.rows[0].id);
        console.log(`  📋 Menú creado: ${menu.title}`);
      }
    }
    console.log(`✅ ${menuIds.length} menús creados\n`);

    // 3. Crear usuarios demo para los pacientes
    const patientUserIds = [];
    for (const p of PATIENTS) {
      // Verificar si ya existe
      const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [p.email]);
      let userId;
      if (existing.rows.length > 0) {
        userId = existing.rows[0].id;
        // Actualizar nombre
        await client.query(`UPDATE users SET name = $1 WHERE id = $2`, [p.name, userId]);
      } else {
        const openId = `demo_${p.email.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
        const res = await client.query(`
          INSERT INTO users ("openId", name, email, role, "imageUrl", "onboardingCompleted", "registrationStep", "createdAt", "updatedAt", "lastSignedIn")
          VALUES ($1, $2, $3, 'user', $4, true, 'completed', NOW(), NOW(), NOW())
          RETURNING id
        `, [openId, p.name, p.email, `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=F97316&color=fff&size=200`]);
        userId = res.rows[0].id;
      }
      patientUserIds.push(userId);
      console.log(`  👤 Paciente: ${p.name} (userId=${userId})`);
    }
    console.log(`✅ ${patientUserIds.length} usuarios pacientes preparados\n`);

    // 4. Crear relaciones expert_patients y datos de seguimiento
    for (let i = 0; i < PATIENTS.length; i++) {
      const p = PATIENTS[i];
      const patientUserId = patientUserIds[i];
      const startDate = weeksAgo(p.startWeeksAgo);

      // Verificar si ya existe la relación
      const existingRel = await client.query(
        `SELECT id FROM expert_patients WHERE "expertId" = $1 AND "patientUserId" = $2`,
        [EXPERT_ID, patientUserId]
      );
      let relId;
      if (existingRel.rows.length > 0) {
        relId = existingRel.rows[0].id;
        await client.query(
          `UPDATE expert_patients SET status = $1, notes = $2, "startDate" = $3, "inviteAcceptedAt" = $4, "updatedAt" = NOW() WHERE id = $5`,
          [p.status, p.notes, startDate, startDate, relId]
        );
      } else {
        const res = await client.query(`
          INSERT INTO expert_patients ("expertId", "patientUserId", status, notes, "startDate", "inviteAcceptedAt", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $5, $5, NOW())
          RETURNING id
        `, [EXPERT_ID, patientUserId, p.status, p.notes, startDate]);
        relId = res.rows[0].id;
      }
      console.log(`\n📊 Procesando datos de ${p.name} (relId=${relId})...`);

      // 5. Crear registros de progreso (patient_progress) — cada 2 semanas
      await client.query(`DELETE FROM patient_progress WHERE "expertPatientId" = $1`, [relId]);
      const numProgressPoints = Math.floor(p.weeklyWeights.length / 2);
      for (let w = 0; w < numProgressPoints; w++) {
        const weekIdx = w * 2;
        const recordDate = weeksAgo(p.startWeeksAgo - weekIdx);
        const weightProgress = p.weeklyWeights[weekIdx];
        const bodyFatProgress = p.bodyFatStart - ((p.bodyFatStart - p.bodyFatEnd) * (weekIdx / (p.weeklyWeights.length - 1)));
        const waistProgress = p.waistStart - ((p.waistStart - p.waistEnd) * (weekIdx / (p.weeklyWeights.length - 1)));

        await client.query(`
          INSERT INTO patient_progress ("expertPatientId", "patientUserId", "recordedAt", weight, "bodyFat", waist, "expertComment", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $3)
        `, [
          relId, patientUserId, recordDate,
          weightProgress,
          Math.round(bodyFatProgress * 10) / 10,
          Math.round(waistProgress),
          w === 0 ? "Medición inicial. Establecemos objetivos y plan de acción." :
          w === 1 ? "Buen progreso inicial. Ajustamos las calorías ligeramente." :
          w === 2 ? "Progreso constante. Muy buena adherencia al plan." :
          w === 3 ? "Excelente evolución. Seguimos con el mismo plan." :
          "Progreso sostenido. Ajuste de macros para la siguiente fase.",
        ]);
      }
      console.log(`  ✅ ${numProgressPoints} registros de progreso`);

      // 6. Crear check-ins semanales
      await client.query(`DELETE FROM weekly_checkins WHERE "expertPatientId" = $1`, [relId]);
      for (let w = 0; w < p.weeklyWeights.length; w++) {
        const weekStart = weeksAgo(p.startWeeksAgo - w);
        const adherence = p.adherence[w] || 8;
        const energy = p.energy[w] || 7;
        const weight = p.weeklyWeights[w];

        const diffNotes = adherence < 7
          ? "Semana difícil por compromisos sociales. Costó mantener el plan en el fin de semana."
          : adherence >= 9
          ? "Semana muy buena. Seguí el plan al 100% incluso en la cena del sábado."
          : "Semana normal. Algún pequeño desvío pero en general bien.";

        const expertFeedback = w % 3 === 0
          ? `Muy buen trabajo esta semana. El peso baja de forma constante y sostenible. Recuerda hidratarte bien y no saltarte el desayuno.`
          : w % 3 === 1
          ? `Excelente adherencia. Noto que tu energía mejora semana a semana, lo que indica que el plan está bien ajustado. Sigue así.`
          : null;

        const weekStartDate = weekStart.toISOString().split('T')[0];
        await client.query(`
          INSERT INTO weekly_checkins ("userId", "expertPatientId", "weekStart", weight, "adherenceRating", "energyRating", "hungerRating", "difficultyNotes", "generalNotes", "expertFeedback", "expertFeedbackAt", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          patientUserId, relId, weekStartDate,
          weight, adherence, energy,
          Math.max(1, 10 - adherence + Math.floor(Math.random() * 2)), // hunger inversamente proporcional a adherencia
          diffNotes,
          `Semana ${w + 1} de seguimiento. Peso: ${weight} kg.`,
          expertFeedback,
          expertFeedback ? daysAgo(p.startWeeksAgo - w - 2) : null,
          weekStart, // $12 createdAt
        ]);
      }
      console.log(`  ✅ ${p.weeklyWeights.length} check-ins semanales`);

      // 7. Crear notas clínicas
      await client.query(`DELETE FROM expert_patient_notes WHERE "expertPatientId" = $1`, [relId]);
      const clinicalNotes = [
        { type: "clinical", content: `**Evaluación inicial — ${startDate.toLocaleDateString('es-ES')}**\n\nPaciente acude a consulta por primera vez. Anamnesis completa realizada.\n\n**Objetivo:** ${p.objective}\n**Peso inicial:** ${p.initialWeight} kg · **Altura:** ${p.height} cm · **IMC:** ${(p.initialWeight / ((p.height/100) ** 2)).toFixed(1)}\n\n**Antecedentes:** ${p.notes}\n\n**Plan de acción:** Inicio de plan nutricional personalizado con revisión quincenal.`, pinned: true },
        { type: "diet", content: `**Análisis dietético inicial**\n\nRegistro de 3 días analizado. Ingesta calórica media: ${Math.round(p.initialWeight * 28)} kcal/día.\n\nDeficiencias detectadas:\n- Proteína: por debajo del objetivo\n- Fibra: 12g/día (objetivo: 25-30g)\n- Omega-3: insuficiente\n\nExcesos:\n- Azúcares simples\n- Grasas saturadas\n\nPlan de mejora establecido en el menú semanal asignado.`, pinned: false },
        { type: "goal", content: `**Objetivos a 3 meses**\n\n✅ Objetivo principal: ${p.objective}\n\n📊 Métricas objetivo:\n- Peso: ${(p.initialWeight - (p.initialWeight - p.currentWeight) * 1.2).toFixed(1)} kg\n- % Grasa corporal: ${(p.bodyFatEnd - 2).toFixed(1)}%\n- Cintura: ${p.waistEnd - 3} cm\n\n🗓️ Revisión mensual programada. Ajuste de plan según evolución.`, pinned: false },
        { type: "general", content: `**Nota de seguimiento — semana 4**\n\nPaciente muestra excelente adherencia y motivación. Ajuste de calorías en -100 kcal para mantener el ritmo de pérdida. Se añade suplementación con vitamina D3 (2000 UI/día) por analítica reciente.`, pinned: false },
        { type: "alert", content: `**⚠️ Alerta — Semana 7**\n\nBajada de energía reportada. Posible déficit calórico excesivo. Se aumenta la ingesta en +150 kcal los días de entrenamiento. Pendiente de analítica de hierro y ferritina.`, pinned: false },
        { type: "clinical", content: `**Revisión mensual — Mes 2**\n\nExcelente evolución. Pérdida de ${(p.initialWeight - p.weeklyWeights[Math.floor(p.weeklyWeights.length / 2)]).toFixed(1)} kg en 2 meses.\n\nAnalítica de control: todos los parámetros dentro de rango normal. Glucosa en ayunas: 92 mg/dL. Colesterol total: 185 mg/dL.\n\nSe mantiene el plan con pequeños ajustes en la distribución de macros.`, pinned: false },
      ];

      for (const note of clinicalNotes) {
        await client.query(`
          INSERT INTO expert_patient_notes ("expertId", "patientUserId", "expertPatientId", content, "noteType", "isPinned", "isPrivate", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
        `, [EXPERT_ID, patientUserId, relId, note.content, note.type, note.pinned]);
      }
      console.log(`  ✅ ${clinicalNotes.length} notas clínicas`);

      // 8. Crear citas
      await client.query(`DELETE FROM expert_appointments WHERE "expertPatientId" = $1`, [relId]);
      const appointments = [
        // Pasadas completadas
        { weeksBack: p.startWeeksAgo, title: "Primera consulta — Evaluación inicial", status: "completed", duration: 60, modality: "online" },
        { weeksBack: Math.floor(p.startWeeksAgo * 0.75), title: "Revisión mensual — Ajuste de plan", status: "completed", duration: 30, modality: "online" },
        { weeksBack: Math.floor(p.startWeeksAgo * 0.5), title: "Control de progreso — Mes 2", status: "completed", duration: 30, modality: "online" },
        // Próximas
        { weeksBack: -1, title: "Revisión semanal — Control de peso", status: "scheduled", duration: 20, modality: "online" },
        { weeksBack: -3, title: "Consulta mensual — Evaluación de resultados", status: "scheduled", duration: 45, modality: "online" },
      ];

      for (const appt of appointments) {
        const apptDate = weeksAgo(appt.weeksBack);
        apptDate.setHours(10 + (i % 4) * 2, 0, 0, 0); // Diferentes horarios
        const endDate = new Date(apptDate.getTime() + appt.duration * 60000);

        await client.query(`
          INSERT INTO expert_appointments ("expertPatientId", "expertId", "patientUserId", title, "startTime", "endTime", status, modality, "meetingUrl", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        `, [
          relId, EXPERT_ID, patientUserId,
          appt.title, apptDate, endDate,
          appt.status, appt.modality,
          appt.status === "scheduled" ? "https://meet.google.com/demo-link-" + Math.random().toString(36).substr(2, 8) : null,
        ]);
      }
      console.log(`  ✅ ${appointments.length} citas programadas`);

      // 9. Asignar menú al paciente
      const menuId = menuIds[i % menuIds.length];
      if (menuId) {
        await client.query(`DELETE FROM expert_assigned_menus WHERE "expertPatientId" = $1`, [relId]);
        await client.query(`
          INSERT INTO expert_assigned_menus ("expertPatientId", "expertId", "patientUserId", "originalMenuId", "originalMenuTitle", status, "weekStartDate", "expertNotes", "patientRating", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, NOW(), NOW())
        `, [
          relId, EXPERT_ID, patientUserId,
          menuId, MENUS_DEMO[i % MENUS_DEMO.length].title,
          daysAgo(7),
          `Menú adaptado específicamente para ${p.name}. Objetivo: ${p.objective}. Recuerda respetar los horarios de comida y no saltarte ninguna toma.`,
          4 + (i % 2), // rating 4 o 5
        ]);
        console.log(`  ✅ Menú asignado: ${MENUS_DEMO[i % MENUS_DEMO.length].title}`);
      }

      // 10. Crear conversación de chat realista
      await client.query(`DELETE FROM expert_messages WHERE "expertPatientId" = $1`, [relId]);
      const chatMessages = generateChatMessages(p, relId, patientUserId, EXPERT_USER_ID, startDate);
      for (const msg of chatMessages) {
        await client.query(`
          INSERT INTO expert_messages ("expertPatientId", "senderId", "senderRole", content, "isRead", "readAt", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [relId, msg.senderId, msg.role, msg.content, true, msg.createdAt, msg.createdAt]);
      }
      console.log(`  ✅ ${chatMessages.length} mensajes de chat`);

      // 11. Crear hitos del paciente
      await client.query(`DELETE FROM patient_milestones WHERE "expertPatientId" = $1`, [relId]);
      const milestones = generateMilestones(p, relId, patientUserId, EXPERT_ID, startDate);
      for (const m of milestones) {
        await client.query(`
          INSERT INTO patient_milestones ("expertId", "patientUserId", "expertPatientId", title, description, "milestoneDate", icon, "isNotified", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
        `, [EXPERT_ID, patientUserId, relId, m.title, m.description, m.date, m.icon]);
      }
      console.log(`  ✅ ${milestones.length} hitos registrados`);
    }

    console.log("\n🎉 Seed completado con éxito!");
    console.log(`\n📋 Resumen:`);
    console.log(`  - Dra. Laura Sánchez (expertId=${EXPERT_ID})`);
    console.log(`  - ${PATIENTS.length} pacientes activos con datos completos`);
    console.log(`  - ${MENUS_DEMO.length} menús semanales creados`);
    console.log(`  - Datos de 3+ meses de seguimiento por paciente`);

  } catch (err) {
    console.error("❌ Error en el seed:", err.message);
    console.error(err.stack);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

function generateChatMessages(p, relId, patientUserId, expertUserId, startDate) {
  const msgs = [];
  const startTs = startDate.getTime();
  const now = Date.now();
  const totalDays = Math.floor((now - startTs) / (1000 * 60 * 60 * 24));

  // Mensaje de bienvenida
  msgs.push({ senderId: expertUserId, role: "expert", content: `¡Hola ${p.name.split(' ')[0]}! 👋 Bienvenida/o a BuddyMarket. Soy la Dra. Laura Sánchez y seré tu nutricionista. He revisado tu perfil y ya tengo preparado tu plan personalizado. ¿Tienes alguna duda antes de empezar?`, createdAt: new Date(startTs + 1000 * 60 * 30) });
  msgs.push({ senderId: patientUserId, role: "patient", content: `¡Hola Dra. Laura! Muchas gracias, estoy muy emocionada/o de empezar. Mi principal duda es si puedo tomar café por las mañanas o si tengo que eliminarlo.`, createdAt: new Date(startTs + 1000 * 60 * 90) });
  msgs.push({ senderId: expertUserId, role: "expert", content: `¡Claro que sí! El café solo o con leche vegetal está perfectamente bien. Lo que hay que evitar es añadirle azúcar o tomarlo con bollería. Un café con leche de avena por las mañanas es una opción estupenda. 😊`, createdAt: new Date(startTs + 1000 * 60 * 120) });

  // Semana 2
  const week2 = startTs + 1000 * 60 * 60 * 24 * 10;
  msgs.push({ senderId: patientUserId, role: "patient", content: `Dra. Laura, llevo ya 10 días y me siento muy bien. He perdido 1.5 kg. ¿Es normal que tenga más hambre por las noches?`, createdAt: new Date(week2) });
  msgs.push({ senderId: expertUserId, role: "expert", content: `¡Muy bien! 1.5 kg en 10 días es un ritmo perfecto, sostenible y saludable. El hambre nocturna es normal al inicio. Te recomiendo añadir una pequeña cena proteica: un yogur natural con nueces o un huevo duro. Eso ayudará a controlar el apetito nocturno sin romper el déficit.`, createdAt: new Date(week2 + 1000 * 60 * 60 * 2) });

  // Semana 4
  const week4 = startTs + 1000 * 60 * 60 * 24 * 25;
  msgs.push({ senderId: patientUserId, role: "patient", content: `He tenido una semana complicada, fui a una boda y me salté bastante el plan. Me siento mal por ello 😞`, createdAt: new Date(week4) });
  msgs.push({ senderId: expertUserId, role: "expert", content: `¡No te preocupes! Una celebración no arruina el progreso de semanas. Lo importante es retomar el plan hoy mismo. La constancia a largo plazo es lo que cuenta, no la perfección puntual. ¿Cómo te has sentido físicamente esta semana?`, createdAt: new Date(week4 + 1000 * 60 * 60 * 1) });
  msgs.push({ senderId: patientUserId, role: "patient", content: `La verdad es que me sentí más pesada/o y con menos energía. Eso me motiva a volver al plan. ¡Gracias por el apoyo!`, createdAt: new Date(week4 + 1000 * 60 * 60 * 3) });

  // Semana 6 - mensaje con menú
  if (totalDays > 42) {
    const week6 = startTs + 1000 * 60 * 60 * 24 * 42;
    msgs.push({ senderId: expertUserId, role: "expert", content: `Te he asignado el menú de la semana. He hecho algunos ajustes basándome en tus preferencias y en cómo ha ido evolucionando tu plan. Los cambios principales son:\n\n- **Más proteína en el desayuno** para mejorar la saciedad\n- **Carbohidratos complejos** en la comida del mediodía\n- **Cena más ligera** con verduras y proteína magra\n\nRevísalo en la app y dime si tienes alguna duda. 💪`, createdAt: new Date(week6) });
    msgs.push({ senderId: patientUserId, role: "patient", content: `¡Perfecto! Ya lo he visto. Me gusta mucho el menú de esta semana. Una pregunta: ¿puedo sustituir el salmón del martes por atún en lata? No tengo tiempo de cocinarlo.`, createdAt: new Date(week6 + 1000 * 60 * 60 * 4) });
    msgs.push({ senderId: expertUserId, role: "expert", content: `¡Sí, perfectamente! El atún en lata al natural es una excelente alternativa. Aporta proteínas similares y también tiene omega-3. Solo asegúrate de que sea al natural, no en aceite. 👍`, createdAt: new Date(week6 + 1000 * 60 * 60 * 5) });
  }

  // Semana 8 - progreso
  if (totalDays > 56) {
    const week8 = startTs + 1000 * 60 * 60 * 24 * 56;
    const weightLost = (p.initialWeight - p.weeklyWeights[Math.min(8, p.weeklyWeights.length - 1)]).toFixed(1);
    msgs.push({ senderId: patientUserId, role: "patient", content: `¡Dra. Laura! Acabo de pesarme y llevo ${weightLost} kg menos desde que empecé. ¡No me lo puedo creer! 🎉`, createdAt: new Date(week8) });
    msgs.push({ senderId: expertUserId, role: "expert", content: `¡¡Enhorabuena!! 🎊🎉 ¡${weightLost} kg es un logro increíble! Y lo más importante es que lo has conseguido de forma saludable y sostenible. Tus análisis también han mejorado notablemente. Sigue así, ¡estás en el camino correcto!`, createdAt: new Date(week8 + 1000 * 60 * 30) });
  }

  // Mensaje reciente (últimos 3 días)
  const recent = daysAgo(2);
  msgs.push({ senderId: patientUserId, role: "patient", content: `Buenos días Dra. Laura. Esta semana me ha costado más seguir el plan, creo que necesito un pequeño ajuste. ¿Podemos hablar en la próxima consulta?`, createdAt: recent });
  msgs.push({ senderId: expertUserId, role: "expert", content: `¡Buenos días! Claro, lo hablamos en la consulta del próximo lunes. Mientras tanto, si tienes mucha hambre, puedes añadir una pequeña merienda: una fruta con un puñado de frutos secos. No te preocupes, los ajustes son parte del proceso. 😊`, createdAt: new Date(recent.getTime() + 1000 * 60 * 60 * 2) });

  return msgs;
}

function generateMilestones(p, relId, patientUserId, expertId, startDate) {
  const milestones = [];
  const weightLost = p.initialWeight - p.currentWeight;

  if (weightLost >= 2) {
    milestones.push({
      title: "¡Primeros 2 kg perdidos!",
      description: `${p.name.split(' ')[0]} ha alcanzado su primer hito: -2 kg desde el inicio del tratamiento.`,
      date: weeksAgo(p.startWeeksAgo - 3).toISOString().split('T')[0],
      icon: "🎯",
    });
  }
  if (weightLost >= 5) {
    milestones.push({
      title: "¡5 kg menos!",
      description: "Hito importante: 5 kg de pérdida de peso sostenida. Excelente adherencia al plan.",
      date: weeksAgo(p.startWeeksAgo - 7).toISOString().split('T')[0],
      icon: "⭐",
    });
  }
  if (weightLost >= 8) {
    milestones.push({
      title: "¡8 kg de pérdida!",
      description: "Resultado extraordinario. Parámetros analíticos mejorados notablemente.",
      date: weeksAgo(p.startWeeksAgo - 11).toISOString().split('T')[0],
      icon: "🏆",
    });
  }
  milestones.push({
    title: "3 meses de seguimiento",
    description: "Constancia y compromiso durante 3 meses. ¡Un logro que merece celebrarse!",
    date: weeksAgo(p.startWeeksAgo - 12).toISOString().split('T')[0],
    icon: "🌟",
  });
  milestones.push({
    title: "Adherencia perfecta — Semana 6",
    description: "Seguimiento del 100% del plan durante una semana completa.",
    date: weeksAgo(p.startWeeksAgo - 6).toISOString().split('T')[0],
    icon: "💪",
  });

  return milestones;
}

run().catch(console.error);
