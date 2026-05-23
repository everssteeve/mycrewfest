export interface TrendingFestivalItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  festivalType: string;
  followerCount: number;
}

const FESTIVAL_TYPE_LABELS: Record<string, string> = {
  musique: "Musique",
  théâtre_rue: "Théâtre de rue",
  cirque: "Cirque",
  world: "World",
  multidisciplinaire: "Multi",
};

export function formatFestivalTypeLabel(type: string): string {
  return FESTIVAL_TYPE_LABELS[type] ?? type;
}

export function selectTrendingFestivals(
  festivals: TrendingFestivalItem[],
  limit: number,
  now: Date = new Date(),
): TrendingFestivalItem[] {
  return festivals
    .filter((f) => new Date(f.startDate) >= now)
    .sort((a, b) => b.followerCount - a.followerCount)
    .slice(0, limit);
}
