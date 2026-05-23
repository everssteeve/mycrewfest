import { describe, it, expect } from "vitest";
import { computeFestivalierScore, type FestivalierStats } from "@/lib/festivalier-score";

const s = (
  festEventsCount = 0,
  vuCount = 0,
  souvenirsCount = 0,
  followedFestivalsCount = 0,
): FestivalierStats => ({ festEventsCount, vuCount, souvenirsCount, followedFestivalsCount });

describe("computeFestivalierScore", () => {
  it("returns score 0 and rookie for all-zero stats", () => {
    const result = computeFestivalierScore(s());
    expect(result.score).toBe(0);
    expect(result.rank).toBe("rookie");
  });

  it("computes score: festEvents*10 + vu*1 + souvenirs*2 + followed*3", () => {
    const result = computeFestivalierScore(s(1, 0, 0, 0));
    expect(result.score).toBe(10);

    const result2 = computeFestivalierScore(s(0, 5, 0, 0));
    expect(result2.score).toBe(5);

    const result3 = computeFestivalierScore(s(0, 0, 3, 0));
    expect(result3.score).toBe(6);

    const result4 = computeFestivalierScore(s(0, 0, 0, 4));
    expect(result4.score).toBe(12);
  });

  it("returns rookie for score below 30", () => {
    expect(computeFestivalierScore(s(0, 20, 0, 0)).rank).toBe("rookie");
    expect(computeFestivalierScore(s(2, 5, 0, 0)).rank).toBe("rookie");
  });

  it("returns passionné for score 30–99", () => {
    const result = computeFestivalierScore(s(3, 0, 0, 0)); // 30 pts
    expect(result.rank).toBe("passionné");

    const result2 = computeFestivalierScore(s(9, 9, 0, 0)); // 99 pts
    expect(result2.rank).toBe("passionné");
  });

  it("returns expert for score 100–299", () => {
    const result = computeFestivalierScore(s(10, 0, 0, 0)); // 100 pts
    expect(result.rank).toBe("expert");

    const result2 = computeFestivalierScore(s(20, 50, 25, 5)); // 200+50+50+15 = 315 → légende
    // let me use a 299 case
    const result3 = computeFestivalierScore(s(0, 299, 0, 0)); // 299 pts
    expect(result3.rank).toBe("expert");
  });

  it("returns légende for score >= 300", () => {
    const result = computeFestivalierScore(s(30, 0, 0, 0)); // 300 pts
    expect(result.rank).toBe("légende");

    const result2 = computeFestivalierScore(s(50, 100, 50, 20)); // 500+100+100+60=760 pts
    expect(result2.rank).toBe("légende");
  });

  it("returns nextRankThreshold=30 for rookie", () => {
    const result = computeFestivalierScore(s(0, 10, 0, 0));
    expect(result.nextRankThreshold).toBe(30);
  });

  it("returns nextRankThreshold=100 for passionné", () => {
    const result = computeFestivalierScore(s(3, 0, 0, 0)); // 30 pts
    expect(result.nextRankThreshold).toBe(100);
  });

  it("returns nextRankThreshold=300 for expert", () => {
    const result = computeFestivalierScore(s(10, 0, 0, 0)); // 100 pts
    expect(result.nextRankThreshold).toBe(300);
  });

  it("returns nextRankThreshold=null for légende (top rank)", () => {
    const result = computeFestivalierScore(s(30, 0, 0, 0)); // 300 pts
    expect(result.nextRankThreshold).toBeNull();
  });

  it("has a non-empty label for each rank", () => {
    expect(computeFestivalierScore(s(0)).label.length).toBeGreaterThan(0);
    expect(computeFestivalierScore(s(3)).label.length).toBeGreaterThan(0);
    expect(computeFestivalierScore(s(10)).label.length).toBeGreaterThan(0);
    expect(computeFestivalierScore(s(30)).label.length).toBeGreaterThan(0);
  });
});
