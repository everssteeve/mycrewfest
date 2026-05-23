/**
 * E2E tests for the admin submissions page.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin — submissions page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/submissions");
    await page.waitForLoadState("networkidle");
  });

  test("submissions page loads with title and KPIs", async ({ page }) => {
    await expect(page.getByTestId("admin-submissions-title")).toBeVisible();
    await expect(page.getByTestId("admin-submissions-kpis")).toBeVisible();
    await expect(page.getByTestId("admin-submissions-kpi-pending")).toBeVisible();
    await expect(page.getByTestId("admin-submissions-kpi-processing")).toBeVisible();
    await expect(page.getByTestId("admin-submissions-kpi-accepted")).toBeVisible();
    await expect(page.getByTestId("admin-submissions-kpi-rejected")).toBeVisible();
  });
});
