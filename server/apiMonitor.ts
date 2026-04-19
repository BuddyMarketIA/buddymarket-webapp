/**
 * API Health Monitor Service
 * Checks all active monitors, logs results, and notifies owner on failures.
 */
import * as db from "./db";

const FAIL_THRESHOLD = 10; // Notify after 10 consecutive failures
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h between notifications per monitor

let monitorInterval: ReturnType<typeof setInterval> | null = null;

// ── Single endpoint check ────────────────────────────────────────────────────
export async function checkEndpoint(
  endpoint: string,
  method: string,
  expectedStatus: number,
  baseUrl: string
): Promise<{ status: "ok" | "degraded" | "down"; latencyMs: number; httpStatus: number | null; errorMessage: string | null }> {
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    const httpStatus = res.status;

    if (httpStatus === expectedStatus || (expectedStatus === 200 && httpStatus < 400)) {
      return { status: "ok", latencyMs, httpStatus, errorMessage: null };
    } else if (httpStatus >= 500) {
      return { status: "down", latencyMs, httpStatus, errorMessage: `HTTP ${httpStatus}` };
    } else {
      return { status: "degraded", latencyMs, httpStatus, errorMessage: `HTTP ${httpStatus} (expected ${expectedStatus})` };
    }
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const isTimeout = err?.name === "AbortError";
    return {
      status: "down",
      latencyMs,
      httpStatus: null,
      errorMessage: isTimeout ? "Timeout (>10s)" : (err?.message ?? "Unknown error"),
    };
  }
}

// ── Run all monitors ─────────────────────────────────────────────────────────
export async function runAllMonitors(baseUrl: string = "http://localhost:3000"): Promise<void> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return;

  const { apiMonitors, apiHealthLogs } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const monitors = await drizzleDb
    .select()
    .from(apiMonitors)
    .where(eq(apiMonitors.isActive, true));

  for (const monitor of monitors) {
    const result = await checkEndpoint(monitor.endpoint, monitor.method, monitor.expectedStatus, baseUrl);

    // Log the result
    await drizzleDb.insert(apiHealthLogs).values({
      monitorId: monitor.id,
      status: result.status,
      latencyMs: result.latencyMs,
      httpStatus: result.httpStatus ?? undefined,
      errorMessage: result.errorMessage,
    });

    // Update monitor state
    const newFailCount = result.status === "ok" ? 0 : (monitor.failCount ?? 0) + 1;
    const shouldNotify =
      result.status !== "ok" &&
      newFailCount >= FAIL_THRESHOLD &&
      (!monitor.notifiedAt || Date.now() - new Date(monitor.notifiedAt).getTime() > NOTIFY_COOLDOWN_MS);

    await drizzleDb
      .update(apiMonitors)
      .set({
        lastStatus: result.status,
        lastLatencyMs: result.latencyMs,
        lastCheckedAt: new Date(),
        lastErrorMessage: result.errorMessage,
        failCount: newFailCount,
        notifiedAt: shouldNotify ? new Date() : monitor.notifiedAt,
        updatedAt: new Date(),
      })
      .where(eq(apiMonitors.id, monitor.id));

    // Send notification if needed
    if (shouldNotify) {
      try {
        const { notifyOwner } = await import("./_core/notification");
        await notifyOwner({
          title: `🚨 API caída: ${monitor.name}`,
          content: `El monitor "${monitor.name}" ha fallado ${newFailCount} veces consecutivas.\nEndpoint: ${monitor.endpoint}\nError: ${result.errorMessage ?? "Sin respuesta"}\nLatencia: ${result.latencyMs}ms\nHora: ${new Date().toLocaleString("es-ES")}\n\nAccede al panel de monitorización: https://buddymarketapp.com/admin/api-monitor`,
        });
        console.log(`[Monitor] Alert sent for ${monitor.name}`);
      } catch (notifyErr) {
        console.error("[Monitor] Failed to send alert:", notifyErr);
      }
    }

    console.log(`[Monitor] ${monitor.name}: ${result.status} (${result.latencyMs}ms)`);
  }

  // Purge logs older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { lt } = await import("drizzle-orm");
  await drizzleDb.delete(apiHealthLogs).where(lt(apiHealthLogs.checkedAt, sevenDaysAgo));
}

// ── Start/stop the background job ────────────────────────────────────────────
export function startMonitorJob(baseUrl?: string): void {
  if (monitorInterval) return;
  console.log("[Monitor] Starting API health monitor job (every 5 min)");
  // Run immediately on start
  runAllMonitors(baseUrl).catch(console.error);
  monitorInterval = setInterval(() => {
    runAllMonitors(baseUrl).catch(console.error);
  }, CHECK_INTERVAL_MS);
}

export function stopMonitorJob(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}
