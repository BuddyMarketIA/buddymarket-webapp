/**
 * BuddyMarket — k6 Load Test Suite
 *
 * Scenarios:
 *   smoke  → 1 VU, 1 min  — sanity check, verifica que todo responde
 *   load   → ramp to 50 VUs over 5 min, hold 10 min, ramp down 2 min
 *   stress → ramp to 200 VUs over 10 min, hold 5 min, ramp down 3 min
 *
 * Usage:
 *   k6 run --env SCENARIO=smoke  --env BASE_URL=https://staging.appbuddymarket.com load-tests/main.js
 *   k6 run --env SCENARIO=load   --env BASE_URL=https://staging.appbuddymarket.com load-tests/main.js
 *   k6 run --env SCENARIO=stress --env BASE_URL=https://staging.appbuddymarket.com load-tests/main.js
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// ─── Custom Metrics ────────────────────────────────────────────────────────────
const errorRate        = new Rate("buddymarket_errors");
const healthLatency    = new Trend("buddymarket_health_latency", true);
const trpcLatency      = new Trend("buddymarket_trpc_latency", true);
const authLatency      = new Trend("buddymarket_auth_latency", true);
const recipesLatency   = new Trend("buddymarket_recipes_latency", true);
const requestsTotal    = new Counter("buddymarket_requests_total");

// ─── Configuration ─────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "https://appbuddymarket.com";
const SCENARIO = __ENV.SCENARIO || "smoke";

const SCENARIOS = {
  smoke: {
    executor: "constant-vus",
    vus: 1,
    duration: "1m",
    gracefulStop: "10s",
  },
  load: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "2m", target: 10 },   // ramp up to 10 VUs
      { duration: "3m", target: 50 },   // ramp up to 50 VUs
      { duration: "10m", target: 50 },  // hold at 50 VUs
      { duration: "2m", target: 0 },    // ramp down
    ],
    gracefulRampDown: "30s",
  },
  stress: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "2m", target: 20 },   // warm up
      { duration: "3m", target: 100 },  // ramp to 100
      { duration: "5m", target: 200 },  // ramp to 200 (stress)
      { duration: "5m", target: 200 },  // hold at 200
      { duration: "3m", target: 0 },    // ramp down
    ],
    gracefulRampDown: "30s",
  },
};

// ─── Thresholds ────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    [SCENARIO]: SCENARIOS[SCENARIO] || SCENARIOS.smoke,
  },
  thresholds: {
    // Global HTTP thresholds
    http_req_duration:              ["p(95)<2000", "p(99)<5000"],
    http_req_failed:                ["rate<0.05"],   // <5% error rate

    // Custom metric thresholds
    buddymarket_errors:             ["rate<0.05"],
    buddymarket_health_latency:     ["p(95)<500"],   // health check must be fast
    buddymarket_trpc_latency:       ["p(95)<2000"],  // tRPC under 2s at p95
    buddymarket_auth_latency:       ["p(95)<1000"],  // auth under 1s at p95
    buddymarket_recipes_latency:    ["p(95)<2000"],  // recipes list under 2s
  },
  // Output summary to console and HTML report
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json",
};

function trpcBatch(procedures) {
  const input = JSON.stringify(
    procedures.reduce((acc, { path, input }, i) => {
      acc[i] = { json: input };
      return acc;
    }, {})
  );
  const paths = procedures.map((p) => p.path).join(",");
  return http.get(
    `${BASE_URL}/api/trpc/${paths}?batch=1&input=${encodeURIComponent(input)}`,
    { headers: HEADERS, tags: { endpoint: "trpc" } }
  );
}

// ─── Test Scenarios ────────────────────────────────────────────────────────────
export default function () {
  requestsTotal.add(1);

  // 1. Health check — always first
  group("Health & Status", () => {
    const res = http.get(`${BASE_URL}/api/health`, {
      headers: HEADERS,
      tags: { endpoint: "health" },
    });
    healthLatency.add(res.timings.duration);
    const ok = check(res, {
      "health: status 200":        (r) => r.status === 200,
      "health: ok=true":           (r) => { try { return JSON.parse(r.body).ok === true; } catch { return false; } },
      "health: db status ok":      (r) => { try { return JSON.parse(r.body).db?.status === "ok"; } catch { return false; } },
      "health: response < 500ms":  (r) => r.timings.duration < 500,
    });
    errorRate.add(!ok);
    sleep(0.5);
  });

  // 2. Public landing page
  group("Public Pages", () => {
    const res = http.get(`${BASE_URL}/`, {
      tags: { endpoint: "landing" },
    });
    const ok = check(res, {
      "landing: status 200": (r) => r.status === 200,
      "landing: has content": (r) => r.body && r.body.length > 100,
    });
    errorRate.add(!ok);
    sleep(0.3);
  });

  // 3. tRPC public procedures (no auth required)
  group("tRPC Public Procedures", () => {
    // auth.me — should return null for unauthenticated users
    const authRes = http.get(
      `${BASE_URL}/api/trpc/auth.me?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { json: null } }))}`,
      { headers: HEADERS, tags: { endpoint: "trpc_auth" } }
    );
    authLatency.add(authRes.timings.duration);
    const authOk = check(authRes, {
      "auth.me: status 200":      (r) => r.status === 200,
      "auth.me: valid JSON":       (r) => { try { JSON.parse(r.body); return true; } catch { return false; } },
      "auth.me: response < 1s":   (r) => r.timings.duration < 1000,
    });
    errorRate.add(!authOk);
    sleep(0.5);
  });

  // 4. Metrics endpoint (with token if available)
  group("Metrics Endpoint", () => {
    const metricsToken = __ENV.METRICS_TOKEN || "";
    const metricsHeaders = metricsToken
      ? { ...HEADERS, Authorization: `Bearer ${metricsToken}` }
      : HEADERS;

    const res = http.get(`${BASE_URL}/api/metrics/json`, {
      headers: metricsHeaders,
      tags: { endpoint: "metrics" },
    });
    // Accept 200 (with token) or 401 (without token) — both are correct
    const ok = check(res, {
      "metrics: responds":          (r) => r.status === 200 || r.status === 401,
      "metrics: response < 500ms":  (r) => r.timings.duration < 500,
    });
    errorRate.add(!ok);
    sleep(0.3);
  });

  // 5. Static assets
  group("Static Assets", () => {
    const res = http.get(`${BASE_URL}/robots.txt`, {
      tags: { endpoint: "static" },
    });
    check(res, {
      "robots.txt: responds": (r) => r.status === 200 || r.status === 404,
    });
    sleep(0.2);
  });

  // Random think time between iterations (0.5s - 2s)
  sleep(Math.random() * 1.5 + 0.5);
}

// ─── Summary Report ────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const reportFile = `load-tests/reports/report-${SCENARIO}-${timestamp}.html`;

  return {
    stdout: textSummary(data, { indent: "  ", enableColors: true }),
    [reportFile]: htmlReport(data),
    "load-tests/reports/latest.json": JSON.stringify(data, null, 2),
  };
}
