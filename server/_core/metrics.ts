/**
 * tRPC Performance Metrics Module
 *
 * Collects per-procedure latency (p50/p95/p99), call counts and error rates
 * in-memory. Exposes a /api/metrics endpoint in Prometheus text format and
 * a /api/metrics/json endpoint for dashboards.
 *
 * For production, pipe these metrics to Datadog / Grafana / Prometheus.
 */

import type { Express } from "express";
import logger from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcedureStats {
  calls: number;
  errors: number;
  totalDurationMs: number;
  latencies: number[]; // last 1000 samples
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const stats = new Map<string, ProcedureStats>();

// Global counters
let totalCalls = 0;
let totalErrors = 0;
const startTime = Date.now();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreate(key: string): ProcedureStats {
  if (!stats.has(key)) {
    stats.set(key, { calls: 0, errors: 0, totalDurationMs: 0, latencies: [] });
  }
  return stats.get(key)!;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ─── tRPC Middleware ──────────────────────────────────────────────────────────

/**
 * tRPC middleware that records latency and error rate per procedure.
 * Add to publicProcedure and protectedProcedure in trpc.ts.
 */
export const metricsTrpcMiddleware = async (opts: {
  path: string;
  type: string;
  next: () => Promise<unknown>;
  ctx: unknown;
  rawInput: unknown;
}) => {
  const { path, type, next } = opts;
  const key = `${type}.${path}`;
  const start = Date.now();
  totalCalls++;

  try {
    const result = await next();
    const durationMs = Date.now() - start;
    const s = getOrCreate(key);
    s.calls++;
    s.totalDurationMs += durationMs;
    s.latencies.push(durationMs);
    // Keep only last 1000 samples to bound memory
    if (s.latencies.length > 1000) s.latencies.shift();

    // Log slow procedures (>2s)
    if (durationMs > 2000) {
      logger.warn(`[Metrics] Slow procedure: ${key} took ${durationMs}ms`);
    }

    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    totalErrors++;
    const s = getOrCreate(key);
    s.calls++;
    s.errors++;
    s.totalDurationMs += durationMs;
    s.latencies.push(durationMs);
    if (s.latencies.length > 1000) s.latencies.shift();
    throw error;
  }
};

// ─── Metrics snapshot ─────────────────────────────────────────────────────────

export function getMetricsSnapshot() {
  const procedures: Record<string, {
    calls: number;
    errors: number;
    errorRate: string;
    avgLatencyMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  }> = {};

  for (const [key, s] of Array.from(stats.entries())) {
    const sorted = [...s.latencies].sort((a, b) => a - b);
    procedures[key] = {
      calls: s.calls,
      errors: s.errors,
      errorRate: s.calls > 0 ? `${((s.errors / s.calls) * 100).toFixed(1)}%` : "0%",
      avgLatencyMs: s.calls > 0 ? Math.round(s.totalDurationMs / s.calls) : 0,
      p50Ms: percentile(sorted, 50),
      p95Ms: percentile(sorted, 95),
      p99Ms: percentile(sorted, 99),
    };
  }

  return {
    uptime: Math.round((Date.now() - startTime) / 1000),
    totalCalls,
    totalErrors,
    globalErrorRate: totalCalls > 0 ? `${((totalErrors / totalCalls) * 100).toFixed(1)}%` : "0%",
    procedures,
  };
}

// ─── Prometheus text format ───────────────────────────────────────────────────

function toPrometheusText(): string {
  const lines: string[] = [];
  const snapshot = getMetricsSnapshot();

  lines.push(`# HELP trpc_calls_total Total tRPC procedure calls`);
  lines.push(`# TYPE trpc_calls_total counter`);
  lines.push(`trpc_calls_total ${snapshot.totalCalls}`);

  lines.push(`# HELP trpc_errors_total Total tRPC procedure errors`);
  lines.push(`# TYPE trpc_errors_total counter`);
  lines.push(`trpc_errors_total ${snapshot.totalErrors}`);

  lines.push(`# HELP process_uptime_seconds Server uptime in seconds`);
  lines.push(`# TYPE process_uptime_seconds gauge`);
  lines.push(`process_uptime_seconds ${snapshot.uptime}`);

  lines.push(`# HELP trpc_procedure_calls_total Calls per procedure`);
  lines.push(`# TYPE trpc_procedure_calls_total counter`);
  for (const [key, p] of Object.entries(snapshot.procedures)) {
    const label = key.replace(/[^a-zA-Z0-9_.]/g, "_");
    lines.push(`trpc_procedure_calls_total{procedure="${label}"} ${p.calls}`);
  }

  lines.push(`# HELP trpc_procedure_errors_total Errors per procedure`);
  lines.push(`# TYPE trpc_procedure_errors_total counter`);
  for (const [key, p] of Object.entries(snapshot.procedures)) {
    const label = key.replace(/[^a-zA-Z0-9_.]/g, "_");
    lines.push(`trpc_procedure_errors_total{procedure="${label}"} ${p.errors}`);
  }

  lines.push(`# HELP trpc_procedure_latency_p95_ms P95 latency per procedure in ms`);
  lines.push(`# TYPE trpc_procedure_latency_p95_ms gauge`);
  for (const [key, p] of Object.entries(snapshot.procedures)) {
    const label = key.replace(/[^a-zA-Z0-9_.]/g, "_");
    lines.push(`trpc_procedure_latency_p95_ms{procedure="${label}"} ${p.p95Ms}`);
  }

  return lines.join("\n") + "\n";
}

// ─── Express routes ───────────────────────────────────────────────────────────

/**
 * Register /api/metrics (Prometheus) and /api/metrics/json endpoints.
 * Both are restricted to internal/admin use via a simple bearer token check.
 */
export function registerMetricsRoutes(app: Express): void {
  const metricsToken = process.env.METRICS_TOKEN;

  function checkAuth(req: any, res: any): boolean {
    if (!metricsToken) return true; // no token configured → open (dev mode)
    const auth = req.headers.authorization as string | undefined;
    if (!auth || auth !== `Bearer ${metricsToken}`) {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    }
    return true;
  }

  // Prometheus scrape endpoint
  app.get("/api/metrics", (req: any, res: any) => {
    if (!checkAuth(req, res)) return;
    res.set("Content-Type", "text/plain; version=0.0.4");
    res.send(toPrometheusText());
  });

  // JSON dashboard endpoint
  app.get("/api/metrics/json", (req: any, res: any) => {
    if (!checkAuth(req, res)) return;
    res.json(getMetricsSnapshot());
  });

  logger.info("[Metrics] Routes registered: GET /api/metrics, GET /api/metrics/json");
}
