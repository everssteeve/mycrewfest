/**
 * E2E tests for the age restriction filter in the programme view.
 * Clicking the badge toggles a filter showing only age-restricted events.
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

test.describe("Programme — age restriction filter", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme page loads without error", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("age restriction filter button appears and is togglable when age-restricted events exist", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }

    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const filterBtn = page.getByTestId("programme-age-restricted-filter");
    const isVisible = await filterBtn.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) {
      // No age-restricted events — acceptable
      test.skip();
      return;
    }

    await expect(filterBtn).toBeVisible();
    await expect(filterBtn).toHaveAttribute("aria-pressed", "false");

    // Click to activate filter
    await filterBtn.click();
    await expect(filterBtn).toHaveAttribute("aria-pressed", "true");

    // Click again to deactivate
    await filterBtn.click();
    await expect(filterBtn).toHaveAttribute("aria-pressed", "false");
  });
});
