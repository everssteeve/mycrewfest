export interface ArtistFilterable {
  artist: { name: string } | null;
}

export function matchesArtistFilter(event: ArtistFilterable, artistName: string | null): boolean {
  if (!artistName) return true;
  if (!event.artist) return false;
  return event.artist.name.toLowerCase() === artistName.toLowerCase();
}

export function getUniqueArtistNames(events: ArtistFilterable[]): string[] {
  const names = new Set<string>();
  for (const e of events) {
    if (e.artist?.name) names.add(e.artist.name);
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b, "fr"));
}

export function countArtistAppearances(events: ArtistFilterable[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.artist?.name) {
      counts.set(e.artist.name, (counts.get(e.artist.name) ?? 0) + 1);
    }
  }
  return counts;
}

export function getArtistsWithMultipleSlots(events: ArtistFilterable[]): string[] {
  const counts = countArtistAppearances(events);
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b, "fr"));
}

export function buildArtistFilterAriaLabel(artistName: string, count: number): string {
  return `Filtrer sur ${artistName} (${count} set${count > 1 ? "s" : ""})`;
}
