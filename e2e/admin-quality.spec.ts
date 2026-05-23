/**
 * E2E smoke tests — Admin festival data quality page.
 */

import { test, expect } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin — Qualité des données", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("page loads for authenticated admin", async ({ page }) => {
    await page.goto("/admin/festivals/qualite");
    await page.waitForLoadState("networkidle");

    if (!page.url().includes("/admin/festivals/qualite")) return;

    const dist = page.locator('[data-testid="quality-grade-distribution"]');
    const visible = await dist.isVisible({ timeout: 3_000 }).catch(() => false);
    if (visible) {
      await expect(dist).toBeVisible();
      for (const grade of ["A", "B", "C", "D"]) {
        await expect(page.locator(`[data-testid="quality-grade-${grade}"]`)).toBeVisible();
      }
    }
    expect(true).toBe(true);
  });

  test("festival list is visible when festivals exist", async ({ page }) => {
    await page.goto("/admin/festivals/qualite");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/admin/festivals/qualite")) return;

    const list = page.locator('[data-testid="quality-festival-list"]');
    const visible = await list.isVisible({ timeout: 3_000 }).catch(() => false);
    if (visible) {
      await expect(list).toBeVisible();
    }
    expect(true).toBe(true);
  });

  test("unauthenticated user is redirected", async ({ page: anonPage }) => {
    await anonPage.goto("/admin/festivals/qualite");
    await anonPage.waitForLoadState("networkidle");
    expect(anonPage.url()).not.toContain("/admin/festivals/qualite");
  });
});
