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

export interface AssigneeStatsItem {
  assigneeName?: string | null;
  done: boolean;
}

export interface AssigneeStat {
  assigneeName: string;
  total: number;
  done: number;
  percent: number;
}

/**
 * Returns per-assignee task completion stats, sorted alphabetically.
 * Only includes items that have an assigneeName.
 */
export function computeAssigneeStats<T extends AssigneeStatsItem>(
  items: T[],
): AssigneeStat[] {
  const map = new Map<string, { total: number; done: number }>();

  for (const item of items) {
    if (!item.assigneeName) continue;
    const entry = map.get(item.assigneeName) ?? { total: 0, done: 0 };
    entry.total++;
    if (item.done) entry.done++;
    map.set(item.assigneeName, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([assigneeName, { total, done }]) => ({
      assigneeName,
      total,
      done,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
    }));
}
