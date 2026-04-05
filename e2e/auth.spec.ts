import { test, expect } from "@playwright/test";

/**
 * Auth Flow E2E Tests
 * These tests verify the authentication flow of BuddyMarket:
 * - Unauthenticated users are redirected to login
 * - Protected routes require authentication
 * - Public pages are accessible without login
 */

test.describe("Auth Flow — Public pages", () => {
  test("landing page loads without authentication", async ({ page }) => {
    await page.goto("/");
    // Should show the landing page, not redirect to login
    await expect(page).not.toHaveURL(/login/);
    // Should have the main CTA
    await expect(page.locator("text=Empezar gratis").first()).toBeVisible();
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    // Should render the login page or redirect to OAuth
    // Either way, it should not be a 404
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Not Found");
  });

  test("pricing page is accessible without login", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Auth Flow — Protected routes redirect to login", () => {
  test("dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/app/dashboard");
    // Should redirect away from the dashboard
    await page.waitForURL((url) =>
      !url.pathname.startsWith("/app/dashboard") ||
      url.pathname === "/login" ||
      url.pathname === "/"
    );
    const currentUrl = page.url();
    // Either redirected to login, home, or shows a login prompt
    const isRedirected =
      currentUrl.includes("/login") ||
      currentUrl === new URL("/", page.url()).href ||
      currentUrl.includes("oauth");
    // If still on /app/dashboard, check for login prompt
    if (!isRedirected) {
      const hasLoginButton = await page
        .locator("text=Iniciar sesión, text=Login, text=Sign in")
        .count();
      expect(hasLoginButton).toBeGreaterThan(0);
    }
  });

  test("my-menus redirects unauthenticated users", async ({ page }) => {
    await page.goto("/app/my-menus");
    await page.waitForURL((url) => !url.pathname.startsWith("/app/my-menus"), {
      timeout: 5000,
    }).catch(() => {});
    const currentUrl = page.url();
    const isProtected =
      currentUrl.includes("/login") ||
      currentUrl.includes("oauth") ||
      !currentUrl.includes("/app/my-menus");
    if (!isProtected) {
      // If still on the page, it should show a login prompt
      const hasLoginButton = await page
        .locator("button:has-text('Iniciar sesión'), a:has-text('Iniciar sesión')")
        .count();
      expect(hasLoginButton).toBeGreaterThan(0);
    }
  });

  test("meal-log redirects unauthenticated users", async ({ page }) => {
    await page.goto("/app/meal-log");
    await page.waitForURL((url) => !url.pathname.startsWith("/app/meal-log"), {
      timeout: 5000,
    }).catch(() => {});
    const currentUrl = page.url();
    const isProtected =
      currentUrl.includes("/login") ||
      currentUrl.includes("oauth") ||
      !currentUrl.includes("/app/meal-log");
    if (!isProtected) {
      const hasLoginButton = await page
        .locator("button:has-text('Iniciar sesión'), a:has-text('Iniciar sesión')")
        .count();
      expect(hasLoginButton).toBeGreaterThan(0);
    }
  });

  test("admin panel redirects unauthenticated users", async ({ page }) => {
    await page.goto("/app/admin");
    await page.waitForURL((url) => !url.pathname.startsWith("/app/admin"), {
      timeout: 5000,
    }).catch(() => {});
    const currentUrl = page.url();
    const isProtected =
      currentUrl.includes("/login") ||
      currentUrl.includes("oauth") ||
      !currentUrl.includes("/app/admin");
    if (!isProtected) {
      const hasLoginButton = await page
        .locator("button:has-text('Iniciar sesión'), a:has-text('Iniciar sesión')")
        .count();
      expect(hasLoginButton).toBeGreaterThan(0);
    }
  });
});

test.describe("Auth Flow — API endpoints require authentication", () => {
  test("GET /api/trpc/auth.me returns null for unauthenticated request", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D"
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    // auth.me returns null for unauthenticated users (publicProcedure)
    const result = Array.isArray(body) ? body[0] : body;
    const data = result?.result?.data?.json ?? result?.result?.data;
    expect(data).toBeNull();
  });

  test("POST /api/trpc/menus.list returns UNAUTHORIZED for unauthenticated request", async ({
    request,
  }) => {
    const response = await request.post("/api/trpc/menus.list?batch=1", {
      data: { "0": { json: null } },
      headers: { "Content-Type": "application/json" },
    });
    // Should return 401 or a tRPC UNAUTHORIZED error
    const body = await response.json();
    const result = Array.isArray(body) ? body[0] : body;
    const isUnauthorized =
      response.status() === 401 ||
      result?.error?.data?.code === "UNAUTHORIZED" ||
      result?.error?.data?.httpStatus === 401;
    expect(isUnauthorized).toBe(true);
  });

  test("POST /api/trpc/admin.stats returns UNAUTHORIZED for unauthenticated request", async ({
    request,
  }) => {
    const response = await request.post("/api/trpc/admin.stats?batch=1", {
      data: { "0": { json: null } },
      headers: { "Content-Type": "application/json" },
    });
    const body = await response.json();
    const result = Array.isArray(body) ? body[0] : body;
    const isUnauthorized =
      response.status() === 401 ||
      result?.error?.data?.code === "UNAUTHORIZED" ||
      result?.error?.data?.httpStatus === 401;
    expect(isUnauthorized).toBe(true);
  });

  test("POST /api/trpc/buddyIA.generateMenuWithQuestionnaire returns UNAUTHORIZED", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/trpc/buddyIA.generateMenuWithQuestionnaire?batch=1",
      {
        data: { "0": { json: { startDate: "2026-04-01", days: 7 } } },
        headers: { "Content-Type": "application/json" },
      }
    );
    const body = await response.json();
    const result = Array.isArray(body) ? body[0] : body;
    const isUnauthorized =
      response.status() === 401 ||
      result?.error?.data?.code === "UNAUTHORIZED" ||
      result?.error?.data?.httpStatus === 401;
    expect(isUnauthorized).toBe(true);
  });
});
