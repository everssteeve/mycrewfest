/**
 * Auth fixture for Playwright E2E tests.
 *
 * Extends the base test with an `authenticatedPage` fixture that handles
 * login once and persists the session via storageState for subsequent tests.
 *
 * Usage:
 *   import { test, expect } from '@/e2e/fixtures/auth'
 *   test('my test', async ({ authenticatedPage }) => { ... })
 */

import { test as base, type Page } from "@playwright/test";
import path from "node:path";

// Path for persisted storage state (created once per test run)
const STORAGE_STATE_PATH = path.join(
  __dirname,
  "../.auth/user-storage-state.json",
);

/** Perform a credentials login and return after redirect to /catalogue. */
async function loginWithCredentials(
  page: Page,
  email = "test@mycrewfest.dev",
  password = "password123",
) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Extended test fixture — persists auth via storageState
// ---------------------------------------------------------------------------

export const test = base.extend<{
  /** A page pre-authenticated as the seed test user. */
  authenticatedPage: Page;
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture pattern requires destructuring
  authenticatedPage: async ({}, use) => {
    // Each fixture creates a fresh browser context with the stored session.
    // The global setup (see below) should run loginWithCredentials once and
    // save the state to STORAGE_STATE_PATH before the test suite starts.
    //
    // For standalone use, fall back to a fresh login.
    const { chromium } = await import("@playwright/test");
    const browser = await chromium.launch();
    const context = await browser.newContext({
      storageState: STORAGE_STATE_PATH,
    }).catch(async () => {
      // storageState file not found — login fresh
      const ctx = await browser.newContext();
      const pg = await ctx.newPage();
      pg.on("console", () => {}); // suppress noise
      await loginWithCredentials(pg);
      await ctx.storageState({ path: STORAGE_STATE_PATH });
      return ctx;
    });

    const page = await context.newPage();
    await use(page);
    await context.close();
    await browser.close();
  },
});

export { expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Global setup helper (run from playwright.config.ts globalSetup if needed)
// ---------------------------------------------------------------------------

export async function globalAuthSetup(baseURL: string) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await loginWithCredentials(page);
  await context.storageState({ path: STORAGE_STATE_PATH });

  await context.close();
  await browser.close();
}
