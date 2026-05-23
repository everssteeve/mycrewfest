/**
 * E2E tests for the profile stats section.
 *
 * Requires: dev server + test user account.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Profil — stats section", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("profil page loads successfully", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("profil stats section is visible with 4 stat cards", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const statsSection = page.getByTestId("profil-stats");
    await expect(statsSection).toBeVisible({ timeout: 3_000 });

    // Should have exactly 4 stat cards (Festivals, Événements vus, Suivis, Souvenirs)
    const statCards = statsSection.locator("div");
    const count = await statCards.count();
    expect(count).toBe(4);
  });

  test("Événements vus stat is visible", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Événements vus")).toBeVisible({
      timeout: 3_000,
    });
  });
});
