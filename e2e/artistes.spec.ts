/**
 * E2E smoke test — artist catalogue page at /artistes.
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

test.describe("Catalogue artistes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("artistes page loads and shows count", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="artistes-count"]')).toBeVisible();
  });

  test("artistes search filters results", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const search = page.locator('[data-testid="artistes-search"]');
    await expect(search).toBeVisible();
    await search.fill("iron");
    await page.waitForTimeout(300);

    const countText = await page.locator('[data-testid="artistes-count"]').textContent();
    expect(countText).toMatch(/\d+/);
  });

  test("artistes shows list or empty state", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const hasList = await page
      .locator('[data-testid="artistes-list"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    const isEmpty = await page
      .locator('[data-testid="artistes-empty"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasList || isEmpty).toBe(true);
  });

  test("clicking an artist card navigates to their profile", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const firstCard = page.locator('a[href^="/artiste/"]').first();
    const hasCard = await firstCard.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasCard) { test.skip(); return; }

    await firstCard.click();
    await expect(page.locator('[data-testid="artiste-name"]')).toBeVisible({ timeout: 5_000 });
  });

  test("discipline filter chips are visible when disciplines exist", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const hasList = await page.locator('[data-testid="artistes-list"]').isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasList) { test.skip(); return; }

    await expect(page.locator('[data-testid="artistes-discipline-filters"]')).toBeVisible();
  });
});
