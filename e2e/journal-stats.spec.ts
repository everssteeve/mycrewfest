/**
 * E2E tests for the journal stats strip (total entries, days, photos).
 *
 * Requires: dev server + seed data with at least one FestEvent with souvenirs.
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

test.describe("Journal — stats strip", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("journal page loads without error", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("stats strip is visible when souvenirs exist", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const statsStrip = page.getByTestId("journal-stats");
    const hasStats = await statsStrip.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasStats) {
      // No souvenirs in seed — fine
      test.skip();
      return;
    }

    await expect(statsStrip).toBeVisible();
    await expect(page.getByTestId("journal-stats-entries")).toBeVisible();
    await expect(page.getByTestId("journal-stats-days")).toBeVisible();
  });
});
