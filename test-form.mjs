import { test, expect } from "@playwright/test";

/**
 * End-to-end test for the Tester.io contact form.
 *
 * What it proves:
 *   1. The form on the home page can be filled and submitted.
 *   2. On success the browser is redirected to /thankyou.html.
 *
 * Why it's safe to run locally:
 *   Every external request is intercepted (mocked), so nothing is written to
 *   your real Supabase project, no row is appended to Google Sheets, and no
 *   welcome email is sent via Resend. The test runs fully offline and fast.
 *
 *   Mocked endpoints:
 *     - Supabase REST insert  ->  /rest/v1/contact_messages   (faked 201 OK)
 *     - Google Apps Script    ->  script.google.com/.../exec  (faked 200 OK)
 *     - Welcome email         ->  /api/send-welcome           (faked 200 OK)
 */

const SAMPLE = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Excited about the Tester Pro Terminal — please add me to early access!",
};

// Intercept all three external destinations the form talks to, so the test is
// hermetic (no real network, no real data). Returning success makes the form's
// success branch run and redirect to the thank-you page.
async function mockExternalRequests(page) {
  // 1) Supabase insert — supabase-js does a CROSS-ORIGIN insert without
  //    .select(), so a 201 is treated as success (error === null). Because it's
  //    cross-origin, the browser enforces CORS: the faked response MUST carry
  //    Access-Control-* headers, and the preflight OPTIONS must be answered too,
  //    or the browser blocks the request and the form's insert throws.
  await page.route("**/rest/v1/contact_messages**", (route) => {
    const req = route.request();
    const cors = {
      "Access-Control-Allow-Origin": req.headers()["origin"] || "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      // Echo the headers supabase-js asks for (apikey, authorization, prefer, …).
      "Access-Control-Allow-Headers":
        req.headers()["access-control-request-headers"] || "*",
    };
    if (req.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: cors, body: "" });
    }
    return route.fulfill({
      status: 201,
      headers: { ...cors, "content-type": "application/json" },
      body: "[]",
    });
  });

  // 2) Google Sheets Apps Script (the form posts no-cors / best-effort).
  await page.route("**/script.google.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  );

  // 3) Welcome-email endpoint — same-origin (/api proxied), lets the test pass
  //    without server.js running.
  await page.route("**/api/send-welcome", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' })
  );
}

test("contact form submits and redirects to the thank-you page", async ({ page }) => {
  await mockExternalRequests(page);

  // Open the local site (baseURL = http://localhost:3000 from playwright.config).
  await page.goto("/");

  // Scope to the contact form — the page has several other submit buttons
  // (hero "Get Early Access", account modal, footer "Subscribe"), so we must
  // target the form inside the #contact section specifically.
  const form = page.locator("#contact form");

  await form.locator('input[name="name"]').fill(SAMPLE.name);
  await form.locator('input[name="email"]').fill(SAMPLE.email);
  await form.locator('textarea[name="message"]').fill(SAMPLE.message);
  // The newsletter checkbox is pre-checked; we leave it ticked.
  await expect(form.locator('input[name="newsletter"]')).toBeChecked();

  // Submit, and wait for the redirect to the thank-you page. The form only
  // redirects after all three mocked requests settle, which is a bit slower in
  // Firefox, so we allow generous headroom.
  await Promise.all([
    page.waitForURL(/thankyou\.html/, { timeout: 25_000 }),
    form.locator('button[type="submit"]').click(),
  ]);

  // Confirm we landed on the thank-you page.
  await expect(page).toHaveURL(/thankyou\.html/);
  await expect(page.locator("body")).toContainText(/list|thank/i);
});
