import type { GlobalSearchResponse } from "@/lib/global-search";

export type SearchTypeFilter = "all" | "festivals" | "artists";

export interface SearchResultCounts {
  festivals: number;
  artists: number;
  total: number;
}

export function countSearchResults(response: GlobalSearchResponse): SearchResultCounts {
  return {
    festivals: response.festivals.length,
    artists: response.artists.length,
    total: response.total,
  };
}

/**
 * Returns a filtered view of the search response based on the active type filter.
 * Does not mutate the original response.
 */
export function applySearchTypeFilter(
  response: GlobalSearchResponse,
  filter: SearchTypeFilter,
): GlobalSearchResponse {
  if (filter === "festivals") {
    return { festivals: response.festivals, artists: [], total: response.festivals.length };
  }
  if (filter === "artists") {
    return { festivals: [], artists: response.artists, total: response.artists.length };
  }
  return response;
}

/**
 * Returns the active tab label with result count.
 */
export function buildTabLabel(filter: SearchTypeFilter, counts: SearchResultCounts): string {
  switch (filter) {
    case "festivals":
      return `Festivals (${counts.festivals})`;
    case "artists":
      return `Artistes (${counts.artists})`;
    default:
      return `Tout (${counts.total})`;
  }
}

/**
 * Returns true when a filter tab should be disabled (no results for that type).
 */
export function isTabDisabled(filter: SearchTypeFilter, counts: SearchResultCounts): boolean {
  if (filter === "festivals") return counts.festivals === 0;
  if (filter === "artists") return counts.artists === 0;
  return counts.total === 0;
}
