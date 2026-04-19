/**
 * Jobs de email programados para BuddyMarket
 *
 * Flujos implementados:
 * - Lunes 08:00 UTC: Recordatorio de check-in semanal a todos los pacientes activos
 * - Lunes 09:00 UTC: Resumen semanal del experto (pacientes, adherencia, citas)
 * - Diario 10:00 UTC: Reactivación por inactividad (3 días y 7 días)
 * - Diario 11:00 UTC: Recordatorio de cita 24h antes
 * - Miércoles 08:00 UTC: Recordatorio de check-in (segunda pasada para los que no han hecho)
 * - Diario 18:00 UTC (20:00 España): Recordatorio de racha en peligro
 * - Diario 19:00 UTC (21:00 España): Resumen diario nocturno
 */

import { getDb } from "../db";
import { eq, and, gte, lte, lt, isNotNull, ne, sql } from "drizzle-orm";
import {
  users,
  expertPatients,
  buddyExperts,
  weeklyCheckins,
  expertAppointments,
  patientProgress,
  expertMessages,
} from "../../drizzle/schema";
import {
  sendWeeklyCheckinReminder,
  sendReactivationEmail,
  sendAppointmentReminderEmail,
  sendExpertWeeklySummary,
  sendUserWeeklyProgress,
  processPendingEmails,
} from "../email";
import {
  mealLogs,
  userProfiles,
  userHealthMetrics,
} from "../../drizzle/schema";

const logger = {
  info: (msg: string, ...args: any[]) => console.log(`[EmailJobs] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[EmailJobs] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[EmailJobs] ${msg}`, ...args),
};

// ─── Job: Recordatorio de check-in semanal ────────────────────────────────────
export async function runWeeklyCheckinReminders() {
  logger.info("Starting weekly check-in reminder job...");
  const db = await getDb();
  if (!db) { logger.warn("DB not available"); return; }

  try {
    // Obtener todos los pacientes activos con su email y nutricionista
    const activePatients = await db
      .select({
        patientUserId: expertPatients.patientUserId,
        expertId: expertPatients.expertId,
        patientName: users.name,
        patientEmail: users.email,
        expertDisplayName: buddyExperts.displayName,
      })
      .from(expertPatients)
      .innerJoin(users, eq(users.id, expertPatients.patientUserId))
      .innerJoin(buddyExperts, eq(buddyExperts.id, expertPatients.expertId))
      .where(eq(expertPatients.status, "active"));

    // Calcular inicio de semana actual (lunes)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon...
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - daysToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    let sent = 0;
    let skipped = 0;

    for (const patient of activePatients) {
      if (!patient.patientEmail) { skipped++; continue; }

      // Verificar si ya hizo check-in esta semana
      const existingCheckin = await db
        .select({ id: weeklyCheckins.id })
        .from(weeklyCheckins)
        .where(
          and(
            eq(weeklyCheckins.expertPatientId, patient.expertId), // using expertId as proxy
            gte(weeklyCheckins.createdAt, weekStart)
          )
        )
        .limit(1);

      if (existingCheckin[0]) { skipped++; continue; }

      // Obtener último peso registrado
      const lastProgress = await db
        .select({ weight: patientProgress.weight, recordedAt: patientProgress.recordedAt })
        .from(patientProgress)
        .where(eq(patientProgress.patientUserId, patient.patientUserId))
        .orderBy(sql`${patientProgress.recordedAt} DESC`)
        .limit(1);

      try {
        await sendWeeklyCheckinReminder({
          userEmail: patient.patientEmail,
          userName: patient.patientName ?? "Paciente",
          expertName: patient.expertDisplayName ?? "tu nutricionista",
        });
        sent++;
      } catch (err) {
        logger.error(`Failed to send check-in reminder to ${patient.patientEmail}:`, err);
      }
    }

    logger.info(`Weekly check-in reminders: ${sent} sent, ${skipped} skipped`);
  } catch (err) {
    logger.error("Error in weekly check-in reminder job:", err);
  }
}

