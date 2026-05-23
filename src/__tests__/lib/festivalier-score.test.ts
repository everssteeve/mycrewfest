import { describe, expect, it } from "vitest";
import {
  computeFestivalierScore,
  computeScoreBreakdown,
  type FestivalierStats,
} from "@/lib/festivalier-score";

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

    const _result2 = computeFestivalierScore(s(20, 50, 25, 5)); // 200+50+50+15 = 315 → légende
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

describe("computeScoreBreakdown", () => {
  it("returns zero pts for all-zero stats", () => {
    const b = computeScoreBreakdown(s());
    expect(b.festivals.pts).toBe(0);
    expect(b.vus.pts).toBe(0);
    expect(b.souvenirs.pts).toBe(0);
    expect(b.suivis.pts).toBe(0);
  });

  it("festivals contribute 10 pts each", () => {
    const b = computeScoreBreakdown(s(3, 0, 0, 0));
    expect(b.festivals.count).toBe(3);
    expect(b.festivals.pts).toBe(30);
    expect(b.festivals.multiplier).toBe(10);
  });

  it("vus contribute 1 pt each", () => {
    const b = computeScoreBreakdown(s(0, 7, 0, 0));
    expect(b.vus.count).toBe(7);
    expect(b.vus.pts).toBe(7);
    expect(b.vus.multiplier).toBe(1);
  });

  it("souvenirs contribute 2 pts each", () => {
    const b = computeScoreBreakdown(s(0, 0, 5, 0));
    expect(b.souvenirs.count).toBe(5);
    expect(b.souvenirs.pts).toBe(10);
    expect(b.souvenirs.multiplier).toBe(2);
  });

  it("suivis contribute 3 pts each", () => {
    const b = computeScoreBreakdown(s(0, 0, 0, 4));
    expect(b.suivis.count).toBe(4);
    expect(b.suivis.pts).toBe(12);
    expect(b.suivis.multiplier).toBe(3);
  });

  it("total pts matches computeFestivalierScore", () => {
    const stats = s(2, 10, 3, 5);
    const b = computeScoreBreakdown(stats);
    const total = b.festivals.pts + b.vus.pts + b.souvenirs.pts + b.suivis.pts;
    expect(total).toBe(computeFestivalierScore(stats).score);
  });
});

describe("computeFestivalierScore — rankProgressPercent / currentRankMin", () => {
  it("rookie at score 0: 0% progress toward passionné (30)", () => {
    const r = computeFestivalierScore(s(0, 0, 0, 0));
    expect(r.currentRankMin).toBe(0);
    expect(r.rankProgressPercent).toBe(0);
  });

  it("rookie at score 15: 50% toward passionné (30)", () => {
    const r = computeFestivalierScore(s(0, 15, 0, 0)); // 15 pts
    expect(r.rankProgressPercent).toBe(50);
  });

  it("passionné at exactly 30: 0% toward expert (100)", () => {
    const r = computeFestivalierScore(s(3, 0, 0, 0)); // 30 pts
    expect(r.currentRankMin).toBe(30);
    expect(r.rankProgressPercent).toBe(0);
  });

  it("passionné at 65 pts: 50% toward expert (100)", () => {
    const r = computeFestivalierScore(s(0, 65, 0, 0)); // 65 pts
    expect(r.rankProgressPercent).toBe(50);
  });

  it("légende: 100% progress (top rank, no next threshold)", () => {
    const r = computeFestivalierScore(s(30, 0, 0, 0)); // 300 pts
    expect(r.rankProgressPercent).toBe(100);
    expect(r.currentRankMin).toBe(300);
  });

  it("does not exceed 100%", () => {
    const r = computeFestivalierScore(s(0, 29, 0, 0)); // 29 pts
    expect(r.rankProgressPercent).toBeLessThanOrEqual(100);
    expect(r.rankProgressPercent).toBeGreaterThanOrEqual(0);
  });
});
