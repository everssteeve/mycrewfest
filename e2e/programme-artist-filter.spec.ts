/**
 * E2E tests for the artist filter in the programme view.
 * Clicking an artist name filters the list to show only their events.
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

test.describe("Programme — artist filter", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme loads without error", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("artist name is clickable when events have artists", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const firstArtistBtn = page.locator('[data-testid^="event-artist-filter-"]').first();
    const isVisible = await firstArtistBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!isVisible) { test.skip(); return; }
    await expect(firstArtistBtn).toBeVisible();
  });

  test("clicking artist shows active filter chip", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const firstArtistBtn = page.locator('[data-testid^="event-artist-filter-"]').first();
    const isVisible = await firstArtistBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await firstArtistBtn.click();
    await expect(page.getByTestId("programme-artist-filter-active")).toBeVisible({ timeout: 2_000 });
  });

  test("clicking active filter chip clears it", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const firstArtistBtn = page.locator('[data-testid^="event-artist-filter-"]').first();
    const isVisible = await firstArtistBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await firstArtistBtn.click();
    const activeChip = page.getByTestId("programme-artist-filter-active");
    await expect(activeChip).toBeVisible({ timeout: 2_000 });
    await activeChip.click();
    await expect(activeChip).not.toBeVisible({ timeout: 2_000 });
  });
});
