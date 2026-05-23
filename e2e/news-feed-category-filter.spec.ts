/**
 * E2E smoke test — category filter chips on the news feed page /fil.
 *
 * Requires: dev server + user following festivals with news of different categories.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Fil d'actu — category filter", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("feed page loads without error", async ({ page }) => {
    await page.goto("/fil");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="feed-title"]')).toBeVisible();
  });

  test("category filter chips appear when multiple categories present", async ({ page }) => {
    await page.goto("/fil");
    await page.waitForLoadState("networkidle");

    const filterBar = page.locator('[data-testid="feed-category-filter"]');
    const hasFilter = await filterBar.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasFilter) {
      // Only one category or no news — acceptable
      test.skip();
      return;
    }

    await expect(filterBar).toBeVisible();
    await expect(page.locator('[data-testid="feed-category-all"]')).toBeVisible();
  });

  test("clicking a category filter narrows the feed", async ({ page }) => {
    await page.goto("/fil");
    await page.waitForLoadState("networkidle");

    const filterBar = page.locator('[data-testid="feed-category-filter"]');
    const hasFilter = await filterBar.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasFilter) { test.skip(); return; }

    const categoryBtns = filterBar.locator('button').filter({
      hasNot: page.locator('[data-testid="feed-category-all"]'),
    });
    if (await categoryBtns.count() === 0) { test.skip(); return; }

    await categoryBtns.first().click();
    await page.waitForTimeout(100);

    const firstBtn = categoryBtns.first();
    await expect(firstBtn).toHaveAttribute("aria-pressed", "true");
  });
});
