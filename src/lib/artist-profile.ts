export interface ArtistFestivalAppearance {
  festivalId: string;
  festivalName: string;
  festivalSlug: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  eventTitle: string;
  startTime: string | null;
}

export function sortAppearancesByDate(
  appearances: ArtistFestivalAppearance[],
): ArtistFestivalAppearance[] {
  return [...appearances].sort((a, b) => {
    if (a.startDate < b.startDate) return -1;
    if (a.startDate > b.startDate) return 1;
    const ta = a.startTime ?? "";
    const tb = b.startTime ?? "";
    return ta.localeCompare(tb);
  });
}

export function splitByTemporality(
  appearances: ArtistFestivalAppearance[],
  now = new Date(),
): {
  upcoming: ArtistFestivalAppearance[];
  past: ArtistFestivalAppearance[];
} {
  const today = now.toISOString().slice(0, 10);
  return {
    upcoming: appearances.filter((a) => a.endDate.slice(0, 10) >= today),
    past: appearances.filter((a) => a.endDate.slice(0, 10) < today),
  };
}

export function formatDisciplines(disciplines: string[]): string {
  return disciplines.join(", ");
}

export function buildInstagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
}

export function buildSpotifyUrl(spotifyId: string): string {
  return `https://open.spotify.com/artist/${spotifyId}`;
}
