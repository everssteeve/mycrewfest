import { parseJsonArray } from "@/lib/api";

export interface SeenArtist {
  id: string;
  name: string;
  disciplines: string[];
  countryCode: string | null;
  timesVu: number;
}

interface RawArtistRef {
  id: string;
  name: string;
  disciplines: string | null;
  countryCode: string | null;
}

export function extractSeenArtists(
  artistRefs: (RawArtistRef | null | undefined)[],
): SeenArtist[] {
  const map = new Map<string, SeenArtist>();

  for (const ref of artistRefs) {
    if (!ref) continue;
    const existing = map.get(ref.id);
    if (existing) {
      existing.timesVu++;
    } else {
      map.set(ref.id, {
        id: ref.id,
        name: ref.name,
        disciplines: parseJsonArray(ref.disciplines) as string[],
        countryCode: ref.countryCode,
        timesVu: 1,
      });
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.timesVu !== a.timesVu) return b.timesVu - a.timesVu;
    return a.name.localeCompare(b.name, "fr");
  });
}

export function topSeenArtists(artists: SeenArtist[], limit = 10): SeenArtist[] {
  return artists.slice(0, limit);
}
