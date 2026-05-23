/**
 * E2E smoke test — personal agenda page at /agenda.
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

test.describe("Agenda personnel", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("agenda page loads and shows title", async ({ page }) => {
    await page.goto("/agenda");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
    await expect(page.locator('[data-testid="agenda-title"]')).toBeVisible();
  });

  test("agenda shows empty state or festival list", async ({ page }) => {
    await page.goto("/agenda");
    await page.waitForLoadState("networkidle");

    const isEmpty = await page.locator('[data-testid="agenda-empty"]').isVisible({ timeout: 3_000 }).catch(() => false);
    const hasFestivals = await page.locator('[data-testid="agenda-festivals"]').isVisible({ timeout: 3_000 }).catch(() => false);

    // Either empty state or festival list must be visible
    expect(isEmpty || hasFestivals).toBe(true);
  });

  test("profil page has agenda link", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    const agendaLink = page.locator('[data-testid="profil-agenda-link"]');
    await expect(agendaLink).toBeVisible();
    await agendaLink.click();
    await expect(page).toHaveURL("/agenda");
  });

  test("agenda redirects to login when unauthenticated", async ({ page }) => {
    // New context without login
    await page.context().clearCookies();
    await page.goto("/agenda");
    await expect(page).toHaveURL(/\/login/);
  });
});
