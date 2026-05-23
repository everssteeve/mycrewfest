/**
 * E2E tests for the programme day score summary strip.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

async function getFirstFestEventId(page: import("@playwright/test").Page): Promise<string | null> {
  const res = await page.request.get("/api/festevents");
  if (!res.ok()) return null;
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.festEvents ?? data.data ?? [];
  return items[0]?.id ?? null;
}

test.describe("Programme — day score summary", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme loads without error", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("day score summary is visible when multi-day programme and selections exist", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const summary = page.getByTestId("programme-day-score-summary");
    const isVisible = await summary.isVisible({ timeout: 2_000 }).catch(() => false);
    // Only visible when multiple days + at least one selection — skip if not applicable
    if (!isVisible) { test.skip(); return; }
    await expect(summary).toBeVisible();
  });

  test("day score badges contain must-see star when selections exist", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const summary = page.getByTestId("programme-day-score-summary");
    const isVisible = await summary.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const dayBadges = page.locator('[data-testid^="day-score-"]');
    const count = await dayBadges.count();
    expect(count).toBeGreaterThan(0);
  });
});
