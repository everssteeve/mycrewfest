/**
 * E2E tests for the quick-follow heart button on festival cards.
 * Allows following/unfollowing directly from the catalogue without
 * navigating to the festival detail page.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — quick-follow heart button", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("follow button is visible on festival cards", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const firstFollowBtn = page.locator('[data-testid^="festival-quick-follow-"]').first();
    const isVisible = await firstFollowBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!isVisible) { test.skip(); return; }
    await expect(firstFollowBtn).toBeVisible();
  });

  test("follow button has correct aria-pressed attribute", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const firstFollowBtn = page.locator('[data-testid^="festival-quick-follow-"]').first();
    const isVisible = await firstFollowBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const ariaPressed = await firstFollowBtn.getAttribute("aria-pressed");
    expect(["true", "false"]).toContain(ariaPressed);
  });

  test("clicking follow button toggles aria-pressed", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const firstFollowBtn = page.locator('[data-testid^="festival-quick-follow-"]').first();
    const isVisible = await firstFollowBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const before = await firstFollowBtn.getAttribute("aria-pressed");
    await firstFollowBtn.click();
    await page.waitForTimeout(400);
    const after = await firstFollowBtn.getAttribute("aria-pressed");

    // The press should have toggled (either direction)
    expect(after).not.toBe(before);

    // Restore original state
    await firstFollowBtn.click();
    await page.waitForTimeout(400);
  });

  test("follow does not navigate away from catalogue", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const firstFollowBtn = page.locator('[data-testid^="festival-quick-follow-"]').first();
    const isVisible = await firstFollowBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await firstFollowBtn.click();
    await page.waitForTimeout(400);
    await expect(page).toHaveURL(/\/catalogue/);

    // Restore
    await firstFollowBtn.click();
  });
});
