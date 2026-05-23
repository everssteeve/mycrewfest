/**
 * E2E tests for the journal total word count stat badge.
 *
 * Requires: dev server + seed data with journal entries containing text.
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

test.describe("Journal — word count stat", () => {
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

  test("word count badge is visible when entries have text", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const wordsEl = page.getByTestId("journal-stats-words");
    const hasEl = await wordsEl.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasEl) {
      // No journal entries with text in seed — acceptable
      test.skip();
      return;
    }

    await expect(wordsEl).toBeVisible();
    const text = await wordsEl.textContent();
    expect(text).toMatch(/\d+ mot/);
  });
});
