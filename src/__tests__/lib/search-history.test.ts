import { describe, it, expect, beforeEach } from "vitest";
import {
  addToSearchHistory,
  removeFromSearchHistory,
  loadSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
} from "@/lib/search-history";

// localStorage is available in vitest/jsdom environment
beforeEach(() => {
  localStorage.clear();
});

describe("addToSearchHistory", () => {
  it("adds a new query to the front", () => {
    const result = addToSearchHistory("hellfest", []);
    expect(result[0]).toBe("hellfest");
  });

  it("deduplicates: moves existing query to front", () => {
    const result = addToSearchHistory("hellfest", ["solidays", "hellfest"]);
    expect(result[0]).toBe("hellfest");
    expect(result.filter((q) => q === "hellfest")).toHaveLength(1);
  });

  it("trims whitespace before adding", () => {
    const result = addToSearchHistory("  hell  ", []);
    expect(result[0]).toBe("hell");
  });

  it("does not add query shorter than 2 chars", () => {
    expect(addToSearchHistory("h", ["solidays"])).toHaveLength(1);
    expect(addToSearchHistory("", ["solidays"])).toHaveLength(1);
  });

  it("caps at 5 entries", () => {
    const existing = ["a1", "a2", "a3", "a4", "a5"];
    const result = addToSearchHistory("new", existing);
    expect(result).toHaveLength(5);
    expect(result[0]).toBe("new");
    expect(result).not.toContain("a5");
  });

  it("does not mutate the input array", () => {
    const existing = ["solidays"];
    addToSearchHistory("hellfest", existing);
    expect(existing).toHaveLength(1);
  });

  it("accepts query of exactly 2 chars", () => {
    const result = addToSearchHistory("ok", []);
    expect(result[0]).toBe("ok");
  });
});

describe("removeFromSearchHistory", () => {
  it("removes the specified query", () => {
    const result = removeFromSearchHistory("hellfest", ["hellfest", "solidays"]);
    expect(result).not.toContain("hellfest");
    expect(result).toContain("solidays");
  });

  it("returns unchanged array if query not found", () => {
    const result = removeFromSearchHistory("unknown", ["hellfest"]);
    expect(result).toEqual(["hellfest"]);
  });

  it("handles empty array", () => {
    expect(removeFromSearchHistory("hellfest", [])).toHaveLength(0);
  });

  it("does not mutate input", () => {
    const input = ["hellfest", "solidays"];
    removeFromSearchHistory("hellfest", input);
    expect(input).toHaveLength(2);
  });
});

describe("saveSearchHistory + loadSearchHistory", () => {
  it("saves and loads history correctly", () => {
    saveSearchHistory(["hellfest", "solidays"]);
    expect(loadSearchHistory()).toEqual(["hellfest", "solidays"]);
  });

  it("returns empty array when nothing is saved", () => {
    expect(loadSearchHistory()).toHaveLength(0);
  });

  it("returns empty array for invalid stored value", () => {
    localStorage.setItem("mycrewfest:search-history", "not-json{{{");
    expect(loadSearchHistory()).toHaveLength(0);
  });

  it("returns empty array if stored value is not an array", () => {
    localStorage.setItem("mycrewfest:search-history", JSON.stringify({ a: 1 }));
    expect(loadSearchHistory()).toHaveLength(0);
  });

  it("filters out non-string entries", () => {
    localStorage.setItem("mycrewfest:search-history", JSON.stringify(["ok", 42, null]));
    const result = loadSearchHistory();
    expect(result).toEqual(["ok"]);
  });
});

describe("clearSearchHistory", () => {
  it("clears stored history and returns empty array", () => {
    saveSearchHistory(["hellfest"]);
    const result = clearSearchHistory();
    expect(result).toHaveLength(0);
    expect(loadSearchHistory()).toHaveLength(0);
  });

  it("handles clear when nothing is stored", () => {
    expect(clearSearchHistory()).toHaveLength(0);
  });
});
