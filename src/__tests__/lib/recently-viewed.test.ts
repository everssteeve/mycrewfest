import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadRecentlyViewed,
  addToRecentlyViewed,
  saveRecentlyViewed,
  clearRecentlyViewed,
} from "@/lib/recently-viewed";

const ENTRY_A = { slug: "hellfest-2026", name: "Hellfest", city: "Clisson" };
const ENTRY_B = { slug: "garorock-2026", name: "Garorock", city: "Marmande" };
const ENTRY_C = { slug: "rock-en-seine-2026", name: "Rock en Seine", city: "Paris" };
const ENTRY_D = { slug: "vieilles-charrues-2026", name: "Vieilles Charrues", city: "Carhaix" };
const ENTRY_E = { slug: "eurockéennes-2026", name: "Les Eurockéennes", city: "Belfort" };
const ENTRY_F = { slug: "download-2026", name: "Download Festival", city: "Paris" };

describe("addToRecentlyViewed", () => {
  it("adds a new entry at the start", () => {
    const result = addToRecentlyViewed(ENTRY_A, []);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("hellfest-2026");
    expect(result[0].viewedAt).toBeDefined();
  });

  it("deduplicates by slug — moves existing entry to front", () => {
    const existing = addToRecentlyViewed(ENTRY_A, []);
    const result = addToRecentlyViewed(ENTRY_A, [
      ...existing,
      { ...ENTRY_B, viewedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("hellfest-2026");
    expect(result[1].slug).toBe("garorock-2026");
  });

  it("caps at 5 entries", () => {
    let list = addToRecentlyViewed(ENTRY_A, []);
    list = addToRecentlyViewed(ENTRY_B, list);
    list = addToRecentlyViewed(ENTRY_C, list);
    list = addToRecentlyViewed(ENTRY_D, list);
    list = addToRecentlyViewed(ENTRY_E, list);
    list = addToRecentlyViewed(ENTRY_F, list);
    expect(list).toHaveLength(5);
    expect(list[0].slug).toBe("download-2026");
  });

  it("sets a fresh viewedAt ISO string on each call", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00.000Z"));
    const first = addToRecentlyViewed(ENTRY_A, []);
    vi.setSystemTime(new Date("2026-01-01T11:00:00.000Z"));
    const second = addToRecentlyViewed(ENTRY_A, first);
    expect(second[0].viewedAt).toBe("2026-01-01T11:00:00.000Z");
    vi.useRealTimers();
  });

  it("does not mutate the current array", () => {
    const current = [{ ...ENTRY_A, viewedAt: "2026-01-01T00:00:00.000Z" }];
    const snapshot = [...current];
    addToRecentlyViewed(ENTRY_B, current);
    expect(current).toEqual(snapshot);
  });
});

describe("loadRecentlyViewed", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => { store[k] = v; },
          removeItem: (k: string) => { delete store[k]; },
          clear: () => { store = {}; },
        };
      })(),
    });
  });

  it("returns [] when nothing stored", () => {
    expect(loadRecentlyViewed()).toEqual([]);
  });

  it("returns [] for malformed JSON", () => {
    window.localStorage.setItem("mycrewfest:recently-viewed", "{invalid}");
    expect(loadRecentlyViewed()).toEqual([]);
  });

  it("returns [] when stored value is not an array", () => {
    window.localStorage.setItem("mycrewfest:recently-viewed", JSON.stringify({ slug: "x" }));
    expect(loadRecentlyViewed()).toEqual([]);
  });

  it("filters out entries missing slug or name", () => {
    const raw = [
      { slug: "hellfest-2026", name: "Hellfest", city: "Clisson", viewedAt: "2026-01-01T00:00:00.000Z" },
      { name: "No Slug", city: "X", viewedAt: "2026-01-01T00:00:00.000Z" },
      { slug: "no-name", city: "X", viewedAt: "2026-01-01T00:00:00.000Z" },
    ];
    window.localStorage.setItem("mycrewfest:recently-viewed", JSON.stringify(raw));
    const result = loadRecentlyViewed();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("hellfest-2026");
  });

  it("round-trips through save and load", () => {
    const entries = [{ ...ENTRY_A, viewedAt: "2026-01-01T00:00:00.000Z" }];
    saveRecentlyViewed(entries);
    expect(loadRecentlyViewed()).toEqual(entries);
  });
});

describe("clearRecentlyViewed", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => { store[k] = v; },
          removeItem: (k: string) => { delete store[k]; },
          clear: () => { store = {}; },
        };
      })(),
    });
  });

  it("returns []", () => {
    expect(clearRecentlyViewed()).toEqual([]);
  });

  it("removes stored entries", () => {
    saveRecentlyViewed([{ ...ENTRY_A, viewedAt: "2026-01-01T00:00:00.000Z" }]);
    clearRecentlyViewed();
    expect(loadRecentlyViewed()).toEqual([]);
  });
});
