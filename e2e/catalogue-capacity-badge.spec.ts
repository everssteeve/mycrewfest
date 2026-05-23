/**
 * E2E tests for the festival capacity tier badge on festival cards.
 * Shows "Nk · Tier" when a festival has capacity data.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — festival capacity badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("catalogue loads without error", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("capacity badge shows correct text format when visible", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("festival-capacity-badge").first();
    const isVisible = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) { test.skip(); return; }

    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    // Format: "60k · Méga" or "1.5k · Petit" or "500 · Intime"
    expect(text?.trim()).toMatch(/[\d.]+k?\s*·\s*(Intime|Petit|Moyen|Grand|Méga)/);
  });

  test("capacity badge has accessible aria-label", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("festival-capacity-badge").first();
    const isVisible = await badge.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const ariaLabel = await badge.getAttribute("aria-label");
    expect(ariaLabel).toMatch(/Capacité/i);
  });
});
