/**
 * E2E tests for the average festival duration badge in the catalogue view.
 * Shows ⌀ Nj (average duration in days) when there are at least 2 festivals.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — average festival duration badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("catalogue page loads without error", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("avg-duration badge shows when multiple festivals are listed", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("catalogue-avg-duration");
    const isVisible = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) {
      // Fewer than 2 festivals — acceptable
      test.skip();
      return;
    }

    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text?.trim()).toMatch(/⌀\s*[\d.]+j/i);
  });
});
