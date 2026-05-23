/**
 * E2E tests — User search on the admin users page.
 * The search input filters by name, email, or role.
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

test.describe("Admin users — search", () => {
  test("search input is visible", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-users-search")).toBeVisible();
  });

  test("filtered count is shown", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-users-filtered-count")).toBeVisible();
    const text = await page.getByTestId("admin-users-filtered-count").textContent();
    expect(text).toMatch(/\d+ \/ \d+/);
  });

  test("typing a query filters the table", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const countBefore = parseInt(
      (await page.getByTestId("admin-users-filtered-count").textContent())?.split("/")[0] ?? "0",
    );
    if (countBefore < 2) { test.skip(); return; }

    await page.getByTestId("admin-users-search").fill("zzz_no_match_999");
    await page.waitForTimeout(200);

    const countAfter = parseInt(
      (await page.getByTestId("admin-users-filtered-count").textContent())?.split("/")[0] ?? "0",
    );
    expect(countAfter).toBeLessThan(countBefore);
  });

  test("clearing the query restores full list", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const total = parseInt(
      (await page.getByTestId("admin-users-filtered-count").textContent())?.split("/")[1] ?? "0",
    );
    await page.getByTestId("admin-users-search").fill("test");
    await page.waitForTimeout(200);
    await page.getByTestId("admin-users-search").fill("");
    await page.waitForTimeout(200);

    const restored = parseInt(
      (await page.getByTestId("admin-users-filtered-count").textContent())?.split("/")[0] ?? "0",
    );
    expect(restored).toBe(total);
  });
});
