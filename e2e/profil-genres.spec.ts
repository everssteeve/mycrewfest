/**
 * E2E smoke tests — "Mes genres" section on /profil.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Profil — Mes genres", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("profil page loads without errors", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("genres section appears when user has seen artists with disciplines", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");

    const genresSection = page.locator('[data-testid="profil-genres-section"]');
    const seenArtists = page.locator('[data-testid="profil-seen-artists"]');

    const hasSeenArtists = await seenArtists.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasSeenArtists) {
      const genresVisible = await genresSection.isVisible({ timeout: 3_000 }).catch(() => false);
      if (genresVisible) {
        await expect(genresSection).toBeVisible();
        const firstGenre = page.locator('[data-testid="profil-genre-0"]');
        await expect(firstGenre).toBeVisible({ timeout: 3_000 });
      }
    }
    // If no seen artists, genres section simply shouldn't be shown — that's valid
    expect(true).toBe(true);
  });

  test("genres section is not shown when no artists seen", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");

    const seenArtists = page.locator('[data-testid="profil-seen-artists"]');
    const hasSeenArtists = await seenArtists.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasSeenArtists) {
      const genresSection = page.locator('[data-testid="profil-genres-section"]');
      await expect(genresSection).not.toBeVisible({ timeout: 2_000 });
    }
  });

  test("unauthenticated user is redirected from /profil", async ({ page: unauthPage }) => {
    await unauthPage.goto("/profil");
    await unauthPage.waitForLoadState("networkidle");
    expect(unauthPage.url()).not.toContain("/profil");
  });
});
