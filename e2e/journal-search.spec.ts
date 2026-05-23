/**
 * E2E tests for the search bar in the journal page.
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

test.describe("Journal — search bar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("journal page loads successfully", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");

    // Page should load without errors
    await expect(page).not.toHaveURL("/login");
  });

  test("search input is visible when journal has entries", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const searchInput = page.getByTestId("journal-search-input");
    const journalHasEntries = await page.getByRole("article").count() > 1;

    if (!journalHasEntries) {
      // Search bar only appears with more than 1 entry
      test.skip();
      return;
    }

    await expect(searchInput).toBeVisible({ timeout: 3_000 });
  });

  test("searching filters journal entries", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const searchInput = page.getByTestId("journal-search-input");
    if (!(await searchInput.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await searchInput.fill("xqz_no_match_query_1234");
    await page.waitForTimeout(300);

    // Should show empty state
    await expect(page.getByText(/aucune entrée ne correspond/i)).toBeVisible({ timeout: 2_000 });
  });

  test("clearing search shows all entries again", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const searchInput = page.getByTestId("journal-search-input");
    if (!(await searchInput.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await searchInput.fill("xqz_no_match");
    await page.waitForTimeout(200);

    await page.getByLabel("Effacer la recherche").first().click();
    await page.waitForTimeout(200);

    await expect(searchInput).toHaveValue("");
    await expect(page.getByText(/aucune entrée ne correspond/i)).not.toBeVisible({ timeout: 1_000 });
  });
});
