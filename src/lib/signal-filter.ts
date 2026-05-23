export type SignalScope = "crew" | "communauté";

export interface ScopeFilterable {
  scope: SignalScope;
}

export function filterSignalsByScope<T extends ScopeFilterable>(
  signals: T[],
  scope: SignalScope | null,
): T[] {
  if (scope === null) return signals;
  return signals.filter((s) => s.scope === scope);
}

/**
 * Returns the count of signals with scope "crew".
 */
export function countCrewSignals<T extends ScopeFilterable>(signals: T[]): number {
  return signals.filter((s) => s.scope === "crew").length;
}

/**
 * Returns the count of signals with scope "communauté".
 */
export function countCommunautéSignals<T extends ScopeFilterable>(signals: T[]): number {
  return signals.filter((s) => s.scope === "communauté").length;
}
