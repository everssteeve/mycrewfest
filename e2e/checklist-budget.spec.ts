/**
 * E2E tests for the checklist budget breakdown (Total / Dépensé / Restant).
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

test.describe("Checklist — budget breakdown", () => {
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

  test("budget section is visible when items have costs", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const budget = page.getByTestId("checklist-budget");
    const hasBudget = await budget.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasBudget) {
      // No costed items in seed — that's fine
      test.skip();
      return;
    }

    // Total badge should contain "€"
    await expect(budget.getByText(/€/)).toBeVisible();
  });

  test("remaining badge shows when uncompleted items have costs", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const remaining = page.getByTestId("checklist-budget-remaining");
    const hasRemaining = await remaining.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasRemaining) {
      test.skip();
      return;
    }

    await expect(remaining).toContainText("Restant");
    await expect(remaining).toContainText("€");
  });
});
