/**
 * BuddyMarket — Smoke Test
 * Minimal test: 1 VU, 30s — verifica que los endpoints críticos responden.
 * Se ejecuta en cada PR para detectar regresiones rápidamente.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.BASE_URL || "https://appbuddymarket.com";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed:   ["rate<0.10"],
  },
};

export default function () {
  // 1. Health check
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, {
    "health OK":        (r) => r.status === 200,
    "health db ok":     (r) => { try { return JSON.parse(r.body).ok === true; } catch { return false; } },
    "health fast":      (r) => r.timings.duration < 1000,
  });
  sleep(1);

  // 2. Landing page
  const landing = http.get(`${BASE_URL}/`);
  check(landing, {
    "landing 200": (r) => r.status === 200,
  });
  sleep(0.5);

  // 3. tRPC auth.me (public)
  const authMe = http.get(
    `${BASE_URL}/api/trpc/auth.me?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { json: null } }))}`,
    { headers: { "Content-Type": "application/json" } }
  );
  check(authMe, {
    "auth.me 200":       (r) => r.status === 200,
    "auth.me valid JSON": (r) => { try { JSON.parse(r.body); return true; } catch { return false; } },
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: "  ", enableColors: true }),
    "load-tests/reports/smoke-latest.json": JSON.stringify(data, null, 2),
  };
}
