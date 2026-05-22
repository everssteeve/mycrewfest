/**
 * E2E tests for ICS export from the planning page.
 *
 * Requires: dev server + seed data with at least one FestEvent that has
 * selected events (must-see or intéressé).
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

async function goToFirstFestEvent(
  page: import("@playwright/test").Page
): Promise<string | null> {
  // Navigate to first festevent planning page
  await page.goto("/catalogue");
  const firstFestCard = page.locator('a[href^="/festevent/"]').first();
  if ((await firstFestCard.count()) === 0) return null;
  const href = await firstFestCard.getAttribute("href");
  return href;
}

test.describe("ICS export — planning page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("export .ics link is visible on the planning page", async ({ page }) => {
    // Navigate directly to a festevent planning page
    const res = await page.request.get("/api/festevents");
    if (!res.ok()) {
      test.skip();
      return;
    }

    const festEvents: { id: string }[] = await res.json();
    if (!Array.isArray(festEvents) || festEvents.length === 0) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEvents[0].id}/planning`);
    await page.waitForLoadState("networkidle");

    const icsLink = page.getByRole("link", { name: /\.ics/i }).or(
      page.locator('a[download][href*="/planning/export"]')
    );
    await expect(icsLink).toBeVisible({ timeout: 8_000 });
  });

  test("ICS export API returns text/calendar content", async ({ page }) => {
    const res = await page.request.get("/api/festevents");
    if (!res.ok()) {
      test.skip();
      return;
    }

    const festEvents: { id: string }[] = await res.json();
    if (!Array.isArray(festEvents) || festEvents.length === 0) {
      test.skip();
      return;
    }

    const exportRes = await page.request.get(
      `/api/festevents/${festEvents[0].id}/planning/export`
    );

    expect(exportRes.status()).toBe(200);
    const contentType = exportRes.headers()["content-type"] ?? "";
    expect(contentType).toContain("text/calendar");

    const body = await exportRes.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("END:VCALENDAR");
    expect(body).toContain("VERSION:2.0");
  });

  test("ICS export returns 401 when not authenticated", async ({ browser }) => {
    const ctx = await browser.newContext(); // no auth cookies
    const anonPage = await ctx.newPage();

    const res = await anonPage.request.get(
      "/api/festevents/any-id/planning/export"
    );
    expect(res.status()).toBe(401);
    await ctx.close();
  });
});
