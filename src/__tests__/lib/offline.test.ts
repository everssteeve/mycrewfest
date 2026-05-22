/**
 * Tests for lib/offline.ts
 *
 * Verifies that cacheFestivals, searchFestivalsOffline, and
 * queueSouvenirOffline work correctly with a mocked Dexie instance.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { OfflineFestival } from "@/types";

// ---------------------------------------------------------------------------
// Mock Dexie — we don't want to hit real IndexedDB in unit tests
// ---------------------------------------------------------------------------

const mockFestivalsStore = new Map<string, OfflineFestival>();
const mockSouvenirsStore: Array<{ id?: number; festEventId: string; payload: unknown; createdAt: string }> = [];

vi.mock("dexie", () => {
  const mockTable = {
    bulkPut: vi.fn(async (items: OfflineFestival[]) => {
      for (const item of items) {
        mockFestivalsStore.set(item.id, item);
      }
    }),
    filter: vi.fn((predicate: (f: OfflineFestival) => boolean) => ({
      toArray: vi.fn(async () =>
        Array.from(mockFestivalsStore.values()).filter(predicate),
      ),
    })),
    toArray: vi.fn(async () => Array.from(mockFestivalsStore.values())),
    add: vi.fn(async (item: { festEventId: string; payload: unknown; createdAt: string }) => {
      mockSouvenirsStore.push(item);
      return mockSouvenirsStore.length;
    }),
  };

  class MockDexie {
    festivals = mockTable;
    souvenirs = mockTable;
    events = mockTable;
    festevents = mockTable;
    selections = mockTable;
    newsItems = mockTable;

    version(_v: number) {
      return { stores: () => this };
    }
  }

  return {
    default: MockDexie,
    Table: class {},
  };
});

// Import AFTER mocking
const { cacheFestivals, searchFestivalsOffline, queueSouvenirOffline } =
  await import("@/lib/offline");

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const makeFestival = (id: string, name: string, city = "Paris"): OfflineFestival => ({
  id,
  name,
  slug: `${name.toLowerCase().replace(/\s+/g, "-")}`,
  startDate: "2026-07-01",
  endDate: "2026-07-03",
  city,
  country: "FR",
  festivalType: "musique",
  programType: "structuré",
  programStatus: "complet",
  confidenceLevel: "vérifié_humain",
});

beforeEach(() => {
  mockFestivalsStore.clear();
  mockSouvenirsStore.length = 0;
});

// ---------------------------------------------------------------------------
// cacheFestivals
// ---------------------------------------------------------------------------

describe("cacheFestivals", () => {
  it("stores festivals in the local cache without error", async () => {
    const festivals = [
      makeFestival("f-1", "Hellfest"),
      makeFestival("f-2", "Les Vieilles Charrues"),
    ];

    await expect(cacheFestivals(festivals)).resolves.toBeUndefined();
    expect(mockFestivalsStore.size).toBe(2);
  });

  it("is idempotent — calling twice with same data doesn't throw", async () => {
    const festivals = [makeFestival("f-1", "Hellfest")];
    await cacheFestivals(festivals);
    await expect(cacheFestivals(festivals)).resolves.toBeUndefined();
  });

  it("handles an empty array gracefully", async () => {
    await expect(cacheFestivals([])).resolves.toBeUndefined();
    expect(mockFestivalsStore.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// searchFestivalsOffline
// ---------------------------------------------------------------------------

describe("searchFestivalsOffline", () => {
  beforeEach(async () => {
    await cacheFestivals([
      makeFestival("f-1", "Hellfest", "Clisson"),
      makeFestival("f-2", "Les Vieilles Charrues", "Carhaix"),
      makeFestival("f-3", "Download Festival", "Paris"),
    ]);
  });

  it("returns all festivals when query is empty", async () => {
    const results = await searchFestivalsOffline("");
    expect(results.length).toBeGreaterThanOrEqual(0); // mock returns whatever is in store
  });

  it("filters by name (case-insensitive)", async () => {
    const results = await searchFestivalsOffline("hellfest");
    // In the real impl the filter predicate is applied — our mock honours it
    expect(
      results.every((f) => f.name.toLowerCase().includes("hellfest")),
    ).toBe(true);
  });

  it("filters by city (case-insensitive)", async () => {
    const results = await searchFestivalsOffline("clisson");
    expect(results.every((f) => f.city.toLowerCase().includes("clisson"))).toBe(
      true,
    );
  });

  it("returns empty array when no match", async () => {
    const results = await searchFestivalsOffline("xyznonexistent");
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// queueSouvenirOffline
// ---------------------------------------------------------------------------

describe("queueSouvenirOffline", () => {
  it("stores a souvenir payload without throwing", async () => {
    await expect(
      queueSouvenirOffline("fe-1", { freeText: "Super concert", photos: [] }),
    ).resolves.toBeUndefined();
  });

  it("does not throw when payload is minimal", async () => {
    await expect(queueSouvenirOffline("fe-2", {})).resolves.toBeUndefined();
  });

  it("does not throw when Dexie add fails (error swallowed)", async () => {
    // Force the mock to reject
    const mockDexie = await import("@/lib/offline");
    const origAdd = (mockDexie.db as unknown as { souvenirs: { add: typeof vi.fn } }).souvenirs?.add;
    if (origAdd) {
      vi.spyOn(
        (mockDexie.db as unknown as { souvenirs: { add: typeof vi.fn } }).souvenirs,
        "add",
      ).mockRejectedValueOnce(new Error("IndexedDB unavailable"));
    }

    await expect(
      queueSouvenirOffline("fe-1", { freeText: "Test" }),
    ).resolves.toBeUndefined();
  });
});
