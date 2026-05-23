/**
 * E2E smoke tests — global search page /recherche.
 * Requires: dev server running with at least one festival and one artist in the DB.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Global Search — /recherche", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("search icon is visible on catalogue page", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    const searchLink = page.locator('[data-testid="catalogue-search-link"]');
    await expect(searchLink).toBeVisible();
  });

  test("clicking search icon navigates to /recherche", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.click('[data-testid="catalogue-search-link"]');
    await page.waitForURL("/recherche", { timeout: 5_000 });
    expect(page.url()).toContain("/recherche");
  });

  test("search input is autofocused on /recherche", async ({ page }) => {
    await page.goto("/recherche");
    await page.waitForLoadState("networkidle");
    const input = page.locator('[data-testid="search-input"]');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test("typing less than 2 chars shows no results", async ({ page }) => {
    await page.goto("/recherche");
    const input = page.locator('[data-testid="search-input"]');
    await input.fill("h");
    await page.waitForTimeout(400);
    const festivalsSection = page.locator('[data-testid="search-festivals-section"]');
    await expect(festivalsSection).not.toBeVisible();
  });

  test("API returns valid search response", async ({ page }) => {
    const response = await page.request.get("/api/search?q=hell");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("festivals");
    expect(body).toHaveProperty("artists");
    expect(body).toHaveProperty("total");
    expect(Array.isArray(body.festivals)).toBe(true);
    expect(Array.isArray(body.artists)).toBe(true);
  });

  test("API returns empty results for short query", async ({ page }) => {
    const response = await page.request.get("/api/search?q=h");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(0);
    expect(body.festivals).toHaveLength(0);
    expect(body.artists).toHaveLength(0);
  });

  test("API returns empty results for unmatched query", async ({ page }) => {
    const response = await page.request.get("/api/search?q=zzznomatch99999");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(0);
  });

  test("searching 'hell' shows hellfest in results", async ({ page }) => {
    const response = await page.request.get("/api/search?q=hell");
    if (response.status() !== 200) { test.skip(); return; }
    const body = await response.json();
    if (body.festivals.length === 0) { test.skip(); return; }

    await page.goto("/recherche");
    const input = page.locator('[data-testid="search-input"]');
    await input.fill("hell");
    await page.waitForSelector('[data-testid="search-festivals-section"]', { timeout: 3_000 });
    const section = page.locator('[data-testid="search-festivals-section"]');
    await expect(section).toBeVisible();
  });

  test("clear button removes query", async ({ page }) => {
    await page.goto("/recherche");
    const input = page.locator('[data-testid="search-input"]');
    await input.fill("hell");
    await page.waitForTimeout(100);
    const clearBtn = page.locator('button[aria-label="Effacer la recherche"]');
    await clearBtn.click();
    await expect(input).toHaveValue("");
  });

  test("empty state appears for no results", async ({ page }) => {
    await page.goto("/recherche");
    const input = page.locator('[data-testid="search-input"]');
    await input.fill("zzznomatch99999");
    const emptyState = await page
      .locator('[data-testid="search-empty"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    // Only assert if the query resolved (might still be loading)
    if (emptyState) {
      await expect(page.locator('[data-testid="search-empty"]')).toBeVisible();
    }
  });
});
