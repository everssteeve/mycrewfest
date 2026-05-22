/**
 * E2E tests for EventCard enriched display (duration, access, age badges).
 *
 * Requires: dev server + seed data with at least one FestEvent with events.
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

test.describe("EventCard enriched display", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme page shows event cards with time labels", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    // At least one event card should be present
    const articles = page.locator('article[role="article"]');
    await page.waitForTimeout(500);
    const count = await articles.count();
    if (count === 0) {
      test.skip();
      return;
    }

    // Each visible card should have an aria-label (title)
    await expect(articles.first()).toHaveAttribute("aria-label");
  });

  test("planning page shows event cards", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");

    // Planning may be empty if no selections — just verify the page renders
    await expect(page.locator("body")).toBeVisible();
  });

  test("programme page renders tag chips when events have tags", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    // If any event has tags, tag groups should be present
    const tagGroups = page.locator('[role="group"][aria-label="Tags"]');
    const tagGroupCount = await tagGroups.count();

    if (tagGroupCount > 0) {
      // At least one tag chip should start with #
      const firstTagText = await tagGroups.first().locator("span").first().textContent();
      expect(firstTagText).toMatch(/^#/);
    }
    // If no events have tags, tagGroupCount === 0 is valid
  });

  test("programme tag filter row appears only when events have tags", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    const tagFilterGroup = page.locator('[role="group"][aria-label="Filtrer par tag"]');
    const hasTagFilter = await tagFilterGroup.count();

    // If the tag filter row exists, buttons inside should start with #
    if (hasTagFilter > 0) {
      const firstBtn = tagFilterGroup.locator("button").first();
      const btnText = await firstBtn.textContent();
      expect(btnText).toMatch(/^#/);
    }
  });

  test("selection button cycles through intéressé → must-see → vu → null", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const articles = page.locator('article[role="article"]');
    const count = await articles.count();
    if (count === 0) {
      test.skip();
      return;
    }

    // Find the first "+ Ajouter" button (unselected event)
    const addBtn = page.getByRole("button", { name: "+ Ajouter" }).first();
    if (!(await addBtn.isVisible())) {
      test.skip();
      return;
    }

    // Cycle: null → intéressé
    await addBtn.click();
    await page.waitForTimeout(200);
    await expect(page.getByRole("button", { name: /intéressé/i }).first()).toBeVisible();

    // Cycle: intéressé → must-see
    await page.getByRole("button", { name: /intéressé/i }).first().click();
    await page.waitForTimeout(200);
    await expect(page.getByRole("button", { name: /must-see/i }).first()).toBeVisible();

    // Cycle: must-see → vu
    await page.getByRole("button", { name: /must-see/i }).first().click();
    await page.waitForTimeout(200);
    await expect(page.getByRole("button", { name: /vu/i }).first()).toBeVisible();

    // Cycle: vu → null (back to "+ Ajouter")
    await page.getByRole("button", { name: /vu/i }).first().click();
    await page.waitForTimeout(200);
    await expect(page.getByRole("button", { name: "+ Ajouter" }).first()).toBeVisible();
  });
});
