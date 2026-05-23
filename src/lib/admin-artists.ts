export interface AdminArtistRow {
  id: string;
  name: string;
  disciplines: string[];
  countryCode: string | null;
  eventCount: number;
  instagram: string | null;
  siteUrl: string | null;
}

export function filterAdminArtists(artists: AdminArtistRow[], query: string): AdminArtistRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return artists;
  return artists.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.disciplines.some((d) => d.toLowerCase().includes(q)) ||
      (a.countryCode?.toLowerCase() ?? "").includes(q),
  );
}

export function sortAdminArtistsByName(artists: AdminArtistRow[]): AdminArtistRow[] {
  return [...artists].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function sortAdminArtistsByEventCount(artists: AdminArtistRow[]): AdminArtistRow[] {
  return [...artists].sort(
    (a, b) => b.eventCount - a.eventCount || a.name.localeCompare(b.name, "fr"),
  );
}

export function countArtistsMissingCountry(artists: AdminArtistRow[]): number {
  return artists.filter((a) => !a.countryCode).length;
}

export function countArtistsMissingDisciplines(artists: AdminArtistRow[]): number {
  return artists.filter((a) => a.disciplines.length === 0).length;
}

export function filterOrphanArtists(artists: AdminArtistRow[]): AdminArtistRow[] {
  return artists.filter((a) => a.eventCount === 0);
}

export function countOrphanArtists(artists: AdminArtistRow[]): number {
  return artists.filter((a) => a.eventCount === 0).length;
}
