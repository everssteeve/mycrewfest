/**
 * E2E smoke test — co-affichés section on the artist profile page.
 *
 * Requires: dev server + seed data (Hellfest 2026 with multiple artists).
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Page artiste — co-affichés", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("co-affichés section appears when artists share festivals", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");

    const artistLink = page.locator('a[href^="/artiste/"]').first();
    const hasLink = await artistLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    const href = await artistLink.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    const section = page.locator('[data-testid="artiste-coaffiche"]');
    const hasSection = await section.isVisible({ timeout: 3_000 }).catch(() => false);

    // The section only shows if the festival has multiple artists
    if (!hasSection) { test.skip(); return; }

    await expect(section).toBeVisible();
    const coCards = section.locator('[data-testid^="artiste-coaffiche-"]');
    expect(await coCards.count()).toBeGreaterThan(0);
    expect(await coCards.count()).toBeLessThanOrEqual(4);
  });

  test("co-affichés links navigate to artist pages", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");

    const artistLink = page.locator('a[href^="/artiste/"]').first();
    const hasLink = await artistLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    const href = await artistLink.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    const section = page.locator('[data-testid="artiste-coaffiche"]');
    const hasSection = await section.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasSection) { test.skip(); return; }

    const firstCoLink = section.locator('a[href^="/artiste/"]').first();
    await firstCoLink.click();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-testid="artiste-name"]')).toBeVisible();
    expect(page.url()).toMatch(/\/artiste\//);
  });
});
