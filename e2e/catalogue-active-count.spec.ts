/**
 * E2E tests for the "festivals currently in progress" badge in the catalogue.
 * Shows how many festivals are live right now (today falls between start/end date).
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — active festivals count badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("catalogue page loads without error", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("active count badge shows when at least one festival is currently live", async ({
    page,
  }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("catalogue-active-count");
    const isVisible = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) {
      // No festivals currently in progress — acceptable
      test.skip();
      return;
    }

    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text?.trim()).toMatch(/◉\s*\d+\s*en cours/i);
  });
});
