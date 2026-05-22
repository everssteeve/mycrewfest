/**
 * E2E tests for the "Copier la liste" button on the checklist page.
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

test.describe("Checklist — copy button", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("copy button is visible on checklist page", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");

    const copyBtn = page.getByTestId("copy-checklist-btn");
    await expect(copyBtn).toBeVisible({ timeout: 5_000 });
  });

  test("copy button changes aria-label after click", async ({ page, context }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");

    const copyBtn = page.getByTestId("copy-checklist-btn");
    if (!(await copyBtn.isVisible())) {
      test.skip();
      return;
    }

    await copyBtn.click();
    await expect(copyBtn).toHaveAttribute("aria-label", "Liste copiée", { timeout: 2_000 });
  });

  test("copy button reverts after 2s", async ({ page, context }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");

    const copyBtn = page.getByTestId("copy-checklist-btn");
    if (!(await copyBtn.isVisible())) {
      test.skip();
      return;
    }

    await copyBtn.click();
    await expect(copyBtn).toHaveAttribute("aria-label", "Liste copiée", { timeout: 2_000 });

    await page.waitForTimeout(2_200);
    await expect(copyBtn).toHaveAttribute("aria-label", "Copier la liste");
  });
});
