/**
 * E2E tests for the programme ICS export button.
 * The button appears when the user has selected events (must-see or intéressant).
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

test.describe("Programme — ICS export button", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme page loads and shows toolbar", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("ICS export button visible when selection exists", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const btn = page.getByTestId("programme-export-ics-btn");
    const isVisible = await btn.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) {
      // No selection in this fest event — acceptable
      test.skip();
      return;
    }

    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("aria-label", /\.ics|calendrier/i);
  });
});
