/**
 * E2E smoke test — admin export page at /admin/export.
 *
 * Requires: dev server running + admin seed user.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin Export", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("export page loads and shows title", async ({ page }) => {
    await page.goto("/admin/export");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="admin-export-title"]')).toBeVisible();
  });

  test("export page shows KPI grid", async ({ page }) => {
    await page.goto("/admin/export");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="admin-export-kpis"]')).toBeVisible();
  });

  test("export page shows festivals and users export cards", async ({ page }) => {
    await page.goto("/admin/export");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="admin-export-card-festivals"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-export-card-users"]')).toBeVisible();
  });

  test("export buttons are present", async ({ page }) => {
    await page.goto("/admin/export");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="admin-export-festivals"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-export-users"]')).toBeVisible();
  });

  test("admin nav has export link", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    const exportLink = page.locator('a[href="/admin/export"]');
    await expect(exportLink).toBeVisible();
    await exportLink.click();
    await expect(page).toHaveURL("/admin/export");
  });

  test("export page redirects non-admin users", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@mycrewfest.dev");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/catalogue", { timeout: 10_000 });
    await page.goto("/admin/export");
    await expect(page).not.toHaveURL("/admin/export");
  });
});
