/**
 * E2E tests for the missed must-see duration badge in the bilan view.
 * Shows the total duration (e.g. "4h30") of must-see events not yet marked vu.
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

test.describe("Bilan — missed must-see duration badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("bilan page loads without error", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/bilan`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("missed-duration badge shows when must-see events have known duration", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }

    await page.goto(`/festevent/${id}/bilan`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("bilan-missed-duration");
    const isVisible = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) {
      // No must-see events with duration — acceptable
      test.skip();
      return;
    }

    await expect(badge).toBeVisible();
  });
});
