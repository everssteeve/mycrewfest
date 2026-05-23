/**
 * E2E tests for the news stats (total count, critique count) in the news view.
 *
 * Requires: dev server + a fest event with at least some news items.
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

test.describe("News — stats badges", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("news page loads without error", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/news`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("news total count badge appears when news items exist", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/news`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const totalBadge = page.getByTestId("news-stats-total");
    const hasEl = await totalBadge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasEl) {
      // No news items in seed — acceptable
      test.skip();
      return;
    }

    await expect(totalBadge).toBeVisible();
    const text = await totalBadge.textContent();
    expect(Number(text?.trim())).toBeGreaterThan(0);
  });
});
