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
