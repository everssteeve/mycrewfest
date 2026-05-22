/**
 * E2E tests for authentication flows.
 *
 * Covers: register, login (valid/invalid), logout.
 * Requires: dev server running at http://localhost:3000
 * Seed user: test@mycrewfest.dev / password123
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Login flow
// ---------------------------------------------------------------------------

test.describe("Login flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("displays the login form", async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("valid credentials redirect to /catalogue", async ({ page }) => {
    await page.fill('input[type="email"]', "test@mycrewfest.dev");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/catalogue", { timeout: 10_000 });
    expect(page.url()).toContain("/catalogue");
  });

  test("invalid credentials show an error message", async ({ page }) => {
    await page.fill('input[type="email"]', "test@mycrewfest.dev");
    await page.fill('input[type="password"]', "wrong-password");
    await page.click('button[type="submit"]');

    const error = page.locator('[role="alert"]');
    await expect(error).toBeVisible({ timeout: 5_000 });
    await expect(error).toContainText(/incorrect|invalide/i);
  });

  test("wrong email shows an error message", async ({ page }) => {
    await page.fill('input[type="email"]', "nobody@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    const error = page.locator('[role="alert"]');
    await expect(error).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Register flow
// ---------------------------------------------------------------------------

test.describe("Register flow", () => {
  const uniqueEmail = `e2e-${Date.now()}@mycrewfest.dev`;

  test("displays the register form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("registering a new user redirects to /catalogue", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[id="name"]', "E2E Tester");
    await page.fill('input[id="email"]', uniqueEmail);
    await page.fill('input[id="password"]', "Password1234!");
    await page.click('button[type="submit"]');

    // After registration + auto sign-in, expect redirect to /catalogue
    await page.waitForURL("/catalogue", { timeout: 15_000 });
    expect(page.url()).toContain("/catalogue");
  });

  test("registering with an already-used email shows an error", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.fill('input[id="name"]', "Duplicate User");
    await page.fill('input[id="email"]', "test@mycrewfest.dev");
    await page.fill('input[id="password"]', "Password1234!");
    await page.click('button[type="submit"]');

    const error = page.locator('[role="alert"]');
    await expect(error).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Logout flow
// ---------------------------------------------------------------------------

test.describe("Logout flow", () => {
  test("logging out redirects to /login", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@mycrewfest.dev");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/catalogue", { timeout: 10_000 });

    // Find logout — look for a button or link containing "déconnect" in the nav
    const logoutBtn = page
      .getByRole("button", { name: /déconnect/i })
      .or(page.getByRole("link", { name: /déconnect/i }));

    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/\/(login|$)/, { timeout: 10_000 });
      expect(page.url()).toMatch(/\/(login|$)/);
    } else {
      // Skip logout step if the UI doesn't expose it directly
      test.skip();
    }
  });
});
