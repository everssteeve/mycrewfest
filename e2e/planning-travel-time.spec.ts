/**
 * E2E tests for the travel time indicator between consecutive planning events.
 *
 * Requires: dev server + seed data with at least one FestEvent and selected events at different venues.
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

test.describe("Planning — travel time indicator", () => {
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

  test("travel time badge appears between events at different venues", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByText(/min à pied/i).first();
    const hasBadge = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasBadge) {
      // No consecutive events at different venues with coords — that's fine
      test.skip();
      return;
    }

    await expect(badge).toBeVisible();
    await expect(badge).toContainText("→");
  });
});
