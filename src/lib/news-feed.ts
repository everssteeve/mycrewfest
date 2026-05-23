export interface FeedItem {
  id: string;
  festivalId: string;
  festivalName: string;
  festivalSlug: string;
  summary: string;
  category: string;
  urgencyLevel: "normal" | "critique";
  isPinned: boolean;
  publishedAt: string;
  sourceUrl: string | null;
}

export interface FeedDay {
  dateKey: string;
  label: string;
  items: FeedItem[];
}

export const FEED_CATEGORY_LABELS: Record<string, string> = {
  "line-up": "Line-up",
  logistique: "Logistique",
  "programme-change": "Changement programme",
  annulation: "Annulation",
  urgence: "Urgence",
  autre: "Info",
};

export function getFeedCategoryLabel(category: string): string {
  return FEED_CATEGORY_LABELS[category] ?? category;
}

export function sortFeedItems(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.urgencyLevel !== b.urgencyLevel) {
      return a.urgencyLevel === "critique" ? -1 : 1;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export function groupFeedByDay(items: FeedItem[]): FeedDay[] {
  const map = new Map<string, FeedItem[]>();

  for (const item of items) {
    const dateKey = item.publishedAt.slice(0, 10);
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)?.push(item);
  }

  const days: FeedDay[] = [];
  for (const [dateKey, dayItems] of map) {
    const date = new Date(`${dateKey}T12:00:00Z`);
    const label = date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    days.push({ dateKey, label, items: sortFeedItems(dayItems) });
  }

  return days.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export function countCriticalItems(items: FeedItem[]): number {
  return items.filter((i) => i.urgencyLevel === "critique").length;
}

export function getRecentItemCount(
  items: FeedItem[],
  withinDays: number,
  now = new Date(),
): number {
  const cutoff = new Date(now.getTime() - withinDays * 24 * 60 * 60 * 1000);
  return items.filter((i) => new Date(i.publishedAt) >= cutoff).length;
}

export function filterFeedByFestival(items: FeedItem[], festivalId: string | null): FeedItem[] {
  if (!festivalId) return items;
  return items.filter((i) => i.festivalId === festivalId);
}

export function filterFeedByCategory(items: FeedItem[], category: string | null): FeedItem[] {
  if (!category) return items;
  return items.filter((i) => i.category === category);
}

export function getAvailableCategoriesFromFeed(items: FeedItem[]): string[] {
  const seen = new Set<string>();
  for (const item of items) seen.add(item.category);
  return [...seen].sort((a, b) =>
    (FEED_CATEGORY_LABELS[a] ?? a).localeCompare(FEED_CATEGORY_LABELS[b] ?? b, "fr"),
  );
}

export function getFollowedFestivalsFromFeed(items: FeedItem[]): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const item of items) {
    if (!seen.has(item.festivalId)) {
      seen.set(item.festivalId, item.festivalName);
    }
  }
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
