export interface FestivalierStats {
  festEventsCount: number;
  vuCount: number;
  souvenirsCount: number;
  followedFestivalsCount: number;
}

export type FestivalierRank = "rookie" | "passionné" | "expert" | "légende";

export interface FestivalierScore {
  score: number;
  rank: FestivalierRank;
  label: string;
  nextRankThreshold: number | null;
  currentRankMin: number;
  rankProgressPercent: number;
}

const RANK_THRESHOLDS: { rank: FestivalierRank; label: string; min: number }[] = [
  { rank: "légende", label: "Légende", min: 300 },
  { rank: "expert", label: "Expert", min: 100 },
  { rank: "passionné", label: "Passionné·e", min: 30 },
  { rank: "rookie", label: "Rookie", min: 0 },
];

export function computeFestivalierScore(stats: FestivalierStats): FestivalierScore {
  const score =
    stats.festEventsCount * 10 +
    stats.vuCount * 1 +
    stats.souvenirsCount * 2 +
    stats.followedFestivalsCount * 3;

  const current = RANK_THRESHOLDS.find((t) => score >= t.min) ?? RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
  const currentIdx = RANK_THRESHOLDS.indexOf(current);
  const next = currentIdx > 0 ? RANK_THRESHOLDS[currentIdx - 1] : null;

  const currentRankMin = current.min;
  const nextMin = next?.min ?? null;
  const rankProgressPercent =
    nextMin !== null && nextMin > currentRankMin
      ? Math.min(100, Math.round(((score - currentRankMin) / (nextMin - currentRankMin)) * 100))
      : 100;

  return {
    score,
    rank: current.rank,
    label: current.label,
    nextRankThreshold: nextMin,
    currentRankMin,
    rankProgressPercent,
  };
}
