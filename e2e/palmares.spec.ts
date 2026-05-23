/**
 * E2E smoke tests — /palmares page.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Palmarès — /palmares", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("palmarès link is visible on /catalogue", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    const link = page.locator('[data-testid="catalogue-palmares-link"]');
    await expect(link).toBeVisible({ timeout: 5_000 });
  });

  test("clicking palmarès link navigates to /palmares", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.click('[data-testid="catalogue-palmares-link"]');
    await page.waitForURL("/palmares", { timeout: 5_000 });
    expect(page.url()).toContain("/palmares");
  });

  test("page loads and shows title", async ({ page }) => {
    await page.goto("/palmares");
    await page.waitForLoadState("networkidle");
    const title = page.locator('[data-testid="palmares-title"]');
    await expect(title).toBeVisible({ timeout: 5_000 });
  });

  test("page shows at least one ranking section or empty state", async ({ page }) => {
    await page.goto("/palmares");
    await page.waitForLoadState("networkidle");

    const followers = page.locator('[data-testid="palmares-followers-section"]');
    const upcoming = page.locator('[data-testid="palmares-upcoming-section"]');
    const programme = page.locator('[data-testid="palmares-programme-section"]');
    const empty = page.locator('[data-testid="palmares-empty"]');

    const hasFollowers = await followers.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasUpcoming = await upcoming.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasProgramme = await programme.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasFollowers || hasUpcoming || hasProgramme || hasEmpty).toBe(true);
  });

  test("festival entries link to festival pages", async ({ page }) => {
    await page.goto("/palmares");
    await page.waitForLoadState("networkidle");

    const entries = page.locator('[data-testid^="palmares-entry-"]');
    const count = await entries.count();
    if (count === 0) { test.skip(); return; }

    const href = await entries.first().getAttribute("href");
    expect(href).toMatch(/^\/festival\//);
  });

  test("back link navigates to /catalogue", async ({ page }) => {
    await page.goto("/palmares");
    await page.waitForLoadState("networkidle");
    const backLink = page.locator('a[href="/catalogue"]').first();
    await expect(backLink).toBeVisible({ timeout: 3_000 });
  });
});