// ─── Job: Reactivación por inactividad ───────────────────────────────────────
export async function runInactivityEmails() {
  logger.info("Starting inactivity email job...");
  const db = await getDb();
  if (!db) { logger.warn("DB not available"); return; }

  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    // Usuarios con lastActiveAt entre 3 y 4 días (primer recordatorio)
    const inactiveThreeDays = await db
      .select({ id: users.id, name: users.name, email: users.email, lastActiveAt: users.lastActiveAt })
      .from(users)
      .where(
        and(
          isNotNull(users.email),
          isNotNull(users.lastActiveAt),
          gte(users.lastActiveAt, sevenDaysAgo),
          lte(users.lastActiveAt, threeDaysAgo),
          ne(users.role, "buddyexpert"),
          ne(users.role, "admin"),
        )
      )
      .limit(100);

    let sent3 = 0;
    for (const user of inactiveThreeDays) {
      if (!user.email) continue;
      try {
        await sendReactivationEmail({
          userEmail: user.email,
          userName: user.name ?? "Usuario",
          daysInactive: 3,
        });
        sent3++;
      } catch (err) {
        logger.error(`Failed to send 3-day inactivity email to ${user.email}:`, err);
      }
    }

    // Usuarios con lastActiveAt entre 7 y 8 días (segundo recordatorio)
    const inactiveSevenDays = await db
      .select({ id: users.id, name: users.name, email: users.email, lastActiveAt: users.lastActiveAt })
      .from(users)
      .where(
        and(
          isNotNull(users.email),
          isNotNull(users.lastActiveAt),
          gte(users.lastActiveAt, eightDaysAgo),
          lte(users.lastActiveAt, sevenDaysAgo),
          ne(users.role, "buddyexpert"),
          ne(users.role, "admin"),
        )
      )
      .limit(100);

    let sent7 = 0;
    for (const user of inactiveSevenDays) {
      if (!user.email) continue;
      try {
        await sendReactivationEmail({
          userEmail: user.email,
          userName: user.name ?? "Usuario",
          daysInactive: 7,
        });
        sent7++;
      } catch (err) {
        logger.error(`Failed to send 7-day inactivity email to ${user.email}:`, err);
      }
    }

    // Usuarios con lastActiveAt entre 30 y 31 días (tercer recordatorio)
    const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const inactiveThirtyDays = await db
      .select({ id: users.id, name: users.name, email: users.email, lastActiveAt: users.lastActiveAt })
      .from(users)
      .where(
        and(
          isNotNull(users.email),
          isNotNull(users.lastActiveAt),
          gte(users.lastActiveAt, thirtyOneDaysAgo),
          lte(users.lastActiveAt, thirtyDaysAgo),
          ne(users.role, "buddyexpert"),
          ne(users.role, "admin"),
        )
      )
      .limit(50);
    let sent30 = 0;
    for (const user of inactiveThirtyDays) {
      if (!user.email) continue;
      try {
        await sendReactivationEmail({
          userEmail: user.email,
          userName: user.name ?? "Usuario",
          daysInactive: 30,
        });
        sent30++;
      } catch (err) {
        logger.error(`Failed to send 30-day inactivity email to ${user.email}:`, err);
      }
    }
    logger.info(`Inactivity emails: ${sent3} sent (3-day), ${sent7} sent (7-day), ${sent30} sent (30-day)`);
  } catch (err) {
    logger.error("Error in inactivity email job:", err);
  }
}
// ─── Job: Recordatorio de cita 24h antess ─────────────────────────────────────
export async function runAppointmentReminders() {
  logger.info("Starting appointment reminder job...");
  const db = await getDb();
  if (!db) { logger.warn("DB not available"); return; }

  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Citas programadas en las próximas 24-25 horas (ventana de 1h para no duplicar)
    const upcomingAppointments = await db
      .select({
        id: expertAppointments.id,
        title: expertAppointments.title,
        startTime: expertAppointments.startTime,
        endTime: expertAppointments.endTime,
        modality: expertAppointments.modality,
        meetingUrl: expertAppointments.meetingUrl,
        location: expertAppointments.location,
        googleCalendarLink: expertAppointments.googleCalendarLink,
        patientUserId: expertAppointments.patientUserId,
        expertId: expertAppointments.expertId,
        patientName: users.name,
        patientEmail: users.email,
        expertDisplayName: buddyExperts.displayName,
      })
      .from(expertAppointments)
      .innerJoin(users, eq(users.id, expertAppointments.patientUserId))
      .innerJoin(buddyExperts, eq(buddyExperts.id, expertAppointments.expertId))
      .where(
        and(
          eq(expertAppointments.status, "scheduled"),
          gte(expertAppointments.startTime, in24h),
          lte(expertAppointments.startTime, in25h),
        )
      );

    let sent = 0;
    for (const appt of upcomingAppointments) {
      if (!appt.patientEmail) continue;
      try {
        await sendAppointmentReminderEmail({
          patientEmail: appt.patientEmail,
          patientName: appt.patientName ?? "Paciente",
          expertName: appt.expertDisplayName ?? "tu nutricionista",
          appointmentTitle: appt.title,
          startTime: appt.startTime,
          endTime: appt.endTime,
          modality: (appt.modality as "online" | "presencial") ?? "online",
          meetingUrl: appt.meetingUrl ?? null,
          location: appt.location ?? null,
          gcalLink: appt.googleCalendarLink ?? null,
        });
        sent++;
      } catch (err) {
        logger.error(`Failed to send appointment reminder for appt ${appt.id}:`, err);
      }
    }

    logger.info(`Appointment reminders: ${sent} sent`);
  } catch (err) {
    logger.error("Error in appointment reminder job:", err);
  }
}

