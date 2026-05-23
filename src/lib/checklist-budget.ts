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
