export interface SearchableNewsItem {
  summary: string;
  source?: string;
  category?: string;
}

/**
 * Returns true if the news item matches the given query.
 * Searches in: summary, source, category.
 * Empty or whitespace-only query always returns true.
 */
export function matchesNewsQuery<T extends SearchableNewsItem>(
  item: T,
  query: string,
): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    item.summary.toLowerCase().includes(q) ||
    (item.source?.toLowerCase().includes(q) ?? false) ||
    (item.category?.toLowerCase().includes(q) ?? false)
  );
}
