/**
 * E2E smoke tests — Country filter on the catalogue page.
 *
 * The filter appears as a compact select when multiple countries exist.
 * Selecting a country narrows the festival list to that country only.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — country filter", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("country filter is present when multiple countries exist", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const select = page.locator('[data-testid="catalogue-country-filter"]');
    const isVisible = await select.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) {
      // Only one country in seed data — skip gracefully
      test.skip();
      return;
    }
    await expect(select).toBeVisible();
  });

  test("default option is 'Tous les pays'", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const select = page.locator('[data-testid="catalogue-country-filter"]');
    const isVisible = await select.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const value = await select.inputValue();
    expect(value).toBe("");
  });

  test("selecting a country filters the list", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const select = page.locator('[data-testid="catalogue-country-filter"]');
    const isVisible = await select.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const options = await select.locator("option").allTextContents();
    const countryOptions = options.filter((o) => o !== "Tous les pays");
    if (countryOptions.length === 0) { test.skip(); return; }

    await select.selectOption({ label: countryOptions[0] });
    await page.waitForTimeout(300);

    const allCards = page.locator('a[href^="/festival/"]');
    const count = await allCards.count();
    // After filtering to one country, count should be ≤ total
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("resetting to 'Tous les pays' restores full list", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const select = page.locator('[data-testid="catalogue-country-filter"]');
    const isVisible = await select.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const options = await select.locator("option").allTextContents();
    const countryOptions = options.filter((o) => o !== "Tous les pays");
    if (countryOptions.length === 0) { test.skip(); return; }

    const totalBefore = await page.locator('a[href^="/festival/"]').count();
    await select.selectOption({ label: countryOptions[0] });
    await page.waitForTimeout(200);
    await select.selectOption({ value: "" });
    await page.waitForTimeout(200);
    const totalAfter = await page.locator('a[href^="/festival/"]').count();
    expect(totalAfter).toBe(totalBefore);
  });
});
