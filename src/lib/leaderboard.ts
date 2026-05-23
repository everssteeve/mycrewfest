import {
  computeFestivalierScore,
  type FestivalierRank,
  type FestivalierStats,
} from "./festivalier-score";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  rank: FestivalierRank;
  score: number;
  festEventsCount: number;
  vuCount: number;
  souvenirsCount: number;
  followedFestivalsCount: number;
}

interface RawUserStats {
  id: string;
  name: string | null;
  pseudo: string | null;
  festEventsCount: number;
  followedFestivalsCount: number;
  souvenirsCount: number;
}

export function resolveDisplayName(pseudo: string | null, name: string | null): string {
  return pseudo ?? name ?? "Festivalier";
}

export function buildLeaderboard(
  users: RawUserStats[],
  vuCountByUser: Record<string, number>,
): LeaderboardEntry[] {
  return users
    .map((u) => {
      const stats: FestivalierStats = {
        festEventsCount: u.festEventsCount,
        followedFestivalsCount: u.followedFestivalsCount,
        souvenirsCount: u.souvenirsCount,
        vuCount: vuCountByUser[u.id] ?? 0,
      };
      const result = computeFestivalierScore(stats);
      return {
        userId: u.id,
        displayName: resolveDisplayName(u.pseudo, u.name),
        rank: result.rank,
        score: result.score,
        festEventsCount: stats.festEventsCount,
        vuCount: stats.vuCount,
        souvenirsCount: stats.souvenirsCount,
        followedFestivalsCount: stats.followedFestivalsCount,
      };
    })
    .sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName));
}

export function getUserPosition(entries: LeaderboardEntry[], userId: string): number {
  const idx = entries.findIndex((e) => e.userId === userId);
  return idx === -1 ? -1 : idx + 1;
}

export function filterTopN(entries: LeaderboardEntry[], n: number): LeaderboardEntry[] {
  return entries.slice(0, n);
}

export const RANK_COLORS: Record<FestivalierRank, string> = {
  légende: "var(--warning-orange)",
  expert: "var(--accent-pink)",
  passionné: "var(--secondary-cyan)",
  rookie: "var(--text-dim)",
};

export const RANK_LABELS: Record<FestivalierRank, string> = {
  légende: "Légende",
  expert: "Expert",
  passionné: "Passionné·e",
  rookie: "Rookie",
};

export const POSITION_MEDALS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};
