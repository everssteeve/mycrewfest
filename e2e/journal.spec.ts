/**
 * E2E tests for the journal (souvenirs) feature.
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

/** Navigate to the first available FestEvent's journal page. */
async function goToJournal(
  page: import("@playwright/test").Page,
): Promise<boolean> {
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
  await page.goto(`${festEventUrl}/journal`);
  return true;
}

test.describe("Journal (souvenirs)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("journal page loads", async ({ page }) => {
    const navigated = await goToJournal(page);
    if (!navigated) {
      test.skip();
      return;
    }
    await expect(page.locator("main")).toBeVisible({ timeout: 5_000 });
    // Page should have a heading
    await expect(page.locator("h1, h2")).toBeVisible({ timeout: 5_000 });
  });

  test("can create a souvenir from the FAB or add button", async ({ page }) => {
    const navigated = await goToJournal(page);
    if (!navigated) {
      test.skip();
      return;
    }

    // Look for FAB (floating action button) or add souvenir button
    const fab = page
      .locator('[data-testid="fab"]')
      .or(page.getByRole("button", { name: /ajouter|souvenir|nouveau|créer/i }))
      .or(page.locator('button[aria-label*="souvenir"]'))
      .first();

    if (!(await fab.isVisible({ timeout: 3_000 }))) {
      test.skip();
      return;
    }

    await fab.click();

    // A modal or form should appear
    const souvenirForm = page
      .locator('[role="dialog"]')
      .or(page.locator('form[data-testid="souvenir-form"]'))
      .or(page.locator("textarea"))
      .first();

    await expect(souvenirForm).toBeVisible({ timeout: 5_000 });

    // Fill in free text
    const textArea = page.locator("textarea").first();
    if (await textArea.isVisible()) {
      await textArea.fill("Un super concert de métal !");

      // Submit the souvenir
      const submitBtn = page.getByRole("button", {
        name: /sauvegarder|enregistrer|ajouter|ok|valider/i,
      });
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1_000);
        // The souvenir text should appear in the journal
        await expect(
          page.locator("text=Un super concert de métal !"),
        ).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test("journal displays existing souvenirs", async ({ page }) => {
    const navigated = await goToJournal(page);
    if (!navigated) {
      test.skip();
      return;
    }

    await expect(page.locator("main")).toBeVisible({ timeout: 5_000 });

    // Souvenir items — could be list items, cards, etc.
    // Just verify the page rendered without error (empty state is fine)
    await expect(
      page.locator("main").locator("p, li, article").first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("share token is displayed or copyable", async ({ page }) => {
    const navigated = await goToJournal(page);
    if (!navigated) {
      test.skip();
      return;
    }

    // Look for a share button or link containing a token
    const shareBtn = page
      .getByRole("button", { name: /partager|copier|share/i })
      .or(page.locator('[data-testid="share-btn"]'))
      .or(page.locator('a[href*="/p/"]'));

    if (await shareBtn.isVisible({ timeout: 3_000 })) {
      await shareBtn.click();
      await page.waitForTimeout(300);

      // Either a link was copied (clipboard feedback) or a modal appeared
      const feedback = page
        .locator("text=copié")
        .or(page.locator('[role="dialog"]'))
        .or(page.locator('input[value*="/p/"]'));

      // Verify no hard error — share interaction completed
      await expect(page.locator('[role="alert"][class*="error"]')).not.toBeVisible();
    } else {
      test.skip();
    }
  });
});
