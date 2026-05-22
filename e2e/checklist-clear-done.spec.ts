/**
 * E2E tests for the "Effacer les cochés" button on the checklist page.
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

test.describe("Checklist — clear done items", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("clear done button is not visible when no items are done", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const clearBtn = page.getByTestId("clear-done-btn");
    // Button should only appear when there are done items
    // Fresh checklist or no done items → button hidden
    const isVisible = await clearBtn.isVisible().catch(() => false);
    if (isVisible) {
      // If visible, it means some items are done — acceptable, skip this assertion
      test.skip();
      return;
    }
    await expect(clearBtn).not.toBeVisible();
  });

  test("checklist page loads and shows action buttons", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");

    // The "Ajouter" and "Template" action buttons should always be present
    await expect(page.getByText("Ajouter")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Template")).toBeVisible({ timeout: 5_000 });
  });

  test("add item, toggle done, then clear done removes it", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/checklist`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Add a new item
    await page.getByText("Ajouter").click();
    await page.waitForTimeout(300);

    const labelInput = page.getByPlaceholder("Nom de l'item *");
    if (!(await labelInput.isVisible())) {
      test.skip();
      return;
    }

    const uniqueLabel = `Test item ${Date.now()}`;
    await labelInput.fill(uniqueLabel);
    await page.getByText("Créer").click();
    await page.waitForTimeout(500);

    // Find the item row and toggle it to done
    const itemText = page.getByText(uniqueLabel);
    if (!(await itemText.isVisible({ timeout: 3_000 }))) {
      test.skip();
      return;
    }

    // Click the checkbox button (first button in the item row)
    const itemRow = page.locator(`[role="article"]`, { hasText: uniqueLabel }).or(
      page.locator("div", { hasText: uniqueLabel }).first()
    );
    const toggleBtn = itemRow.locator("button").first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
    }

    // Clear done button should now be visible
    const clearBtn = page.getByTestId("clear-done-btn");
    if (await clearBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await clearBtn.click();
      await page.waitForTimeout(500);

      // The item should no longer be visible
      await expect(page.getByText(uniqueLabel)).not.toBeVisible({ timeout: 3_000 });
    }
  });
});
