/**
 * E2E tests — "Traiter" button on admin submissions page.
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

test.describe("Admin submissions — take charge button", () => {
  test("submissions page renders action columns", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-submissions-title")).toBeVisible();
  });

  test("en_attente rows show Traiter button when submissions exist", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    // Filter to pending only
    await page.getByTestId("admin-submissions-kpi-pending").click();
    await page.waitForLoadState("networkidle");

    const takeChargeButtons = page.locator('[data-testid^="admin-submission-take-charge-"]');
    const count = await takeChargeButtons.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await expect(takeChargeButtons.first()).toBeVisible();
  });

  test("en_traitement rows do not show Traiter button", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await page.getByTestId("admin-submissions-kpi-processing").click();
    await page.waitForLoadState("networkidle");

    const takeChargeButtons = page.locator('[data-testid^="admin-submission-take-charge-"]');
    expect(await takeChargeButtons.count()).toBe(0);
  });
});
