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
