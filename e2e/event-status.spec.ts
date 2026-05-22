/**
 * E2E tests for the "En cours" ongoing event badge on programme cards.
 *
 * Requires: dev server + seed data.
 * Note: "En cours" badge only appears for events actually happening now.
 * These tests verify the mechanism and page stability.
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

test.describe("Programme — En cours badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme loads without JS errors (ongoing detection does not crash)", async ({
    page,
  }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page.locator('[aria-live="polite"]')).toBeVisible({ timeout: 8_000 });
    expect(errors).toHaveLength(0);
  });

  test("'En cours' badges are visible when present (opportunistic)", async ({
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

    const badges = page.getByTestId("ongoing-badge");
    const count = await badges.count();

    if (count > 0) {
      await expect(badges.first()).toBeVisible();
      // Badge should have correct aria-label
      await expect(badges.first()).toHaveAttribute("aria-label", "En cours maintenant");
    }
    // 0 badges is valid when no events are currently live
  });
});
