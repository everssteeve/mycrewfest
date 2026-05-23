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
