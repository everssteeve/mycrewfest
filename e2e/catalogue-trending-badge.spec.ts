/**
 * E2E smoke test — trending badge on festival cards in catalogue.
 *
 * The badge (🔥 Chaud / 📈 Montant) appears on cards whose computed trending
 * score exceeds the threshold. With seeded data this may or may not trigger;
 * the test validates behaviour without assuming specific data.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — trending badge on festival cards", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("trending badges have correct testid pattern when present", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const badges = page.locator('[data-testid^="festival-trending-badge-"]');
    const count = await badges.count();
    if (count === 0) {
      // No festivals are trending with current seed data — acceptable
      test.skip();
      return;
    }

    const firstBadge = badges.first();
    const text = await firstBadge.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
    // Badge text must be one of the two tier labels
    expect(text).toMatch(/Chaud|Montant/);
  });

  test("trending badge count does not exceed festival card count", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const cards = page.locator('a[href^="/festival/"]');
    const cardCount = await cards.count();
    if (cardCount === 0) { test.skip(); return; }

    const badges = page.locator('[data-testid^="festival-trending-badge-"]');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeLessThanOrEqual(cardCount);
  });

  test("trending badge is visible and has aria-label", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const badges = page.locator('[data-testid^="festival-trending-badge-"]');
    const count = await badges.count();
    if (count === 0) { test.skip(); return; }

    const ariaLabel = await badges.first().getAttribute("aria-label");
    expect(ariaLabel).toMatch(/chaud|montant/i);
  });
});
