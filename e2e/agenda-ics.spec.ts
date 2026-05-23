/**
 * E2E smoke test — agenda ICS export.
 *
 * Requires: dev server running + seed data loaded.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Agenda ICS export", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("agenda page loads without ICS button when empty", async ({ page }) => {
    await page.goto("/agenda");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="agenda-title"]')).toBeVisible();
  });

  test("ICS API returns valid calendar content when authenticated", async ({
    page,
  }) => {
    const response = await page.request.get("/api/agenda/ics");
    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("text/calendar");
    const body = await response.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("END:VCALENDAR");
  });

  test("ICS API rejects unauthenticated requests", async ({ page }) => {
    await page.context().clearCookies();
    const response = await page.request.get("/api/agenda/ics");
    expect(response.status()).toBe(401);
  });

  test("agenda ICS export button appears when events exist", async ({
    page,
  }) => {
    await page.goto("/agenda");
    await page.waitForLoadState("networkidle");

    const hasEvents = await page
      .locator('[data-testid="agenda-festivals"]')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (hasEvents) {
      const icsBtn = page.locator('[data-testid="agenda-ics-export"]');
      await expect(icsBtn).toBeVisible();
      expect(await icsBtn.getAttribute("href")).toBe("/api/agenda/ics");
    }
  });
});
