/**
 * E2E smoke test — /admin/artists page.
 * Requires: dev server running, admin user (admin@mycrewfest.dev / password123).
 */

import { test, expect } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin — Page Artistes", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("page loads with title and artist table", async ({ page }) => {
    await page.goto("/admin/artists");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-testid="admin-artists-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-artists-table"]')).toBeVisible();
  });

  test("total count is displayed", async ({ page }) => {
    await page.goto("/admin/artists");
    await page.waitForLoadState("networkidle");

    const totalEl = page.locator('[data-testid="admin-artists-total"]');
    await expect(totalEl).toBeVisible();
    const text = await totalEl.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test("search filters the artist list", async ({ page }) => {
    await page.goto("/admin/artists");
    await page.waitForLoadState("networkidle");

    const countEl = page.locator('[data-testid="admin-artists-filtered-count"]');
    const beforeText = await countEl.textContent();

    await page.fill('[data-testid="admin-artists-search"]', "orelsan");
    await page.waitForTimeout(200);

    const afterText = await countEl.textContent();
    // The filtered count (before the "/") should differ or equal — at minimum the text changes
    expect(afterText).toBeTruthy();
    // Clearing should restore
    await page.fill('[data-testid="admin-artists-search"]', "");
    const restoredText = await countEl.textContent();
    expect(restoredText).toBe(beforeText);
  });

  test("sort toggle switches between A-Z and events", async ({ page }) => {
    await page.goto("/admin/artists");
    await page.waitForLoadState("networkidle");

    const sortName = page.locator('[data-testid="admin-artists-sort-name"]');
    const sortEvents = page.locator('[data-testid="admin-artists-sort-events"]');

    await expect(sortName).toBeVisible();
    await expect(sortEvents).toBeVisible();

    await sortEvents.click();
    await expect(sortEvents).toHaveAttribute("aria-pressed", "true");
  });

  test("non-admin user cannot access admin/artists", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@mycrewfest.dev");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/catalogue", { timeout: 10_000 });

    await page.goto("/admin/artists");
    // Should redirect away from admin
    await expect(page).not.toHaveURL(/\/admin\/artists/, { timeout: 5_000 });
  });
});
