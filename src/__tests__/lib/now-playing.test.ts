import { describe, expect, it } from "vitest";
import { formatMinsUntil } from "@/lib/now-playing";

describe("formatMinsUntil", () => {
  it("returns 'maintenant' for 0 minutes", () => {
    expect(formatMinsUntil(0)).toBe("maintenant");
  });

  it("returns 'maintenant' for negative values", () => {
    expect(formatMinsUntil(-5)).toBe("maintenant");
  });

  it("returns minutes for values under 60", () => {
    expect(formatMinsUntil(1)).toBe("1 min");
    expect(formatMinsUntil(30)).toBe("30 min");
    expect(formatMinsUntil(59)).toBe("59 min");
  });

  it("returns whole hours for exact multiples of 60", () => {
    expect(formatMinsUntil(60)).toBe("1h");
    expect(formatMinsUntil(120)).toBe("2h");
  });

  it("returns hours and minutes for non-exact multiples", () => {
    expect(formatMinsUntil(90)).toBe("1h 30m");
    expect(formatMinsUntil(75)).toBe("1h 15m");
    expect(formatMinsUntil(125)).toBe("2h 5m");
  });
});
