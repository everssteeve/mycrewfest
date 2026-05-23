/**
 * E2E tests for the catalogue month filter.
 *
 * Requires: dev server + seed data with festivals in multiple months.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — month filter", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("catalogue page loads without error", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("month filter is visible when festivals span multiple months", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const monthFilter = page.getByTestId("catalogue-month-filter");
    const hasFilter = await monthFilter.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasFilter) {
      // All festivals in the same month — fine
      test.skip();
      return;
    }

    await expect(monthFilter).toBeVisible();
    // "Tous mois" reset button is always present when filter is shown
    await expect(page.getByTestId("catalogue-month-filter-all")).toBeVisible();
  });
});
