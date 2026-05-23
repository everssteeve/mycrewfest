export interface MesArtistesItem {
  artistId: string;
  artistName: string;
  disciplines: string[];
  festivalId: string;
  festivalName: string;
  festivalSlug: string;
  festivalStartDate: string;
  festivalEndDate: string;
  city: string;
  eventTitle: string;
  startTime: string | null;
}

export function deduplicateArtistsByFestival(items: MesArtistesItem[]): MesArtistesItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.artistId}-${item.festivalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function sortByFestivalDate(items: MesArtistesItem[]): MesArtistesItem[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.festivalStartDate).getTime();
    const dateB = new Date(b.festivalStartDate).getTime();
    if (dateA !== dateB) return dateA - dateB;
    // then by artist name
    return a.artistName.localeCompare(b.artistName);
  });
}

export function filterUpcoming(items: MesArtistesItem[], now: Date = new Date()): MesArtistesItem[] {
  return items.filter((item) => new Date(item.festivalEndDate) >= now);
}

export function filterPast(items: MesArtistesItem[], now: Date = new Date()): MesArtistesItem[] {
  return items.filter((item) => new Date(item.festivalEndDate) < now);
}

export function groupByFestival(
  items: MesArtistesItem[],
): Map<string, { festivalName: string; festivalSlug: string; startDate: string; city: string; artists: MesArtistesItem[] }> {
  const map = new Map<string, { festivalName: string; festivalSlug: string; startDate: string; city: string; artists: MesArtistesItem[] }>();
  for (const item of items) {
    const existing = map.get(item.festivalId);
    if (existing) {
      existing.artists.push(item);
    } else {
      map.set(item.festivalId, {
        festivalName: item.festivalName,
        festivalSlug: item.festivalSlug,
        startDate: item.festivalStartDate,
        city: item.city,
        artists: [item],
      });
    }
  }
  return map;
}
