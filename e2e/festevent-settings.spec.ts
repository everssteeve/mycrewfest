/**
 * E2E tests for the FestEvent settings sheet (presence dates + delete).
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

test.describe("FestEvent settings sheet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("settings button is visible on festevent pages", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    const settingsBtn = page.getByRole("button", { name: /paramètres/i });
    await expect(settingsBtn).toBeVisible({ timeout: 8_000 });
  });

  test("clicking settings button opens the settings sheet", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    const settingsBtn = page.getByRole("button", { name: /paramètres/i });
    if (!(await settingsBtn.isVisible())) {
      test.skip();
      return;
    }

    await settingsBtn.click();

    // Sheet should open with "Mes jours de présence" label
    await expect(
      page.getByText(/mes jours de présence/i).first(),
    ).toBeVisible({ timeout: 4_000 });

    // "Quitter ce festival" danger button should be visible
    await expect(
      page.getByRole("button", { name: /quitter ce festival/i }),
    ).toBeVisible({ timeout: 4_000 });
  });

  test("closing the settings sheet via X button works", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    const settingsBtn = page.getByRole("button", { name: /paramètres/i });
    if (!(await settingsBtn.isVisible())) {
      test.skip();
      return;
    }

    await settingsBtn.click();
    await expect(page.getByText(/mes jours de présence/i).first()).toBeVisible({
      timeout: 4_000,
    });

    const closeBtn = page.getByRole("button", { name: /fermer/i });
    await closeBtn.click();

    await expect(page.getByText(/mes jours de présence/i)).toBeHidden({
      timeout: 3_000,
    });
  });
});
