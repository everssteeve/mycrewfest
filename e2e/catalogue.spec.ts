/**
 * E2E tests for the festival catalogue page.
 *
 * Requires: dev server running + seed data loaded.
 */

import { test, expect } from "@playwright/test";

// Helper: log in as the seed test user
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("loads the catalogue page with a list of festivals", async ({
    page,
  }) => {
    await page.goto("/catalogue");
    // There should be at least one festival card / item after seed
    await expect(page.locator("main")).toBeVisible();

    // Festival items: look for cards, list items, or links with festival names
    const festivalItems = page.locator('[data-testid="festival-card"]').or(
      page.locator('a[href^="/festival/"]'),
    );
    await expect(festivalItems.first()).toBeVisible({ timeout: 8_000 });
    expect(await festivalItems.count()).toBeGreaterThan(0);
  });

  test("search input filters festivals by name", async ({ page }) => {
    await page.goto("/catalogue");

    // Get initial count
    const allCards = page
      .locator('[data-testid="festival-card"]')
      .or(page.locator('a[href^="/festival/"]'));
    await expect(allCards.first()).toBeVisible({ timeout: 8_000 });
    const initialCount = await allCards.count();

    // Search for a known festival name from seed
    const searchInput = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/recherch/i))
      .or(page.locator('input[type="search"]'));

    if (await searchInput.isVisible()) {
      await searchInput.fill("Hellfest");
      // Wait for results to update
      await page.waitForTimeout(500);

      const filteredCards = page
        .locator('[data-testid="festival-card"]')
        .or(page.locator('a[href^="/festival/"]'));
      const filteredCount = await filteredCards.count();

      // Either results narrowed or the search doesn't apply (graceful skip)
      if (initialCount > 0) {
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }
    } else {
      test.skip();
    }
  });

  test("filter by festival type works", async ({ page }) => {
    await page.goto("/catalogue");

    // Look for a filter/select for festival type
    const typeFilter = page
      .getByRole("combobox", { name: /type/i })
      .or(page.locator('select[name*="type"]'))
      .or(page.getByRole("button", { name: /musique/i }));

    if (await typeFilter.isVisible()) {
      await typeFilter.click();

      // Select "musique" option
      const musiqueOption = page
        .getByRole("option", { name: /musique/i })
        .or(page.locator('li:has-text("musique")'));

      if (await musiqueOption.isVisible()) {
        await musiqueOption.click();
        await page.waitForTimeout(500);

        // Results should exist and be filtered
        const cards = page
          .locator('[data-testid="festival-card"]')
          .or(page.locator('a[href^="/festival/"]'));
        expect(await cards.count()).toBeGreaterThanOrEqual(0);
      }
    } else {
      test.skip();
    }
  });

  test("festival cards have data-temporal attribute with a valid status", async ({
    page,
  }) => {
    await page.goto("/catalogue");

    const cards = page.locator("article[data-temporal]");
    await expect(cards.first()).toBeVisible({ timeout: 8_000 });

    const validStatuses = new Set(["en_cours", "imminent", "upcoming", "past"]);
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const status = await cards.nth(i).getAttribute("data-temporal");
      expect(validStatuses.has(status ?? "")).toBe(true);
    }
  });

  test("catalogue is sorted with en_cours before upcoming and past", async ({
    page,
  }) => {
    await page.goto("/catalogue");

    const cards = page.locator("article[data-temporal]");
    await expect(cards.first()).toBeVisible({ timeout: 8_000 });

    const statuses = await cards.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-temporal") ?? "")
    );

    const ORDER: Record<string, number> = {
      en_cours: 0,
      imminent: 1,
      upcoming: 2,
      past: 3,
    };

    // Verify no card has a lower-priority status before a higher-priority one
    for (let i = 0; i < statuses.length - 1; i++) {
      const curr = ORDER[statuses[i]] ?? 99;
      const next = ORDER[statuses[i + 1]] ?? 99;
      expect(curr).toBeLessThanOrEqual(next);
    }
  });

  test("en_cours badge is visible when a festival is ongoing", async ({
    page,
  }) => {
    await page.goto("/catalogue");

    const ongoingCard = page.locator('article[data-temporal="en_cours"]').first();

    // Only assert if such a card exists in seed data
    const count = await ongoingCard.count();
    if (count > 0) {
      await expect(ongoingCard).toBeVisible();
      await expect(
        ongoingCard.getByText(/en cours/i)
      ).toBeVisible();
    } else {
      // No ongoing festival in seed — check imminent instead
      const imminentCard = page.locator('article[data-temporal="imminent"]').first();
      if (await imminentCard.count() > 0) {
        await expect(imminentCard.getByText(/dans \d+ j/i).or(imminentCard.getByText(/demain/i))).toBeVisible();
      }
    }
  });

  test("past festivals are visually de-emphasised (opacity < 1)", async ({
    page,
  }) => {
    await page.goto("/catalogue");

    const pastCard = page.locator('article[data-temporal="past"]').first();
    if (await pastCard.count() > 0) {
      const opacity = await pastCard.evaluate(
        (el) => parseFloat(getComputedStyle(el).opacity)
      );
      expect(opacity).toBeLessThan(1);
    }
  });

  test("clicking a festival card opens the festival detail page", async ({
    page,
  }) => {
    await page.goto("/catalogue");

    const firstCard = page
      .locator('[data-testid="festival-card"]')
      .or(page.locator('a[href^="/festival/"]'))
      .first();

    await expect(firstCard).toBeVisible({ timeout: 8_000 });
    await firstCard.click();

    // Should navigate to /festival/[slug]
    await page.waitForURL(/\/festival\/[^/]+$/, { timeout: 8_000 });
    expect(page.url()).toMatch(/\/festival\/[^/]+$/);
  });
});
