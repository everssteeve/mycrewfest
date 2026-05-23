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
