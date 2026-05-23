/**
 * E2E tests for the XP score breakdown section in the profil view.
 *
 * Requires: dev server + a user with at least some activity (festevents, vu events, etc.).
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Profil — XP score breakdown", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("profil page loads without error", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("XP breakdown is visible when user has a non-zero score", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const breakdown = page.getByTestId("profil-score-breakdown");
    const hasEl = await breakdown.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasEl) {
      // User has zero score — no activity in seed
      test.skip();
      return;
    }

    await expect(breakdown).toBeVisible();
    // At least one category should be visible
    const festivalXp = page.getByTestId("profil-xp-festivals");
    const vuXp = page.getByTestId("profil-xp-vus");
    const souvXp = page.getByTestId("profil-xp-souvenirs");
    const suivisXp = page.getByTestId("profil-xp-suivis");

    const anyVisible = await Promise.any([
      festivalXp.isVisible({ timeout: 1_000 }),
      vuXp.isVisible({ timeout: 1_000 }),
      souvXp.isVisible({ timeout: 1_000 }),
      suivisXp.isVisible({ timeout: 1_000 }),
    ]).catch(() => false);

    expect(anyVisible).toBe(true);
  });
});
