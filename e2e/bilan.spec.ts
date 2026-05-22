/**
 * E2E smoke tests for the Bilan de festival page.
 *
 * The bilan tab only appears when the festival end date is in the past.
 * Since test data may have future festivals, we test the route directly.
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

test.describe("Bilan de festival", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("bilan page renders without crashing", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");

    // Page should render — either the bilan content or the empty state
    await expect(page.locator("body")).toBeVisible();

    // Should not show a 404 or redirect to catalogue (would leave /bilan URL)
    expect(page.url()).toContain("/bilan");
  });

  test("bilan page shows 'Ton bilan' heading when data is available", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");

    // Heading should be visible
    const heading = page.getByRole("heading", { name: /ton bilan/i });
    await expect(heading).toBeVisible();
  });

  test("bilan page shows stat cards", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/bilan`);
    await page.waitForLoadState("networkidle");

    // At least one stat should be visible (even if 0 events)
    const eventsVusLabel = page.getByText(/événements vus/i);
    await expect(eventsVusLabel).toBeVisible();
  });
});
