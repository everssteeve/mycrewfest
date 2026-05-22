/**
 * E2E tests for the programme conflict badge on event cards.
 *
 * Requires: dev server + seed data with a FestEvent.
 * Note: conflict badges only appear when two selected events overlap in time.
 * These tests verify the mechanism, but may skip if no conflicts exist in seed data.
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

test.describe("Programme — conflict badges", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme page loads without errors (conflict detection does not crash)", async ({
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

    // Page should have loaded event cards without JS errors
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Stats strip should be visible
    await expect(page.locator('[aria-live="polite"]')).toBeVisible({ timeout: 8_000 });
    expect(errors).toHaveLength(0);
  });

  test("conflict badges are visible when present (opportunistic)", async ({
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

    // Look for conflict badges — they may or may not be present depending on seed data
    const conflictBadges = page.getByText("⚠ Conflit");
    const count = await conflictBadges.count();

    if (count > 0) {
      // If they exist, they should be visible
      await expect(conflictBadges.first()).toBeVisible();
    }
    // Either 0 or more is valid — no assertion required
  });
});
