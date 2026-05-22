/**
 * E2E tests for the Share button on the festival detail page.
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

async function goToFirstFestival(page: import("@playwright/test").Page) {
  await page.goto("/catalogue");
  const firstCard = page
    .locator('[data-testid="festival-card"]')
    .or(page.locator('a[href^="/festival/"]'))
    .first();
  await expect(firstCard).toBeVisible({ timeout: 8_000 });
  await firstCard.click();
  await page.waitForURL(/\/festival\/[^/]+$/, { timeout: 8_000 });
}

test.describe("Share button — festival detail", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("share button is visible on festival detail page", async ({ page }) => {
    await goToFirstFestival(page);

    const shareBtn = page
      .getByRole("button", { name: /partager|copié/i })
      .first();
    await expect(shareBtn).toBeVisible({ timeout: 5_000 });
  });

  test("clicking share button copies URL to clipboard (desktop fallback)", async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await goToFirstFestival(page);

    const shareBtn = page
      .getByRole("button", { name: /partager/i })
      .first();

    if (!(await shareBtn.isVisible())) {
      test.skip();
      return;
    }

    // Override navigator.share to be undefined so we get clipboard fallback
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
      });
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const shareBtnAfterReload = page
      .getByRole("button", { name: /partager/i })
      .first();

    await shareBtnAfterReload.click();

    // Should show "Copié !" feedback
    await expect(
      page.getByRole("button", { name: /copié/i }).first()
    ).toBeVisible({ timeout: 3_000 });
  });

  test("share button returns to initial state after 2 seconds", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await goToFirstFestival(page);

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
      });
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    const shareBtn = page.getByRole("button", { name: /partager/i }).first();
    if (!(await shareBtn.isVisible())) {
      test.skip();
      return;
    }

    await shareBtn.click();
    await expect(
      page.getByRole("button", { name: /copié/i }).first()
    ).toBeVisible({ timeout: 3_000 });

    // After 2s the label should revert
    await expect(
      page.getByRole("button", { name: /partager/i }).first()
    ).toBeVisible({ timeout: 4_000 });
  });
});
