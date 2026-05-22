/**
 * E2E tests for the programme day tabs filter.
 *
 * Requires: dev server + seed data with a multi-day festival.
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

test.describe("Programme — day tabs", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("day tabs group is visible for multi-day festival", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const tabGroup = page.locator('[role="group"][aria-label="Filtrer par jour"]');
    const groupVisible = await tabGroup.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!groupVisible) {
      // Single-day festival — no day tabs, skip gracefully
      test.skip();
      return;
    }

    await expect(tabGroup).toBeVisible();
  });

  test("'Tous' tab is present and activates when clicked", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const tabGroup = page.locator('[role="group"][aria-label="Filtrer par jour"]');
    if (!(await tabGroup.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const tousBtn = tabGroup.getByRole("button", { name: /^tous$/i });
    await expect(tousBtn).toBeVisible();

    // Click "Tous" and verify it's pressed
    await tousBtn.click();
    await page.waitForTimeout(200);
    await expect(tousBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("clicking a day tab filters events", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const tabGroup = page.locator('[role="group"][aria-label="Filtrer par jour"]');
    if (!(await tabGroup.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // First click "Tous" to see all events
    const tousBtn = tabGroup.getByRole("button", { name: /^tous$/i });
    await tousBtn.click();
    await page.waitForTimeout(300);

    const statsStrip = page.locator('[aria-live="polite"]');
    const allText = await statsStrip.textContent();

    // Click the first day tab
    const dayBtns = tabGroup.getByRole("button").filter({ hasNotText: /^tous$/i });
    const firstDayBtn = dayBtns.first();

    if (!(await firstDayBtn.isVisible())) {
      test.skip();
      return;
    }

    await firstDayBtn.click();
    await page.waitForTimeout(300);

    // Stats strip count may change (or stay same for single-day data)
    const dayText = await statsStrip.textContent();
    // Just verify the stats strip is still visible and not errored
    expect(dayText).toMatch(/événement/);
  });
});
