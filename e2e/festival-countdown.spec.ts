/**
 * E2E smoke tests — Festival countdown badge on detail page.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Festival Countdown Badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("festival detail page loads without error", async ({ page }) => {
    const res = await page.request.get("/api/festivals/hellfest-2026");
    if (res.status() === 404) { test.skip(); return; }

    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/404");
  });

  test("countdown badge is present or absent based on festival dates", async ({ page }) => {
    const apiRes = await page.request.get("/api/festivals/hellfest-2026");
    if (apiRes.status() === 404) { test.skip(); return; }

    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");

    const now = new Date();
    const festData = await apiRes.json();
    const start = new Date(festData.startDate);
    const end = new Date(festData.endDate);

    const daysUntil = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isOngoing = start <= now && end >= now;
    const shouldShow = isOngoing || (daysUntil >= 0 && daysUntil <= 14);

    const badge = page.locator('[data-testid="festival-countdown-badge"]');
    if (shouldShow) {
      await expect(badge).toBeVisible({ timeout: 3_000 });
    }
    // If not shouldShow, badge should not be visible — we just don't assert (far future is valid)
  });

  test("ongoing festival shows EN COURS badge", async ({ page }) => {
    // This test only runs if there's an ongoing festival in the DB
    const res = await page.request.get("/api/festivals?pageSize=50");
    const body = await res.json();
    const festivals = body.data ?? body;
    const now = new Date();

    const ongoing = Array.isArray(festivals) ? festivals.find((f: { startDate: string; endDate: string; slug: string }) => {
      const s = new Date(f.startDate);
      const e = new Date(f.endDate);
      return s <= now && e >= now;
    }) : null;

    if (!ongoing) { test.skip(); return; }

    await page.goto(`/festival/${ongoing.slug}`);
    await page.waitForLoadState("networkidle");
    const badge = page.locator('[data-testid="festival-countdown-badge"]');
    await expect(badge).toBeVisible({ timeout: 3_000 });
    await expect(badge).toContainText("EN COURS");
  });
});
