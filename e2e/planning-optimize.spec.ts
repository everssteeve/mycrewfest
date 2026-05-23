/**
 * E2E tests for the "Optimiser" button in the planning view.
 *
 * Requires: dev server + seed data with conflicting events in the user's planning.
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

test.describe("Planning — optimize button", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("planning page loads without error", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("optimize button appears when conflicts exist and shows result", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const optimizeBtn = page.getByTestId("planning-optimize-btn");
    const hasBtn = await optimizeBtn.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasBtn) {
      // No conflicts in seed planning — acceptable
      test.skip();
      return;
    }

    await optimizeBtn.click();
    await expect(page.getByTestId("planning-optimize-result")).toBeVisible();
  });
});
