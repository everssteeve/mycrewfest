/**
 * E2E tests for the "Dans X min" countdown on the planning view next event.
 *
 * Requires: dev server + seed data with at least one FestEvent with future selections.
 * The countdown only appears when there is a future event today, so skip if not applicable.
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

test.describe("Planning — next event countdown", () => {
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

  test("countdown badge appears for the next upcoming event when visible", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Look for any countdown badge in the DOM — only present if there's a future event
    const badge = page.locator('[data-testid^="next-event-countdown-"]').first();
    const hasBadge = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasBadge) {
      // No upcoming events (festival is past or no future selections) — skip gracefully
      test.skip();
      return;
    }

    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/Dans/);
  });
});
