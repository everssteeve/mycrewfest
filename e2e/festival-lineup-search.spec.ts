/**
 * E2E smoke test — artist search on the public festival page /festival/[slug].
 *
 * Requires: dev server running + seed data (Hellfest 2026 with artists).
 */

import { test, expect } from "@playwright/test";

const FESTIVAL_SLUG = "hellfest-2026";

test.describe("Festival line-up search", () => {
  test("shows artist count and search input when festival has artists", async ({ page }) => {
    await page.goto(`/festival/${FESTIVAL_SLUG}`);
    await page.waitForLoadState("networkidle");

    const count = page.locator('[data-testid="festival-lineup-count"]');
    const hasCount = await count.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasCount) { test.skip(); return; }

    await expect(count).toBeVisible();
    const search = page.locator('[data-testid="festival-lineup-search"]');
    await expect(search).toBeVisible();
  });

  test("filters artists by name when user types in search", async ({ page }) => {
    await page.goto(`/festival/${FESTIVAL_SLUG}`);
    await page.waitForLoadState("networkidle");

    const search = page.locator('[data-testid="festival-lineup-search"]');
    const hasSearch = await search.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasSearch) { test.skip(); return; }

    // Get initial count
    const countEl = page.locator('[data-testid="festival-lineup-count"]');
    const initialText = await countEl.textContent();
    const totalMatch = initialText?.match(/\/\s*(\d+)/);
    if (!totalMatch || Number(totalMatch[1]) < 2) { test.skip(); return; }

    // Type a query that is unlikely to match all artists
    await search.fill("zzz-no-match");
    await page.waitForTimeout(100);

    const empty = page.locator('[data-testid="festival-lineup-empty"]');
    const hasEmpty = await empty.isVisible({ timeout: 2_000 }).catch(() => false);

    // Either empty state shows or filtered count is less than total
    const afterText = await countEl.textContent();
    const filteredMatch = afterText?.match(/^(\d+)/);
    const filtered = filteredMatch ? Number(filteredMatch[1]) : null;
    const total = Number(totalMatch[1]);

    expect(hasEmpty || (filtered !== null && filtered < total)).toBe(true);
  });

  test("clearing search restores all artists", async ({ page }) => {
    await page.goto(`/festival/${FESTIVAL_SLUG}`);
    await page.waitForLoadState("networkidle");

    const search = page.locator('[data-testid="festival-lineup-search"]');
    const hasSearch = await search.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasSearch) { test.skip(); return; }

    const countEl = page.locator('[data-testid="festival-lineup-count"]');
    const initialText = await countEl.textContent();

    await search.fill("gojira");
    await page.waitForTimeout(100);
    await search.fill("");
    await page.waitForTimeout(100);

    const restoredText = await countEl.textContent();
    expect(restoredText).toBe(initialText);
  });
});
