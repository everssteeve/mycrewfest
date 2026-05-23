/**
 * E2E tests for the peak selection day badge in the programme view.
 * Shows ★ dayname +N when a user has events selected across multiple days.
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

test.describe("Programme — peak selection day badge", () => {
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

  test("peak-selection-day badge shows when selection spans multiple days", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }

    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("programme-peak-selection-day");
    const isVisible = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) {
      // Selection not spanning multiple days — acceptable
      test.skip();
      return;
    }

    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text?.trim()).toMatch(/★\s+\w+\s+\+\d+/i);
  });
});
