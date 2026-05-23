/**
 * E2E tests for the admin users management page (/admin/users).
 * Verifies user table, role counts, and toggle-role buttons render.
 * Requires admin role — skips gracefully if current user is not admin.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });

  await page.goto("/admin/users");
  await page.waitForLoadState("networkidle");

  return page.url().includes("/admin/users");
}

test.describe("Admin — users management", () => {
  test("page requires authentication", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/admin/users");
  });

  test("users page renders title and table", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expect(page.getByTestId("admin-users-title")).toBeVisible();
    await expect(page.getByTestId("admin-users-table")).toBeVisible();
  });

  test("admin and regular user counts are shown", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    await expect(page.getByTestId("admin-users-admin-count")).toBeVisible();
    await expect(page.getByTestId("admin-users-regular-count")).toBeVisible();
  });

  test("at least one user row is shown", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) {
      test.skip();
      return;
    }

    const rows = page.locator("[data-testid^='admin-user-row-']");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});
