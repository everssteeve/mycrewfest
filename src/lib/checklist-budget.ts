export interface BudgetItem {
  cost?: number | null;
  done: boolean;
}

export interface ChecklistBudget {
  total: number;
  spent: number;
  remaining: number;
}

export function computeChecklistBudget(items: BudgetItem[]): ChecklistBudget {
  let total = 0;
  let spent = 0;
  for (const item of items) {
    const c = item.cost ?? 0;
    total += c;
    if (item.done) spent += c;
  }
  return { total, spent, remaining: total - spent };
}

export interface CompletionRateItem {
  done: boolean;
}

/**
 * Returns the completion percentage (0–100) of items that are done.
 * Returns 0 for an empty list.
 */
export function computeCompletionRate(items: CompletionRateItem[]): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}

export interface AgableItem {
  done: boolean;
  createdAt: string;
}

/**
 * Returns the age in whole days of the oldest pending (not done) item,
 * relative to `now`. Returns null when all items are done or the list is empty.
 * Items with unparseable createdAt are ignored.
 */
export function getOldestPendingItemAgeDays(
  items: AgableItem[],
  now: Date = new Date(),
): number | null {
  let oldest: number | null = null;
  for (const item of items) {
    if (item.done) continue;
    const t = new Date(item.createdAt).getTime();
    if (Number.isNaN(t)) continue;
    const ageDays = Math.floor((now.getTime() - t) / (24 * 60 * 60_000));
    if (oldest === null || ageDays > oldest) oldest = ageDays;
  }
  return oldest;
}

export interface CompletedAgableItem {
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Returns the average number of whole days between createdAt and updatedAt
 * for items that are done. Uses updatedAt as a proxy for completion time.
 * Returns null when no done items have parseable timestamps or the list has no
 * done items.
 */
export function computeAvgDaysToComplete(items: CompletedAgableItem[]): number | null {
  let total = 0;
  let count = 0;
  for (const item of items) {
    if (!item.done) continue;
    const created = new Date(item.createdAt).getTime();
    const updated = new Date(item.updatedAt).getTime();
    if (Number.isNaN(created) || Number.isNaN(updated)) continue;
    const days = Math.max(0, Math.floor((updated - created) / (24 * 60 * 60_000)));
    total += days;
    count++;
  }
  return count === 0 ? null : Math.round(total / count);
}
