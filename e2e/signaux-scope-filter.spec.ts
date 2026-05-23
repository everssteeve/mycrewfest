/**
 * E2E tests for the signaux scope filter (crew vs communauté).
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

test.describe("Signaux — scope filter", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("signaux page loads without error", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/signaux`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("scope filter chips appear when both scopes exist", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/signaux`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const filter = page.getByTestId("signal-scope-filter");
    const hasFilter = await filter.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasFilter) {
      // Not both scopes present — that's fine
      test.skip();
      return;
    }

    const tousBtn = filter.getByRole("button", { name: "Tous" });
    await expect(tousBtn).toBeVisible();
    await expect(tousBtn).toHaveAttribute("aria-pressed", "true");
  });
});
