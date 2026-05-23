/**
 * E2E tests for the admin festivals search + filter bar.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
  await page.goto("/admin/festivals");
  await page.waitForLoadState("networkidle");
}

test.describe("Admin — festivals filter bar", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("festivals page loads and shows the filter bar", async ({ page }) => {
    await expect(page.getByTestId("admin-festival-search")).toBeVisible();
    await expect(page.getByTestId("admin-festival-filter-tous")).toBeVisible();
    await expect(page.getByTestId("admin-festival-filter-count")).toBeVisible();
  });

  test("search input filters the festivals table", async ({ page }) => {
    const table = page.getByTestId("admin-festivals-table");
    await expect(table).toBeVisible();

    const countEl = page.getByTestId("admin-festival-filter-count");
    const initialText = await countEl.textContent();
    const total = parseInt(initialText?.match(/\/\s*(\d+)/)?.[1] ?? "0");

    if (total === 0) { test.skip(); return; }

    // Type a query unlikely to match everything
    await page.getByTestId("admin-festival-search").fill("zzzzz_no_match");
    await page.waitForTimeout(200);

    const filteredText = await countEl.textContent();
    const filteredCount = parseInt(filteredText?.match(/^(\d+)/)?.[1] ?? "0");
    expect(filteredCount).toBe(0);

    // Clear the search — back to full list
    await page.getByTestId("admin-festival-search").fill("");
    await page.waitForTimeout(200);
    const restoredText = await countEl.textContent();
    const restoredCount = parseInt(restoredText?.match(/^(\d+)/)?.[1] ?? "0");
    expect(restoredCount).toBe(total);
  });

  test("status filter chip changes the count", async ({ page }) => {
    const countEl = page.getByTestId("admin-festival-filter-count");
    const initialText = await countEl.textContent();
    const total = parseInt(initialText?.match(/\/\s*(\d+)/)?.[1] ?? "0");

    if (total === 0) { test.skip(); return; }

    // Click "détecté" filter
    await page.getByTestId("admin-festival-filter-détecté").click();
    await page.waitForTimeout(200);
    const filteredText = await countEl.textContent();
    const filteredCount = parseInt(filteredText?.match(/^(\d+)/)?.[1] ?? "0");
    expect(filteredCount).toBeLessThanOrEqual(total);

    // Click "tous" to restore
    await page.getByTestId("admin-festival-filter-tous").click();
    await page.waitForTimeout(200);
    const restoredText = await countEl.textContent();
    const restoredCount = parseInt(restoredText?.match(/^(\d+)/)?.[1] ?? "0");
    expect(restoredCount).toBe(total);
  });
});
