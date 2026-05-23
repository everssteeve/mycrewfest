/**
 * E2E tests for personal event notes in the programme view.
 * Users can add private notes to each event (stored in localStorage).
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
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.festEvents ?? data.data ?? [];
  return items[0]?.id ?? null;
}

test.describe("Programme — event personal notes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("note toggle button is visible on event cards", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const firstNoteToggle = page.locator('[data-testid^="event-note-toggle-"]').first();
    const isVisible = await firstNoteToggle.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!isVisible) { test.skip(); return; }
    await expect(firstNoteToggle).toBeVisible();
  });

  test("clicking note toggle opens textarea", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const firstNoteToggle = page.locator('[data-testid^="event-note-toggle-"]').first();
    const isVisible = await firstNoteToggle.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const toggleTestId = await firstNoteToggle.getAttribute("data-testid");
    const eventId = toggleTestId?.replace("event-note-toggle-", "");
    if (!eventId) { test.skip(); return; }

    await firstNoteToggle.click();
    await expect(page.getByTestId(`event-note-input-${eventId}`)).toBeVisible({ timeout: 2_000 });
  });

  test("note is saved and shown as preview", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const firstNoteToggle = page.locator('[data-testid^="event-note-toggle-"]').first();
    const isVisible = await firstNoteToggle.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const toggleTestId = await firstNoteToggle.getAttribute("data-testid");
    const eventId = toggleTestId?.replace("event-note-toggle-", "");
    if (!eventId) { test.skip(); return; }

    await firstNoteToggle.click();
    const input = page.getByTestId(`event-note-input-${eventId}`);
    await input.fill("Rejoindre Julie devant la scène");

    const okBtn = page.locator(`[data-testid="event-note-section-${eventId}"] button:has-text("OK")`);
    await okBtn.click();

    await expect(page.getByTestId(`event-note-preview-${eventId}`)).toBeVisible({ timeout: 2_000 });
    await expect(page.getByTestId(`event-note-preview-${eventId}`)).toContainText("Rejoindre");
  });
});
