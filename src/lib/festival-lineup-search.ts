import type { ArtistSummary } from "@/types/index";

export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function filterLineup(artists: ArtistSummary[], query: string): ArtistSummary[] {
  const norm = normalizeQuery(query);
  if (!norm) return artists;
  return artists.filter((a) => {
    const name = normalizeQuery(a.name);
    if (name.includes(norm)) return true;
    if (a.disciplines?.some((d) => normalizeQuery(d).includes(norm))) return true;
    if (a.countryCode && normalizeQuery(a.countryCode).includes(norm)) return true;
    return false;
  });
}
