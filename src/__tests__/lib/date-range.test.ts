import { describe, expect, it } from "vitest";
import { getDatesInRange, toYMD } from "@/lib/date-range";

describe("getDatesInRange", () => {
  it("returns a single date when start equals end", () => {
    const result = getDatesInRange("2026-07-10", "2026-07-10");
    expect(result).toHaveLength(1);
    expect(toYMD(result[0])).toBe("2026-07-10");
  });

  it("returns all dates inclusive for a 3-day range", () => {
    const result = getDatesInRange("2026-07-10", "2026-07-12");
    expect(result).toHaveLength(3);
    expect(toYMD(result[0])).toBe("2026-07-10");
    expect(toYMD(result[1])).toBe("2026-07-11");
    expect(toYMD(result[2])).toBe("2026-07-12");
  });

  it("crosses month boundaries correctly", () => {
    const result = getDatesInRange("2026-07-30", "2026-08-01");
    expect(result).toHaveLength(3);
    expect(toYMD(result[0])).toBe("2026-07-30");
    expect(toYMD(result[1])).toBe("2026-07-31");
    expect(toYMD(result[2])).toBe("2026-08-01");
  });

  it("returns empty array when start is after end", () => {
    const result = getDatesInRange("2026-07-15", "2026-07-10");
    expect(result).toHaveLength(0);
  });

  it("handles date strings with trailing time (normalises to local midnight)", () => {
    // Both start and end are noon on their respective dates — unambiguous in any timezone
    const result = getDatesInRange("2026-07-10T12:00:00", "2026-07-12T12:00:00");
    expect(result).toHaveLength(3);
  });
});

describe("toYMD", () => {
  it("formats a date as yyyy-MM-dd", () => {
    expect(toYMD(new Date("2026-07-04"))).toBe("2026-07-04");
    expect(toYMD(new Date("2026-12-31"))).toBe("2026-12-31");
  });

  it("pads single-digit months and days", () => {
    expect(toYMD(new Date("2026-01-09"))).toBe("2026-01-09");
  });
});
