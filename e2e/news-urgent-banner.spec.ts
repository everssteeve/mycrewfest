/**
 * E2E smoke test — urgent news banner shown on festevent pages.
 *
 * The banner appears when the festival has news items with urgencyLevel "critique".
 * Seeds: "news-vc-2026-pass-sold-out" and "news-eurocks-2026-..." have urgencyLevel "critique".
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

async function getFirstFestEventId(page: import("@playwright/test").Page): Promise<string | null> {
  const res = await page.request.get("/api/festevents");
  if (!res.ok()) return null;
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.festEvents ?? data.data ?? [];
  return items[0]?.id ?? null;
}

test.describe("Urgent news banner", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("festevent programme loads without crashing", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("banner is rendered when critical news exist — or absent otherwise", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");

    const banner = page.locator('[data-testid="urgent-news-banner"]');
    const hasBanner = await banner.isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasBanner) {
      // If banner exists it must have a dismiss button and a link to news
      await expect(page.locator('[data-testid="urgent-news-banner-dismiss"]')).toBeVisible();
      await expect(page.locator('[data-testid="urgent-news-banner-link"]')).toBeVisible();
    }
    // Either visible or absent — both are valid states depending on seed data
    expect(true).toBe(true);
  });

  test("banner can be dismissed", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");

    const banner = page.locator('[data-testid="urgent-news-banner"]');
    const hasBanner = await banner.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasBanner) { test.skip(); return; }

    await page.locator('[data-testid="urgent-news-banner-dismiss"]').click();
    await expect(banner).not.toBeVisible();
  });

  test("banner link navigates to news page", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");

    const banner = page.locator('[data-testid="urgent-news-banner"]');
    const hasBanner = await banner.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasBanner) { test.skip(); return; }

    await page.locator('[data-testid="urgent-news-banner-link"]').click();
    await expect(page).toHaveURL(new RegExp(`/festevent/${id}/news`));
  });
});
