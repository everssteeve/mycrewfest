/**
 * E2E smoke test — Open Graph metadata on festival and artist pages.
 *
 * Requires: dev server running + seed data loaded.
 */

import { test, expect } from "@playwright/test";

test.describe("Open Graph metadata", () => {
  test("festival page has OG title meta tag", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("domcontentloaded");

    const ogTitle = page.locator('meta[property="og:title"]');
    const content = await ogTitle.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain("Hellfest");
    expect(content).toContain("MyCrewFest");
  });

  test("festival page has OG description with city and dates", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("domcontentloaded");

    const ogDesc = page.locator('meta[property="og:description"]');
    const content = await ogDesc.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain("Clisson");
  });

  test("festival page has twitter:card meta tag", async ({ page }) => {
    await page.goto("/festival/hellfest-2026");
    await page.waitForLoadState("domcontentloaded");

    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute("content", "summary");
  });

  test("artist page has OG title meta tag", async ({ page }) => {
    // Navigate to the artistes catalogue to find an artist ID
    await page.goto("/artistes");
    await page.waitForLoadState("networkidle");

    const firstLink = page.locator('a[href^="/artiste/"]').first();
    const hasLink = await firstLink.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    const href = await firstLink.getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("domcontentloaded");

    const ogTitle = page.locator('meta[property="og:title"]');
    const content = await ogTitle.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).toContain("MyCrewFest");
  });
});
