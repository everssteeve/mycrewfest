/**
 * E2E tests for the bottom navigation bar.
 *
 * Verifies:
 * - 5 tabs are rendered with the correct data-testid attributes
 * - "Accueil" tab navigates to /catalogue
 * - "Programme" tab navigates contextually (to /catalogue when outside a fest event)
 * - "Carte" tab navigates contextually (to /catalogue when outside a fest event)
 * - "Crew" tab navigates contextually (to /profil when outside a fest event)
 * - "Profil" tab navigates to /profil
 * - Active tab is highlighted (aria-current="page")
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Bottom navigation bar", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("renders all 5 navigation tabs", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("nav-accueil")).toBeVisible();
    await expect(page.getByTestId("nav-programme")).toBeVisible();
    await expect(page.getByTestId("nav-carte")).toBeVisible();
    await expect(page.getByTestId("nav-crew")).toBeVisible();
    await expect(page.getByTestId("nav-profil")).toBeVisible();
  });

  test("Accueil tab navigates to /catalogue", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("nav-accueil").click();
    await page.waitForURL("/catalogue", { timeout: 5_000 });
    expect(page.url()).toContain("/catalogue");
  });

  test("Accueil tab is active on catalogue page", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    const accueilTab = page.getByTestId("nav-accueil");
    await expect(accueilTab).toHaveAttribute("aria-current", "page");
  });

  test("Programme tab links to /catalogue when outside a fest event", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    const href = await page.getByTestId("nav-programme").getAttribute("href");
    expect(href).toBe("/catalogue");
  });

  test("Carte tab links to /catalogue when outside a fest event", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    const href = await page.getByTestId("nav-carte").getAttribute("href");
    expect(href).toBe("/catalogue");
  });

  test("Crew tab links to /profil when outside a fest event", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    const href = await page.getByTestId("nav-crew").getAttribute("href");
    expect(href).toBe("/profil");
  });

  test("Profil tab navigates to /profil", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("nav-profil").click();
    await page.waitForURL("/profil", { timeout: 5_000 });
    expect(page.url()).toContain("/profil");
  });

  test("Profil tab is active on profil page", async ({ page }) => {
    await page.goto("/profil");
    await page.waitForLoadState("networkidle");
    const profilTab = page.getByTestId("nav-profil");
    await expect(profilTab).toHaveAttribute("aria-current", "page");
  });

  test("Programme tab links contextually inside a fest event", async ({ page }) => {
    // Navigate to a fest event if one exists
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const festLink = page.locator('a[href^="/festevent/"]').first();
    const hasFestEvent = await festLink.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasFestEvent) {
      test.skip();
      return;
    }

    await festLink.click();
    await page.waitForLoadState("networkidle");

    // Extract fest event ID from current URL
    const url = page.url();
    const match = url.match(/\/festevent\/([^/]+)/);
    if (!match) {
      test.skip();
      return;
    }
    const festEventId = match[1];

    const programmeHref = await page.getByTestId("nav-programme").getAttribute("href");
    expect(programmeHref).toBe(`/festevent/${festEventId}/programme`);

    const carteHref = await page.getByTestId("nav-carte").getAttribute("href");
    expect(carteHref).toBe(`/festevent/${festEventId}/carte`);

    const crewHref = await page.getByTestId("nav-crew").getAttribute("href");
    expect(crewHref).toBe(`/festevent/${festEventId}/crew`);
  });

  test("Programme tab is active on programme page", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const festLink = page.locator('a[href^="/festevent/"]').first();
    const hasFestEvent = await festLink.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!hasFestEvent) {
      test.skip();
      return;
    }

    await festLink.click();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("nav-programme").click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("nav-programme")).toHaveAttribute("aria-current", "page");
  });
});
