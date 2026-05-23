export interface TrendingInput {
  followerCount: number;
  recentNewsCount: number;
  startDate: string;
}

const PROXIMITY_MULTIPLIER = (daysUntil: number): number => {
  if (daysUntil <= 0) return 0; // past/ongoing — exclude from trending
  if (daysUntil <= 14) return 3.0; // this fortnight — very hot
  if (daysUntil <= 30) return 2.0; // this month — hot
  if (daysUntil <= 60) return 1.5; // 2 months out — warming up
  return 1.0;
};

const NEWS_BONUS_PER_ITEM = 40;
const FOLLOWER_WEIGHT = 8;
const SCORE_CAP = 1000;

/**
 * Computes a trending score for a festival.
 *
 * Score = (followerCount × FOLLOWER_WEIGHT + recentNewsCount × NEWS_BONUS)
 *         × proximityMultiplier
 *
 * Returns 0 for festivals that have already started or whose startDate is
 * in the past relative to `now`.
 */
export function computeTrendingScore(festival: TrendingInput, now: Date = new Date()): number {
  const start = new Date(festival.startDate);
  const daysUntil = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const multiplier = PROXIMITY_MULTIPLIER(daysUntil);
  if (multiplier === 0) return 0;

  const raw =
    festival.followerCount * FOLLOWER_WEIGHT + festival.recentNewsCount * NEWS_BONUS_PER_ITEM;

  return Math.min(Math.round(raw * multiplier), SCORE_CAP);
}

/**
 * Returns the trending tier label for a given score.
 */
export function getTrendingTier(score: number): "chaud" | "montant" | "stable" | null {
  if (score >= 600) return "chaud";
  if (score >= 200) return "montant";
  if (score >= 50) return "stable";
  return null;
}

/**
 * Returns a CSS color variable for the trending tier.
 */
export function getTrendingColor(tier: ReturnType<typeof getTrendingTier>): string {
  switch (tier) {
    case "chaud":
      return "var(--danger-red)";
    case "montant":
      return "var(--warning-orange)";
    case "stable":
      return "var(--primary-neon)";
    default:
      return "var(--text-dim)";
  }
}

/**
 * Sorts a list of trending items by computed score, descending.
 */
export function rankByTrendingScore<T extends TrendingInput>(
  festivals: T[],
  now: Date = new Date(),
): Array<T & { trendingScore: number }> {
  return festivals
    .map((f) => ({ ...f, trendingScore: computeTrendingScore(f, now) }))
    .filter((f) => f.trendingScore > 0)
    .sort((a, b) => b.trendingScore - a.trendingScore);
}
