/**
 * Push Notification Cron Jobs
 * Sends periodic push notifications to users for:
 * - Weekly weight reminder (Monday morning)
 * - Weekly measurements reminder (Monday morning)
 * - Daily diary reminder (if user hasn't logged today)
 */

import { sendPushToUser } from "./pushNotifications.js";

// Simple interval-based cron (runs checks every hour)
let cronInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Check if it's time to send weekly reminders (Monday 9:00 AM Spain time)
 * We approximate Spain time as UTC+1 (winter) / UTC+2 (summer)
 */
function isWeeklyReminderTime(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcDay = now.getUTCDay(); // 0=Sunday, 1=Monday

  // Monday at 7-8 UTC = 8-9 CET (winter) or 9-10 CEST (summer)
  return utcDay === 1 && (utcHour === 7 || utcHour === 8);
}

/**
 * Check if it's time to send daily diary reminders (8:00 PM Spain time)
 */
function isDailyReminderTime(): boolean {
  const now = new Date();
  const utcHour = now.getUTCHours();
  // 18-19 UTC = 19-20 CET / 20-21 CEST
  return utcHour === 18 || utcHour === 19;
}

// Track last sent times to avoid duplicate sends
const lastSent: Record<string, number> = {};

function shouldSend(key: string, minIntervalMs: number): boolean {
  const last = lastSent[key] ?? 0;
  const now = Date.now();
  if (now - last < minIntervalMs) return false;
  lastSent[key] = now;
  return true;
}

/**
 * Send weekly weight/measurements reminder to all users with push subscriptions
 */
async function sendWeeklyReminders() {
  if (!shouldSend("weekly", 23 * 60 * 60 * 1000)) return; // max once per 23h

  try {
    const { getDb } = await import("./db.js");
    const { pushSubscriptions, userMetrics } = await import("../drizzle/schema.js");
    const { eq, sql, not, inArray } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) return;

    // Get all users with push subscriptions
    const subsRows = await db
      .selectDistinct({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions);

    if (subsRows.length === 0) return;

    const userIds = subsRows.map((r) => r.userId);

    // Check which users haven't logged weight this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

    const recentWeightLogs = await db
      .selectDistinct({ userId: userMetrics.userId })
      .from(userMetrics)
      .where(
        sql`${userMetrics.userId} IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)}) AND ${userMetrics.date} >= ${oneWeekAgoStr} AND ${userMetrics.weight} IS NOT NULL`
      );

    const usersWithRecentWeight = new Set(recentWeightLogs.map((r) => r.userId));
    const usersNeedingReminder = userIds.filter((id) => !usersWithRecentWeight.has(id));

    console.log(`[PushCron] Weekly reminder: ${usersNeedingReminder.length} users need weight reminder`);

    // Send reminders
    for (const userId of usersNeedingReminder) {
      await sendPushToUser(userId, {
        title: "⚖️ Registra tu peso semanal",
        body: "¡Es lunes! Anota tu peso de esta semana para hacer seguimiento de tu progreso.",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        url: "/app/meal-log",
        tag: "weekly-weight-reminder",
        data: { type: "weekly_weight_reminder" },
      });
    }
  } catch (err: any) {
    console.error("[PushCron] Weekly reminder error:", err?.message || err);
  }
}

/**
 * Send daily diary reminder to users who haven't logged any meals today
 */
async function sendDailyDiaryReminders() {
  if (!shouldSend("daily", 23 * 60 * 60 * 1000)) return; // max once per 23h

  try {
    const { getDb } = await import("./db.js");
    const { pushSubscriptions, mealLogs } = await import("../drizzle/schema.js");
    const { sql } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) return;

    const today = new Date().toISOString().split("T")[0];

    // Get users with push subscriptions who haven't logged today
    const subsRows = await db
      .selectDistinct({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions);

    if (subsRows.length === 0) return;

    const userIds = subsRows.map((r) => r.userId);

    const loggedTodayRows = await db
      .selectDistinct({ userId: mealLogs.userId })
      .from(mealLogs)
      .where(
        sql`${mealLogs.userId} IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)}) AND ${mealLogs.logDate} = ${today}`
      );

    const usersLoggedToday = new Set(loggedTodayRows.map((r) => r.userId));
    const usersNeedingReminder = userIds.filter((id) => !usersLoggedToday.has(id));

    console.log(`[PushCron] Daily diary reminder: ${usersNeedingReminder.length} users haven't logged today`);

    for (const userId of usersNeedingReminder) {
      await sendPushToUser(userId, {
        title: "🍽️ ¿Has registrado tus comidas hoy?",
        body: "Mantén el control de tu nutrición. Anota lo que has comido hoy en tu diario.",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        url: "/app/meal-log",
        tag: "daily-diary-reminder",
        data: { type: "daily_diary_reminder" },
      });
    }
  } catch (err: any) {
    console.error("[PushCron] Daily diary reminder error:", err?.message || err);
  }
}

/**
 * Start the cron job scheduler
 * Runs checks every hour
 */
export function startPushCron() {
  if (cronInterval) return; // Already running

  console.log("[PushCron] Starting push notification cron scheduler");

  // Check every hour
  cronInterval = setInterval(async () => {
    try {
      if (isWeeklyReminderTime()) {
        await sendWeeklyReminders();
      }
      if (isDailyReminderTime()) {
        await sendDailyDiaryReminders();
      }
    } catch (err: any) {
      console.error("[PushCron] Cron tick error:", err?.message || err);
    }
  }, 60 * 60 * 1000); // Every hour

  // Run an initial check after 5 minutes (to avoid startup noise)
  setTimeout(async () => {
    if (isWeeklyReminderTime()) await sendWeeklyReminders();
    if (isDailyReminderTime()) await sendDailyDiaryReminders();
  }, 5 * 60 * 1000);
}

/**
 * Stop the cron job scheduler
 */
export function stopPushCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log("[PushCron] Push notification cron stopped");
  }
}
