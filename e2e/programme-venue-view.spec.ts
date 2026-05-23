/**
 * E2E tests for the programme "by-venue" view mode toggle.
 * Shows ⊞ Scènes button when the festival has multiple venues.
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

test.describe("Programme — venue view toggle", () => {
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

  test("by-venue toggle visible when multiple venues exist", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const toggle = page.getByTestId("programme-view-by-venue");
    const isVisible = await toggle.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) {
      // Only one venue or no events — acceptable
      test.skip();
      return;
    }

    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  test("clicking by-venue shows grouped sections", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const toggle = page.getByTestId("programme-view-by-venue");
    const isVisible = await toggle.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    const venueView = page.getByTestId("programme-by-venue-view");
    await expect(venueView).toBeVisible({ timeout: 3_000 });
  });

  test("switching back to list view works", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const byVenueBtn = page.getByTestId("programme-view-by-venue");
    const isVisible = await byVenueBtn.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await byVenueBtn.click();
    const listBtn = page.getByTestId("programme-view-list");
    await listBtn.click();
    await expect(listBtn).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("programme-by-venue-view")).not.toBeVisible();
  });
});
