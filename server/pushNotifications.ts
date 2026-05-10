/**
 * Push Notifications Helper
 * Uses web-push library with VAPID keys to send Web Push notifications
 * to subscribed users.
 */

import webpush from "web-push";

// Configure VAPID keys once at module load
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.PUBLIC_APP_URL
  ? `mailto:hola@buddyoneapp.com`
  : "mailto:hola@buddyoneapp.com";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[PushNotifications] VAPID keys not configured — push notifications disabled");
    return;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Send a push notification to a single subscription.
 * Returns true on success, false on failure (expired/invalid subscription).
 */
export async function sendPushToSubscription(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  ensureVapidConfigured();
  if (!vapidConfigured) return false;

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: 86400, // 24 hours
      urgency: "normal",
    });
    return true;
  } catch (err: any) {
    // 410 Gone = subscription expired/unsubscribed
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      console.log(`[PushNotifications] Subscription expired (${err.statusCode}): ${subscription.endpoint.slice(0, 50)}...`);
      return false; // Caller should delete this subscription
    }
    console.error("[PushNotifications] Send error:", err?.message || err);
    return false;
  }
}

/**
 * Send a push notification to all subscriptions of a user.
 * Returns the count of successful sends.
 * Automatically removes expired subscriptions from the DB.
 */
export async function sendPushToUser(
  userId: number,
  payload: PushPayload
): Promise<number> {
  ensureVapidConfigured();
  if (!vapidConfigured) return 0;

  try {
    const { getDb } = await import("./db.js");
    const { pushSubscriptions } = await import("../drizzle/schema.js");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) return 0;

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) return 0;

    let successCount = 0;
    const expiredEndpoints: string[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        const success = await sendPushToSubscription(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        );
        if (success) {
          successCount++;
        } else {
          expiredEndpoints.push(sub.endpoint);
        }
      })
    );

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      const { inArray, and } = await import("drizzle-orm");
      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, userId),
            inArray(pushSubscriptions.endpoint, expiredEndpoints)
          )
        );
      console.log(`[PushNotifications] Cleaned up ${expiredEndpoints.length} expired subscriptions for user ${userId}`);
    }

    return successCount;
  } catch (err: any) {
    console.error("[PushNotifications] sendPushToUser error:", err?.message || err);
    return 0;
  }
}

/**
 * Send push notifications to all users who have subscriptions.
 * Used for broadcast notifications (e.g., weekly reminders).
 */
export async function sendPushBroadcast(
  payload: PushPayload,
  filter?: { userIds?: number[] }
): Promise<{ sent: number; failed: number }> {
  ensureVapidConfigured();
  if (!vapidConfigured) return { sent: 0, failed: 0 };

  try {
    const { getDb } = await import("./db.js");
    const { pushSubscriptions } = await import("../drizzle/schema.js");
    const { inArray } = await import("drizzle-orm");

    const db = await getDb();
    if (!db) return { sent: 0, failed: 0 };

    let query = db.select().from(pushSubscriptions);
    if (filter?.userIds && filter.userIds.length > 0) {
      query = query.where(inArray(pushSubscriptions.userId, filter.userIds)) as any;
    }

    const subs = await query;
    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    // Process in batches of 50 to avoid overwhelming the push service
    const batchSize = 50;
    for (let i = 0; i < subs.length; i += batchSize) {
      const batch = subs.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (sub) => {
          const success = await sendPushToSubscription(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload
          );
          if (success) {
            sent++;
          } else {
            failed++;
            expiredEndpoints.push(sub.endpoint);
          }
        })
      );
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      const { inArray: inArr } = await import("drizzle-orm");
      await db
        .delete(pushSubscriptions)
        .where(inArr(pushSubscriptions.endpoint, expiredEndpoints));
    }

    return { sent, failed };
  } catch (err: any) {
    console.error("[PushNotifications] sendPushBroadcast error:", err?.message || err);
    return { sent: 0, failed: 0 };
  }
}
