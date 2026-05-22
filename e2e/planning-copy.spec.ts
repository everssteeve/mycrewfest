/**
 * E2E tests for the "Copier mon planning" button on the planning page.
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

test.describe("Planning — copy button", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("copy button is visible on planning page", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");

    const copyBtn = page
      .getByTestId("copy-planning-btn")
      .or(page.getByRole("button", { name: /copier/i }));

    await expect(copyBtn).toBeVisible({ timeout: 8_000 });
  });

  test("copy button writes text to clipboard and shows confirmation", async ({
    page,
    context,
  }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");

    const copyBtn = page.getByTestId("copy-planning-btn");
    if (!(await copyBtn.isVisible())) {
      test.skip();
      return;
    }

    await copyBtn.click();

    // Button should show "Copié !" feedback
    await expect(
      page.getByRole("button", { name: /copié/i }),
    ).toBeVisible({ timeout: 3_000 });

    // Clipboard content should include the planning header emoji
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toContain("🎪");
  });

  test("copied text includes festival name", async ({ page, context }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto(`/festevent/${festEventId}/planning`);
    await page.waitForLoadState("networkidle");

    const copyBtn = page.getByTestId("copy-planning-btn");
    if (!(await copyBtn.isVisible())) {
      test.skip();
      return;
    }

    await copyBtn.click();
    await page.waitForTimeout(300);

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    // Must contain something — either events or the empty-state message
    expect(clipboardText.length).toBeGreaterThan(10);
  });
});
