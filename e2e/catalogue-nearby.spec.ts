/**
 * E2E smoke tests — "Près de moi" geolocation filter on /catalogue.
 */

import { test, expect } from "@playwright/test";

test.describe("Catalogue — Près de moi", () => {
  test("nearby button is visible on catalogue page", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const btn = page.locator('[data-testid="catalogue-nearby"]');
    await expect(btn).toBeVisible({ timeout: 5_000 });
  });

  test("nearby button shows geolocated state when permission is granted", async ({
    page,
    context,
  }) => {
    // Grant geolocation permission and set a fixed location (Paris)
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const btn = page.locator('[data-testid="catalogue-nearby"]');
    await expect(btn).toBeVisible({ timeout: 5_000 });

    await btn.click();

    // After clicking, the button should show "Près de moi ✓" or be in pressed state
    await expect(btn).toHaveAttribute("aria-pressed", "true", { timeout: 5_000 });
  });

  test("clicking nearby button again deactivates it", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const btn = page.locator('[data-testid="catalogue-nearby"]');
    await btn.click();
    await expect(btn).toHaveAttribute("aria-pressed", "true", { timeout: 5_000 });

    await btn.click();
    await expect(btn).toHaveAttribute("aria-pressed", "false", { timeout: 2_000 });
  });
});