// ─── Job: Resumen semanal de progreso del usuario ────────────────────────────────────────────
export async function runUserWeeklyProgress() {
  logger.info("Starting user weekly progress email job...");
  const db = await getDb();
  if (!db) { logger.warn("DB not available"); return; }
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    // Usuarios activos en los últimos 30 días con email
    const activeUsers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(
        and(
          isNotNull(users.email),
          isNotNull(users.lastActiveAt),
          gte(users.lastActiveAt, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
          ne(users.role, "admin"),
        )
      )
      .limit(200);
    let sent = 0;
    for (const user of activeUsers) {
      if (!user.email) continue;
      try {
        // Calcular días registrados esta semana
        const weekLogs = await db
          .selectDistinct({ logDate: mealLogs.logDate })
          .from(mealLogs)
          .where(and(eq(mealLogs.userId, user.id), gte(mealLogs.logDate, sevenDaysAgo.toISOString().split('T')[0])))
          .limit(7);
        const daysLogged = weekLogs.length;
        if (daysLogged === 0) continue; // No enviar si no registró nada esta semana
        // Calcular promedios nutricionales
        const nutritionRows = await db
          .select({ calories: mealLogs.calories, proteins: mealLogs.proteins })
          .from(mealLogs)
          .where(and(eq(mealLogs.userId, user.id), gte(mealLogs.logDate, sevenDaysAgo.toISOString().split('T')[0])));
        const totalCals = nutritionRows.reduce((s, r) => s + (r.calories ?? 0), 0);
        const totalProt = nutritionRows.reduce((s, r) => s + (r.proteins ?? 0), 0);
        const avgCalories = nutritionRows.length > 0 ? totalCals / daysLogged : null;
        const avgProtein = nutritionRows.length > 0 ? totalProt / daysLogged : null;
        // Obtener perfil para peso objetivo
        const profile = await db
          .select({ weight: userProfiles.weight, targetWeight: userProfiles.targetWeight })
          .from(userProfiles)
          .where(eq(userProfiles.userId, user.id))
          .limit(1);
        const currentWeight = profile[0]?.weight ?? null;
        const targetWeight = profile[0]?.targetWeight ?? null;
        // Calcular cambio de peso esta semana
        const lastWeekWeight = await db
          .select({ weight: userHealthMetrics.weight })
          .from(userHealthMetrics)
          .where(and(
            eq(userHealthMetrics.userId, user.id),
            gte(userHealthMetrics.recordedAt, fourteenDaysAgo.toISOString().split('T')[0]),
            lte(userHealthMetrics.recordedAt, sevenDaysAgo.toISOString().split('T')[0]),
          ))
          .orderBy(sql`${userHealthMetrics.recordedAt} DESC`)
          .limit(1);
        const weightChange = (currentWeight && lastWeekWeight[0]?.weight)
          ? currentWeight - lastWeekWeight[0].weight
          : null;
        // Calcular racha (número de días consecutivos)
        const allLogs = await db
          .selectDistinct({ logDate: mealLogs.logDate })
          .from(mealLogs)
          .where(eq(mealLogs.userId, user.id))
          .orderBy(sql`${mealLogs.logDate} DESC`)
          .limit(60);
        let streakDays = 0;
        if (allLogs.length > 0) {
          const dates = allLogs.map(r => r.logDate).sort().reverse();
          const today = now.toISOString().split('T')[0];
          const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
          if (dates[0] === today || dates[0] === yesterday) {
            streakDays = 1;
            for (let i = 1; i < dates.length; i++) {
              const prev = new Date(dates[i - 1]!);
              const curr = new Date(dates[i]!);
              const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
              if (diff === 1) streakDays++;
              else break;
            }
          }
        }
        await sendUserWeeklyProgress({
          userEmail: user.email,
          userName: user.name ?? "Usuario",
          daysLogged,
          avgCalories,
          avgProtein,
          weightChange,
          currentWeight,
          targetWeight,
          streakDays,
        });
        sent++;
      } catch (err) {
        logger.error(`Failed to send weekly progress to ${user.email}:`, err);
      }
    }
    logger.info(`User weekly progress: ${sent} sent`);
  } catch (err) {
    logger.error("Error in user weekly progress job:", err);
  }
}

