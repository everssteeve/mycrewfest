export interface SearchableEvent {
  title: string;
  artist?: { name: string } | null;
  venue?: { name: string } | null;
  tags?: string[];
}

export function matchesProgrammeQuery<T extends SearchableEvent>(event: T, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    event.title.toLowerCase().includes(q) ||
    (event.artist?.name.toLowerCase().includes(q) ?? false) ||
    (event.venue?.name.toLowerCase().includes(q) ?? false) ||
    (event.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
  );
}

export type SelectionFilter = "tous" | "sélectionné" | "must-see" | "intéressé" | "vu";

export interface SelectionFilterable {
  selectionStatus?: string | null;
}

export function matchesSelectionFilter<T extends SelectionFilterable>(
  event: T,
  filter: SelectionFilter,
): boolean {
  if (filter === "tous") return true;
  const s = event.selectionStatus;
  if (filter === "sélectionné") {
    return s === "must-see" || s === "intéressé" || s === "vu";
  }
  return s === filter;
}

export interface TagFilterable {
  tags?: string[];
}

export function matchesTagFilter<T extends TagFilterable>(
  event: T,
  activeTags: ReadonlySet<string>,
): boolean {
  if (activeTags.size === 0) return true;
  return event.tags?.some((t) => activeTags.has(t)) ?? false;
}

export interface VenueFilterable {
  venue?: { id: string } | null;
}

export function matchesVenueFilter<T extends VenueFilterable>(
  event: T,
  venueId: string | null,
): boolean {
  if (venueId === null) return true;
  return event.venue?.id === venueId;
}

export type DurationFilter = "tous" | "court" | "normal" | "long";

export const DURATION_FILTER_LABELS: Record<DurationFilter, string> = {
  tous: "Toutes durées",
  court: "< 30min",
  normal: "30–90min",
  long: "> 90min",
};

export interface DurationFilterable {
  durationMins?: number | null;
}

/**
 * court: durationMins < 30
 * normal: 30 <= durationMins <= 90
 * long: durationMins > 90
 * Events with no durationMins only match "tous".
 */
export function matchesDurationFilter<T extends DurationFilterable>(
  event: T,
  filter: DurationFilter,
): boolean {
  if (filter === "tous") return true;
  const d = event.durationMins;
  if (d == null) return false;
  if (filter === "court") return d < 30;
  if (filter === "normal") return d >= 30 && d <= 90;
  return d > 90;
}

export interface AgeRestrictionFilterable {
  ageMin?: number | null;
  ageMax?: number | null;
}

/**
 * When `showOnlyRestricted` is true, returns true only for events that have a
 * positive ageMin or ageMax. When false, always returns true.
 */
export function matchesAgeRestrictionFilter<T extends AgeRestrictionFilterable>(
  event: T,
  showOnlyRestricted: boolean,
): boolean {
  if (!showOnlyRestricted) return true;
  return (event.ageMin != null && event.ageMin > 0) || (event.ageMax != null && event.ageMax > 0);
}
