/**
 * E2E tests for the admin crews management page.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin — crews management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/crews");
    await page.waitForLoadState("networkidle");
  });

  test("crews page loads with title and KPIs", async ({ page }) => {
    await expect(page.getByTestId("admin-crews-title")).toBeVisible();
    await expect(page.getByTestId("admin-crews-kpis")).toBeVisible();
    await expect(page.getByTestId("admin-crews-kpi-total")).toBeVisible();
    await expect(page.getByTestId("admin-crews-kpi-members")).toBeVisible();
    await expect(page.getByTestId("admin-crews-kpi-avg")).toBeVisible();
    await expect(page.getByTestId("admin-crews-kpi-withfest")).toBeVisible();
  });

  test("crews table is visible", async ({ page }) => {
    await expect(page.getByTestId("admin-crews-table")).toBeVisible();
  });

  test("sidebar link to crews page is present", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    const link = page.getByRole("link", { name: /crews/i });
    await expect(link).toBeVisible();
  });
});
