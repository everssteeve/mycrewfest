export interface PlatformHealthInput {
  totalFestivals: number;
  enrichedFestivals: number;
  totalUsers: number;
  usersWithPseudo: number;
  totalSignals: number;
  totalFestEvents: number;
}

export interface HealthMetric {
  label: string;
  value: number;
  unit: string;
  score: number;
  description: string;
}

export function computeFestivalEnrichmentRate(total: number, enriched: number): number {
  if (total === 0) return 0;
  return Math.round((enriched / total) * 100);
}

export function computeProfileCompletionRate(totalUsers: number, usersWithPseudo: number): number {
  if (totalUsers === 0) return 0;
  return Math.round((usersWithPseudo / totalUsers) * 100);
}

export function computeSignalDensity(totalSignals: number, totalFestEvents: number): number {
  if (totalFestEvents === 0) return 0;
  return Math.round((totalSignals / totalFestEvents) * 10) / 10;
}

export function computeHealthScore(input: PlatformHealthInput): number {
  const enrichmentRate = computeFestivalEnrichmentRate(
    input.totalFestivals,
    input.enrichedFestivals,
  );
  const profileRate = computeProfileCompletionRate(input.totalUsers, input.usersWithPseudo);
  const density = computeSignalDensity(input.totalSignals, input.totalFestEvents);
  // Density capped at 10 signals/festEvent = 100 points
  const densityScore = Math.min(100, density * 10);

  // Weighted average: enrichment 40%, profiles 35%, signal density 25%
  return Math.round(enrichmentRate * 0.4 + profileRate * 0.35 + densityScore * 0.25);
}

export function getHealthScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Bon";
  if (score >= 40) return "Passable";
  return "Critique";
}

export function getHealthScoreColor(score: number): string {
  if (score >= 80) return "var(--primary-neon)";
  if (score >= 60) return "var(--secondary-cyan)";
  if (score >= 40) return "var(--warning-orange)";
  return "var(--danger-red)";
}

export function buildHealthMetrics(input: PlatformHealthInput): HealthMetric[] {
  const enrichmentRate = computeFestivalEnrichmentRate(
    input.totalFestivals,
    input.enrichedFestivals,
  );
  const profileRate = computeProfileCompletionRate(input.totalUsers, input.usersWithPseudo);
  const density = computeSignalDensity(input.totalSignals, input.totalFestEvents);

  return [
    {
      label: "Festivals enrichis",
      value: enrichmentRate,
      unit: "%",
      score: enrichmentRate,
      description: `${input.enrichedFestivals} / ${input.totalFestivals} festivals`,
    },
    {
      label: "Profils complétés",
      value: profileRate,
      unit: "%",
      score: profileRate,
      description: `${input.usersWithPseudo} / ${input.totalUsers} utilisateurs avec pseudo`,
    },
    {
      label: "Densité signaux",
      value: density,
      unit: "/ fest.",
      score: Math.min(100, density * 10),
      description: `${input.totalSignals} signaux pour ${input.totalFestEvents} fest events`,
    },
  ];
}
