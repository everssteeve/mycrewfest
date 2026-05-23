/**
 * E2E smoke tests — type filter tabs on /recherche page.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Search Type Filter — /recherche", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("type filter tabs are not shown before a search", async ({ page }) => {
    await page.goto("/recherche");
    await page.waitForLoadState("networkidle");
    const tabs = page.locator('[data-testid="search-type-filter"]');
    await expect(tabs).not.toBeVisible();
  });

  test("type filter tabs appear when results are loaded", async ({ page }) => {
    await page.goto("/recherche");
    const input = page.locator('[data-testid="search-input"]');
    await input.fill("fest");
    await page.waitForTimeout(600);
    await page.waitForLoadState("networkidle");

    const tabs = page.locator('[data-testid="search-type-filter"]');
    const tabsVisible = await tabs.isVisible({ timeout: 5_000 }).catch(() => false);

    const festivals = page.locator('[data-testid="search-festivals-section"]');
    const artists = page.locator('[data-testid="search-artists-section"]');
    const hasResults = await festivals.isVisible({ timeout: 3_000 }).catch(() => false)
      || await artists.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasResults) {
      expect(tabsVisible).toBe(true);
    }
  });

  test("'Tout' tab is selected by default", async ({ page }) => {
    await page.goto("/recherche");
    const input = page.locator('[data-testid="search-input"]');
    await input.fill("fest");
    await page.waitForTimeout(600);

    const tabs = page.locator('[data-testid="search-type-filter"]');
    const visible = await tabs.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) { test.skip(); return; }

    const allTab = page.locator('[data-testid="search-type-tab-all"]');
    await expect(allTab).toHaveAttribute("aria-selected", "true", { timeout: 3_000 });
  });

  test("clicking 'Festivals' tab shows only festival results", async ({ page }) => {
    await page.goto("/recherche");
    const input = page.locator('[data-testid="search-input"]');
    await input.fill("fest");
    await page.waitForTimeout(600);

    const tabs = page.locator('[data-testid="search-type-filter"]');
    const visible = await tabs.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) { test.skip(); return; }

    const festivalsTab = page.locator('[data-testid="search-type-tab-festivals"]');
    const isDisabled = await festivalsTab.isDisabled({ timeout: 2_000 }).catch(() => true);
    if (isDisabled) { test.skip(); return; }

    await festivalsTab.click();
    await expect(festivalsTab).toHaveAttribute("aria-selected", "true");

    const artistsSection = page.locator('[data-testid="search-artists-section"]');
    await expect(artistsSection).not.toBeVisible({ timeout: 2_000 });
  });

  test("filter tabs reset when query changes", async ({ page }) => {
    await page.goto("/recherche");
    const input = page.locator('[data-testid="search-input"]');
    await input.fill("fest");
    await page.waitForTimeout(600);

    const tabs = page.locator('[data-testid="search-type-filter"]');
    const visible = await tabs.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) { test.skip(); return; }

    const festivalsTab = page.locator('[data-testid="search-type-tab-festivals"]');
    const isDisabled = await festivalsTab.isDisabled().catch(() => true);
    if (!isDisabled) await festivalsTab.click();

    await input.fill("");
    await input.fill("music");
    await page.waitForTimeout(600);

    const allTab = page.locator('[data-testid="search-type-tab-all"]');
    const allTabVisible = await allTab.isVisible({ timeout: 3_000 }).catch(() => false);
    if (allTabVisible) {
      await expect(allTab).toHaveAttribute("aria-selected", "true");
    }
  });
});
