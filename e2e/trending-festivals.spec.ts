/**
 * E2E smoke tests — Trending festivals widget on catalogue.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Trending Festivals", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("API /api/festivals/trending returns valid response", async ({ page }) => {
    const response = await page.request.get("/api/festivals/trending");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      const first = body.data[0];
      expect(first).toHaveProperty("name");
      expect(first).toHaveProperty("slug");
      expect(first).toHaveProperty("followerCount");
    }
  });

  test("API respects limit param", async ({ page }) => {
    const response = await page.request.get("/api/festivals/trending?limit=1");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.length).toBeLessThanOrEqual(1);
  });

  test("trending section visible or absent on catalogue (skip if no data)", async ({ page }) => {
    const apiRes = await page.request.get("/api/festivals/trending");
    const { data } = await apiRes.json();
    if (data.length === 0) { test.skip(); return; }

    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    const section = page.locator('[data-testid="trending-festivals-section"]');
    await expect(section).toBeVisible({ timeout: 5_000 });
  });

  test("each trending result links to festival page", async ({ page }) => {
    const apiRes = await page.request.get("/api/festivals/trending");
    const { data } = await apiRes.json();
    if (data.length === 0) { test.skip(); return; }

    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    const firstSlug = data[0].slug;
    const card = page.locator(`[data-testid="trending-festival-${firstSlug}"]`);
    await expect(card).toBeVisible({ timeout: 5_000 });
    await expect(card).toHaveAttribute("href", `/festival/${firstSlug}`);
  });
});
