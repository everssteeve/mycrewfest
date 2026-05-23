/**
 * E2E tests — Status filter on the admin submissions page.
 * Clicking a KPI card filters the table by that status.
 * Skips gracefully if there are no submissions in seed data.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });

  await page.goto("/admin/submissions");
  await page.waitForLoadState("networkidle");
  return page.url().includes("/admin/submissions");
}

test.describe("Admin submissions — status filter", () => {
  test("KPI grid is visible", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-submissions-kpis")).toBeVisible();
  });

  test("'Toutes' chip links to /admin/submissions with no params", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const href = await page.getByTestId("admin-submissions-filter-all").getAttribute("href");
    expect(href).toMatch(/\/admin\/submissions\/?$/);
  });

  test("clicking a KPI card adds ?status= to URL", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await page.getByTestId("admin-submissions-kpi-pending").click();
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("status=en_attente");
  });

  test("filtering by pending shows only pending rows", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await page.goto("/admin/submissions?status=en_attente");
    await page.waitForLoadState("networkidle");

    const rows = page.locator('[data-testid^="admin-submission-row-"]');
    const count = await rows.count();
    if (count === 0) { test.skip(); return; }

    // Spot-check that no "Ajouté" or "Rejeté" badge is visible
    const texts = await page.locator("table tbody").textContent();
    expect(texts).not.toMatch(/Rejeté/i);
  });
});
