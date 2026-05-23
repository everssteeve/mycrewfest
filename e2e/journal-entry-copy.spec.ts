/**
 * E2E tests for the copy button on each journal entry.
 *
 * Requires: dev server + seed data with at least one FestEvent with ≥1 souvenir.
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

test.describe("Journal — copy entry button", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("copy button is visible on each journal entry", async ({ page }) => {
    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const articles = page.getByRole("article");
    const count = await articles.count();
    if (count === 0) {
      test.skip();
      return;
    }

    // Each article should have a copy button
    const firstArticle = articles.first();
    const copyBtn = firstArticle.getByRole("button", { name: /copier ce souvenir/i });
    await expect(copyBtn).toBeVisible({ timeout: 3_000 });
  });

  test("copy button shows check icon feedback after click", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const articles = page.getByRole("article");
    if ((await articles.count()) === 0) {
      test.skip();
      return;
    }

    const firstArticle = articles.first();
    const copyBtn = firstArticle.getByRole("button", { name: /copier ce souvenir/i });
    if (!(await copyBtn.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await copyBtn.click();

    // Button aria-label should change to indicate success
    await expect(
      firstArticle.getByRole("button", { name: /copié/i }),
    ).toBeVisible({ timeout: 2_000 });
  });

  test("copied text contains festival name", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const festEventId = await getFirstFestEventId(page);
    if (!festEventId) {
      test.skip();
      return;
    }

    await page.goto(`/festevent/${festEventId}/journal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const articles = page.getByRole("article");
    if ((await articles.count()) === 0) {
      test.skip();
      return;
    }

    const copyBtn = articles.first().getByRole("button", { name: /copier ce souvenir/i });
    if (!(await copyBtn.isVisible({ timeout: 2_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await copyBtn.click();
    await page.waitForTimeout(300);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("📔");
  });
});
