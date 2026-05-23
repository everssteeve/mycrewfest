export interface DisciplineCount {
  discipline: string;
  count: number;
  percentage: number;
}

/**
 * Counts how many times each discipline appears across the given artists.
 * An artist with multiple disciplines contributes once per discipline.
 */
export function aggregateDisciplines(
  artists: Array<{ disciplines: string[]; timesVu?: number }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const artist of artists) {
    const weight = artist.timesVu ?? 1;
    for (const d of artist.disciplines) {
      const trimmed = d.trim();
      if (!trimmed) continue;
      map.set(trimmed, (map.get(trimmed) ?? 0) + weight);
    }
  }
  return map;
}

/**
 * Converts the discipline count map to a sorted array with percentages.
 * The total is the sum of all counts (used for percentage calculation).
 */
export function buildDisciplineRanking(
  counts: Map<string, number>,
  limit = 5,
): DisciplineCount[] {
  const total = [...counts.values()].reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  return [...counts.entries()]
    .map(([discipline, count]) => ({
      discipline,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.discipline.localeCompare(b.discipline, "fr"))
    .slice(0, limit);
}

/**
 * Returns a color token for a discipline rank (0-indexed).
 */
export function getDisciplineColor(index: number): string {
  const colors = [
    "var(--primary-neon)",
    "var(--secondary-cyan)",
    "var(--accent-pink)",
    "var(--warning-orange)",
    "var(--text-muted)",
  ];
  return colors[index] ?? "var(--text-dim)";
}

/**
 * Returns true if there is enough data to show a genre profile.
 */
export function hasGenreData(counts: Map<string, number>): boolean {
  return counts.size > 0;
}
