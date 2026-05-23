/**
 * E2E tests for the catalogue sort mode toggle.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

test.describe("Catalogue — sort mode toggle", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("sort toggle is visible", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("catalogue-sort-toggle")).toBeVisible();
  });

  test("three sort buttons are rendered", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("catalogue-sort-temporal")).toBeVisible();
    await expect(page.getByTestId("catalogue-sort-alpha")).toBeVisible();
    await expect(page.getByTestId("catalogue-sort-popularity")).toBeVisible();
  });

  test("temporal sort is active by default", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const temporalBtn = page.getByTestId("catalogue-sort-temporal");
    await expect(temporalBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("clicking alpha sort activates it", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const alphaBtn = page.getByTestId("catalogue-sort-alpha");
    await alphaBtn.click();
    await expect(alphaBtn).toHaveAttribute("aria-pressed", "true");
    const temporalBtn = page.getByTestId("catalogue-sort-temporal");
    await expect(temporalBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("clicking popularity sort activates it", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.getByTestId("catalogue-sort-popularity").click();
    await expect(page.getByTestId("catalogue-sort-popularity")).toHaveAttribute("aria-pressed", "true");
  });
});