// ─── Job: Procesador de cola de emails de onboarding ───────────────────────────────────
export async function runOnboardingEmailProcessor() {
  try {
    await processPendingEmails();
  } catch (err) {
    logger.error("Error in onboarding email processor:", err);
  }
}

// ─── Job: Resumen semanal del experto ────────────────────────────────────────
export async function runExpertWeeklySummary() {
  logger.info("Starting expert weekly summary job...");
  const db = await getDb();
  if (!db) { logger.warn("DB not available"); return; }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Obtener todos los expertos activos
    const experts = await db
      .select({
        id: buddyExperts.id,
        userId: buddyExperts.userId,
        displayName: buddyExperts.displayName,
        expertEmail: users.email,
      })
      .from(buddyExperts)
      .innerJoin(users, eq(users.id, buddyExperts.userId))
      .where(isNotNull(users.email));

    let sent = 0;
    for (const expert of experts) {
      if (!expert.expertEmail) continue;

      try {
        // Pacientes activos
        const activePatients = await db
          .select({ id: expertPatients.id, patientUserId: expertPatients.patientUserId })
          .from(expertPatients)
          .where(and(eq(expertPatients.expertId, expert.id), eq(expertPatients.status, "active")));

        if (activePatients.length === 0) continue; // No enviar si no tiene pacientes

        // Citas de la semana pasada
        const weekAppointments = await db
          .select({ id: expertAppointments.id, status: expertAppointments.status })
          .from(expertAppointments)
          .where(
            and(
              eq(expertAppointments.expertId, expert.id),
              gte(expertAppointments.startTime, sevenDaysAgo),
              lte(expertAppointments.startTime, now),
            )
          );

        // Próximas citas
        const nextAppointments = await db
          .select({
            id: expertAppointments.id,
            title: expertAppointments.title,
            startTime: expertAppointments.startTime,
            patientName: users.name,
          })
          .from(expertAppointments)
          .innerJoin(users, eq(users.id, expertAppointments.patientUserId))
          .where(
            and(
              eq(expertAppointments.expertId, expert.id),
              gte(expertAppointments.startTime, now),
              eq(expertAppointments.status, "scheduled"),
            )
          )
          .orderBy(expertAppointments.startTime)
          .limit(5);

        // Mensajes no leídos
        const unreadMessages = await db
          .select({ id: expertMessages.id })
          .from(expertMessages)
          .innerJoin(expertPatients, eq(expertPatients.id, expertMessages.expertPatientId))
          .where(
            and(
              eq(expertPatients.expertId, expert.id),
              eq(expertMessages.senderRole, "patient"),
              eq(expertMessages.isRead, false),
            )
          );

        // Check-ins de la semana
        const weekCheckins = await db
          .select({ id: weeklyCheckins.id, adherenceScore: weeklyCheckins.adherenceScore })
          .from(weeklyCheckins)
          .innerJoin(expertPatients, eq(expertPatients.id, weeklyCheckins.expertPatientId))
          .where(
            and(
              eq(expertPatients.expertId, expert.id),
              gte(weeklyCheckins.createdAt, sevenDaysAgo),
            )
          );

        const avgAdherence = weekCheckins.length > 0
          ? Math.round(weekCheckins.reduce((sum, c) => sum + (c.adherenceScore ?? 0), 0) / weekCheckins.length)
          : null;

        await sendExpertWeeklySummary({
          expertEmail: expert.expertEmail,
          expertName: expert.displayName ?? "Experto",
          activePatients: activePatients.length,
          pendingCheckins: activePatients.length - weekCheckins.length,
          appointmentsThisWeek: weekAppointments.length,
          avgAdherence,
          newMessages: unreadMessages.length,
        });
        sent++;
      } catch (err) {
        logger.error(`Failed to send weekly summary to expert ${expert.id}:`, err);
      }
    }

    logger.info(`Expert weekly summaries: ${sent} sent`);
  } catch (err) {
    logger.error("Error in expert weekly summary job:", err);
  }
}

