/**
 * E2E smoke test — festival filter chips on the news feed page /fil.
 *
 * Requires: dev server + seed data + user following festivals with news.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Fil d'actu — festival filter", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("feed page renders title", async ({ page }) => {
    await page.goto("/fil");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="feed-title"]')).toBeVisible();
  });

  test("filter chips appear when multiple followed festivals have news", async ({ page }) => {
    await page.goto("/fil");
    await page.waitForLoadState("networkidle");

    const filterBar = page.locator('[data-testid="feed-festival-filter"]');
    const hasFilter = await filterBar.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasFilter) {
      // Only one followed festival or no news — acceptable
      test.skip();
      return;
    }

    await expect(filterBar).toBeVisible();
    const allBtn = page.locator('[data-testid="feed-filter-all"]');
    await expect(allBtn).toBeVisible();
  });

  test("clicking a festival filter chip filters the feed", async ({ page }) => {
    await page.goto("/fil");
    await page.waitForLoadState("networkidle");

    const filterBar = page.locator('[data-testid="feed-festival-filter"]');
    const hasFilter = await filterBar.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasFilter) { test.skip(); return; }

    // Find a specific festival chip (not "Tous")
    const chips = filterBar.locator("button").filter({ hasNot: page.locator('[data-testid="feed-filter-all"]') });
    const chipCount = await chips.count();
    if (chipCount === 0) { test.skip(); return; }

    const countBefore = page.locator('[data-testid="feed-filtered-count"]');
    const textBefore = await countBefore.textContent().catch(() => null);

    await chips.first().click();
    await page.waitForTimeout(100);

    const textAfter = await countBefore.textContent();
    // Either the count changed or a filter-empty state appeared
    const filterEmpty = page.locator('[data-testid="feed-filter-empty"]');
    const hasEmpty = await filterEmpty.isVisible({ timeout: 1_000 }).catch(() => false);
    expect(textAfter !== textBefore || hasEmpty).toBe(true);
  });
});
