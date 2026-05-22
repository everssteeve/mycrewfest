export interface SearchableEvent {
  title: string;
  artist?: { name: string } | null;
  venue?: { name: string } | null;
}

export function matchesProgrammeQuery<T extends SearchableEvent>(
  event: T,
  query: string
): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    event.title.toLowerCase().includes(q) ||
    (event.artist?.name.toLowerCase().includes(q) ?? false) ||
    (event.venue?.name.toLowerCase().includes(q) ?? false)
  );
}

export type SelectionFilter = "tous" | "sélectionné" | "must-see" | "intéressé";

export interface SelectionFilterable {
  selectionStatus?: string | null;
}

export function matchesSelectionFilter<T extends SelectionFilterable>(
  event: T,
  filter: SelectionFilter
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
