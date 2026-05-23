/**
 * E2E tests for Escape key clearing the search input on the programme page.
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

test.describe("Programme — Escape key clears search", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Escape key clears the programme search input", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const searchInput = page.getByRole("searchbox", {
      name: /rechercher dans le programme/i,
    });
    await searchInput.fill("rockband");
    await expect(searchInput).toHaveValue("rockband");

    await searchInput.press("Escape");

    await expect(searchInput).toHaveValue("");
  });

  test("Escape key clears the journal search input", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const searchInput = page.getByTestId("journal-search-input");
    const isVisible = await searchInput
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await searchInput.fill("something");
    await expect(searchInput).toHaveValue("something");

    await searchInput.press("Escape");

    await expect(searchInput).toHaveValue("");
  });
});
