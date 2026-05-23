/**
 * E2E tests for the admin platform stats page (/admin/stats).
 * Verifies activity summary, signals chart, and festivals engagement table.
 * Requires admin role — skips gracefully if not available.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });

  await page.goto("/admin/stats");
  await page.waitForLoadState("networkidle");

  return page.url().includes("/admin/stats");
}

test.describe("Admin — platform stats", () => {
  test("page requires authentication", async ({ page }) => {
    await page.goto("/admin/stats");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/admin/stats");
  });

  test("stats page renders title and activity grid", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-stats-title")).toBeVisible();
    await expect(page.getByTestId("admin-stats-activity")).toBeVisible();
  });

  test("all 4 activity stat cards are present", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-stat-signals")).toBeVisible();
    await expect(page.getByTestId("admin-stat-souvenirs")).toBeVisible();
    await expect(page.getByTestId("admin-stat-selections")).toBeVisible();
    await expect(page.getByTestId("admin-stat-crews")).toBeVisible();
  });

  test("signals chart and festivals table are rendered", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-stats-signals-chart")).toBeVisible();
    await expect(page.getByTestId("admin-stats-festivals-table")).toBeVisible();
    await expect(page.getByTestId("admin-stats-total-engagement")).toBeVisible();
  });
});
