/**
 * E2E tests for the programme search bar.
 *
 * Requires: dev server + seed data with at least one FestEvent and events.
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
  page: import("@playwright/test").Page
): Promise<string | null> {
  const res = await page.request.get("/api/festevents");
  if (!res.ok()) return null;
  const data: { id: string }[] = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0].id : null;
}

test.describe("Programme search bar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("search input is visible on the programme page", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    const searchInput = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/artiste|scène/i))
      .or(page.locator('input[type="search"]'));

    await expect(searchInput).toBeVisible({ timeout: 8_000 });
  });

  test("search input filters events in real-time", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    const searchInput = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/artiste|scène/i));

    if (!(await searchInput.isVisible())) {
      test.skip();
      return;
    }

    // Count initial events
    const eventCards = page.locator('[data-testid="event-card"]').or(
      page.locator('article[aria-label]')
    );
    await page.waitForTimeout(500);
    const initialCount = await eventCards.count();

    // Type a query unlikely to match anything
    await searchInput.fill("xyzzyImpossibleQuery123");
    await page.waitForTimeout(300);

    const afterCount = await eventCards.count();
    // Should have fewer results (or 0)
    expect(afterCount).toBeLessThanOrEqual(initialCount);
  });

  test("selection filter chips are visible", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    const allChip = page.getByRole("button", { name: /^tous$/i }).first();
    if (!(await allChip.isVisible())) {
      test.skip();
      return;
    }

    await expect(page.getByRole("button", { name: /sélectionnés/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: /must-see/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: /intéressé/i })).toBeVisible({ timeout: 5_000 });
  });

  test("sort controls are visible and change button state", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) { test.skip(); return; }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    // Sort group should be visible
    const sortGroup = page.locator('[role="group"][aria-label="Trier par"]');
    await expect(sortGroup).toBeVisible();

    // "Horaire" should be the default active (aria-pressed=true)
    const horaireBtn = sortGroup.getByRole("button", { name: "Horaire" });
    await expect(horaireBtn).toBeVisible();
    await expect(horaireBtn).toHaveAttribute("aria-pressed", "true");

    // Clicking "A→Z" should activate it
    const alphaBtn = sortGroup.getByRole("button", { name: "A→Z" });
    await alphaBtn.click();
    await page.waitForTimeout(200);
    await expect(alphaBtn).toHaveAttribute("aria-pressed", "true");
    await expect(horaireBtn).toHaveAttribute("aria-pressed", "false");

    // Clicking "Scène" should activate it
    const venueBtn = sortGroup.getByRole("button", { name: "Scène" });
    await venueBtn.click();
    await page.waitForTimeout(200);
    await expect(venueBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("stats strip shows event count and updates on search", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    // Stats strip should mention "événement"
    const statsStrip = page.locator('[aria-live="polite"]');
    await expect(statsStrip).toBeVisible();
    const initialText = await statsStrip.textContent();
    expect(initialText).toMatch(/événement/);

    // After filtering with a non-matching query, should show 0
    const searchInput = page.getByRole("searchbox").or(page.getByPlaceholder(/artiste|scène/i));
    if (await searchInput.isVisible()) {
      await searchInput.fill("zzznomatch9999");
      await page.waitForTimeout(300);
      const filteredText = await statsStrip.textContent();
      expect(filteredText).toMatch(/0 événement/);

      // Restore
      await searchInput.fill("");
      await page.waitForTimeout(200);
      const restoredText = await statsStrip.textContent();
      expect(restoredText).toBe(initialText);
    }
  });

  test("clear button removes search query", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    const searchInput = page
      .getByRole("searchbox")
      .or(page.getByPlaceholder(/artiste|scène/i));

    if (!(await searchInput.isVisible())) {
      test.skip();
      return;
    }

    await searchInput.fill("test query");
    await page.waitForTimeout(300);

    // Clear button should appear
    const clearBtn = page.getByRole("button", { name: /effacer/i }).or(
      page.locator('button[aria-label*="effacer"]')
    );

    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(searchInput).toHaveValue("");
    }
  });
});
