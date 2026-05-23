export interface AssigneeFilterable {
  assigneeName?: string | null;
}

export function filterByAssignee<T extends AssigneeFilterable>(
  items: T[],
  assignee: string | null,
): T[] {
  if (assignee === null) return items;
  return items.filter((i) => i.assigneeName === assignee);
}

export function getUniqueAssignees<T extends AssigneeFilterable>(items: T[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (item.assigneeName) seen.add(item.assigneeName);
  }
  return Array.from(seen).sort();
}
