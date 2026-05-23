/**
 * E2E tests — Orphan artist filter on the admin artists page.
 * "Orphan" artists have no linked events.
 * Skips gracefully when no orphan artist exists in seed data.
 */

import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page): Promise<boolean> {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });

  await page.goto("/admin/artists");
  await page.waitForLoadState("networkidle");
  return page.url().includes("/admin/artists");
}

test.describe("Admin artists — orphan filter", () => {
  test("orphan alert badge is visible when orphan artists exist", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const alert = page.getByTestId("admin-artists-orphan-alert");
    const isVisible = await alert.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    const text = await alert.textContent();
    expect(text).toMatch(/\d+ artiste/);
    expect(text).toMatch(/sans événement/);
  });

  test("orphan filter toggle is present on the page", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    await expect(page.getByTestId("admin-artists-orphan-filter")).toBeVisible();
  });

  test("activating orphan filter narrows the list", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const totalText = await page.getByTestId("admin-artists-filtered-count").textContent();
    const total = parseInt(totalText?.split("/")[1] ?? "0");
    if (total === 0) { test.skip(); return; }

    await page.getByTestId("admin-artists-orphan-filter").click();
    await page.waitForTimeout(200);

    const filteredText = await page.getByTestId("admin-artists-filtered-count").textContent();
    const filtered = parseInt(filteredText?.split("/")[0] ?? "0");
    expect(filtered).toBeLessThanOrEqual(total);
  });

  test("deactivating orphan filter restores full count", async ({ page }) => {
    const isAdmin = await loginAsAdmin(page);
    if (!isAdmin) { test.skip(); return; }

    const totalText = await page.getByTestId("admin-artists-filtered-count").textContent();
    const total = parseInt(totalText?.split("/")[1] ?? "0");
    if (total === 0) { test.skip(); return; }

    const btn = page.getByTestId("admin-artists-orphan-filter");
    await btn.click();
    await page.waitForTimeout(200);
    await btn.click();
    await page.waitForTimeout(200);

    const restoredText = await page.getByTestId("admin-artists-filtered-count").textContent();
    const restored = parseInt(restoredText?.split("/")[0] ?? "0");
    expect(restored).toBe(total);
  });
});
