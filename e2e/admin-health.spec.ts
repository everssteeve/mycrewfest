/**
 * E2E tests for the admin health dashboard page.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin — Santé de la plateforme", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin health page loads without error", async ({ page }) => {
    await page.goto("/admin/health");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("health title is visible", async ({ page }) => {
    await page.goto("/admin/health");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("admin-health-title")).toBeVisible();
  });

  test("health score is visible", async ({ page }) => {
    await page.goto("/admin/health");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("admin-health-score")).toBeVisible();
  });

  test("health metrics grid is visible", async ({ page }) => {
    await page.goto("/admin/health");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("admin-health-metrics")).toBeVisible();
  });

  test("santé link appears in sidebar", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    const healthLink = page.locator('a[href="/admin/health"]');
    await expect(healthLink).toBeVisible();
  });
});
