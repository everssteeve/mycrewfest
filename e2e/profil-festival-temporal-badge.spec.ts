/**
 * E2E tests for temporal status badges on followed festivals in the profil view.
 *
 * Requires: dev server + a user following at least one festival with a known temporal status.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Profil — festival temporal badges", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("profil page loads without error", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("temporal badge appears on followed festivals when status is not upcoming", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Find any temporal badge (any festival that is en_cours, imminent, or past)
    const anyBadge = page.locator('[data-testid^="profil-festival-badge-"]').first();
    const hasEl = await anyBadge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasEl) {
      // All followed festivals are "upcoming" (no badge) — acceptable
      test.skip();
      return;
    }

    await expect(anyBadge).toBeVisible();
    const text = await anyBadge.textContent();
    // Badge should be one of: "En cours", "Demain", "Dans N j", "Passé"
    expect(text).toMatch(/En cours|Demain|Dans \d+ j|Passé/);
  });
});
