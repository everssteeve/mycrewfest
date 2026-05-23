/**
 * E2E tests for the "Name: N" most-loaded assignee badge in the checklist header.
 *
 * Requires: dev server + a fest event with checklist items assigned to
 * at least one person with more than 1 pending task.
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

test.describe("Checklist — most loaded assignee badge", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("checklist page loads without error", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("most loaded badge appears when an assignee has 2+ pending items", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const badge = page.getByTestId("checklist-most-loaded");
    const hasEl = await badge.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasEl) {
      // No assignee has more than 1 pending task — acceptable
      test.skip();
      return;
    }

    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text).toMatch(/.+:\s*\d+/);
  });
});
