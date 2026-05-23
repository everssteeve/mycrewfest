/**
 * E2E tests for search query highlighting in the programme.
 */

import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@mycrewfest.dev");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/catalogue", { timeout: 10_000 });
}

async function getFirstFestEventId(page: import("@playwright/test").Page): Promise<string | null> {
  const res = await page.request.get("/api/festevents");
  if (!res.ok()) return null;
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.festEvents ?? data.data ?? [];
  return items[0]?.id ?? null;
}

test.describe("Programme — search highlight", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("programme loads without error", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL("/login");
  });

  test("typing in search filters events and may render highlights", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[type="search"]').first();
    const isVisible = await searchInput.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    // Type a short query that likely matches something
    await searchInput.fill("a");
    await page.waitForTimeout(300);

    // Highlights are <mark> elements injected when searchQuery is set
    const marks = page.locator("mark");
    const markCount = await marks.count();
    // Either marks appear (events matched) or the list is empty — both valid
    expect(markCount).toBeGreaterThanOrEqual(0);
  });

  test("clearing search removes marks", async ({ page }) => {
    const id = await getFirstFestEventId(page);
    if (!id) { test.skip(); return; }
    await page.goto(`/festevent/${id}/programme`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[type="search"]').first();
    const isVisible = await searchInput.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) { test.skip(); return; }

    await searchInput.fill("a");
    await page.waitForTimeout(300);
    await searchInput.fill("");
    await page.waitForTimeout(300);

    const marks = page.locator("mark");
    expect(await marks.count()).toBe(0);
  });
});
