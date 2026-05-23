/**
 * E2E smoke test — leaderboard page at /classement.
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

test.describe("Classement Festivaliers", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("classement page loads and shows title", async ({ page }) => {
    await page.goto("/classement");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="classement-title"]')).toBeVisible();
  });

  test("classement shows list or empty state", async ({ page }) => {
    await page.goto("/classement");
    await page.waitForLoadState("networkidle");

    const hasList = await page
      .locator('[data-testid="classement-list"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const isEmpty = await page
      .locator('[data-testid="classement-empty"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasList || isEmpty).toBe(true);
  });

  test("classement redirects unauthenticated users", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/classement");
    await expect(page).toHaveURL(/\/login/);
  });

  test("profil page has classement link", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    const link = page.locator('[data-testid="profil-classement-link"]');
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL("/classement");
  });
});
