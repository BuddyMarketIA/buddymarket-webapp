import { defineConfig, devices } from "@playwright/test";

/**
 * BuddyMarket Playwright E2E Test Configuration
 * Tests run against the dev server at localhost:3000
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Do NOT auto-start the server — tests assume it's already running
  // webServer: { command: "pnpm dev", port: 3000, reuseExistingServer: true },
});
