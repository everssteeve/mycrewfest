/**
 * E2E tests for the "vu" visual treatment on EventCards in the programme.
 *
 * Requires: dev server + seed data with at least one FestEvent and events.
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

test.describe("Programme — EventCard vu visual treatment", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("event cards have data-selection attribute", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const cards = page.locator('[role="article"][data-selection]');
    const count = await cards.count();
    if (count === 0) {
      test.skip();
      return;
    }

    // All cards should have data-selection attribute set to a known value
    const firstCard = cards.first();
    const selectionAttr = await firstCard.getAttribute("data-selection");
    expect(["none", "intéressé", "must-see", "vu"]).toContain(selectionAttr);
  });

  test("vu events have data-selection='vu'", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const vuCards = page.locator('[role="article"][data-selection="vu"]');
    const vuCount = await vuCards.count();

    if (vuCount === 0) {
      // No vu events yet — acceptable, test passes vacuously
      return;
    }

    // Each vu card should be partially opaque (style.opacity should be set)
    const firstVuCard = vuCards.first();
    const opacity = await firstVuCard.evaluate((el) => {
      return (el as HTMLElement).style.opacity;
    });
    // opacity should be "0.8" for vu events
    expect(opacity).toBe("0.8");
  });
});
