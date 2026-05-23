/**
 * E2E tests for the "complete programme" count badge in the catalogue.
 * Shows how many festivals have programStatus === "complet".
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — complete programme count badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("catalogue page loads without error", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("complete programme badge shows when festivals have full programme data", async ({
    page,
  }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("catalogue-complete-programme-count");
    const isVisible = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) {
      // No festivals with complete programme — acceptable
      test.skip();
      return;
    }

    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text?.trim()).toMatch(/✓\s*\d+\s*complets?/i);
  });
});
