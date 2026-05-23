/**
 * Pure helpers for admin festival list filtering.
 * No DB access — fully unit-testable.
 */

export type FestivalIngestionStatus = "tous" | "détecté" | "vérifié" | "enrichi";

export interface AdminFestivalFilterable {
  name: string;
  ingestionStatus: string;
}

/**
 * Returns true when the festival matches the given status filter.
 * "tous" always matches.
 */
export function matchesFestivalStatusFilter<T extends AdminFestivalFilterable>(
  festival: T,
  status: FestivalIngestionStatus,
): boolean {
  if (status === "tous") return true;
  return festival.ingestionStatus === status;
}

/**
 * Returns true when the festival name contains the query string (case-insensitive).
 * Empty query always matches.
 */
export function matchesFestivalNameQuery<T extends AdminFestivalFilterable>(
  festival: T,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return festival.name.toLowerCase().includes(q);
}

/**
 * Applies both name query and status filter to a list of festivals.
 */
export function filterAdminFestivals<T extends AdminFestivalFilterable>(
  festivals: T[],
  query: string,
  status: FestivalIngestionStatus,
): T[] {
  return festivals.filter(
    (f) => matchesFestivalNameQuery(f, query) && matchesFestivalStatusFilter(f, status),
  );
}

export const FESTIVAL_STATUS_OPTIONS: { value: FestivalIngestionStatus; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "détecté", label: "Détecté" },
  { value: "vérifié", label: "Vérifié" },
  { value: "enrichi", label: "Enrichi" },
];
