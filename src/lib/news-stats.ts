export interface StatsableNewsItem {
  urgencyLevel: "normal" | "critique";
  isPinned: boolean;
}

export interface NewsStats {
  total: number;
  critiques: number;
  pinned: number;
}

/**
 * Computes aggregate statistics for a list of news items.
 */
export function computeNewsStats<T extends StatsableNewsItem>(items: T[]): NewsStats {
  let critiques = 0;
  let pinned = 0;
  for (const item of items) {
    if (item.urgencyLevel === "critique") critiques++;
    if (item.isPinned) pinned++;
  }
  return { total: items.length, critiques, pinned };
}

export interface SourceCountable {
  source: string;
}

/**
 * Returns the source name with the most news items, or null when the list is empty.
 * Ties are broken by insertion order (first encountered wins).
 */
export function getTopNewsSource<T extends SourceCountable>(items: T[]): string | null {
  if (items.length === 0) return null;
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.source, (counts.get(item.source) ?? 0) + 1);
  }
  let topSource: string | null = null;
  let max = 0;
  for (const [source, count] of counts) {
    if (count > max) {
      max = count;
      topSource = source;
    }
  }
  return topSource;
}
