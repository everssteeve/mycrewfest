import type { NewsItemSummary } from "@/lib/types";

export function sortNewsItems(items: NewsItemSummary[]): NewsItemSummary[] {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.urgencyLevel !== b.urgencyLevel) {
      return a.urgencyLevel === "critique" ? -1 : 1;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export function countByUrgency(items: NewsItemSummary[]): { normal: number; critique: number } {
  let normal = 0;
  let critique = 0;
  for (const item of items) {
    if (item.urgencyLevel === "critique") critique++;
    else normal++;
  }
  return { normal, critique };
}

export function countPinned(items: NewsItemSummary[]): number {
  return items.filter((i) => i.isPinned).length;
}
