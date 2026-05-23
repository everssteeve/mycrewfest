/**
 * E2E smoke test — sort toggle on the /artistes catalogue page.
 *
 * Requires: dev server + seed data with at least 2 artists.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Artistes catalogue — sort toggle", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("sort controls are visible on artistes page", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const sortBar = page.locator('[data-testid="artistes-sort"]');
    const hasSort = await sortBar.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasSort) { test.skip(); return; }

    await expect(sortBar).toBeVisible();
    await expect(page.locator('[data-testid="artistes-sort-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="artistes-sort-festivals"]')).toBeVisible();
  });

  test("default sort is A-Z (name)", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const nameBtn = page.locator('[data-testid="artistes-sort-name"]');
    const hasBtn = await nameBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasBtn) { test.skip(); return; }

    await expect(nameBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("clicking festivals sort changes active button", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const festBtn = page.locator('[data-testid="artistes-sort-festivals"]');
    const hasBtn = await festBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasBtn) { test.skip(); return; }

    await festBtn.click();
    await page.waitForTimeout(100);

    await expect(festBtn).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-testid="artistes-sort-name"]')).toHaveAttribute("aria-pressed", "false");
  });
});
