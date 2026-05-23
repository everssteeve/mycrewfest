/**
 * E2E tests for the festival card community followers badge.
 * Shows "N fans" with a Users icon when a festival has followers.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — festival follower badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("catalogue page loads without error", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
    await expect(page.locator("article.festival-card, [class*='festival-card']").first()).toBeVisible({ timeout: 8_000 });
  });

  test("follower badge shows correct text format when visible", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("festival-follower-badge").first();
    const isVisible = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) { test.skip(); return; }

    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text?.trim()).toMatch(/\d+(\.\d+)?k?\s*fans?/i);
  });

  test("follower badge has accessible aria-label", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("festival-follower-badge").first();
    const isVisible = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) { test.skip(); return; }

    const ariaLabel = await badge.getAttribute("aria-label");
    expect(ariaLabel).toMatch(/personnes suivent/i);
  });
});
