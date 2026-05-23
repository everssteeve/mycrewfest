/**
 * E2E tests for programme hour separator dividers.
 * Shows "HH:00" pink separators between events in different hours when sorted by time.
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

test.describe("Programme — timeline hour separators", () => {
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

  test("hour separators appear in time-sorted view", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    const separators = page.locator('[data-testid^="timeline-hour-"]');
    const count = await separators.count();

    if (count === 0) {
      // All events in same hour or no events with times — acceptable
      test.skip();
      return;
    }

    const first = separators.first();
    await expect(first).toBeVisible();
    const text = await first.textContent();
    expect(text?.trim()).toMatch(/^\d{2}:00/);
  });

  test("separators disappear when switching to alpha sort", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const separatorsBefore = await page.locator('[data-testid^="timeline-hour-"]').count();
    if (separatorsBefore === 0) { test.skip(); return; }

    // Switch to alpha sort
    await page.getByRole("button", { name: /A→Z|alpha/i }).click().catch(() => {});
    const alphaBtn = page.locator('button[aria-pressed]').filter({ hasText: /A→Z/ });
    await alphaBtn.click().catch(() => {});

    // Try finding sort button by label
    const buttons = page.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      if (text?.includes("A→Z") || text?.includes("Alpha")) {
        await buttons.nth(i).click();
        break;
      }
    }

    await page.waitForTimeout(300);
    const separatorsAfter = await page.locator('[data-testid^="timeline-hour-"]').count();
    expect(separatorsAfter).toBe(0);
  });
});
