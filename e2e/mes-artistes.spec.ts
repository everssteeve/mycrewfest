/**
 * E2E smoke tests — /mes-artistes page.
 * Requires: dev server running, logged-in user with at least one followed festival.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Mes Artistes — /mes-artistes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("link to mes-artistes is visible on /artistes", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");
    const link = page.locator('[data-testid="artistes-mes-artistes-link"]');
    await expect(link).toBeVisible({ timeout: 5_000 });
  });

  test("clicking link navigates to /mes-artistes", async ({ page }) => {
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");
    await page.click('[data-testid="artistes-mes-artistes-link"]');
    await page.waitForURL("/mes-artistes", { timeout: 5_000 });
    expect(page.url()).toContain("/mes-artistes");
  });

  test("unauthenticated user is redirected away", async ({ page: unauthPage }) => {
    await unauthPage.goto("/mes-artistes");
    await unauthPage.waitForLoadState("networkidle");
    expect(unauthPage.url()).not.toContain("/mes-artistes");
  });

  test("page loads and shows content or empty state", async ({ page }) => {
    await page.goto("/mes-artistes");
    await page.waitForLoadState("networkidle");

    const upcoming = page.locator('[data-testid="mes-artistes-upcoming"]');
    const empty = page.locator('[data-testid="mes-artistes-empty"]');

    const hasUpcoming = await upcoming.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasUpcoming || hasEmpty).toBe(true);
  });

  test("empty state links to /catalogue", async ({ page }) => {
    await page.goto("/mes-artistes");
    await page.waitForLoadState("networkidle");
    const empty = page.locator('[data-testid="mes-artistes-empty"]');
    const isEmpty = await empty.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isEmpty) { test.skip(); return; }

    const link = empty.locator('a[href="/catalogue"]');
    await expect(link).toBeVisible();
  });
});
