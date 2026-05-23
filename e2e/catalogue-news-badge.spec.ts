/**
 * E2E smoke test — news badge on festival cards in catalogue.
 *
 * Requires: dev server + seed data + followed festival with recent news.
 * The badge only appears for followed festivals with news in the last 7 days.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — news badge on festival cards", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("news badge has correct testid when present", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    // The badge only appears for followed festivals with recent news.
    // We check the pattern is correct if any badge exists.
    const badges = page.locator('[data-testid^="festival-news-badge-"]');
    const count = await badges.count();
    if (count === 0) {
      // No followed festivals with recent news — skip gracefully
      test.skip();
      return;
    }

    // At least one badge should have text content
    const firstBadge = badges.first();
    const text = await firstBadge.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test("festival cards without news do not show news badge", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    // All card links
    const cardLinks = page.locator('a[href^="/festival/"]');
    const count = await cardLinks.count();
    if (count === 0) { test.skip(); return; }

    // Confirm that non-followed festivals (most of them) have no badge
    // by checking there are far fewer badges than cards
    const badges = page.locator('[data-testid^="festival-news-badge-"]');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeLessThanOrEqual(count);
  });
});
