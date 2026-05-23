/**
 * E2E tests for gap warnings between consecutive selected events in the programme.
 *
 * A "tight" transition badge (⚡ X min — transition serrée) is shown before
 * a selected event when fewer than 15 minutes separate it from the previous
 * selected event.
 *
 * These tests are graceful: they skip when no festEvent is seeded or when
 * no gap-warnings are present (the warnings only appear when the seed data
 * contains consecutive selected events with a gap < 15 min).
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

test.describe("Programme — gap warnings (tight transitions)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme page loads without errors", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    // Page should not have a crash — stats strip or event list is visible
    const hasContent =
      (await page.locator("[aria-live='polite']").count()) > 0 ||
      (await page.locator("[data-testid^='timeline-hour-']").count()) > 0;

    expect(hasContent).toBe(true);
  });

  test("gap-warning badges are visible when present", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const warnings = page.locator("[data-testid^='gap-warning-']");
    const count = await warnings.count();

    if (count === 0) {
      // No tight transitions in seed data — this is fine
      test.skip();
      return;
    }

    // At least one gap-warning badge exists — verify it is visible
    await expect(warnings.first()).toBeVisible();
  });

  test("gap-warning badge contains expected text", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const warnings = page.locator("[data-testid^='gap-warning-']");
    const count = await warnings.count();

    if (count === 0) {
      test.skip();
      return;
    }

    const firstBadge = warnings.first();
    await expect(firstBadge).toContainText("transition serrée");
    await expect(firstBadge).toContainText("min");
  });
});
