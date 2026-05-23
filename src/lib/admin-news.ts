export interface AdminNewsRow {
  id: string;
  festivalId: string;
  festivalName: string;
  festivalSlug: string;
  source: string;
  sourceUrl: string | null;
  publishedAt: string;
  category: string;
  summary: string;
  urgencyLevel: string;
  isPinned: boolean;
}

export const NEWS_CATEGORIES = [
  "line-up",
  "logistique",
  "programme-change",
  "annulation",
  "urgence",
  "autre",
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const NEWS_URGENCY_LEVELS = ["normal", "critique"] as const;

export const NEWS_CATEGORY_LABELS: Record<string, string> = {
  "line-up": "Line-up",
  logistique: "Logistique",
  "programme-change": "Changement",
  annulation: "Annulation",
  urgence: "Urgence",
  autre: "Info",
};

export function filterAdminNews(
  news: AdminNewsRow[],
  query: string,
  urgencyLevel: string,
  category: string,
): AdminNewsRow[] {
  const q = query.toLowerCase().trim();
  return news.filter((item) => {
    const matchesQuery =
      !q || item.festivalName.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);
    const matchesUrgency = !urgencyLevel || item.urgencyLevel === urgencyLevel;
    const matchesCategory = !category || item.category === category;
    return matchesQuery && matchesUrgency && matchesCategory;
  });
}

export function sortAdminNewsByDate(news: AdminNewsRow[]): AdminNewsRow[] {
  return [...news].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function countCritiqueNews(news: AdminNewsRow[]): number {
  return news.filter((n) => n.urgencyLevel === "critique").length;
}

export function countPinnedNews(news: AdminNewsRow[]): number {
  return news.filter((n) => n.isPinned).length;
}
