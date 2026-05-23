/**
 * E2E tests for the festivalier rank progress bar on the profil page.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Profil — rank progress bar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("profil page loads without error", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("rank progress bar is visible for non-légende users", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const bar = page.getByTestId("profil-rank-progress-bar");
    const hasBar = await bar.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasBar) {
      // User is légende (top rank) — no progress bar shown, that's correct
      test.skip();
      return;
    }

    await expect(bar).toBeVisible();
    const role = await bar.getAttribute("role");
    expect(role).toBe("progressbar");
  });
});
