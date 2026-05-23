/**
 * E2E smoke test — /mes-festivals page.
 *
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

test.describe("Page Mes Festivals", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("page is accessible and shows a list or empty state", async ({ page }) => {
    await page.goto("/mes-festivals");
    await page.waitForLoadState("networkidle");

    const list = page.locator('[data-testid="mes-festivals-list"]');
    const empty = page.locator('[data-testid="mes-festivals-empty"]');

    const hasList = await list.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 1_000 }).catch(() => false);

    expect(hasList || hasEmpty).toBe(true);
  });

  test("redirects to login when not authenticated", async ({ page }) => {
    // Fresh page with no cookies
    await page.context().clearCookies();
    await page.goto("/mes-festivals");
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test("each followed festival shows a days badge", async ({ page }) => {
    await page.goto("/mes-festivals");
    await page.waitForLoadState("networkidle");

    const list = page.locator('[data-testid="mes-festivals-list"]');
    const hasList = await list.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasList) { test.skip(); return; }

    const items = page.locator('[data-testid^="mes-festivals-item-"]');
    const count = await items.count();
    if (count === 0) { test.skip(); return; }

    // First item should have a days badge
    const firstSlug = await items.first().getAttribute("data-testid");
    const slug = firstSlug?.replace("mes-festivals-item-", "");
    if (!slug) { test.skip(); return; }

    const badge = page.locator(`[data-testid="mes-festivals-days-${slug}"]`);
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test("followed festival cards link to their festival page", async ({ page }) => {
    await page.goto("/mes-festivals");
    await page.waitForLoadState("networkidle");

    const items = page.locator('[data-testid^="mes-festivals-item-"]');
    const hasList = (await items.count()) > 0;
    if (!hasList) { test.skip(); return; }

    const link = items.first().locator('a[href^="/festival/"]');
    await expect(link).toBeVisible();
  });
});
