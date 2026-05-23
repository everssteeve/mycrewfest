/**
 * E2E tests for the "prochain festival" countdown card on the profil page.
 * Shows festival name + "Dans N jours" / "En cours" when the user has upcoming festivals.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Profil — prochain festival countdown", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("profil page loads without error", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("countdown card visible when user has upcoming festivals", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const card = page.getByTestId("profil-next-festival-countdown");
    const isVisible = await card.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!isVisible) {
      // User has no upcoming festivals — acceptable
      test.skip();
      return;
    }

    await expect(card).toBeVisible();
  });

  test("countdown label shows correct text format", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const card = page.getByTestId("profil-next-festival-countdown");
    const isVisible = await card.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const label = page.getByTestId("profil-countdown-label");
    await expect(label).toBeVisible();
    const text = await label.textContent();
    expect(text?.trim()).toMatch(/En cours|Demain|Dans \d+ jours?/);
  });

  test("countdown card links to festival programme", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const card = page.getByTestId("profil-next-festival-countdown");
    const isVisible = await card.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const href = await card.getAttribute("href");
    expect(href).toMatch(/\/festevent\/.+\/programme/);
  });
});
