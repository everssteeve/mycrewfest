import { describe, expect, it } from "vitest";
import {
  buildLeaderboard,
  filterTopN,
  getUserPosition,
  RANK_COLORS,
  RANK_LABELS,
  resolveDisplayName,
} from "@/lib/leaderboard";

const BASE_USER = {
  id: "u1",
  name: "Alice",
  pseudo: null,
  festEventsCount: 0,
  followedFestivalsCount: 0,
  souvenirsCount: 0,
};

describe("resolveDisplayName", () => {
  it("prefers pseudo over name", () => {
    expect(resolveDisplayName("crew_alice", "Alice")).toBe("crew_alice");
  });

  it("falls back to name when no pseudo", () => {
    expect(resolveDisplayName(null, "Alice")).toBe("Alice");
  });

  it("falls back to Festivalier when both null", () => {
    expect(resolveDisplayName(null, null)).toBe("Festivalier");
  });
});

describe("buildLeaderboard", () => {
  it("sorts by score descending", () => {
    const users = [
      { ...BASE_USER, id: "u1", festEventsCount: 1 }, // score 10
      { ...BASE_USER, id: "u2", festEventsCount: 5 }, // score 50
      { ...BASE_USER, id: "u3", festEventsCount: 3 }, // score 30
    ];
    const result = buildLeaderboard(users, {});
    expect(result[0].userId).toBe("u2");
    expect(result[1].userId).toBe("u3");
    expect(result[2].userId).toBe("u1");
  });

  it("uses vuCountByUser for score computation", () => {
    const users = [
      { ...BASE_USER, id: "u1", festEventsCount: 0 },
      { ...BASE_USER, id: "u2", festEventsCount: 0 },
    ];
    const result = buildLeaderboard(users, { u1: 10, u2: 5 });
    expect(result[0].userId).toBe("u1");
    expect(result[0].vuCount).toBe(10);
    expect(result[1].vuCount).toBe(5);
  });

  it("defaults vuCount to 0 when not in map", () => {
    const users = [{ ...BASE_USER, id: "u1" }];
    const result = buildLeaderboard(users, {});
    expect(result[0].vuCount).toBe(0);
  });

  it("assigns rank correctly for high scorers", () => {
    const users = [
      {
        ...BASE_USER,
        id: "u1",
        festEventsCount: 30, // 300 pts → légende
        followedFestivalsCount: 0,
        souvenirsCount: 0,
      },
    ];
    const result = buildLeaderboard(users, {});
    expect(result[0].rank).toBe("légende");
    expect(result[0].score).toBe(300);
  });

  it("breaks ties alphabetically by displayName", () => {
    const users = [
      { ...BASE_USER, id: "u1", name: "Zara", pseudo: null, festEventsCount: 1 },
      { ...BASE_USER, id: "u2", name: "Alice", pseudo: null, festEventsCount: 1 },
    ];
    const result = buildLeaderboard(users, {});
    expect(result[0].displayName).toBe("Alice");
    expect(result[1].displayName).toBe("Zara");
  });

  it("returns empty array for empty input", () => {
    expect(buildLeaderboard([], {})).toEqual([]);
  });
});

describe("getUserPosition", () => {
  it("returns 1-indexed position", () => {
    const entries = buildLeaderboard(
      [
        { ...BASE_USER, id: "u1", festEventsCount: 5 },
        { ...BASE_USER, id: "u2", festEventsCount: 2 },
      ],
      {},
    );
    expect(getUserPosition(entries, "u1")).toBe(1);
    expect(getUserPosition(entries, "u2")).toBe(2);
  });

  it("returns -1 when user not found", () => {
    const entries = buildLeaderboard([{ ...BASE_USER, id: "u1" }], {});
    expect(getUserPosition(entries, "unknown")).toBe(-1);
  });
});

describe("filterTopN", () => {
  it("returns at most N entries", () => {
    const entries = buildLeaderboard(
      Array.from({ length: 10 }, (_, i) => ({ ...BASE_USER, id: `u${i}` })),
      {},
    );
    expect(filterTopN(entries, 3)).toHaveLength(3);
  });

  it("returns all when N > length", () => {
    const entries = buildLeaderboard([BASE_USER], {});
    expect(filterTopN(entries, 100)).toHaveLength(1);
  });
});

describe("RANK_COLORS and RANK_LABELS", () => {
  it("covers all 4 ranks", () => {
    const ranks = ["légende", "expert", "passionné", "rookie"] as const;
    for (const rank of ranks) {
      expect(RANK_COLORS[rank]).toBeTruthy();
      expect(RANK_LABELS[rank]).toBeTruthy();
    }
  });
});
