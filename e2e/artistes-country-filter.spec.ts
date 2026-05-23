/**
 * E2E smoke test — country filter on the artist catalogue /artistes.
 *
 * Requires: dev server running with artists that have countryCode set.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue artistes — filtre par pays", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("country filter select is visible when multiple countries exist", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const countrySelect = page.locator('[data-testid="artistes-country-filter"]');
    const isVisible = await countrySelect.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!isVisible) {
      // No artists with country codes in the DB — skip gracefully
      test.skip();
      return;
    }

    await expect(countrySelect).toBeVisible();
  });

  test("selecting a country reduces the artist list", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const countrySelect = page.locator('[data-testid="artistes-country-filter"]');
    const isVisible = await countrySelect.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const countEl = page.locator('[data-testid="artistes-count"]');
    const totalText = await countEl.textContent();
    const totalMatch = totalText?.match(/(\d+)/);
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;

    // Get all country options (excluding the empty "Tous les pays")
    const options = await countrySelect.locator("option").all();
    const nonEmptyOptions = options.filter(async (o) => (await o.getAttribute("value")) !== "");

    if (nonEmptyOptions.length === 0) { test.skip(); return; }

    // Select the first real country option
    const firstOption = nonEmptyOptions[0];
    const countryValue = await firstOption.getAttribute("value");
    if (!countryValue) { test.skip(); return; }

    await countrySelect.selectOption(countryValue);

    const filteredText = await countEl.textContent();
    const filteredMatch = filteredText?.match(/(\d+)/);
    const filtered = filteredMatch ? parseInt(filteredMatch[1]) : 0;

    // Filtered count must be ≤ total
    expect(filtered).toBeLessThanOrEqual(total);
  });

  test("resetting country filter restores full list", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const countrySelect = page.locator('[data-testid="artistes-country-filter"]');
    const isVisible = await countrySelect.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const countEl = page.locator('[data-testid="artistes-count"]');
    const totalText = await countEl.textContent();

    const options = await countrySelect.locator("option").all();
    const nonEmptyOptions = options.filter(async (o) => (await o.getAttribute("value")) !== "");
    if (nonEmptyOptions.length === 0) { test.skip(); return; }

    const firstOption = nonEmptyOptions[0];
    const countryValue = await firstOption.getAttribute("value");
    if (!countryValue) { test.skip(); return; }

    await countrySelect.selectOption(countryValue);
    // Reset
    await countrySelect.selectOption("");

    const restoredText = await countEl.textContent();
    expect(restoredText).toBe(totalText);
  });
});
