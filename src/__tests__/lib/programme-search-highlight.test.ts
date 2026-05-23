import { describe, it, expect } from "vitest";
import {
  highlightTerms,
  hasHighlightMatch,
  getHighlightStyle,
} from "@/lib/programme-search-highlight";

describe("highlightTerms", () => {
  it("returns single non-highlighted segment for empty query", () => {
    const result = highlightTerms("Iron Maiden", "");
    expect(result).toEqual([{ text: "Iron Maiden", highlighted: false }]);
  });

  it("returns single non-highlighted segment for whitespace query", () => {
    const result = highlightTerms("Iron Maiden", "  ");
    expect(result).toEqual([{ text: "Iron Maiden", highlighted: false }]);
  });

  it("highlights matching part", () => {
    const result = highlightTerms("Iron Maiden", "Iron");
    expect(result).toEqual([
      { text: "Iron", highlighted: true },
      { text: " Maiden", highlighted: false },
    ]);
  });

  it("is case-insensitive", () => {
    const result = highlightTerms("Iron Maiden", "iron");
    expect(result.find((s) => s.highlighted)?.text).toBe("Iron");
  });

  it("handles match in the middle", () => {
    const result = highlightTerms("AC/DC Live", "DC");
    const highlighted = result.filter((s) => s.highlighted);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].text).toBe("DC");
  });

  it("handles no match — returns single non-highlighted segment", () => {
    const result = highlightTerms("Iron Maiden", "Metallica");
    expect(result).toEqual([{ text: "Iron Maiden", highlighted: false }]);
  });

  it("handles query matching entire text", () => {
    const result = highlightTerms("Tool", "Tool");
    expect(result).toEqual([{ text: "Tool", highlighted: true }]);
  });

  it("does not return empty segments", () => {
    const result = highlightTerms("Tool", "Tool");
    expect(result.every((s) => s.text.length > 0)).toBe(true);
  });

  it("handles regex special characters safely", () => {
    expect(() => highlightTerms("a.b+c", "a.b+c")).not.toThrow();
  });

  it("handles multiple occurrences", () => {
    const result = highlightTerms("the Beatles and the Who", "the");
    const highlighted = result.filter((s) => s.highlighted);
    expect(highlighted).toHaveLength(2);
  });
});

describe("hasHighlightMatch", () => {
  it("returns false for empty query", () => {
    expect(hasHighlightMatch("Iron Maiden", "")).toBe(false);
  });
  it("returns false for whitespace query", () => {
    expect(hasHighlightMatch("Iron Maiden", "   ")).toBe(false);
  });
  it("returns true for matching query", () => {
    expect(hasHighlightMatch("Iron Maiden", "iron")).toBe(true);
  });
  it("returns false for non-matching query", () => {
    expect(hasHighlightMatch("Iron Maiden", "Slayer")).toBe(false);
  });
});

describe("getHighlightStyle", () => {
  it("returns an object with background, color, borderRadius", () => {
    const style = getHighlightStyle();
    expect(style).toHaveProperty("background");
    expect(style).toHaveProperty("color");
    expect(style).toHaveProperty("borderRadius");
  });
  it("uses neon color", () => {
    const style = getHighlightStyle();
    expect(style.color).toContain("primary-neon");
  });
});
