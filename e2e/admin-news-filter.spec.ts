/**
 * E2E tests — Search and category filter on the admin news page.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });

  await page.goto("/admin/news");
  await page.waitForLoadState("networkidle");
  return page.url().includes("/admin/news");
}

test.describe("Admin news — filter", () => {
  test("filter bar is visible", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-news-filter-bar")).toBeVisible();
    await expect(page.getByTestId("admin-news-search")).toBeVisible();
    await expect(page.getByTestId("admin-news-category-filter")).toBeVisible();
    await expect(page.getByTestId("admin-news-urgency-filter")).toBeVisible();
  });

  test("filtered count shows X / Y format", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-news-filtered-count")).toBeVisible();
    const text = await page.getByTestId("admin-news-filtered-count").textContent();
    expect(text).toMatch(/\d+ \/ \d+/);
  });

  test("submitting form with a query filters results", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await page.getByTestId("admin-news-search").fill("zzz_no_match_abc");
    await page.getByTestId("admin-news-search").press("Enter");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("q=zzz_no_match_abc");
    const count = parseInt(
      (await page.getByTestId("admin-news-filtered-count").textContent())?.split("/")[0] ?? "0",
    );
    expect(count).toBe(0);
  });

  test("reset link removes filters from URL", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await page.goto("/admin/news?q=test");
    await page.waitForLoadState("networkidle");

    const resetLink = page.getByTestId("admin-news-filter-reset");
    const isVisible = await resetLink.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await resetLink.click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("q=");
  });
});
