import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the Tester.io contact-form E2E test.
 *
 * - testDir is the project root, but only `test-form.mjs` is picked up (testMatch).
 * - `headless: false` so you can WATCH the browser fill and submit the form.
 * - `reducedMotion: "reduce"` disables the 5s intro overlay + scroll-reveal
 *   animations (see CLAUDE.md), so the form is interactable immediately and the
 *   run is deterministic.
 * - `webServer` auto-starts Vite (`npm run dev`) on :3000 and reuses an already
 *   running dev server if you have one open. The backend (server.js :5000) is NOT
 *   required — the test mocks every external request, including /api/send-welcome.
 */
export default defineConfig({
  testDir: ".",
  testMatch: ["test-form.mjs"],
  fullyParallel: false,
  workers: 1, // run one browser window at a time so it's easy to watch
  reporter: "list",
  timeout: 45_000,

  use: {
    baseURL: "http://localhost:3000",
    headless: false, // visible browser — watch the test execute
    reducedMotion: "reduce", // skip the intro overlay & reveals for a stable run
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } }, // "Safari" engine
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
