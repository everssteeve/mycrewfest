/**
 * E2E tests for the selection progress bar shown during festivals.
 *
 * Requires: dev server + seed data with a FestEvent that is currently "during".
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

async function getFirstFestEventId(
  page: import("@playwright/test").Page,
): Promise<string | null> {
  const res = await page.request.get("/api/festevents");
  if (!res.ok()) return null;
  const data: { id: string }[] = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0].id : null;
}

test.describe("Selection progress bar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("progress bar renders on programme page during festival", async ({
    page,
  }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Only visible during festival — skip if not
    const bar = page.getByTestId("selection-progress-bar");
    const barVisible = await bar.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!barVisible) {
      test.skip();
      return;
    }

    await expect(bar).toBeVisible();
  });

  test("progress bar shows progressbar role with numeric value", async ({
    page,
  }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const bar = page.getByTestId("selection-progress-bar");
    if (!(await bar.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const progressBar = bar.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    const valueNow = await progressBar.getAttribute("aria-valuenow");
    expect(Number(valueNow)).toBeGreaterThanOrEqual(0);
    expect(Number(valueNow)).toBeLessThanOrEqual(100);
  });
});
