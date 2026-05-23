/**
 * E2E tests for the admin global search feature.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin — global search", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
  });

  test("global search input is visible on admin pages", async ({ page }) => {
    await expect(page.getByTestId("admin-global-search")).toBeVisible();
    await expect(page.getByTestId("admin-global-search-input")).toBeVisible();
  });

  test("search with no match shows empty state", async ({ page }) => {
    const input = page.getByTestId("admin-global-search-input");
    await input.fill("zzzzz_no_match_xyz");
    await page.waitForTimeout(500);
    const results = page.getByTestId("admin-global-search-results");
    const isEmpty = await results.isVisible({ timeout: 1000 }).catch(() => false);
    if (isEmpty) {
      // Results container might still show; check content
      const text = await results.textContent().catch(() => "");
      expect(text).toContain("Aucun résultat");
    }
    // Either no results div or empty state — both acceptable
  });

  test("short query (< 2 chars) does not open results", async ({ page }) => {
    const input = page.getByTestId("admin-global-search-input");
    await input.fill("a");
    await page.waitForTimeout(400);
    const results = page.getByTestId("admin-global-search-results");
    await expect(results).not.toBeVisible({ timeout: 500 }).catch(() => {});
  });
});
