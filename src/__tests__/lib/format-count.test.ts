import { describe, it, expect } from "vitest";
import { formatCount, formatFestivalStats } from "@/lib/format-count";

describe("formatCount", () => {
  it("displays numbers below 1 000 as-is", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1)).toBe("1");
    expect(formatCount(999)).toBe("999");
  });

  it("formats thousands with 'k' suffix", () => {
    expect(formatCount(1_000)).toBe("1k");
    expect(formatCount(1_500)).toBe("1.5k");
    expect(formatCount(9_999)).toBe("10k"); // rounds up
    expect(formatCount(10_000)).toBe("10k");
    expect(formatCount(50_000)).toBe("50k");
    expect(formatCount(999_999)).toBe("999k");
  });

  it("omits '.0' for whole thousands", () => {
    expect(formatCount(2_000)).toBe("2k");
    expect(formatCount(5_000)).toBe("5k");
  });

  it("formats millions with 'M' suffix", () => {
    expect(formatCount(1_000_000)).toBe("1M");
    expect(formatCount(1_500_000)).toBe("1.5M");
    expect(formatCount(2_000_000)).toBe("2M");
  });
});

describe("formatFestivalStats", () => {
  it("includes plural for multiple events and followers", () => {
    const s = formatFestivalStats({ events: 200, followers: 1_234 });
    expect(s).toContain("événements");
    expect(s).toContain("abonnés");
    expect(s).toContain("·");
  });

  it("uses singular for exactly 1 event or follower", () => {
    expect(formatFestivalStats({ events: 1, followers: 0 })).toBe(
      "1 événement"
    );
    expect(formatFestivalStats({ events: 0, followers: 1 })).toBe(
      "1 abonné"
    );
  });

  it("omits events section when events count is 0", () => {
    const s = formatFestivalStats({ events: 0, followers: 500 });
    expect(s).not.toContain("événement");
    expect(s).toContain("abonnés");
  });

  it("omits followers section when followers count is 0", () => {
    const s = formatFestivalStats({ events: 42, followers: 0 });
    expect(s).toContain("événements");
    expect(s).not.toContain("abonné");
  });

  it("returns empty string when both counts are 0", () => {
    expect(formatFestivalStats({ events: 0, followers: 0 })).toBe("");
  });

  it("applies k formatting for large counts", () => {
    const s = formatFestivalStats({ events: 2_000, followers: 15_000 });
    expect(s).toContain("2k événements");
    expect(s).toContain("15k abonnés");
  });
});
