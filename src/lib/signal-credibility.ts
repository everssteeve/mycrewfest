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

/**
 * Returns the percentage (0–100, rounded) of signals with "forte" credibility.
 * Returns 0 for an empty list.
 */
export function computeSignalCredibilityRate(signals: CredibilityInput[]): number {
  if (signals.length === 0) return 0;
  const forte = signals.filter((s) => computeSignalCredibility(s).label === "forte").length;
  return Math.round((forte / signals.length) * 100);
}

export interface TopSignalTypeInput {
  predefinedPhrase?: string | null;
}

export interface TopSignalTypeResult {
  phrase: string;
  count: number;
}

/**
 * Returns the most common predefined phrase across signals, or null if none have one.
 * Ties are broken alphabetically.
 */
export function getTopSignalType(
  signals: TopSignalTypeInput[],
): TopSignalTypeResult | null {
  const counts = new Map<string, number>();
  for (const s of signals) {
    if (s.predefinedPhrase) {
      counts.set(s.predefinedPhrase, (counts.get(s.predefinedPhrase) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  let top: TopSignalTypeResult | null = null;
  for (const [phrase, count] of counts) {
    if (!top || count > top.count || (count === top.count && phrase < top.phrase)) {
      top = { phrase, count };
    }
  }
  return top;
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

export interface AuthorableSignal {
  authorId: string;
}

/**
 * Returns the number of distinct authorIds across the given signals.
 */
export function countUniqueSignalAuthors<T extends AuthorableSignal>(signals: T[]): number {
  return new Set(signals.map((s) => s.authorId)).size;
}
