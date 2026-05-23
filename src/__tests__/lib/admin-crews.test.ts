import { describe, expect, it } from "vitest";
import {
  type AdminCrewRow,
  computeCrewStats,
  getCrewSizeTier,
  getCrewSizeTierColor,
  resolveCrewDisplayName,
  sortCrewsBySize,
} from "@/lib/admin-crews";

const makeCrew = (
  id: string,
  name: string | null,
  memberCount: number,
  festEventCount = 0,
  createdAt = new Date("2025-01-01"),
): AdminCrewRow => ({ id, name, inviteCode: `inv-${id}`, memberCount, festEventCount, createdAt });

describe("resolveCrewDisplayName", () => {
  it("returns name when present", () => {
    expect(resolveCrewDisplayName("Les Nomades", "abc123")).toBe("Les Nomades");
  });
  it("falls back to Crew #<id> when name is null", () => {
    expect(resolveCrewDisplayName(null, "abc123xyz")).toBe("Crew #abc123");
  });
  it("falls back when name is empty string", () => {
    expect(resolveCrewDisplayName("   ", "def456")).toBe("Crew #def456");
  });
});

describe("getCrewSizeTier", () => {
  it("Solo for 1 member", () => expect(getCrewSizeTier(1)).toBe("Solo"));
  it("Petit for 2–4 members", () => {
    expect(getCrewSizeTier(2)).toBe("Petit");
    expect(getCrewSizeTier(4)).toBe("Petit");
  });
  it("Moyen for 5–9 members", () => {
    expect(getCrewSizeTier(5)).toBe("Moyen");
    expect(getCrewSizeTier(9)).toBe("Moyen");
  });
  it("Grand for 10+ members", () => {
    expect(getCrewSizeTier(10)).toBe("Grand");
    expect(getCrewSizeTier(50)).toBe("Grand");
  });
  it("Solo for 0 members", () => expect(getCrewSizeTier(0)).toBe("Solo"));
});

describe("getCrewSizeTierColor", () => {
  it("returns distinct colors for each tier", () => {
    const colors = ["Grand", "Moyen", "Petit", "Solo"].map(getCrewSizeTierColor);
    const unique = new Set(colors);
    expect(unique.size).toBe(4);
  });
});

describe("sortCrewsBySize", () => {
  it("sorts by memberCount descending", () => {
    const crews = [makeCrew("a", "A", 2), makeCrew("b", "B", 10), makeCrew("c", "C", 5)];
    const sorted = sortCrewsBySize(crews);
    expect(sorted.map((c) => c.id)).toEqual(["b", "c", "a"]);
  });
  it("breaks ties by createdAt descending", () => {
    const crews = [
      makeCrew("a", "A", 5, 0, new Date("2025-01-01")),
      makeCrew("b", "B", 5, 0, new Date("2025-06-01")),
    ];
    const sorted = sortCrewsBySize(crews);
    expect(sorted[0].id).toBe("b");
  });
  it("does not mutate input", () => {
    const crews = [makeCrew("a", null, 3), makeCrew("b", null, 1)];
    const original = [...crews];
    sortCrewsBySize(crews);
    expect(crews).toEqual(original);
  });
});

describe("computeCrewStats", () => {
  it("computes total, totalMembers, avgSize, withFestEvent", () => {
    const crews = [makeCrew("a", "A", 4, 2), makeCrew("b", "B", 6, 0), makeCrew("c", "C", 2, 1)];
    const stats = computeCrewStats(crews);
    expect(stats.total).toBe(3);
    expect(stats.totalMembers).toBe(12);
    expect(stats.avgSize).toBe(4);
    expect(stats.withFestEvent).toBe(2);
  });

  it("returns zeros for empty array", () => {
    const stats = computeCrewStats([]);
    expect(stats.total).toBe(0);
    expect(stats.totalMembers).toBe(0);
    expect(stats.avgSize).toBe(0);
    expect(stats.withFestEvent).toBe(0);
  });
});
