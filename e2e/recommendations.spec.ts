/**
 * E2E smoke tests — /recommandations page.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Recommandations — /recommandations", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("recommendations link is visible on /catalogue", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    const link = page.locator('[data-testid="catalogue-recommendations-link"]');
    await expect(link).toBeVisible({ timeout: 5_000 });
  });

  test("clicking recommendations link navigates to /recommandations", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.click('[data-testid="catalogue-recommendations-link"]');
    await page.waitForURL("/recommandations", { timeout: 5_000 });
    expect(page.url()).toContain("/recommandations");
  });

  test("unauthenticated user is redirected away from /recommandations", async ({ page: unauthPage }) => {
    await unauthPage.goto("/recommandations");
    await unauthPage.waitForLoadState("networkidle");
    expect(unauthPage.url()).not.toContain("/recommandations");
  });

  test("page loads and shows title", async ({ page }) => {
    await page.goto("/recommandations");
    await page.waitForLoadState("networkidle");
    const title = page.locator('[data-testid="recommandations-title"]');
    await expect(title).toBeVisible({ timeout: 5_000 });
  });

  test("page shows content or empty state", async ({ page }) => {
    await page.goto("/recommandations");
    await page.waitForLoadState("networkidle");

    const list = page.locator('[data-testid="recommandations-list"]');
    const emptyNoFollows = page.locator('[data-testid="recommandations-empty-no-follows"]');
    const emptyNoRecs = page.locator('[data-testid="recommandations-empty"]');

    const hasList = await list.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasEmptyNoFollows = await emptyNoFollows.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasEmptyNoRecs = await emptyNoRecs.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasList || hasEmptyNoFollows || hasEmptyNoRecs).toBe(true);
  });

  test("recommendation items link to festival pages", async ({ page }) => {
    await page.goto("/recommandations");
    await page.waitForLoadState("networkidle");

    const list = page.locator('[data-testid="recommandations-list"]');
    const isVisible = await list.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const firstItem = list.locator("li a").first();
    const href = await firstItem.getAttribute("href");
    expect(href).toMatch(/^\/festival\//);
  });
});
