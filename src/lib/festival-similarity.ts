export interface SimilarityCandidate {
  id: string;
  slug: string;
  festivalType: string;
  country: string;
  startDate: string;
  endDate: string;
}

export interface SimilarityResult {
  id: string;
  score: number;
}

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
}

export function computeSimilarityScore(
  reference: SimilarityCandidate,
  candidate: SimilarityCandidate,
): number {
  if (candidate.id === reference.id) return -1;

  let score = 0;

  if (candidate.festivalType === reference.festivalType) score += 5;
  if (candidate.country === reference.country) score += 3;

  const days = daysBetween(reference.startDate, candidate.startDate);
  if (days <= 14) score += 4;
  else if (days <= 30) score += 3;
  else if (days <= 60) score += 2;
  else if (days <= 90) score += 1;

  return score;
}

export function rankSimilarFestivals(
  reference: SimilarityCandidate,
  candidates: SimilarityCandidate[],
  limit = 3,
): SimilarityResult[] {
  return candidates
    .map((c) => ({ id: c.id, score: computeSimilarityScore(reference, c) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
