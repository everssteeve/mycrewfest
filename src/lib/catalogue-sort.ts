import { compareByTemporalRelevance } from "@/lib/festival-temporal";

export type CatalogueSortMode = "temporal" | "alpha" | "popularity";

export const SORT_MODES: CatalogueSortMode[] = ["temporal", "alpha", "popularity"];

export const SORT_MODE_LABELS: Record<CatalogueSortMode, string> = {
  temporal: "Pertinence",
  alpha: "A → Z",
  popularity: "Popularité",
};

export function getSortModeAriaLabel(mode: CatalogueSortMode): string {
  switch (mode) {
    case "temporal":
      return "Trier par pertinence temporelle";
    case "alpha":
      return "Trier par ordre alphabétique";
    case "popularity":
      return "Trier par popularité (followers)";
  }
}

interface SortableFestival {
  name: string;
  startDate: string;
  endDate: string;
  _count?: { followers: number } | null;
}

function compareAlpha(a: SortableFestival, b: SortableFestival): number {
  return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
}

function comparePopularity(a: SortableFestival, b: SortableFestival): number {
  const fa = a._count?.followers ?? 0;
  const fb = b._count?.followers ?? 0;
  if (fb !== fa) return fb - fa;
  return compareAlpha(a, b);
}

export function sortFestivals<T extends SortableFestival>(
  festivals: T[],
  mode: CatalogueSortMode,
): T[] {
  const copy = [...festivals];
  switch (mode) {
    case "alpha":
      return copy.sort(compareAlpha);
    case "popularity":
      return copy.sort(comparePopularity);
    default:
      return copy.sort(compareByTemporalRelevance);
  }
}

export function getDefaultSortMode(): CatalogueSortMode {
  return "temporal";
}
