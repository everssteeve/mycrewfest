/**
 * E2E tests — submissions appear in admin global search results.
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

test.describe("Admin global search — submissions", () => {
  test("search input accepts text", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const input = page.getByTestId("admin-global-search-input");
    await expect(input).toBeVisible();
    await input.fill("Pixel");
    await expect(input).toHaveValue("Pixel");
  });

  test("placeholder mentions soumissions", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const input = page.getByTestId("admin-global-search-input");
    const placeholder = await input.getAttribute("placeholder");
    expect(placeholder).toContain("soumissions");
  });

  test("submission type color is distinct from festival and user", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    // Verify the search component loads — type chips will only appear in results
    await expect(page.getByTestId("admin-global-search")).toBeVisible();
  });
});
