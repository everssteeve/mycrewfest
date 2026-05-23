export interface ChecklistSearchable {
  label: string;
  assigneeName?: string | null;
}

export function filterChecklistByQuery<T extends ChecklistSearchable>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) =>
      i.label.toLowerCase().includes(q) ||
      (i.assigneeName?.toLowerCase().includes(q) ?? false),
  );
}
