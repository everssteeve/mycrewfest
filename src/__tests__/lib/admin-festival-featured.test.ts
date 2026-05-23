import { describe, expect, it } from "vitest";
import { sortWithFeaturedFirst } from "@/lib/festival-sort";

describe("sortWithFeaturedFirst", () => {
  it("puts featured festivals before regular ones", () => {
    const items = [
      { isFeatured: false, name: "Aurore Festival" },
      { isFeatured: true, name: "Zenith Festival" },
      { isFeatured: false, name: "Beta Festival" },
    ];
    const result = sortWithFeaturedFirst(items);
    expect(result[0].isFeatured).toBe(true);
    expect(result[0].name).toBe("Zenith Festival");
  });

  it("keeps stable order among non-featured (alphabetical by name)", () => {
    const items = [
      { isFeatured: false, name: "Zaza Fest" },
      { isFeatured: false, name: "Aloha Fest" },
      { isFeatured: false, name: "Mirage Fest" },
    ];
    const result = sortWithFeaturedFirst(items);
    expect(result.map((f) => f.name)).toEqual(["Aloha Fest", "Mirage Fest", "Zaza Fest"]);
  });

  it("handles empty array", () => {
    expect(sortWithFeaturedFirst([])).toEqual([]);
  });

  it("keeps stable order among multiple featured (alphabetical)", () => {
    const items = [
      { isFeatured: true, name: "Zest Fest" },
      { isFeatured: true, name: "Apex Fest" },
      { isFeatured: false, name: "Norm Fest" },
    ];
    const result = sortWithFeaturedFirst(items);
    expect(result[0].name).toBe("Apex Fest");
    expect(result[1].name).toBe("Zest Fest");
    expect(result[2].name).toBe("Norm Fest");
  });

  it("does not mutate the original array", () => {
    const items = [
      { isFeatured: false, name: "Beta" },
      { isFeatured: true, name: "Alpha" },
    ];
    const original = [...items];
    sortWithFeaturedFirst(items);
    expect(items).toEqual(original);
  });
});
