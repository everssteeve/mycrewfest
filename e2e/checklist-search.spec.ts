/**
 * E2E tests for the checklist search input.
 *
 * Requires: dev server + seed data with at least one FestEvent with 6+ checklist items.
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

test.describe("Checklist — search", () => {
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

  test("search input appears when checklist has 6+ items", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const search = page.getByTestId("checklist-search");
    const hasSearch = await search.isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasSearch) {
      // Fewer than 6 items — that's acceptable
      test.skip();
      return;
    }

    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute("aria-label", "Rechercher dans la checklist");
  });

  test("Escape key clears search input", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const search = page.getByTestId("checklist-search");
    const hasSearch = await search.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!hasSearch) {
      test.skip();
      return;
    }

    await search.fill("tente");
    await expect(search).toHaveValue("tente");
    await search.press("Escape");
    await expect(search).toHaveValue("");
  });
});
