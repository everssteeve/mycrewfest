export interface CoAfficheArtist {
  id: string;
  name: string;
  disciplines: string[];
  countryCode: string | null;
  sharedFestivalCount: number;
}

export function rankCoAfficheArtists(
  artists: CoAfficheArtist[],
  limit = 4,
): CoAfficheArtist[] {
  return [...artists]
    .sort((a, b) => b.sharedFestivalCount - a.sharedFestivalCount || a.name.localeCompare(b.name, "fr"))
    .slice(0, limit);
}

export function deduplicateByFestivalCount(
  artists: CoAfficheArtist[],
): CoAfficheArtist[] {
  const seen = new Set<string>();
  const result: CoAfficheArtist[] = [];
  for (const a of artists) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      result.push(a);
    }
  }
  return result;
}
