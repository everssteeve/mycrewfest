import { computeSimilarityScore, type SimilarityCandidate } from "@/lib/festival-similarity";

export interface RecommendationScore {
  id: string;
  totalScore: number;
  matchCount: number;
}

/**
 * Aggregates similarity scores across all followed festivals for each candidate.
 * A candidate scores higher if it is similar to multiple followed festivals.
 */
export function buildRecommendationScores(
  followedFestivals: SimilarityCandidate[],
  allFestivals: SimilarityCandidate[],
): RecommendationScore[] {
  return allFestivals.map((candidate) => {
    let totalScore = 0;
    let matchCount = 0;
    for (const ref of followedFestivals) {
      const score = computeSimilarityScore(ref, candidate);
      if (score > 0) {
        totalScore += score;
        matchCount++;
      }
    }
    return { id: candidate.id, totalScore, matchCount };
  });
}

/**
 * Returns the top N recommendations, excluding already-followed festivals.
 */
export function topRecommendations(
  scores: RecommendationScore[],
  excludeIds: Set<string>,
  limit: number = 5,
): RecommendationScore[] {
  return scores
    .filter((r) => !excludeIds.has(r.id) && r.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore || b.matchCount - a.matchCount)
    .slice(0, limit);
}

export function hasEnoughData(followedCount: number): boolean {
  return followedCount >= 1;
}
