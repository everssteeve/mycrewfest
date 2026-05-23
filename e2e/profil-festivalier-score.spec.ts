/**
 * E2E tests for the festivalier score on the profil page.
 *
 * Requires: dev server + a logged-in user with a profil.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Profil — festivalier score", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("profil page loads without error", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("festivalier score badge is visible on profil page", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const scoreBadge = page.getByTestId("profil-festivalier-score");
    await expect(scoreBadge).toBeVisible();
  });
});
