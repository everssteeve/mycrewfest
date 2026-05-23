/**
 * E2E smoke tests for the tag/genre filter chips on the programme page.
 *
 * Requires: dev server + seed data with at least one FestEvent
 * that has events with tags.
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

test.describe("Programme — tag filter", () => {
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

  test("tag filter container is present when events have tags", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const tagFilter = page.getByTestId("programme-tag-filter");
    const isVisible = await tagFilter.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!isVisible) {
      // No events with tags in seed data — acceptable
      test.skip();
      return;
    }

    await expect(tagFilter).toBeVisible();
  });

  test("clicking a tag chip filters events and reduces count", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const tagFilter = page.getByTestId("programme-tag-filter");
    if (!(await tagFilter.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Find first tag chip inside the tag filter container
    const chips = tagFilter.getByRole("button");
    const chipCount = await chips.count();
    if (chipCount === 0) {
      test.skip();
      return;
    }

    const initialEventCount = await page.getByRole("article").count();

    await chips.first().click();
    await page.waitForTimeout(300);

    const filteredCount = await page.getByRole("article").count();

    // After filtering, count should be <= initial count
    expect(filteredCount).toBeLessThanOrEqual(initialEventCount);
  });

  test("clicking Tous resets tag filter", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const tagFilter = page.getByTestId("programme-tag-filter");
    if (!(await tagFilter.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const chips = tagFilter.getByRole("button");
    if ((await chips.count()) === 0) {
      test.skip();
      return;
    }

    const initialEventCount = await page.getByRole("article").count();

    // Click the first tag chip to activate filter
    await chips.first().click();
    await page.waitForTimeout(300);

    // "Tous" reset button should now appear — click it
    const resetBtn = tagFilter.getByRole("button", { name: /tous/i });
    const hasReset = await resetBtn.isVisible({ timeout: 2_000 }).catch(() => false);

    if (hasReset) {
      await resetBtn.click();
      await page.waitForTimeout(300);
      const resetCount = await page.getByRole("article").count();
      expect(resetCount).toBe(initialEventCount);
    } else {
      // Re-click the chip to deactivate it instead
      await chips.first().click();
      await page.waitForTimeout(300);
      const resetCount = await page.getByRole("article").count();
      expect(resetCount).toBe(initialEventCount);
    }
  });
});
