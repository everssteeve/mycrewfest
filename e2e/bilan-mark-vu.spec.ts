/**
 * E2E tests for the "Marquer vu" button on missed must-see events in the bilan.
 *
 * Requires: dev server + seed data with at least one FestEvent.
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

test.describe("Bilan — mark missed must-see as vu", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("bilan page loads with heading", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 5_000 });
  });

  test("mark-vu buttons appear for each missed must-see", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const missedSection = page.getByRole("region", { name: "Must-sees non vus" });
    if (!(await missedSection.isVisible({ timeout: 3_000 }).catch(() => false))) {
      // No missed must-sees — this is OK, skip this test
      test.skip();
      return;
    }

    // Each missed must-see row should have a mark-vu button
    const markVuButtons = page.getByRole("button", { name: /marquer.*vu/i });
    await expect(markVuButtons.first()).toBeVisible({ timeout: 3_000 });
  });

  test("clicking mark-vu button moves event to seen section", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const missedSection = page.getByRole("region", { name: "Must-sees non vus" });
    if (!(await missedSection.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const markVuButtons = page.getByRole("button", { name: /marquer.*vu/i });
    const count = await markVuButtons.count();
    if (count === 0) {
      test.skip();
      return;
    }

    const initialMissedCount = count;
    await markVuButtons.first().click();
    await page.waitForTimeout(300);

    // The missed section should now have one fewer item (or disappear)
    const newCount = await page.getByRole("button", { name: /marquer.*vu/i }).count();
    expect(newCount).toBe(initialMissedCount - 1);
  });
});
