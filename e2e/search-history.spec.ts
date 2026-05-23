/**
 * E2E smoke tests — search history on /recherche page.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Search History — /recherche", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.removeItem("mycrewfest:search-history"));
  });

  test("no history section shown when localStorage is empty", async ({ page }) => {
    await page.goto("/recherche");
    await page.waitForLoadState("networkidle");
    const section = page.locator('[data-testid="search-history-section"]');
    await expect(section).not.toBeVisible();
  });

  test("history section appears after a search with results", async ({ page }) => {
    // Pre-seed a search into localStorage
    await page.goto("/recherche");
    await page.evaluate(() => {
      localStorage.setItem("mycrewfest:search-history", JSON.stringify(["hellfest"]));
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const section = page.locator('[data-testid="search-history-section"]');
    await expect(section).toBeVisible({ timeout: 3_000 });
  });

  test("clicking a history item fills the search input", async ({ page }) => {
    await page.goto("/recherche");
    await page.evaluate(() => {
      localStorage.setItem("mycrewfest:search-history", JSON.stringify(["hellfest"]));
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const historyItem = page.locator('[data-testid="search-history-item"]').first();
    await expect(historyItem).toBeVisible({ timeout: 3_000 });
    await historyItem.click();

    const input = page.locator('[data-testid="search-input"]');
    await expect(input).toHaveValue("hellfest");
  });

  test("clear button removes all history", async ({ page }) => {
    await page.goto("/recherche");
    await page.evaluate(() => {
      localStorage.setItem("mycrewfest:search-history", JSON.stringify(["hellfest", "solidays"]));
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const clearBtn = page.locator('[data-testid="search-history-clear"]');
    await clearBtn.click();

    const section = page.locator('[data-testid="search-history-section"]');
    await expect(section).not.toBeVisible({ timeout: 2_000 });
  });
});
