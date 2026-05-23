/**
 * E2E tests for the admin dashboard page (/admin).
 * Verifies KPI cards, quick links, and recent activity panels are rendered.
 * Requires an admin user — skips gracefully if not available.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });

  // Check if admin by trying to navigate to /admin
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");

  // If redirected away, user is not admin
  return page.url().includes("/admin");
}

test.describe("Admin dashboard", () => {
  test("admin page requires authentication", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    // Should redirect to login or home if not authenticated
    expect(page.url()).not.toContain("/admin");
  });

  test("dashboard renders KPI grid when logged in as admin", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expect(page.getByTestId("admin-dashboard-title")).toBeVisible();
    await expect(page.getByTestId("admin-kpi-grid")).toBeVisible();
  });

  test("all 5 KPI cards are present", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expect(page.getByTestId("admin-kpi-users")).toBeVisible();
    await expect(page.getByTestId("admin-kpi-festivals")).toBeVisible();
    await expect(page.getByTestId("admin-kpi-pending-submissions")).toBeVisible();
    await expect(page.getByTestId("admin-kpi-today-signals")).toBeVisible();
    await expect(page.getByTestId("admin-kpi-fest-events")).toBeVisible();
  });

  test("quality KPI card shows grade and score", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const kpi = page.getByTestId("admin-kpi-avg-quality");
    await expect(kpi).toBeVisible();
    const text = await kpi.textContent();
    expect(text).toMatch(/[ABCD]/);
    expect(text).toMatch(/\d+\/100/);
  });

  test("quality KPI links to quality page", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const kpi = page.getByTestId("admin-kpi-avg-quality");
    const href = await kpi.getAttribute("href");
    expect(href).toContain("/admin/festivals/qualite");
  });

  test("quick links to festivals, submissions, users are shown", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expect(page.getByTestId("admin-quicklink-festivals")).toBeVisible();
    await expect(page.getByTestId("admin-quicklink-submissions")).toBeVisible();
    await expect(page.getByTestId("admin-quicklink-users")).toBeVisible();
  });

  test("recent festivals and recent users panels are rendered", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expect(page.getByTestId("admin-recent-festivals")).toBeVisible();
    await expect(page.getByTestId("admin-recent-users")).toBeVisible();
  });
});
