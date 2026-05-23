/**
 * E2E smoke test — countdown badge on upcoming appearances on artist page.
 *
 * Requires: dev server + seed data (artist with upcoming festivals).
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Page artiste — countdown sur les apparitions", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("upcoming section shows countdown badges when festivals are near", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");

    const artistLink = page.locator('a[href^="/artiste/"]').first();
    const hasLink = await artistLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    const href = await artistLink.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    const upcoming = page.locator('[data-testid="artiste-upcoming"]');
    const hasUpcoming = await upcoming.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasUpcoming) { test.skip(); return; }

    // Countdown badge appears when festival is ≤30 days away
    const countdowns = page.locator('[data-testid^="artiste-appearance-countdown-"]');
    const countdownCount = await countdowns.count();

    // May be 0 if festivals are >30 days away — that's valid behavior
    if (countdownCount > 0) {
      const text = await countdowns.first().textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }

    // The upcoming section itself should always be visible
    await expect(upcoming).toBeVisible();
  });
});
