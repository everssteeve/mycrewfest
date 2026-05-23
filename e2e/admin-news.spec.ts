/**
 * E2E tests for the admin news management page.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin — News management page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/news");
    await page.waitForLoadState("networkidle");
  });

  test("news page loads without error", async ({ page }) => {
    await expect(page).not.toHaveURL("/login");
  });

  test("news title is visible", async ({ page }) => {
    await expect(page.getByTestId("admin-news-title")).toBeVisible();
  });

  test("news KPIs are visible", async ({ page }) => {
    await expect(page.getByTestId("admin-news-kpis")).toBeVisible();
    await expect(page.getByTestId("admin-news-kpi-total")).toBeVisible();
    await expect(page.getByTestId("admin-news-kpi-festivals")).toBeVisible();
    await expect(page.getByTestId("admin-news-kpi-critiques")).toBeVisible();
    await expect(page.getByTestId("admin-news-kpi-pinned")).toBeVisible();
  });

  test("news table or empty state is visible", async ({ page }) => {
    await expect(page.getByTestId("admin-news-table")).toBeVisible();
  });

  test("news link appears in sidebar", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    const newsLink = page.locator('a[href="/admin/news"]');
    await expect(newsLink).toBeVisible();
  });

  test("create news toggle shows form", async ({ page }) => {
    await expect(page.getByTestId("admin-news-create-toggle")).toBeVisible();
    await page.getByTestId("admin-news-create-toggle").click();
    await expect(page.getByTestId("admin-news-create-form")).toBeVisible();
  });

  test("create news form has required fields", async ({ page }) => {
    await page.getByTestId("admin-news-create-toggle").click();
    await expect(page.locator('select[name="festivalId"]')).toBeVisible();
    await expect(page.locator('select[name="source"]')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toBeVisible();
    await expect(page.locator('textarea[name="summary"]')).toBeVisible();
    await expect(page.getByTestId("admin-news-create-submit")).toBeVisible();
  });

  test("create news toggle closes form on second click", async ({ page }) => {
    await page.getByTestId("admin-news-create-toggle").click();
    await expect(page.getByTestId("admin-news-create-form")).toBeVisible();
    await page.getByTestId("admin-news-create-toggle").click();
    await expect(page.getByTestId("admin-news-create-form")).not.toBeVisible();
  });

  test("pin toggle button is visible for news items", async ({ page }) => {
    const hasTable = await page
      .locator('[data-testid="admin-news-table"] tbody tr')
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (!hasTable) { test.skip(); return; }

    const pinBtn = page.locator('[data-testid^="admin-news-pin-toggle-"]').first();
    await expect(pinBtn).toBeVisible();
  });

  test("urgency toggle button is visible for news items", async ({ page }) => {
    const hasTable = await page
      .locator('[data-testid="admin-news-table"] tbody tr')
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (!hasTable) { test.skip(); return; }

    const urgencyBtn = page.locator('[data-testid^="admin-news-urgency-toggle-"]').first();
    await expect(urgencyBtn).toBeVisible();
  });

  test("pin toggle changes button label on click", async ({ page }) => {
    const hasTable = await page
      .locator('[data-testid="admin-news-table"] tbody tr')
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (!hasTable) { test.skip(); return; }

    const pinBtn = page.locator('[data-testid^="admin-news-pin-toggle-"]').first();
    const labelBefore = await pinBtn.textContent();
    await pinBtn.click();
    await page.waitForTimeout(500);
    const labelAfter = await pinBtn.textContent();
    expect(labelBefore).not.toBe(labelAfter);
  });
});
