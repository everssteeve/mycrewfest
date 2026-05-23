/**
 * Pure helpers for admin platform statistics display.
 * No DB access — fully unit-testable.
 */

export interface TopFestivalEntry {
  id: string;
  name: string;
  followersCount: number;
  festEventsCount: number;
}

export interface PlatformActivitySummary {
  totalSignals: number;
  totalSouvenirs: number;
  totalSelections: number;
  totalCrews: number;
}

/**
 * Returns the engagement score for a festival: weighted sum of followers + fest events.
 * followers × 2 + festEvents × 1
 */
export function computeFestivalEngagementScore(entry: TopFestivalEntry): number {
  return entry.followersCount * 2 + entry.festEventsCount;
}

/**
 * Sorts festival entries by engagement score descending.
 * Ties broken by name alphabetically.
 */
export function sortFestivalsByEngagement(
  entries: TopFestivalEntry[],
): TopFestivalEntry[] {
  return [...entries].sort((a, b) => {
    const diff =
      computeFestivalEngagementScore(b) - computeFestivalEngagementScore(a);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, "fr");
  });
}

/**
 * Returns the engagement tier label for a given score.
 * ≥20 → "Viral", ≥10 → "Populaire", ≥5 → "En vue", else → "Émergent"
 */
export function getEngagementTier(score: number): string {
  if (score >= 20) return "Viral";
  if (score >= 10) return "Populaire";
  if (score >= 5) return "En vue";
  return "Émergent";
}

/**
 * Returns the color token for an engagement tier.
 */
export function getEngagementTierColor(tier: string): string {
  switch (tier) {
    case "Viral": return "var(--accent-pink)";
    case "Populaire": return "var(--primary-neon)";
    case "En vue": return "var(--secondary-cyan)";
    default: return "var(--text-dim)";
  }
}

/**
 * Returns total engagement points across all festivals.
 */
export function computeTotalEngagement(entries: TopFestivalEntry[]): number {
  return entries.reduce((sum, e) => sum + computeFestivalEngagementScore(e), 0);
}
