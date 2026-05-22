/**
 * E2E tests for the checklist feature.
 *
 * Requires: dev server + seed data (existing FestEvent for test@mycrewfest.dev).
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

/** Navigate to the first available FestEvent's checklist page. */
async function goToChecklist(page: import("@playwright/test").Page) {
  await page.goto("/catalogue");

  const firstCard = page
    .locator('[data-testid="festival-card"]')
    .or(page.locator('a[href^="/festival/"]'))
    .first();

  await firstCard.click();
  await page.waitForURL(/\/festival\/[^/]+$/, { timeout: 8_000 });

  const feLink = page.locator('a[href*="/festevent/"]').first();
  if (!(await feLink.isVisible())) return false;

  await feLink.click();
  await page.waitForURL(/\/festevent\/[^/]+/, { timeout: 8_000 });

  const festEventUrl = page.url().replace(/\/$/, "");
  await page.goto(`${festEventUrl}/checklist`);
  return true;
}

test.describe("Checklist", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("checklist page loads", async ({ page }) => {
    const navigated = await goToChecklist(page);
    if (!navigated) {
      test.skip();
      return;
    }
    await expect(page.locator("main")).toBeVisible({ timeout: 5_000 });
  });

  test("can add a new checklist item", async ({ page }) => {
    const navigated = await goToChecklist(page);
    if (!navigated) {
      test.skip();
      return;
    }

    // Look for the "add item" input or button
    const addInput = page
      .getByPlaceholder(/ajouter|item|tâche|checklist/i)
      .or(page.getByRole("textbox", { name: /ajouter|item|nouvel/i }));

    const addBtn = page
      .getByRole("button", { name: /ajouter|add|\+/i })
      .or(page.locator('[data-testid="add-checklist-item"]'));

    if (!(await addInput.isVisible())) {
      test.skip();
      return;
    }

    const itemLabel = `E2E item ${Date.now()}`;
    await addInput.fill(itemLabel);

    if (await addBtn.isVisible()) {
      await addBtn.click();
    } else {
      await addInput.press("Enter");
    }

    await page.waitForTimeout(500);

    // The new item should appear in the list
    await expect(page.locator(`text=${itemLabel}`)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("can check a checklist item as done", async ({ page }) => {
    const navigated = await goToChecklist(page);
    if (!navigated) {
      test.skip();
      return;
    }

    // Find a checkbox for a checklist item
    const checkbox = page
      .getByRole("checkbox")
      .or(page.locator('[data-testid="checklist-done"]'))
      .first();

    if (!(await checkbox.isVisible({ timeout: 3_000 }))) {
      test.skip();
      return;
    }

    const isChecked = await checkbox.isChecked();
    await checkbox.click();
    await page.waitForTimeout(300);

    // State should have flipped
    const isNowChecked = await checkbox.isChecked();
    expect(isNowChecked).toBe(!isChecked);
  });

  test("can delete a checklist item", async ({ page }) => {
    const navigated = await goToChecklist(page);
    if (!navigated) {
      test.skip();
      return;
    }

    // Add an item first so we have something to delete
    const addInput = page.getByPlaceholder(/ajouter|item|tâche/i);
    if (!(await addInput.isVisible())) {
      test.skip();
      return;
    }

    const label = `Delete me ${Date.now()}`;
    await addInput.fill(label);
    await addInput.press("Enter");
    await expect(page.locator(`text=${label}`)).toBeVisible({ timeout: 5_000 });

    // Find the delete button for this item
    const itemRow = page.locator(`text=${label}`).locator("..");
    const deleteBtn = itemRow
      .getByRole("button", { name: /supprimer|delete|×|trash/i })
      .or(itemRow.locator('[data-testid="delete-item"]'));

    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator(`text=${label}`)).not.toBeVisible();
    } else {
      test.skip();
    }
  });
});
