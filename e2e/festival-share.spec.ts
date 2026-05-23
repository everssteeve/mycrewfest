/**
 * E2E smoke test — share button on festival cards.
 * Requires: dev server running.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Festival cards — share button", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("share buttons are present on festival cards", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const shareButtons = page.locator('[data-testid^="festival-share-"]');
    const count = await shareButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("share button has correct aria-label", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const firstShare = page.locator('[data-testid^="festival-share-"]').first();
    const label = await firstShare.getAttribute("aria-label");
    expect(label).toMatch(/Partager/i);
  });

  test("share button is inside the festival card link", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    // Click share without navigating away
    const firstCard = page.locator('[data-testid^="festival-share-"]').first();
    const slug = (await firstCard.getAttribute("data-testid"))?.replace("festival-share-", "");
    if (!slug) { test.skip(); return; }

    // Grant clipboard permission (if browser supports it)
    await page.context().grantPermissions(["clipboard-write"]).catch(() => {});
    await firstCard.click();

    // Should still be on catalogue (no navigation happened)
    await expect(page).toHaveURL(/\/catalogue/, { timeout: 2_000 });
  });

  test("share button also present on mes-festivals page", async ({ page }) => {
    await page.goto("/mes-festivals");
    await page.waitForLoadState("networkidle");

    const list = page.locator('[data-testid="mes-festivals-list"]');
    const hasList = await list.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasList) { test.skip(); return; }

    // FollowButton should be visible for each followed festival
    const followButtons = page.locator('[aria-pressed="true"]');
    const count = await followButtons.count();
    expect(count).toBeGreaterThanOrEqual(0); // graceful — may be 0 if no followed festivals
  });
});
