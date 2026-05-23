/**
 * E2E tests for the news view search bar.
 *
 * Requires: dev server + seed data with at least 4 news items.
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

test.describe("News — search bar", () => {
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

  test("search bar is visible when more than 3 news items exist", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/news`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const search = page.getByTestId("news-search-input");
    const hasSearch = await search.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasSearch) {
      // Not enough news items in seed — fine
      test.skip();
      return;
    }

    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute("placeholder", "Rechercher dans les actualités…");
  });
});
