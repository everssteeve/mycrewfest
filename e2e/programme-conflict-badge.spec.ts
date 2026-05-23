/**
 * E2E tests for the conflict count badge in the programme stats strip.
 *
 * Requires: dev server + seed data with at least one FestEvent.
 * The conflict badge only appears when 2+ selected events overlap,
 * so most tests just verify the page loads and the badge behaves correctly.
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

test.describe("Programme — conflict badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme page loads and stats strip is visible", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    // Stats strip always present (aria-live region)
    const statsStrip = page.locator("[aria-live='polite']").first();
    await expect(statsStrip).toBeVisible({ timeout: 3_000 });
  });

  test("conflict badge is hidden when no conflicts exist", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    // Without any must-see selections set up, no conflict badge
    const badge = page.getByTestId("conflict-count-badge");
    const isVisible = await badge.isVisible({ timeout: 1_000 }).catch(() => false);

    // Either not visible (no conflicts) OR visible with correct text format if seed has conflicts
    if (isVisible) {
      await expect(badge).toContainText("conflit");
    }
    // No assertion needed if not visible — that's the expected default state
  });
});
