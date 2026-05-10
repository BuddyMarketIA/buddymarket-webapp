/**
 * Alerting Module
 *
 * Sends operational alerts to Slack (webhook) and/or email when critical
 * events occur: server errors, performance degradation, security incidents.
 *
 * Configuration (Settings → Secrets):
 *   SLACK_WEBHOOK_URL  — Slack Incoming Webhook URL
 *   ALERT_EMAIL        — Email address for critical alerts (uses Resend)
 *   METRICS_TOKEN      — Bearer token to protect /api/metrics endpoints
 *
 * Usage:
 *   import { alert } from "./alerts";
 *   await alert("error", "Payment webhook failed", { orderId: "123" });
 */

import logger from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "error" | "critical";

export interface AlertPayload {
  severity: AlertSeverity;
  title: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp?: string;
}

// ─── Slack ────────────────────────────────────────────────────────────────────

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  info: ":information_source:",
  warning: ":warning:",
  error: ":x:",
  critical: ":rotating_light:",
};

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  info: "#36a64f",
  warning: "#ffcc00",
  error: "#e01e5a",
  critical: "#8b0000",
};

async function sendSlackAlert(payload: AlertPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const emoji = SEVERITY_EMOJI[payload.severity];
  const color = SEVERITY_COLOR[payload.severity];
  const env = process.env.NODE_ENV ?? "development";
  const ts = payload.timestamp ?? new Date().toISOString();

  const body = {
    text: `${emoji} *[${payload.severity.toUpperCase()}]* ${payload.title}`,
    attachments: [
      {
        color,
        fields: [
          { title: "Environment", value: env, short: true },
          { title: "Time", value: ts, short: true },
          { title: "Message", value: payload.message, short: false },
          ...(payload.context
            ? Object.entries(payload.context).map(([k, v]) => ({
                title: k,
                value: String(v),
                short: true,
              }))
            : []),
        ],
        footer: "BuddyMarket Alerts",
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      logger.warn(`[Alerts] Slack webhook returned ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    logger.warn("[Alerts] Failed to send Slack alert:", err);
  }
}

// ─── Main alert function ──────────────────────────────────────────────────────

/**
 * Send an alert to all configured channels (Slack, log).
 * Only sends to Slack for "error" and "critical" severity by default.
 */
export async function alert(
  severity: AlertSeverity,
  title: string,
  context?: Record<string, unknown>
): Promise<void> {
  const payload: AlertPayload = {
    severity,
    title,
    message: context?.message as string ?? title,
    context,
    timestamp: new Date().toISOString(),
  };

  // Always log locally
  const logFn = severity === "info" ? logger.info
    : severity === "warning" ? logger.warn
    : logger.error;
  logFn(`[Alert:${severity.toUpperCase()}] ${title}`, context ?? {});

  // Send to Slack for warning/error/critical
  if (severity !== "info") {
    await sendSlackAlert(payload);
  }
}

// ─── Performance watchdog ─────────────────────────────────────────────────────

/**
 * Periodically checks metrics and fires alerts when thresholds are exceeded.
 * Call startPerformanceWatchdog() once after server start.
 */
export function startPerformanceWatchdog(): void {
  const intervalMs = 5 * 60 * 1000; // check every 5 minutes

  setInterval(async () => {
    try {
      // Lazy import to avoid circular dependency
      const { getMetricsSnapshot } = await import("./metrics");
      const snapshot = getMetricsSnapshot();

      // Alert if global error rate > 5%
      const errorRate = snapshot.totalCalls > 100
        ? (snapshot.totalErrors / snapshot.totalCalls) * 100
        : 0;

      if (errorRate > 5) {
        await alert("error", `High global error rate: ${errorRate.toFixed(1)}%`, {
          totalCalls: snapshot.totalCalls,
          totalErrors: snapshot.totalErrors,
          uptime: snapshot.uptime,
        });
      }

      // Alert if any procedure has p95 > 5s
      for (const [proc, stats] of Object.entries(snapshot.procedures)) {
        if (stats.p95Ms > 5000 && stats.calls > 10) {
          await alert("warning", `Slow procedure detected: ${proc}`, {
            p95Ms: stats.p95Ms,
            p99Ms: stats.p99Ms,
            calls: stats.calls,
            errorRate: stats.errorRate,
          });
        }
      }
    } catch (err) {
      logger.warn("[Alerts] Watchdog check failed:", err);
    }
  }, intervalMs);

  logger.info("[Alerts] Performance watchdog started (interval: 5 min)");
}

// ─── Supabase connection monitor ────────────────────────────────────────────────

/**
 * Checks Supabase connection pool usage and notifies the owner when
 * approaching the plan limit (60 connections on free tier).
 *
 * Thresholds:
 *   ≥ 70% used  → warning notification
 *   ≥ 90% used  → critical notification + notifyOwner push
 *
 * Call startSupabaseMonitor() once after server start.
 */

const SUPABASE_FREE_TIER_MAX = 60;
const SUPABASE_WARNING_THRESHOLD = 0.70;  // 70%
const SUPABASE_CRITICAL_THRESHOLD = 0.90; // 90%

// Avoid spamming: only send one alert per severity per hour
const _lastAlertSent: Record<string, number> = {};
function shouldSendAlert(key: string, cooldownMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  if (!_lastAlertSent[key] || now - _lastAlertSent[key] > cooldownMs) {
    _lastAlertSent[key] = now;
    return true;
  }
  return false;
}

export function startSupabaseMonitor(): void {
  const intervalMs = 30 * 60 * 1000; // check every 30 minutes

  const checkConnections = async () => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return;

      // Query pg_stat_activity to count active connections to our database
      const { sql } = await import("drizzle-orm");
      const result = await db.execute(
        sql`SELECT count(*) as total,
            sum(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active,
            sum(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) as idle
            FROM pg_stat_activity
            WHERE datname = current_database()`
      );

      const row = (result as any).rows?.[0] ?? (result as any)[0];
      if (!row) return;

      const total = parseInt(String(row.total ?? 0), 10);
      const active = parseInt(String(row.active ?? 0), 10);
      const idle = parseInt(String(row.idle ?? 0), 10);
      const usagePercent = (total / SUPABASE_FREE_TIER_MAX) * 100;

      logger.info(`[SupabaseMonitor] Connections: ${total}/${SUPABASE_FREE_TIER_MAX} (${usagePercent.toFixed(1)}%) — active: ${active}, idle: ${idle}`);

      if (usagePercent >= SUPABASE_CRITICAL_THRESHOLD * 100) {
        if (shouldSendAlert('supabase_critical')) {
          await alert("critical", `Supabase: conexiones al límite (${usagePercent.toFixed(1)}%)`, {
            message: `Se están usando ${total} de ${SUPABASE_FREE_TIER_MAX} conexiones disponibles en el plan gratuito de Supabase. Es necesario ampliar el plan URGENTEMENTE para evitar caídas.`,
            total, active, idle,
            usagePercent: `${usagePercent.toFixed(1)}%`,
            planLimit: SUPABASE_FREE_TIER_MAX,
            upgradeUrl: "https://supabase.com/dashboard/project/ncgkjyozcxcekjztdadv/settings/billing",
          });
          // Also push in-app notification to owner
          try {
            const { notifyOwner } = await import("./notification");
            await notifyOwner({
              title: "🚨 Supabase al límite — Ampliar plan",
              content: `Se están usando ${total}/${SUPABASE_FREE_TIER_MAX} conexiones (${usagePercent.toFixed(1)}%). El plan gratuito está casi agotado. Ve a https://supabase.com/dashboard/project/ncgkjyozcxcekjztdadv/settings/billing para ampliar el plan y evitar caídas de la app.`,
            });
          } catch { /* ignore notification errors */ }
        }
      } else if (usagePercent >= SUPABASE_WARNING_THRESHOLD * 100) {
        if (shouldSendAlert('supabase_warning')) {
          await alert("warning", `Supabase: uso elevado de conexiones (${usagePercent.toFixed(1)}%)`, {
            message: `Se están usando ${total} de ${SUPABASE_FREE_TIER_MAX} conexiones. Considera ampliar el plan de Supabase pronto.`,
            total, active, idle,
            usagePercent: `${usagePercent.toFixed(1)}%`,
            planLimit: SUPABASE_FREE_TIER_MAX,
            upgradeUrl: "https://supabase.com/dashboard/project/ncgkjyozcxcekjztdadv/settings/billing",
          });
          try {
            const { notifyOwner } = await import("./notification");
            await notifyOwner({
              title: "⚠️ Supabase: uso elevado de conexiones",
              content: `Se están usando ${total}/${SUPABASE_FREE_TIER_MAX} conexiones de Supabase (${usagePercent.toFixed(1)}%). Considera ampliar el plan en https://supabase.com/dashboard/project/ncgkjyozcxcekjztdadv/settings/billing`,
            });
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      logger.warn("[SupabaseMonitor] Check failed:", err);
    }
  };

  // Run once immediately after server start (with a small delay)
  setTimeout(checkConnections, 10_000);
  // Then every 30 minutes
  setInterval(checkConnections, intervalMs);

  logger.info("[SupabaseMonitor] Started — checking every 30 min (thresholds: warn 70%, critical 90%)");
}

// ─── Startup alert ────────────────────────────────────────────────────────────

export async function sendStartupAlert(): Promise<void> {
  const env = process.env.NODE_ENV ?? "development";
  if (env === "production") {
    await alert("info", `BuddyMarket server started`, {
      environment: env,
      version: process.env.npm_package_version ?? "unknown",
      nodeVersion: process.version,
    });
  }
}
