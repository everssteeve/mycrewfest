/**
 * E2E tests for the "Tout effacer" filter reset button and day tab counts.
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

test.describe("Programme — reset filters button", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("reset button is hidden when no filter is active", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const resetBtn = page.getByTestId("reset-filters-btn");
    // Should not be visible when no filter is active (default state has activeDay set)
    // activeDay counts as no explicit user-applied filter (upcomingOnly=false etc.)
    // The button only appears when hasActiveFilter is true (types, access, selection, tags, search, upcoming)
    // So with fresh load it should be hidden
    await expect(resetBtn).not.toBeVisible({ timeout: 3_000 });
  });

  test("reset button appears after applying search filter", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Apply search filter
    const searchInput = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/artiste|scène/i));

    if (!(await searchInput.isVisible())) {
      test.skip();
      return;
    }

    await searchInput.fill("test query");
    await page.waitForTimeout(300);

    const resetBtn = page.getByTestId("reset-filters-btn");
    await expect(resetBtn).toBeVisible({ timeout: 3_000 });
  });

  test("clicking reset clears search query", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const searchInput = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/artiste|scène/i));

    if (!(await searchInput.isVisible())) {
      test.skip();
      return;
    }

    await searchInput.fill("some query");
    await page.waitForTimeout(300);

    const resetBtn = page.getByTestId("reset-filters-btn");
    await resetBtn.click();
    await page.waitForTimeout(300);

    await expect(searchInput).toHaveValue("");
    await expect(resetBtn).not.toBeVisible({ timeout: 3_000 });
  });

  test("reset button appears after activating À venir filter", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const upcomingBtn = page.getByTestId("upcoming-filter-btn");
    if (!(await upcomingBtn.isVisible())) {
      test.skip();
      return;
    }

    await upcomingBtn.click();
    await page.waitForTimeout(200);

    const resetBtn = page.getByTestId("reset-filters-btn");
    await expect(resetBtn).toBeVisible({ timeout: 3_000 });

    await resetBtn.click();
    await page.waitForTimeout(200);

    await expect(upcomingBtn).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("Programme — day tab event counts", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("day tabs show event count when multi-day festival", async ({ page }) => {
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

    // Day tabs (excluding "Tous") should contain a "· N" count
    const dayBtns = tabGroup.getByRole("button").filter({ hasNotText: /^tous$/i });
    const firstDayBtn = dayBtns.first();

    const text = await firstDayBtn.textContent();
    // Should contain "·" separator and a number
    expect(text).toMatch(/·\s*\d+/);
  });
});
