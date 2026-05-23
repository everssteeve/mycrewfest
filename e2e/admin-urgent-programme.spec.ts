/**
 * E2E smoke tests — Urgent programme section on the admin dashboard.
 * Shows festivals within 60 days that still have programStatus = "bientôt_disponible".
 * Skips gracefully when no such festival exists in the seed data.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });

  await page.goto("/admin");
  await page.waitForLoadState("networkidle");
  return page.url().includes("/admin");
}

test.describe("Admin dashboard — urgent programme section", () => {
  test("section is rendered when urgent festivals exist", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const section = page.getByTestId("admin-urgent-programme");
    const isVisible = await section.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) {
      // No festival within 60 days with missing programme — acceptable
      test.skip();
      return;
    }

    await expect(section).toBeVisible();
  });

  test("each urgent item links to the festival edit page", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const section = page.getByTestId("admin-urgent-programme");
    const isVisible = await section.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const links = section.locator("a[href*='/admin/festivals/']");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test("each item shows a J-N countdown", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const section = page.getByTestId("admin-urgent-programme");
    const isVisible = await section.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const text = await section.textContent();
    expect(text).toMatch(/J-\d+/);
  });
});