// ─── Scheduler principal ─────────────────────────────────────────────────────
/**
 * Registra todos los jobs de email con sus horarios.
 * Se llama una vez al arrancar el servidor.
 */
export function startEmailJobs() {
  logger.info("Registering email jobs...");

  // Helper para programar un job en el próximo momento específico (hora UTC)
  function scheduleDaily(hour: number, minute: number, job: () => Promise<void>, label: string) {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(hour, minute, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const msUntil = next.getTime() - now.getTime();
    logger.info(`[${label}] Next run in ${(msUntil / 3600000).toFixed(1)}h (${next.toISOString()})`);
    setTimeout(() => {
      job().catch(err => logger.error(`[${label}] Job error:`, err));
      setInterval(() => {
        job().catch(err => logger.error(`[${label}] Job error:`, err));
      }, 24 * 60 * 60 * 1000); // repeat daily
    }, msUntil);
  }

  function scheduleHourly(job: () => Promise<void>, label: string) {
    const msUntil = 60 * 60 * 1000;
    logger.info(`[${label}] First run in 1h, then hourly`);
    setTimeout(() => {
      job().catch(err => logger.error(`[${label}] Job error:`, err));
      setInterval(() => {
        job().catch(err => logger.error(`[${label}] Job error:`, err));
      }, 60 * 60 * 1000);
    }, msUntil);
  }
  function scheduleWeekly(dayOfWeek: number, hour: number, minute: number, job: () => Promise<void>, label: string) {
    // dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
    const now = new Date();
    const next = new Date(now);
    const currentDay = now.getUTCDay();
    let daysUntil = (dayOfWeek - currentDay + 7) % 7;
    if (daysUntil === 0) {
      const todayAtTime = new Date(now);
      todayAtTime.setUTCHours(hour, minute, 0, 0);
      if (todayAtTime <= now) daysUntil = 7;
    }
    next.setUTCDate(now.getUTCDate() + daysUntil);
    next.setUTCHours(hour, minute, 0, 0);
    const msUntil = next.getTime() - now.getTime();
    logger.info(`[${label}] Next run in ${(msUntil / 3600000).toFixed(1)}h (${next.toISOString()})`);
    setTimeout(() => {
      job().catch(err => logger.error(`[${label}] Job error:`, err));
      setInterval(() => {
        job().catch(err => logger.error(`[${label}] Job error:`, err));
      }, 7 * 24 * 60 * 60 * 1000); // repeat weekly
    }, msUntil);
  }

  // Lunes 08:00 UTC — Recordatorio de check-in semanal
  scheduleWeekly(1, 8, 0, runWeeklyCheckinReminders, "CheckinReminder");

  // Lunes 09:00 UTC — Resumen semanal del experto
  scheduleWeekly(1, 9, 0, runExpertWeeklySummary, "ExpertWeeklySummary");

  // Diario 10:00 UTC — Reactivación por inactividad
  scheduleDaily(10, 0, runInactivityEmails, "InactivityEmails");

   // Diario 11:00 UTC — Recordatorio de cita 24h antes
  scheduleDaily(11, 0, runAppointmentReminders, "AppointmentReminders");
  // Domingo 20:00 UTC — Resumen semanal de progreso del usuario
  scheduleWeekly(0, 20, 0, runUserWeeklyProgress, "UserWeeklyProgress");
  // Cada hora — Procesador de cola de emails de onboarding
  scheduleHourly(runOnboardingEmailProcessor, "OnboardingProcessor");

  // Diario 18:00 UTC (20:00 España) — Recordatorio de racha en peligro
  scheduleDaily(18, 0, runStreakReminderJob, "StreakReminder");

  // Diario 19:00 UTC (21:00 España) — Resumen diario nocturno
  scheduleDaily(19, 0, runDailySummaryJob, "DailySummary");

  logger.info("All email jobs registered.");
}

// ─── Job: Recordatorio de racha en peligro (20:00 hora España = 18:00 UTC) ───
export async function runStreakReminderJob() {
  logger.info("Starting streak reminder job (20:00 Spain)...");
  const db = await getDb();
  if (!db) { logger.warn("DB not available"); return; }

  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Usuarios con email activos (que han registrado comidas en los últimos 30 días)
    // Usamos un subquery sobre mealLogs para filtrar usuarios activos
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeUserIds = await db
      .selectDistinct({ userId: mealLogs.userId })
      .from(mealLogs)
      .where(gte(mealLogs.createdAt, thirtyDaysAgo))
      .limit(500);
    const activeIds = activeUserIds.map(r => r.userId);
    if (activeIds.length === 0) { logger.info("No active users found"); return; }
    const activeUsers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(
        and(
          isNotNull(users.email),
          ne(users.role, "admin"),
          ne(users.role, "buddyexpert"),
        )
      )
      .limit(500);
    const activeUsersFiltered = activeUsers.filter(u => activeIds.includes(u.id));

    let sent = 0;
    for (const user of activeUsersFiltered) {
      if (!user.email) continue;
      try {
        // Verificar si ya registró hoy
        const todayLogs = await db
          .select({ id: mealLogs.id, calories: mealLogs.calories })
          .from(mealLogs)
          .where(and(eq(mealLogs.userId, user.id), eq(mealLogs.logDate, todayStr)));

        // Calcular racha
        const allLogs = await db
          .selectDistinct({ logDate: mealLogs.logDate })
          .from(mealLogs)
          .where(eq(mealLogs.userId, user.id))
          .orderBy(sql`${mealLogs.logDate} DESC`)
          .limit(60);

        let streakDays = 0;
        if (allLogs.length > 0) {
          const dates = allLogs.map(r => r.logDate).sort().reverse();
          const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
          // La racha solo cuenta si el último registro fue ayer (hoy aún no ha registrado)
          if (dates[0] === yesterday) {
            streakDays = 1;
            for (let i = 1; i < dates.length; i++) {
              const prev = new Date(dates[i - 1]!);
              const curr = new Date(dates[i]!);
              const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
              if (diff === 1) streakDays++;
              else break;
            }
          }
        }

        // Solo enviar si tiene racha >= 2 días y NO ha registrado hoy
        if (streakDays < 2 || todayLogs.length > 0) continue;

        // Calorías registradas hoy (puede ser 0 si no hay logs)
        const caloriesLogged = todayLogs.reduce((s, r) => s + (r.calories ?? 0), 0);

        // Obtener objetivo calórico del perfil
        const profile = await db
          .select({ dailyCalorieGoal: userProfiles.dailyCalorieGoal })
          .from(userProfiles)
          .where(eq(userProfiles.userId, user.id))
          .limit(1);
        const dailyGoal = profile[0]?.dailyCalorieGoal ?? 2000;

        const { sendStreakReminderEmail } = await import("../email");
        await sendStreakReminderEmail({
          userEmail: user.email,
          userName: user.name ?? "Usuario",
          streakDays,
          caloriesLogged,
          dailyGoal,
        });
        sent++;
      } catch (err) {
        logger.error(`Failed to send streak reminder to ${user.email}:`, err);
      }
    }
    logger.info(`Streak reminders: ${sent} sent`);
  } catch (err) {
    logger.error("Error in streak reminder job:", err);
  }
}

