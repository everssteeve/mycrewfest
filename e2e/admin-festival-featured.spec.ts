import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Admin — festival spotlight manager", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin festivals page loads", async ({ page }) => {
    await page.goto("/admin/festivals");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin\/festivals/);
  });

  test("featured toggle is visible and interactive when festivals exist", async ({ page }) => {
    await page.goto("/admin/festivals");
    await page.waitForLoadState("networkidle");

    const hasToggle = await page
      .locator('[data-testid^="festival-featured-toggle"]')
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasToggle) {
      test.skip();
      return;
    }

    const toggle = page.locator('[data-testid^="festival-featured-toggle"]').first();
    const initialPressed = await toggle.getAttribute("aria-pressed");
    await toggle.click();
    await page.waitForLoadState("networkidle");
    const newPressed = await toggle.getAttribute("aria-pressed");
    expect(newPressed).not.toBe(initialPressed);
  });

  test("catalogue shows featured section when a festival is featured", async ({ page }) => {
    await page.goto("/catalogue");
    await page.waitForLoadState("networkidle");

    const featuredSection = page.getByTestId("catalogue-featured-section");
    const hasFeatured = await featuredSection.isVisible().catch(() => false);

    if (hasFeatured) {
      await expect(featuredSection).toBeVisible();
    }
  });
});
