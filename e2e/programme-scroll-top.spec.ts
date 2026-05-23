/**
 * E2E tests for the scroll-to-top FAB on the programme page.
 *
 * Requires: dev server + seed data with at least one FestEvent.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

async function getFirstFestEventId(
  page: import("@playwright/test").Page,
): Promise<string | null> {
  const res = await page.request.get("/api/festevents");
  if (!res.ok()) return null;
  const data: { id: string }[] = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0].id : null;
}

test.describe("Programme — scroll-to-top FAB", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("scroll-to-top button is hidden at the top of the page", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const scrollTopBtn = page.getByTestId("scroll-to-top-btn");
    await expect(scrollTopBtn).not.toBeVisible();
  });

  test("scroll-to-top button appears after scrolling down", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    // Scroll down 400px
    await page.evaluate(() => window.scrollTo({ top: 400 }));
    await page.waitForTimeout(300);

    const scrollTopBtn = page.getByTestId("scroll-to-top-btn");
    await expect(scrollTopBtn).toBeVisible({ timeout: 2_000 });
  });

  test("clicking scroll-to-top scrolls back to top", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    // Scroll down
    await page.evaluate(() => window.scrollTo({ top: 500 }));
    await page.waitForTimeout(300);

    const scrollTopBtn = page.getByTestId("scroll-to-top-btn");
    if (!(await scrollTopBtn.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await scrollTopBtn.click();
    await page.waitForTimeout(500);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(50);
  });
});
