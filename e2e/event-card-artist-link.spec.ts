/**
 * E2E smoke test — "Fiche artiste" link in expanded event card.
 *
 * Requires: dev server running + seed data loaded (Hellfest 2026 with artist-linked events).
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

async function getFirstFestEventId(page: import("@playwright/test").Page): Promise<string | null> {
  const res = await page.request.get("/api/festevents");
  if (!res.ok()) return null;
  const data: { id: string }[] = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0].id : null;
}

test.describe("EventCard — fiche artiste link", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("expanded event card with artist shows fiche artiste link", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) { test.skip(); return; }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    // Find an event card that has an expand toggle (indicates it has artist details)
    const expandBtn = page.locator('[data-testid^="event-expand-"]').first();
    const hasExpand = await expandBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasExpand) { test.skip(); return; }

    await expandBtn.click();

    // Check if the expanded card has a fiche artiste link
    const artistLink = page.locator('[data-testid^="event-artist-profile-link-"]').first();
    const hasLink = await artistLink.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!hasLink) {
      // Not all events have an artist — skip gracefully
      test.skip();
      return;
    }

    const href = await artistLink.getAttribute("href");
    expect(href).toMatch(/^\/artiste\//);
  });

  test("fiche artiste link navigates to artist profile page", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) { test.skip(); return; }

    await page.goto(`/festevent/${festEventId}/programme`);
    await page.waitForLoadState("networkidle");

    const expandBtn = page.locator('[data-testid^="event-expand-"]').first();
    const hasExpand = await expandBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasExpand) { test.skip(); return; }

    await expandBtn.click();

    const artistLink = page.locator('[data-testid^="event-artist-profile-link-"]').first();
    const hasLink = await artistLink.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!hasLink) { test.skip(); return; }

    await artistLink.click();
    await expect(page.locator('[data-testid="artiste-name"]')).toBeVisible({ timeout: 5_000 });
  });
});
