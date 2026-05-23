import type { SimilarityCandidate } from "@/lib/festival-similarity";

export interface ReasonContext {
  candidate: SimilarityCandidate & { name: string };
  followedFestivals: Array<SimilarityCandidate & { name: string }>;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 60 * 1000),
  );
}

function daysApart(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Returns the most relevant followed festival for explaining a recommendation.
 * Picks the one with the most signal matches (type, country, proximity).
 */
function bestMatch(
  candidate: SimilarityCandidate,
  followedFestivals: Array<SimilarityCandidate & { name: string }>,
): { festival: SimilarityCandidate & { name: string }; typeMatch: boolean; countryMatch: boolean; proximityMatch: boolean } | null {
  let best: { festival: SimilarityCandidate & { name: string }; typeMatch: boolean; countryMatch: boolean; proximityMatch: boolean; score: number } | null = null;

  for (const ref of followedFestivals) {
    if (ref.id === candidate.id) continue;
    const typeMatch = candidate.festivalType === ref.festivalType;
    const countryMatch = candidate.country === ref.country;
    const days = daysApart(ref.startDate, candidate.startDate);
    const proximityMatch = days <= 30;
    const score = (typeMatch ? 5 : 0) + (countryMatch ? 3 : 0) + (proximityMatch ? 4 : 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { festival: ref, typeMatch, countryMatch, proximityMatch, score };
    }
  }

  return best ? { festival: best.festival, typeMatch: best.typeMatch, countryMatch: best.countryMatch, proximityMatch: best.proximityMatch } : null;
}

const FESTIVAL_TYPE_LABELS: Record<string, string> = {
  musique: "musique",
  théâtre_rue: "théâtre de rue",
  cirque: "cirque",
  world: "world",
  multidisciplinaire: "multidisciplinaire",
};

/**
 * Returns a short human-readable reason for a festival recommendation.
 * Falls back to a generic reason when no strong signal is found.
 */
export function buildRecommendationReason(
  candidate: SimilarityCandidate & { name: string },
  followedFestivals: Array<SimilarityCandidate & { name: string }>,
): string {
  const match = bestMatch(candidate, followedFestivals);
  if (!match) return "Dans ton univers";

  const { festival, typeMatch, countryMatch, proximityMatch } = match;

  if (typeMatch && countryMatch) {
    return `Même type et même pays que ${festival.name}`;
  }
  if (typeMatch && proximityMatch) {
    return `Même univers ${FESTIVAL_TYPE_LABELS[candidate.festivalType] ?? candidate.festivalType} que ${festival.name}`;
  }
  if (typeMatch) {
    return `Même type que ${festival.name}`;
  }
  if (countryMatch && proximityMatch) {
    return `Même pays et période que ${festival.name}`;
  }
  if (countryMatch) {
    return `Même pays que ${festival.name}`;
  }
  if (proximityMatch) {
    return `Même période que ${festival.name}`;
  }
  return "Dans ton univers";
}

/**
 * Returns how many distinct signals matched (type, country, proximity).
 * Useful for sorting or displaying confidence.
 */
export function countReasonSignals(
  candidate: SimilarityCandidate,
  followedFestivals: Array<SimilarityCandidate & { name: string }>,
): number {
  const match = bestMatch(candidate, followedFestivals);
  if (!match) return 0;
  return [match.typeMatch, match.countryMatch, match.proximityMatch].filter(Boolean).length;
}
