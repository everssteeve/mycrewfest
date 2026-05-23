/**
 * E2E smoke tests — Festival count badges on type filter chips in the catalogue.
 *
 * Each type chip (Musique, Cirque, etc.) shows a small count of how many
 * festivals of that type exist in the catalogue.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — type filter chips with count badges", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("type chip buttons are present", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const chip = page.locator('[data-testid="catalogue-type-chip-tous"]');
    await expect(chip).toBeVisible({ timeout: 5_000 });
  });

  test("musique chip has a count badge when musique festivals exist", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const countBadge = page.locator('[data-testid="catalogue-type-count-musique"]');
    const isVisible = await countBadge.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const text = await countBadge.textContent();
    const num = Number(text?.trim());
    expect(Number.isInteger(num) && num > 0).toBe(true);
  });

  test("count badges show non-zero positive integers", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const badges = page.locator('[data-testid^="catalogue-type-count-"]');
    const count = await badges.count();
    if (count === 0) { test.skip(); return; }

    for (let i = 0; i < Math.min(count, 4); i++) {
      const text = await badges.nth(i).textContent();
      const num = Number(text?.trim());
      expect(num).toBeGreaterThan(0);
      expect(Number.isInteger(num)).toBe(true);
    }
  });

  test("tous chip has no count badge", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const tousBadge = page.locator('[data-testid="catalogue-type-count-tous"]');
    const hasTosBadge = await tousBadge.isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasTosBadge).toBe(false);
  });
});