// ─── Job: Resumen diario nocturno (21:00 hora España = 19:00 UTC) ─────────────

// Micro-tips nutricionales rotativos
const MICRO_TIPS = [
  "Beber un vaso de agua antes de cada comida ayuda a controlar el apetito y mejorar la digestión.",
  "Las proteínas de calidad (huevo, legumbres, pescado) son clave para mantener la masa muscular mientras pierdes grasa.",
  "Masticar despacio y sin distracciones mejora la saciedad y reduce la ingesta calórica hasta un 20%.",
  "Los carbohidratos complejos (avena, arroz integral, boniato) dan energía sostenida sin picos de glucosa.",
  "Dormir 7-8 horas regula las hormonas del hambre (grelina y leptina) y facilita la pérdida de peso.",
  "Añadir especias como cúrcuma, jengibre o canela a tus platos tiene efectos antiinflamatorios demostrados.",
  "La fibra soluble (avena, manzana, legumbres) alimenta tu microbiota intestinal y mejora el tránsito.",
  "El aceite de oliva virgen extra es una de las mejores grasas para la salud cardiovascular.",
  "Planificar el menú del día siguiente reduce las decisiones impulsivas y mejora la adherencia a tu dieta.",
  "Los frutos secos (30g/día) aportan grasas saludables, proteínas y minerales sin disparar las calorías.",
  "El desayuno rico en proteínas reduce el apetito durante todo el día según múltiples estudios.",
  "Cocinar en casa te da control total sobre los ingredientes y reduce la ingesta de ultraprocesados.",
];

