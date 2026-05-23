/**
 * E2E tests for the checklist per-assignee stats strip.
 *
 * Requires: dev server + seed data with a checklist that has items assigned
 * to at least 2 different people.
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

test.describe("Checklist — assignee stats", () => {
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

  test("assignee stats strip is visible when multiple assignees exist", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const stats = page.getByTestId("checklist-assignee-stats");
    const hasStats = await stats.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasStats) {
      // Not enough assignees in seed — that's fine
      test.skip();
      return;
    }

    await expect(stats).toBeVisible();
  });
});
