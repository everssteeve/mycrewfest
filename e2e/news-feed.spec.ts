/**
 * E2E smoke test — news feed at /fil.
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

test.describe("Fil d'actualité", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("feed page loads and shows title", async ({ page }) => {
    await page.goto("/fil");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="feed-title"]')).toBeVisible();
  });

  test("feed shows list or empty state", async ({ page }) => {
    await page.goto("/fil");
    await page.waitForLoadState("networkidle");

    const hasList = await page
      .locator('[data-testid="feed-list"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const isEmpty = await page
      .locator('[data-testid="feed-empty"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasList || isEmpty).toBe(true);
  });

  test("feed redirects unauthenticated users to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/fil");
    await expect(page).toHaveURL(/\/login/);
  });

  test("profil page has fil d'actu link", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    const link = page.locator('[data-testid="profil-fil-link"]');
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL("/fil");
  });
});
