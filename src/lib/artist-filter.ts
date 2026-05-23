export interface ArtistListItem {
  id: string;
  name: string;
  disciplines: string[];
  countryCode: string | null;
  festivalCount: number;
}

export function filterArtists(
  artists: ArtistListItem[],
  query: string,
  discipline: string,
): ArtistListItem[] {
  const q = query.trim().toLowerCase();
  return artists.filter((a) => {
    const matchesQuery =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.disciplines.some((d) => d.toLowerCase().includes(q));
    const matchesDiscipline =
      !discipline || a.disciplines.includes(discipline);
    return matchesQuery && matchesDiscipline;
  });
}

export function getAvailableDisciplines(artists: ArtistListItem[]): string[] {
  const set = new Set<string>();
  for (const a of artists) {
    for (const d of a.disciplines) {
      if (d) set.add(d);
    }
  }
  return [...set].sort();
}

export function sortArtistsByName(artists: ArtistListItem[]): ArtistListItem[] {
  return [...artists].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
