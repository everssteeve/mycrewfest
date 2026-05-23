/**
 * E2E smoke tests — /admin/souvenirs page.
 */

import { test, expect } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin Souvenirs — /admin/souvenirs", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("page loads and shows title", async ({ page }) => {
    await page.goto("/admin/souvenirs");
    await page.waitForLoadState("networkidle");
    const title = page.locator('[data-testid="admin-souvenirs-title"]');
    await expect(title).toBeVisible({ timeout: 5_000 });
  });

  test("KPI section is visible", async ({ page }) => {
    await page.goto("/admin/souvenirs");
    await page.waitForLoadState("networkidle");
    const kpis = page.locator('[data-testid="admin-souvenirs-kpis"]');
    await expect(kpis).toBeVisible({ timeout: 5_000 });
  });

  test("shows total KPI", async ({ page }) => {
    await page.goto("/admin/souvenirs");
    await page.waitForLoadState("networkidle");
    const total = page.locator('[data-testid="admin-souvenirs-kpi-total"]');
    await expect(total).toBeVisible({ timeout: 5_000 });
  });

  test("shows list or empty state", async ({ page }) => {
    await page.goto("/admin/souvenirs");
    await page.waitForLoadState("networkidle");

    const list = page.locator('[data-testid="admin-souvenirs-list"]');
    const empty = page.locator('[data-testid="admin-souvenirs-empty"]');

    const hasList = await list.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasList || hasEmpty).toBe(true);
  });

  test("non-admin user cannot access /admin/souvenirs", async ({ page: userPage }) => {
    await userPage.goto("/login");
    await userPage.fill('input[type="email"]', "test@mycrewfest.dev");
    await userPage.fill('input[type="password"]', "password123");
    await userPage.click('button[type="submit"]');
    await userPage.waitForURL("/catalogue", { timeout: 10_000 });

    await userPage.goto("/admin/souvenirs");
    await userPage.waitForLoadState("networkidle");
    expect(userPage.url()).not.toContain("/admin/souvenirs");
  });
});
