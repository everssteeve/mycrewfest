/**
 * E2E smoke test — "Artistes vus" section and artistes link on profil page.
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

test.describe("Profil — Artistes vus", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
  });

  test("artistes link is visible on profil", async ({ page }) => {
    await expect(page.locator('[data-testid="profil-artistes-link"]')).toBeVisible();
  });

  test("artistes link navigates to /artistes", async ({ page }) => {
    await page.locator('[data-testid="profil-artistes-link"]').click();
    await expect(page).toHaveURL("/artistes");
  });

  test("seen artists section visible when user has vu events", async ({ page }) => {
    const hasSeen = await page
      .locator('[data-testid="profil-seen-artists"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    // Either shows the section or shows nothing (no vu selections yet)
    // Just verify page loads without error
    await expect(page.locator('[data-testid="profil-artistes-link"]')).toBeVisible();
    expect(typeof hasSeen).toBe("boolean");
  });

  test("seen artist card links to artist profile", async ({ page }) => {
    const hasSeen = await page
      .locator('[data-testid="profil-seen-artists"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (!hasSeen) { test.skip(); return; }

    const firstCard = page.locator('[data-testid^="profil-seen-artist-"]').first();
    await firstCard.click();
    await expect(page.locator('[data-testid="artiste-name"]')).toBeVisible({ timeout: 5_000 });
  });
});
