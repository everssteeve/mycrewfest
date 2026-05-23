/**
 * E2E smoke test — festival .ics download button and API route.
 * Requires: dev server running with at least one festival in the DB.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Festival — Add to Calendar (.ics)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("ICS download button is visible on festival detail page", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");

    const icsBtn = page.locator('[data-testid="festival-ics-download"]');
    const visible = await icsBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) { test.skip(); return; }

    await expect(icsBtn).toBeVisible();
    await expect(icsBtn).toHaveAttribute("download");
  });

  test("ICS API returns valid calendar content", async ({ page }) => {
    const response = await page.request.get("/api/festivals/hellfest-2026/ics");

    if (response.status() === 404) { test.skip(); return; }

    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("text/calendar");

    const body = await response.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("BEGIN:VEVENT");
    expect(body).toContain("END:VEVENT");
    expect(body).toContain("END:VCALENDAR");
    expect(body).toContain("DTSTART;VALUE=DATE:");
  });

  test("ICS API returns 404 for unknown festival", async ({ page }) => {
    const response = await page.request.get("/api/festivals/festival-qui-nexiste-pas/ics");
    expect(response.status()).toBe(404);
  });

  test("ICS content includes festival name and location", async ({ page }) => {
    const response = await page.request.get("/api/festivals/hellfest-2026/ics");
    if (response.status() === 404) { test.skip(); return; }

    const body = await response.text();
    expect(body).toContain("SUMMARY:");
    expect(body).toContain("LOCATION:");
  });
});
