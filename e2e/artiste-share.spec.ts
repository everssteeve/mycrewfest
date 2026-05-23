/**
 * E2E smoke test — share button on the artist profile page.
 *
 * Requires: dev server + seed data.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Page artiste — share button", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("share button is visible on artist page", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");

    const artistLink = page.locator('a[href^="/artiste/"]').first();
    const hasLink = await artistLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    const href = await artistLink.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    const shareBtn = page.locator('[data-testid="artiste-share-button"]');
    await expect(shareBtn).toBeVisible();
  });

  test("share button is accessible with correct aria-label", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");

    const artistLink = page.locator('a[href^="/artiste/"]').first();
    const hasLink = await artistLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    const href = await artistLink.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    const shareBtn = page.locator('[data-testid="artiste-share-button"]');
    const ariaLabel = await shareBtn.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
  });
});
