/**
 * E2E smoke test — J-X countdown badge on festival catalogue cards.
 *
 * Requires: dev server running + seed data loaded.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue countdown badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("every festival card on /catalogue has a visible countdown badge", async ({
    page,
  }) => {
    await page.goto("/catalogue");

    // Wait for at least one card to be rendered
    const firstCard = page.locator('a[href^="/festival/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 8_000 });

    // Every card should expose a countdown badge
    const badges = page.locator('[data-testid="festival-countdown"]');
    await expect(badges.first()).toBeVisible({ timeout: 8_000 });

    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
  });

  test("countdown badge contains a valid label (J-, En cours, or Terminé)", async ({
    page,
  }) => {
    await page.goto("/catalogue");

    const badges = page.locator('[data-testid="festival-countdown"]');
    await expect(badges.first()).toBeVisible({ timeout: 8_000 });

    const badgeCount = await badges.count();

    for (let i = 0; i < badgeCount; i++) {
      const text = await badges.nth(i).textContent();
      const trimmed = (text ?? "").trim().toUpperCase();

      const isValid =
        trimmed.startsWith("J-") ||
        trimmed === "EN COURS" ||
        trimmed === "TERMINÉ";

      expect(isValid, `Badge at index ${i} has unexpected text: "${text}"`).toBe(true);
    }
  });

  test("countdown badge has a non-empty aria-label", async ({ page }) => {
    await page.goto("/catalogue");

    const badges = page.locator('[data-testid="festival-countdown"]');
    await expect(badges.first()).toBeVisible({ timeout: 8_000 });

    const ariaLabel = await badges.first().getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
    expect((ariaLabel ?? "").length).toBeGreaterThan(0);
  });
});
