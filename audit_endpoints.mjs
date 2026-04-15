/**
 * BuddyMarket — Auditoría completa de endpoints tRPC
 * Prueba todos los endpoints públicos y verifica que devuelven JSON válido
 */

const BASE = "http://localhost:3000";

const results = [];

async function testGet(label, path) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Accept": "application/json" },
    });
    const ct = res.headers.get("content-type") ?? "";
    const isJson = ct.includes("application/json") || ct.includes("text/plain");
    let body;
    try {
      body = await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      results.push({ label, status: res.status, ok: false, error: `Non-JSON response: ${text.slice(0, 80)}` });
      return;
    }
    const ok = res.status < 500 && isJson;
    results.push({ label, status: res.status, ok, body: JSON.stringify(body).slice(0, 120) });
  } catch (e) {
    results.push({ label, status: 0, ok: false, error: e.message });
  }
}

async function testPost(label, path, payload) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get("content-type") ?? "";
    const isJson = ct.includes("application/json") || ct.includes("text/plain");
    let body;
    try {
      body = await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      results.push({ label, status: res.status, ok: false, error: `Non-JSON response: ${text.slice(0, 80)}` });
      return;
    }
    // For auth endpoints, 401/403 is expected without a valid session
    const ok = res.status < 500 && isJson;
    results.push({ label, status: res.status, ok, body: JSON.stringify(body).slice(0, 120) });
  } catch (e) {
    results.push({ label, status: 0, ok: false, error: e.message });
  }
}

// ── Public GET endpoints ──────────────────────────────────────────────────────
await testGet("auth.me (no session)", "/api/trpc/auth.me");
await testGet("recipes.list", "/api/trpc/recipes.list?input=%7B%22json%22%3A%7B%22page%22%3A1%2C%22limit%22%3A5%7D%7D");
await testGet("buddyExperts.list", "/api/trpc/buddyExperts.list?input=%7B%22json%22%3A%7B%7D%7D");
await testGet("buddyMakers.list", "/api/trpc/buddyMakers.list?input=%7B%22json%22%3A%7B%7D%7D");
await testGet("catalogs.allergies", "/api/trpc/catalogs.allergies");
await testGet("catalogs.dietaryRestrictions", "/api/trpc/catalogs.dietaryRestrictions");
await testGet("catalogs.categories", "/api/trpc/catalogs.categories");
await testGet("catalogs.units", "/api/trpc/catalogs.units");
await testGet("subscriptions.plans", "/api/trpc/subscriptions.plans");
await testGet("notifications.inApp.unreadCount (no session)", "/api/trpc/notifications.inApp.unreadCount");

// ── Protected GET endpoints (expect 401/UNAUTHORIZED, not 500 or HTML) ───────
await testGet("profile.get (no session)", "/api/trpc/profile.get");
await testGet("menus.getMyMenus (no session)", "/api/trpc/menus.getMyMenus");
await testGet("shoppingLists.getMyLists (no session)", "/api/trpc/shoppingLists.getMyLists");
await testGet("inventory.getMyInventory (no session)", "/api/trpc/inventory.getMyInventory");
await testGet("mealLog.getMyLogs (no session)", "/api/trpc/mealLog.getMyLogs?input=%7B%22json%22%3A%7B%7D%7D");
await testGet("buddyExperts.getMyProfile (no session)", "/api/trpc/buddyExperts.getMyProfile");
await testGet("expertPlans.myPlans (no session)", "/api/trpc/expertPlans.myPlans");
await testGet("admin.getUsers (no session)", "/api/trpc/admin.getUsers?input=%7B%22json%22%3A%7B%7D%7D");
await testGet("plan.getMyPlan (no session)", "/api/trpc/plan.getMyPlan");
await testGet("metrics.getMyMetrics (no session)", "/api/trpc/metrics.getMyMetrics?input=%7B%22json%22%3A%7B%7D%7D");

// ── POST mutations (expect 401/UNAUTHORIZED, not 500 or HTML) ────────────────
await testPost("auth.logout", "/api/trpc/auth.logout", { json: {} });
await testPost("auth.sendOTP", "/api/trpc/auth.sendOTP", { json: { email: "test@example.com" } });

// ── Static assets ─────────────────────────────────────────────────────────────
const staticTests = [
  ["/", "Landing page HTML"],
  ["/login", "Login page HTML"],
  ["/favicon.ico", "Favicon"],
  ["/favicon-192x192.png", "Logo PNG"],
  ["/manifest.json", "PWA Manifest"],
  ["/sw.js", "Service Worker"],
  ["/locales/es/translation.json", "ES translations"],
  ["/locales/en/translation.json", "EN translations"],
];

for (const [path, label] of staticTests) {
  try {
    const res = await fetch(`${BASE}${path}`);
    const ct = res.headers.get("content-type") ?? "";
    const ok = res.status < 400;
    results.push({ label, status: res.status, ok, body: `Content-Type: ${ct.slice(0, 60)}` });
  } catch (e) {
    results.push({ label, status: 0, ok: false, error: e.message });
  }
}

// ── Print results ──────────────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════════════════════════════");
console.log("  BuddyMarket — Auditoría de Endpoints");
console.log("═══════════════════════════════════════════════════════════════\n");

const passed = results.filter(r => r.ok);
const failed = results.filter(r => !r.ok);

for (const r of results) {
  const icon = r.ok ? "✅" : "❌";
  const statusStr = r.status ? `[${r.status}]` : "[ERR]";
  const detail = r.error ?? r.body ?? "";
  console.log(`${icon} ${statusStr} ${r.label}`);
  if (!r.ok) console.log(`   └─ ${detail}`);
}

console.log(`\n─────────────────────────────────────────────────────────────────`);
console.log(`  Resultado: ${passed.length}/${results.length} OK  |  ${failed.length} fallos`);
console.log(`─────────────────────────────────────────────────────────────────\n`);

if (failed.length > 0) {
  console.log("FALLOS DETALLADOS:");
  for (const r of failed) {
    console.log(`\n  ❌ ${r.label} [${r.status}]`);
    console.log(`     ${r.error ?? r.body ?? ""}`);
  }
}

process.exit(failed.length > 0 ? 1 : 0);
