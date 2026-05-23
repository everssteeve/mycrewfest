/**
 * E2E tests — Submissions CSV export on the admin export page.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });

  await page.goto("/admin/export");
  await page.waitForLoadState("networkidle");
  return page.url().includes("/admin/export");
}

test.describe("Admin export — submissions", () => {
  test("export page renders with submissions card", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-export-title")).toBeVisible();
    // Check submissions export card exists
    const link = page.locator('a[href="/api/admin/export/submissions"]');
    await expect(link).toBeVisible();
  });

  test("submissions export link has download attribute", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const link = page.locator('a[href="/api/admin/export/submissions"]');
    const download = await link.getAttribute("download");
    expect(download).toBeTruthy();
  });

  test("submissions API returns CSV content-type", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const response = await page.request.get("/api/admin/export/submissions");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
  });
});
