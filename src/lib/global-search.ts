export interface SearchFestivalResult {
  type: "festival";
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  festivalType: string;
  score: number;
}

export interface SearchArtistResult {
  type: "artist";
  id: string;
  name: string;
  disciplines: string[];
  countryCode: string | null;
  festivalCount: number;
  score: number;
}

export type SearchResult = SearchFestivalResult | SearchArtistResult;

export interface GlobalSearchResponse {
  festivals: SearchFestivalResult[];
  artists: SearchArtistResult[];
  total: number;
}

type ScoredFestival = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  festivalType: string;
  description?: string | null;
};

type ScoredArtist = {
  id: string;
  name: string;
  disciplines: string[];
  countryCode: string | null;
  festivalCount: number;
};

export function scoreFestival(festival: ScoredFestival, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const name = festival.name.toLowerCase();
  const city = festival.city.toLowerCase();
  const desc = (festival.description ?? "").toLowerCase();

  if (name === q) return 10;
  if (name.startsWith(q)) return 4;
  if (name.includes(q)) return 3;
  if (city.startsWith(q)) return 2;
  if (city.includes(q)) return 1.5;
  if (desc.includes(q)) return 0.5;
  return 0;
}

export function scoreArtist(artist: ScoredArtist, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const name = artist.name.toLowerCase();
  const disciplines = artist.disciplines.map((d) => d.toLowerCase());

  if (name === q) return 10;
  if (name.startsWith(q)) return 4;
  if (name.includes(q)) return 3;
  if (disciplines.some((d) => d.includes(q))) return 1;
  return 0;
}

export function filterAndRankFestivals(
  festivals: ScoredFestival[],
  query: string,
  limit = 5,
): SearchFestivalResult[] {
  const q = query.trim();
  if (q.length < 2) return [];

  return festivals
    .map((f) => ({ ...f, score: scoreFestival(f, q) }))
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((f) => ({
      type: "festival" as const,
      id: f.id,
      name: f.name,
      slug: f.slug,
      city: f.city,
      country: f.country,
      startDate: f.startDate,
      endDate: f.endDate,
      festivalType: f.festivalType,
      score: f.score,
    }));
}

export function filterAndRankArtists(
  artists: ScoredArtist[],
  query: string,
  limit = 5,
): SearchArtistResult[] {
  const q = query.trim();
  if (q.length < 2) return [];

  return artists
    .map((a) => ({ ...a, score: scoreArtist(a, q) }))
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((a) => ({
      type: "artist" as const,
      id: a.id,
      name: a.name,
      disciplines: a.disciplines,
      countryCode: a.countryCode,
      festivalCount: a.festivalCount,
      score: a.score,
    }));
}
