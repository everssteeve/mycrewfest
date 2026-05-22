/**
 * E2E tests for the "Suivre" (Follow) festival feature.
 *
 * Requires: dev server + seed data (at least one festival).
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

async function goToFirstFestival(page: import("@playwright/test").Page) {
  await page.goto("/catalogue");
  const firstCard = page
    .locator('[data-testid="festival-card"]')
    .or(page.locator('a[href^="/festival/"]'))
    .first();
  await expect(firstCard).toBeVisible({ timeout: 8_000 });
  await firstCard.click();
  await page.waitForURL(/\/festival\/[^/]+$/, { timeout: 8_000 });
}

test.describe("Follow festival", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("follow button is visible on festival detail page", async ({ page }) => {
    await goToFirstFestival(page);

    const followBtn = page
      .getByRole("button", { name: /suivre|suivi/i })
      .first();
    await expect(followBtn).toBeVisible({ timeout: 5_000 });
  });

  test("clicking follow button changes its label", async ({ page }) => {
    await goToFirstFestival(page);

    const followBtn = page
      .getByRole("button", { name: /suivre/i })
      .first();

    if (await followBtn.isVisible()) {
      // Initially "Suivre" — click to follow
      await followBtn.click();

      // Should now say "Suivi"
      await expect(
        page.getByRole("button", { name: /suivi/i }).first()
      ).toBeVisible({ timeout: 5_000 });
    } else {
      // Already followed — unfollow first then re-follow
      const suivisBtn = page.getByRole("button", { name: /suivi/i }).first();
      await suivisBtn.click();
      await expect(
        page.getByRole("button", { name: /^suivre$/i }).first()
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("follow state persists after page reload", async ({ page }) => {
    await goToFirstFestival(page);
    const url = page.url();

    // Ensure we're in unfollow state first
    const suivisBtn = page.getByRole("button", { name: /suivi/i }).first();
    if (await suivisBtn.isVisible()) {
      await suivisBtn.click();
      await expect(
        page.getByRole("button", { name: /^suivre$/i }).first()
      ).toBeVisible({ timeout: 5_000 });
    }

    // Follow
    const followBtn = page.getByRole("button", { name: /^suivre$/i }).first();
    await followBtn.click();
    await expect(
      page.getByRole("button", { name: /suivi/i }).first()
    ).toBeVisible({ timeout: 5_000 });

    // Reload and check persistence
    await page.goto(url);
    await expect(
      page.getByRole("button", { name: /suivi/i }).first()
    ).toBeVisible({ timeout: 8_000 });

    // Cleanup: unfollow
    await page.getByRole("button", { name: /suivi/i }).first().click();
  });
});
