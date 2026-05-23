/**
 * E2E tests — scope filter on admin signals page.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });

  await page.goto("/admin/signals");
  await page.waitForLoadState("networkidle");
  return page.url().includes("/admin/signals");
}

test.describe("Admin signals — scope filter", () => {
  test("scope filter bar renders with filter buttons", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-signals-scope-filter")).toBeVisible();
    await expect(page.getByTestId("admin-signals-filter-tous")).toBeVisible();
    await expect(page.getByTestId("admin-signals-filter-communauté")).toBeVisible();
    await expect(page.getByTestId("admin-signals-filter-crew")).toBeVisible();
  });

  test("tous filter is active by default", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const tousBtn = page.getByTestId("admin-signals-filter-tous");
    const pressed = await tousBtn.getAttribute("aria-pressed");
    expect(pressed).toBe("true");
  });

  test("result count is visible", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-signals-filter-count")).toBeVisible();
  });
});
