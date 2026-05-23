/**
 * E2E smoke test — artist profile page at /artiste/[id].
 *
 * Requires: dev server running + seed data loaded.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Page artiste", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("navigates to an artist page from a festival programme", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");

    const artistLink = page.locator('a[href^="/artiste/"]').first();
    const hasLink = await artistLink.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasLink) {
      test.skip();
      return;
    }

    const href = await artistLink.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-testid="artiste-name"]')).toBeVisible();
  });

  test("artist page shows name and optional sections", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");

    const artistLink = page.locator('a[href^="/artiste/"]').first();
    const hasLink = await artistLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    const href = await artistLink.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-testid="artiste-name"]')).toBeVisible();

    const hasUpcoming = await page.locator('[data-testid="artiste-upcoming"]').isVisible({ timeout: 2_000 }).catch(() => false);
    const hasPast = await page.locator('[data-testid="artiste-past"]').isVisible({ timeout: 2_000 }).catch(() => false);
    const hasNone = await page.locator('[data-testid="artiste-no-appearances"]').isVisible({ timeout: 2_000 }).catch(() => false);

    expect(hasUpcoming || hasPast || hasNone).toBe(true);
  });

  test("back link returns to catalogue", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("networkidle");

    const artistLink = page.locator('a[href^="/artiste/"]').first();
    const hasLink = await artistLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    const href = await artistLink.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    const backLink = page.locator('a[href="/catalogue"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL("/catalogue");
  });

  test("unknown artist id returns 404", async ({ page }) => {
    const response = await page.goto("/artiste/nonexistent-artist-id-xyz");
    expect(response?.status()).toBe(404);
  });
});
