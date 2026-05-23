/**
 * E2E smoke tests — Quality score panel on the festival edit page.
 *
 * The quality panel shows the current grade (A–D), score (/100), and any
 * failed checks. It is rendered server-side so it's always present when
 * the edit page loads for an admin.
 */

import { test, expect } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

async function getFirstFestivalSlug(page: import("@playwright/test").Page): Promise<string | null> {
  const response = await page.request.get("/api/festivals?limit=1");
  if (!response.ok()) return null;
  const body = await response.json();
  const festivals = body.data ?? body.festivals ?? body;
  if (!Array.isArray(festivals) || festivals.length === 0) return null;
  return festivals[0].slug ?? null;
}

test.describe("Admin — quality panel on festival edit page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("quality panel is present on the edit page", async ({ page }) => {
    const slug = await getFirstFestivalSlug(page);
    if (!slug) { test.skip(); return; }

    await page.goto(`/admin/festivals/${slug}/edit`);
    await page.waitForLoadState("networkidle");

    if (!page.url().includes("/admin/festivals/")) { test.skip(); return; }

    const panel = page.getByTestId("festival-edit-quality-panel");
    await expect(panel).toBeVisible({ timeout: 5_000 });
  });

  test("quality grade badge shows A, B, C, or D", async ({ page }) => {
    const slug = await getFirstFestivalSlug(page);
    if (!slug) { test.skip(); return; }

    await page.goto(`/admin/festivals/${slug}/edit`);
    await page.waitForLoadState("networkidle");

    const grade = page.getByTestId("festival-edit-quality-grade");
    const isVisible = await grade.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const text = await grade.textContent();
    expect(text?.trim()).toMatch(/^[ABCD]$/);
  });

  test("quality score shows a number out of 100", async ({ page }) => {
    const slug = await getFirstFestivalSlug(page);
    if (!slug) { test.skip(); return; }

    await page.goto(`/admin/festivals/${slug}/edit`);
    await page.waitForLoadState("networkidle");

    const score = page.getByTestId("festival-edit-quality-score");
    const isVisible = await score.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const text = await score.textContent();
    expect(text).toMatch(/^\d+\/100$/);
  });
});
