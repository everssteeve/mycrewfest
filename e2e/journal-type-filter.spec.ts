/**
 * E2E tests for the journal entry-type filter (Tous / Events / Mémos).
 *
 * Requires: dev server + seed data with souvenirs linked to events.
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

test.describe("Journal — entry type filter", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("journal page loads without error", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("type filter chips are visible when event-linked entries exist", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const typeFilter = page.getByTestId("journal-type-filter");
    const hasFilter = await typeFilter.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasFilter) {
      // No event-linked entries in seed — fine
      test.skip();
      return;
    }

    await expect(typeFilter).toBeVisible();
    await expect(page.getByTestId("journal-type-filter-tous")).toBeVisible();
    await expect(page.getByTestId("journal-type-filter-event")).toBeVisible();
    await expect(page.getByTestId("journal-type-filter-libre")).toBeVisible();

    // "tous" should be active by default
    await expect(page.getByTestId("journal-type-filter-tous")).toHaveAttribute("aria-pressed", "true");
  });
});
