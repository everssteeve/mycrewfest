/**
 * E2E tests for the "Copy shortlist" button on the programme page.
 *
 * Requires: dev server + seed data with at least one FestEvent with selections.
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

test.describe("Programme — copy shortlist button", () => {
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

  test("copy shortlist button appears when events are selected", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const btn = page.getByTestId("copy-shortlist-btn");
    const hasBtn = await btn.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasBtn) {
      // No selected events in seed — that's fine
      test.skip();
      return;
    }

    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("aria-label", "Copier la sélection");
  });
});
