export interface RankableFestival {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  festivalType: string;
  startDate: string;
  endDate: string;
  followerCount: number;
  programStatus: string;
  eventCount: number;
}

export interface FestivalRankEntry extends RankableFestival {
  rank: number;
}

/**
 * Returns the top N festivals sorted by follower count descending.
 */
export function rankByFollowers(
  festivals: RankableFestival[],
  limit = 10,
): FestivalRankEntry[] {
  return [...festivals]
    .filter((f) => f.followerCount > 0)
    .sort((a, b) => b.followerCount - a.followerCount || a.name.localeCompare(b.name, "fr"))
    .slice(0, limit)
    .map((f, i) => ({ ...f, rank: i + 1 }));
}

/**
 * Returns the top N upcoming festivals sorted by start date ascending.
 * Filters festivals starting within `daysAhead` days from now.
 */
export function rankByUpcoming(
  festivals: RankableFestival[],
  daysAhead = 30,
  limit = 10,
  now = new Date(),
): FestivalRankEntry[] {
  const todayStr = now.toLocaleDateString("sv-SE");
  const cutoffMs = now.getTime() + daysAhead * 86_400_000;
  const cutoffStr = new Date(cutoffMs).toLocaleDateString("sv-SE");

  return festivals
    .filter((f) => {
      const start = f.startDate.slice(0, 10);
      return start >= todayStr && start <= cutoffStr;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || b.followerCount - a.followerCount)
    .slice(0, limit)
    .map((f, i) => ({ ...f, rank: i + 1 }));
}

/**
 * Returns the top N festivals with the most complete programmes (most events).
 * Only includes festivals with at least one event.
 */
export function rankByProgramme(
  festivals: RankableFestival[],
  limit = 10,
): FestivalRankEntry[] {
  return [...festivals]
    .filter((f) => f.eventCount > 0)
    .sort((a, b) => b.eventCount - a.eventCount || a.name.localeCompare(b.name, "fr"))
    .slice(0, limit)
    .map((f, i) => ({ ...f, rank: i + 1 }));
}

/**
 * Returns the medal emoji for a given rank (1–3), or an empty string.
 */
export function getRankMedal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

/**
 * Returns the color token for a rank badge.
 */
export function getRankColor(rank: number): string {
  if (rank === 1) return "var(--warning-orange)";
  if (rank === 2) return "var(--text-muted)";
  if (rank === 3) return "var(--warning-orange)";
  return "var(--text-dim)";
}
