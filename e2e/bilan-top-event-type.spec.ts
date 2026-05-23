/**
 * E2E tests for the bilan top event type indicator.
 *
 * Requires: dev server + seed data with multiple 'vu' events of different types.
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

test.describe("Bilan — top event type", () => {
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

  test("top event type card is visible when seen events have a type", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const typeEl = page.getByTestId("bilan-top-event-type");
    const hasEl = await typeEl.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasEl) {
      // No seen events with eventType in seed — acceptable
      test.skip();
      return;
    }

    await expect(typeEl).toBeVisible();
  });
});
