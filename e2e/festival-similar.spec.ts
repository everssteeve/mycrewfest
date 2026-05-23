/**
 * E2E smoke test — similar festivals section on festival detail page.
 *
 * Requires: dev server running + at least 2 festivals seeded.
 */

import { test, expect } from "@playwright/test";

test.describe("Festivals similaires", () => {
  test("festival page may show similar festivals section", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const firstCard = page.locator("article.festival-card").first();
    const hasCard = await firstCard.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!hasCard) {
      test.skip();
      return;
    }

    await firstCard.click();
    await page.waitForLoadState("networkidle");

    // Similar festivals section is optional (may be absent if only 1 festival seeded)
    const hasSimilar = await page
      .locator('[data-testid="similar-festivals"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (hasSimilar) {
      const links = page.locator('[data-testid^="similar-festival-"]');
      const count = await links.count();
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  test("similar festival links navigate to valid pages", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const firstCard = page.locator("article.festival-card").first();
    const hasCard = await firstCard.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasCard) {
      test.skip();
      return;
    }

    await firstCard.click();
    await page.waitForLoadState("networkidle");

    const similarLink = page
      .locator('[data-testid^="similar-festival-"]')
      .first();
    const hasLink = await similarLink.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasLink) {
      test.skip();
      return;
    }

    await similarLink.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/festival\//);
    await expect(page.locator("h1, [data-testid]").first()).toBeVisible();
  });
});