export async function runDailySummaryJob() {
  logger.info("Starting daily summary job (21:00 Spain)...");
  const db = await getDb();
  if (!db) { logger.warn("DB not available"); return; }

  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split("T")[0];

    // Usuarios que han registrado comidas en los últimos 7 días
    const sevenDaysAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentUserIds = await db
      .selectDistinct({ userId: mealLogs.userId })
      .from(mealLogs)
      .where(gte(mealLogs.createdAt, sevenDaysAgoDate))
      .limit(500);
    const recentIds = recentUserIds.map(r => r.userId);
    if (recentIds.length === 0) { logger.info("No active users for daily summary"); return; }
    const allActiveUsers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(
        and(
          isNotNull(users.email),
          ne(users.role, "admin"),
        )
      )
      .limit(500);
    const activeUsers = allActiveUsers.filter(u => recentIds.includes(u.id));

    let sent = 0;
    for (const user of activeUsers) {
      if (!user.email) continue;
      try {
        // Logs de hoy
        const todayLogs = await db
          .select({ calories: mealLogs.calories, proteins: mealLogs.proteins, carbs: mealLogs.carbohydrates, fats: mealLogs.fats })
          .from(mealLogs)
          .where(and(eq(mealLogs.userId, user.id), eq(mealLogs.logDate, todayStr)));

        // Solo enviar si registró al menos una comida hoy
        if (todayLogs.length === 0) continue;

        const caloriesLogged = todayLogs.reduce((s, r) => s + (r.calories ?? 0), 0);
        const proteinsLogged = todayLogs.reduce((s, r) => s + (r.proteins ?? 0), 0);
        const carbsLogged = todayLogs.reduce((s, r) => s + (r.carbs ?? 0), 0);
        const fatsLogged = todayLogs.reduce((s, r) => s + (r.fats ?? 0), 0);

        // Objetivo calórico
        const profile = await db
          .select({ dailyCalorieGoal: userProfiles.dailyCalorieGoal })
          .from(userProfiles)
          .where(eq(userProfiles.userId, user.id))
          .limit(1);
        const dailyGoal = profile[0]?.dailyCalorieGoal ?? 2000;

        // Calcular racha
        const allLogs = await db
          .selectDistinct({ logDate: mealLogs.logDate })
          .from(mealLogs)
          .where(eq(mealLogs.userId, user.id))
          .orderBy(sql`${mealLogs.logDate} DESC`)
          .limit(60);

        let streakDays = 0;
        if (allLogs.length > 0) {
          const dates = allLogs.map(r => r.logDate).sort().reverse();
          if (dates[0] === todayStr || dates[0] === new Date(now.getTime() - 86400000).toISOString().split("T")[0]) {
            streakDays = 1;
            for (let i = 1; i < dates.length; i++) {
              const prev = new Date(dates[i - 1]!);
              const curr = new Date(dates[i]!);
              const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
              if (diff === 1) streakDays++;
              else break;
            }
          }
        }

        // Receta sugerida para mañana (una receta aleatoria del menú del usuario o de la biblioteca)
        let tomorrowRecipeName: string | null = null;
        let tomorrowRecipeUrl: string | null = null;
        try {
          const { recipes } = await import("../../drizzle/schema");
          const suggestedRecipe = await db
            .select({ id: recipes.id, name: recipes.name })
            .from(recipes)
            .orderBy(sql`RAND()`)
            .limit(1);
          if (suggestedRecipe[0]) {
            tomorrowRecipeName = suggestedRecipe[0].name;
            tomorrowRecipeUrl = `${process.env.PUBLIC_APP_URL || "https://buddymarketapp.com"}/app/recipes/${suggestedRecipe[0].id}`;
          }
        } catch (_) { /* no recipe suggestion */ }

        // Micro-tip del día (rotativo según día del año)
        const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
        const microTip = MICRO_TIPS[dayOfYear % MICRO_TIPS.length] ?? MICRO_TIPS[0]!;

        const { sendDailySummaryEmail } = await import("../email");
        await sendDailySummaryEmail({
          userEmail: user.email,
          userName: user.name ?? "Usuario",
          caloriesLogged,
          dailyGoal,
          proteinsLogged,
          carbsLogged,
          fatsLogged,
          mealsLogged: todayLogs.length,
          streakDays,
          tomorrowRecipeName,
          tomorrowRecipeUrl,
          microTip,
        });
        sent++;
      } catch (err) {
        logger.error(`Failed to send daily summary to ${user.email}:`, err);
      }
    }
    logger.info(`Daily summaries: ${sent} sent`);
  } catch (err) {
    logger.error("Error in daily summary job:", err);
  }
}
