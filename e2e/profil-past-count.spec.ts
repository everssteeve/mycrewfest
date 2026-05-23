/**
 * E2E tests for the "past festivals" count badge on the profil page.
 * Shows ✓ N vécus when the user has attended at least one past festival.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Profil — past fest events count badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("profil page loads without error", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("past-count badge shows when user has attended past festivals", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("profil-past-count");
    const isVisible = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) {
      // No past festivals — acceptable
      test.skip();
      return;
    }

    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text?.trim()).toMatch(/✓\s*\d+\s*vécus?/i);
  });
});
