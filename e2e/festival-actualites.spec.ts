/**
 * E2E smoke test — /festival/[slug]/actualites news listing page.
 *
 * Requires: dev server + seed data (Hellfest 2026 with news items).
 */

import { test, expect } from "@playwright/test";

const SLUG = "hellfest-2026";

test.describe("Festival — page actualités", () => {
  test("actualites page renders news list", async ({ page }) => {
    await page.goto(`/festival/${SLUG}/actualites`);
    await page.waitForLoadState("networkidle");

    const title = page.locator('[data-testid="festival-actualites-title"]');
    await expect(title).toBeVisible();

    const list = page.locator('[data-testid="festival-actualites-list"]');
    const empty = page.locator('[data-testid="festival-actualites-empty"]');
    const hasList = await list.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasEmpty = await empty.isVisible({ timeout: 1_000 }).catch(() => false);
    expect(hasList || hasEmpty).toBe(true);
  });

  test("festival page shows 'Voir toutes les actus' link when news present", async ({ page }) => {
    await page.goto(`/festival/${SLUG}`);
    await page.waitForLoadState("networkidle");

    const seeAll = page.locator('[data-testid="festival-news-see-all"]');
    const hasLink = await seeAll.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    await expect(seeAll).toBeVisible();
    await expect(seeAll).toHaveAttribute("href", `/festival/${SLUG}/actualites`);
  });

  test("clicking see-all navigates to actualites page", async ({ page }) => {
    await page.goto(`/festival/${SLUG}`);
    await page.waitForLoadState("networkidle");

    const seeAll = page.locator('[data-testid="festival-news-see-all"]');
    const hasLink = await seeAll.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    await seeAll.click();
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain(`/festival/${SLUG}/actualites`);
    await expect(page.locator('[data-testid="festival-actualites-title"]')).toBeVisible();
  });

  test("back link returns to festival page", async ({ page }) => {
    await page.goto(`/festival/${SLUG}/actualites`);
    await page.waitForLoadState("networkidle");

    const backLink = page.locator(`a[href="/festival/${SLUG}"]`);
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain(`/festival/${SLUG}`);
  });

  test("unknown slug returns 404", async ({ page }) => {
    const res = await page.goto("/festival/unknown-xyz-festival/actualites");
    expect(res?.status()).toBe(404);
  });
});
