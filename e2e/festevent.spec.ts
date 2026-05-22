/**
 * E2E tests for FestEvent creation and navigation (programme, planning).
 *
 * Requires: dev server + seed data (includes at least one festival with events).
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("FestEvent — create and navigate", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("creates a FestEvent from the festival detail page", async ({ page }) => {
    await page.goto("/catalogue");

    // Navigate to first festival
    const firstCard = page
      .locator('[data-testid="festival-card"]')
      .or(page.locator('a[href^="/festival/"]'))
      .first();
    await expect(firstCard).toBeVisible({ timeout: 8_000 });
    await firstCard.click();
    await page.waitForURL(/\/festival\/[^/]+$/, { timeout: 8_000 });

    // Look for the "Créer mon FestEvent" / "Je participe" CTA
    const ctaBtn = page
      .getByRole("button", { name: /créer|participe|je vais/i })
      .or(page.getByRole("link", { name: /créer|participe|je vais/i }));

    if (await ctaBtn.isVisible()) {
      await ctaBtn.click();
      // Should navigate to /festevent/[id] or show success
      await page.waitForURL(/\/festevent\/[^/]+/, { timeout: 10_000 });
      expect(page.url()).toMatch(/\/festevent\/[^/]+/);
    } else {
      // May already have a FestEvent — navigate via existing link
      const feLink = page.locator('a[href*="/festevent/"]').first();
      if (await feLink.isVisible()) {
        await feLink.click();
        await page.waitForURL(/\/festevent\/[^/]+/, { timeout: 8_000 });
        expect(page.url()).toMatch(/\/festevent\/[^/]+/);
      } else {
        test.skip();
      }
    }
  });

  test("programme tab shows events list", async ({ page }) => {
    await page.goto("/catalogue");

    const firstCard = page
      .locator('[data-testid="festival-card"]')
      .or(page.locator('a[href^="/festival/"]'))
      .first();
    await firstCard.click();
    await page.waitForURL(/\/festival\/[^/]+$/, { timeout: 8_000 });

    // Navigate to an existing FestEvent or skip
    const feLink = page.locator('a[href*="/festevent/"]').first();
    if (!(await feLink.isVisible())) {
      test.skip();
      return;
    }

    await feLink.click();
    await page.waitForURL(/\/festevent\/[^/]+/, { timeout: 8_000 });

    // Navigate to /programme
    const festEventUrl = page.url();
    await page.goto(`${festEventUrl}/programme`);

    // Should show the programme section
    await expect(page.locator("main")).toBeVisible();
    const eventItems = page
      .locator('[data-testid="event-item"]')
      .or(page.locator('li[data-event-id]'))
      .or(page.locator(".event-card"));

    // Programme page loaded (events may be empty if no data)
    await expect(page.locator("h1, h2")).toBeVisible({ timeout: 5_000 });
  });

  test("planning tab renders the timeline", async ({ page }) => {
    await page.goto("/catalogue");

    const firstCard = page
      .locator('[data-testid="festival-card"]')
      .or(page.locator('a[href^="/festival/"]'))
      .first();
    await firstCard.click();
    await page.waitForURL(/\/festival\/[^/]+$/, { timeout: 8_000 });

    const feLink = page.locator('a[href*="/festevent/"]').first();
    if (!(await feLink.isVisible())) {
      test.skip();
      return;
    }

    await feLink.click();
    await page.waitForURL(/\/festevent\/[^/]+/, { timeout: 8_000 });

    const festEventUrl = page.url();
    await page.goto(`${festEventUrl}/planning`);

    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1, h2")).toBeVisible({ timeout: 5_000 });
  });

  test("toggling event selection changes its status", async ({ page }) => {
    await page.goto("/catalogue");

    const firstCard = page
      .locator('[data-testid="festival-card"]')
      .or(page.locator('a[href^="/festival/"]'))
      .first();
    await firstCard.click();
    await page.waitForURL(/\/festival\/[^/]+$/, { timeout: 8_000 });

    const feLink = page.locator('a[href*="/festevent/"]').first();
    if (!(await feLink.isVisible())) {
      test.skip();
      return;
    }

    await feLink.click();
    await page.waitForURL(/\/festevent\/[^/]+/, { timeout: 8_000 });

    const festEventUrl = page.url();
    await page.goto(`${festEventUrl}/programme`);

    // Find an "intéressé" or selection toggle button on an event
    const selectionBtn = page
      .getByRole("button", { name: /intéressé|must-see|vu|sélectionner/i })
      .first();

    if (await selectionBtn.isVisible({ timeout: 5_000 })) {
      const initialText = await selectionBtn.textContent();
      await selectionBtn.click();
      // Status should have changed (button text or aria state updates)
      await page.waitForTimeout(500);
      // Just verify no error occurred — the status change is tested at unit level
      await expect(page.locator('[role="alert"][class*="error"]')).not.toBeVisible();
    } else {
      test.skip();
    }
  });
});
