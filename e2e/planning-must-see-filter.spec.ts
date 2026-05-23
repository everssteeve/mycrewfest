/**
 * E2E tests for the "Must-see only" filter toggle in the planning view.
 *
 * Requires: dev server + seed data with at least one FestEvent.
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

test.describe("Planning — must-see only filter", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("planning page loads successfully", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("must-see filter toggle is visible", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const toggle = page.getByTestId("planning-must-see-filter");
    await expect(toggle).toBeVisible({ timeout: 3_000 });
  });

  test("must-see filter toggle changes aria-pressed state", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const toggle = page.getByTestId("planning-must-see-filter");
    if (!(await toggle.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Initially not pressed
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
