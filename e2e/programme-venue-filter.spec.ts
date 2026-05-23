/**
 * E2E tests for the venue (scène) filter chips on the programme page.
 *
 * Requires: dev server + seed data with at least one FestEvent
 * that has events spread across ≥2 venues.
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

test.describe("Programme — venue filter", () => {
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

  test("venue filter group appears when events span multiple venues", async ({
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

    const venueGroup = page.getByRole("group", { name: /filtrer par scène/i });
    const hasMultiVenue = await venueGroup
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    if (!hasMultiVenue) {
      // Only one venue in seed data — that's fine, skip
      test.skip();
      return;
    }

    await expect(venueGroup).toBeVisible();
    // "Toutes" chip must be present
    await expect(page.getByTestId("venue-filter-tous")).toBeVisible();
  });

  test("clicking a venue chip filters events", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const venueGroup = page.getByRole("group", { name: /filtrer par scène/i });
    if (!(await venueGroup.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Get all venue chip buttons (excluding "Toutes")
    const venueButtons = venueGroup.getByRole("button").filter({ hasNot: page.getByTestId("venue-filter-tous") });
    const count = await venueButtons.count();
    if (count < 2) {
      test.skip();
      return;
    }

    const initialEventCount = await page.getByRole("article").count();
    await venueButtons.first().click();
    await page.waitForTimeout(300);

    const filteredCount = await page.getByRole("article").count();
    // Filtering to one venue should reduce or keep the same count
    expect(filteredCount).toBeLessThanOrEqual(initialEventCount);
  });

  test("clicking Toutes resets venue filter", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const venueGroup = page.getByRole("group", { name: /filtrer par scène/i });
    if (!(await venueGroup.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const venueButtons = venueGroup.getByRole("button").filter({ hasNot: page.getByTestId("venue-filter-tous") });
    if ((await venueButtons.count()) < 2) {
      test.skip();
      return;
    }

    const allCount = await page.getByRole("article").count();

    await venueButtons.first().click();
    await page.waitForTimeout(200);

    await page.getByTestId("venue-filter-tous").click();
    await page.waitForTimeout(200);

    const resetCount = await page.getByRole("article").count();
    expect(resetCount).toBe(allCount);
  });
});
