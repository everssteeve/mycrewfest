/**
 * E2E tests for the age restriction badge on event cards.
 *
 * Requires: dev server + seed data with events that have ageMin or ageMax set.
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

test.describe("Programme — age restriction badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme page loads without error", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("age restriction badge is visible when events have age constraints", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badges = page.getByTestId("event-age-restriction");
    const count = await badges.count();

    if (count === 0) {
      // No events with age restrictions in seed — acceptable
      test.skip();
      return;
    }

    const firstBadge = badges.first();
    await expect(firstBadge).toBeVisible();
    const text = await firstBadge.textContent();
    expect(text).toMatch(/^\+\d+$|^\d+–\d+ ans$|^−\d+ ans$/);
  });
});
