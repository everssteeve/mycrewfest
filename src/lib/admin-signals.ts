export interface AdminSignalRow {
  id: string;
  scope: string;
  description: string | null;
  predefinedPhrase: string | null;
  confirmations: number;
  infirmations: number;
  createdAt: Date;
  expiresAt: Date;
  author: { name: string | null; pseudo: string | null; email: string };
  festival: { name: string; slug: string } | null;
}

export function formatSignalScope(scope: string): string {
  if (scope === "communauté") return "Communauté";
  if (scope === "crew") return "Crew";
  return scope;
}

export function getSignalScopeColor(scope: string): string {
  if (scope === "communauté") return "var(--primary-neon)";
  if (scope === "crew") return "var(--secondary-cyan)";
  return "var(--text-dim)";
}

export function isSignalExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() < now.getTime();
}

export function formatSignalExpiry(expiresAt: Date, now: Date = new Date()): string {
  const diffMs = expiresAt.getTime() - now.getTime();
  if (diffMs <= 0) return "Expiré";
  const diffMins = Math.round(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}min`;
  const diffHours = Math.round(diffMins / 60);
  return `${diffHours}h`;
}

export function resolveSignalLabel(signal: Pick<AdminSignalRow, "predefinedPhrase" | "description">): string {
  return signal.predefinedPhrase ?? signal.description ?? "Signal sans description";
}

export function resolveSignalAuthorName(author: AdminSignalRow["author"]): string {
  return author.pseudo ?? author.name ?? author.email;
}

export function countSignalsByScope(signals: AdminSignalRow[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const s of signals) {
    result[s.scope] = (result[s.scope] ?? 0) + 1;
  }
  return result;
}

export function countActiveSignals(signals: AdminSignalRow[], now: Date = new Date()): number {
  return signals.filter((s) => !isSignalExpired(s.expiresAt, now)).length;
}

export function sortSignalsByRecency(signals: AdminSignalRow[]): AdminSignalRow[] {
  return [...signals].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
