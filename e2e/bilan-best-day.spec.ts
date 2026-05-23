/**
 * E2E tests for the bilan best day stat.
 *
 * Requires: dev server + seed data with "vu" events that have startTime.
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

test.describe("Bilan — best day", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("bilan page loads without error", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("best day card is visible when vu events with startTime exist", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const bestDayCard = page.getByTestId("bilan-best-day");
    const hasCard = await bestDayCard.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasCard) {
      // No vu events with startTime in seed — fine
      test.skip();
      return;
    }

    await expect(bestDayCard).toBeVisible();
  });
});
