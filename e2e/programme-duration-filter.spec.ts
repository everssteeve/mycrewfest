/**
 * E2E tests for the programme duration filter.
 *
 * Requires: dev server + seed data with programme events.
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

test.describe("Programme — duration filter", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme page loads without error", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("duration filter chips are visible and toggle correctly", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Check chips exist
    const courtBtn = page.getByTestId("duration-filter-court");
    const normalBtn = page.getByTestId("duration-filter-normal");
    const longBtn = page.getByTestId("duration-filter-long");

    await expect(courtBtn).toBeVisible();
    await expect(normalBtn).toBeVisible();
    await expect(longBtn).toBeVisible();

    // Toggle "court" on and off
    await courtBtn.click();
    await expect(courtBtn).toHaveAttribute("aria-pressed", "true");
    await courtBtn.click();
    await expect(courtBtn).toHaveAttribute("aria-pressed", "false");
  });
});
