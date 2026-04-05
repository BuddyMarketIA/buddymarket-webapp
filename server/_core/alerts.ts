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
