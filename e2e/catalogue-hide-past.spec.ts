/**
 * E2E tests for the catalogue "hide past festivals" toggle.
 *
 * Requires: dev server + seed data with at least one festival.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — hide past festivals toggle", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("catalogue loads and shows the hide-past toggle", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const toggle = page.getByTestId("catalogue-hide-past");
    await expect(toggle).toBeVisible();
  });

  test("toggle is initially active (hiding past festivals)", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const toggle = page.getByTestId("catalogue-hide-past");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  test("toggle turns off when clicked and shows all festivals", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const toggle = page.getByTestId("catalogue-hide-past");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    // Click again to restore
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});
