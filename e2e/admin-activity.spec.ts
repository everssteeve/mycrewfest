/**
 * E2E tests for the admin activity feed page.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin — activity feed", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/activity");
    await page.waitForLoadState("networkidle");
  });

  test("activity page loads with title and KPIs", async ({ page }) => {
    await expect(page.getByTestId("admin-activity-title")).toBeVisible();
    await expect(page.getByTestId("admin-activity-kpis")).toBeVisible();
    await expect(page.getByTestId("admin-activity-kpi-signups")).toBeVisible();
    await expect(page.getByTestId("admin-activity-kpi-signals")).toBeVisible();
    await expect(page.getByTestId("admin-activity-kpi-submissions")).toBeVisible();
    await expect(page.getByTestId("admin-activity-kpi-festivals")).toBeVisible();
  });

  test("filter chips are visible and interactive", async ({ page }) => {
    await expect(page.getByTestId("admin-activity-filter-all")).toBeVisible();
    await expect(page.getByTestId("admin-activity-filter-user_signup")).toBeVisible();
    await expect(page.getByTestId("admin-activity-filter-signal_posted")).toBeVisible();
    await expect(page.getByTestId("admin-activity-filter-submission_received")).toBeVisible();
    await expect(page.getByTestId("admin-activity-filter-festival_detected")).toBeVisible();

    const countEl = page.getByTestId("admin-activity-count");
    await expect(countEl).toBeVisible();
    const initialText = await countEl.textContent();
    const total = parseInt(initialText?.match(/^(\d+)/)?.[1] ?? "0");

    if (total === 0) { test.skip(); return; }

    // Click a specific filter
    await page.getByTestId("admin-activity-filter-user_signup").click();
    await page.waitForTimeout(200);
    const filteredText = await countEl.textContent();
    const filteredCount = parseInt(filteredText?.match(/^(\d+)/)?.[1] ?? "0");
    expect(filteredCount).toBeLessThanOrEqual(total);

    // Back to all
    await page.getByTestId("admin-activity-filter-all").click();
    await page.waitForTimeout(200);
    const restoredText = await countEl.textContent();
    const restoredCount = parseInt(restoredText?.match(/^(\d+)/)?.[1] ?? "0");
    expect(restoredCount).toBe(total);
  });

  test("timeline shows entries when data exists", async ({ page }) => {
    const countEl = page.getByTestId("admin-activity-count");
    const initialText = await countEl.textContent();
    const total = parseInt(initialText?.match(/^(\d+)/)?.[1] ?? "0");

    if (total === 0) { test.skip(); return; }

    await expect(page.getByTestId("admin-activity-timeline")).toBeVisible();
  });

  test("sidebar link to activity page is present", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    const link = page.getByRole("link", { name: /activité/i });
    await expect(link).toBeVisible();
  });
});
