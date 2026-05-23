export interface CredibilityInput {
  confirmations: number;
  infirmations: number;
}

export interface CredibilityScore {
  score: number;
  total: number;
  label: "forte" | "neutre" | "faible";
}

/**
 * Computes a signal credibility score from 0 to 1.
 * Returns 0.5 (neutre) when there are no votes.
 *
 * - score >= 0.67 → "forte"
 * - score >= 0.33 → "neutre"
 * - score < 0.33  → "faible"
 */
export function computeSignalCredibility(input: CredibilityInput): CredibilityScore {
  const { confirmations, infirmations } = input;
  const total = confirmations + infirmations;

  if (total === 0) {
    return { score: 0.5, total: 0, label: "neutre" };
  }

  const score = confirmations / total;
  const label: CredibilityScore["label"] =
    score >= 2 / 3 ? "forte" : score >= 1 / 3 ? "neutre" : "faible";

  return { score, total, label };
}

/**
 * Returns the number of signals with "forte" credibility.
 */
export function countForteSignals(signals: CredibilityInput[]): number {
  return signals.filter((s) => computeSignalCredibility(s).label === "forte").length;
}

/**
 * Returns the number of signals that have at least one infirmation vote,
 * indicating contested or disputed information.
 */
export function countContestedSignals(signals: CredibilityInput[]): number {
  return signals.filter((s) => s.infirmations >= 1).length;
}

export interface RecentSignalInput {
  createdAt: string;
}

/**
 * Returns the count of signals created within the last `windowDays` calendar days
 * relative to `now`. Signals with an unparseable createdAt are excluded.
 */
export function countRecentSignals(
  signals: RecentSignalInput[],
  windowDays: number,
  now: Date = new Date(),
): number {
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1_000;
  return signals.filter((s) => {
    const t = new Date(s.createdAt).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  }).length;
}
