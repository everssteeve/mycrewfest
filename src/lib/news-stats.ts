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

export interface PinnableNewsItem {
  isPinned: boolean;
}

/**
 * Returns the count of pinned news items.
 */
export function countPinnedNewsItems<T extends PinnableNewsItem>(items: T[]): number {
  return items.filter((i) => i.isPinned).length;
}

export interface CategorizableNewsItem {
  category: string;
}

/**
 * Returns the number of distinct category values across the given news items.
 */
export function countUniqueNewsCategories<T extends CategorizableNewsItem>(items: T[]): number {
  return new Set(items.map((i) => i.category)).size;
}

export interface TimestampedNewsItem {
  publishedAt: string;
}

/**
 * Returns the count of news items published within the last `windowHours` hours
 * relative to `now`. Items with unparseable dates are excluded.
 */
export function countRecentNewsItems<T extends TimestampedNewsItem>(
  items: T[],
  windowHours: number,
  now: Date = new Date(),
): number {
  const cutoff = now.getTime() - windowHours * 60 * 60 * 1_000;
  return items.filter((i) => {
    const t = new Date(i.publishedAt).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  }).length;
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
