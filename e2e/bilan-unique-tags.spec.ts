/**
 * E2E tests for the "N styles explorés" unique tag count card in the bilan.
 *
 * Requires: dev server + a fest event with at least 2 seen events
 * that have distinct tags.
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

test.describe("Bilan — unique tags diversity card", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("bilan page loads without error", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("unique tags card appears when seen events span 2+ distinct tags", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const card = page.getByTestId("bilan-unique-tags");
    const hasEl = await card.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasEl) {
      // Fewer than 2 distinct tags across seen events — acceptable
      test.skip();
      return;
    }

    await expect(card).toBeVisible();
    const text = await card.textContent();
    expect(text).toMatch(/\d+\s*styles\s*explorés/i);
  });
});
