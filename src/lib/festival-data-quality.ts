export interface FestivalQualityInput {
  name: string;
  description: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  siteUrl: string | null;
  instagramHandle: string | null;
  programStatus: string;
  ingestionStatus: string;
  eventCount: number;
}

export interface QualityCheck {
  key: string;
  label: string;
  passed: boolean;
  weight: number;
}

const CHECKS: Array<{
  key: string;
  label: string;
  weight: number;
  test: (f: FestivalQualityInput) => boolean;
}> = [
  { key: "events",       label: "Programme renseigné",      weight: 30, test: (f) => f.eventCount > 0 },
  { key: "programStatus",label: "Programme complet",         weight: 20, test: (f) => f.programStatus === "complet" },
  { key: "description",  label: "Description présente",     weight: 15, test: (f) => (f.description?.trim().length ?? 0) > 20 },
  { key: "coordinates",  label: "Coordonnées GPS",           weight: 10, test: (f) => f.latitude != null && f.longitude != null },
  { key: "capacity",     label: "Capacité renseignée",       weight: 10, test: (f) => f.capacity != null },
  { key: "website",      label: "Site officiel",             weight: 8,  test: (f) => (f.siteUrl?.trim().length ?? 0) > 0 },
  { key: "instagram",    label: "Instagram",                  weight: 7,  test: (f) => (f.instagramHandle?.trim().length ?? 0) > 0 },
];

const TOTAL_WEIGHT = CHECKS.reduce((s, c) => s + c.weight, 0);

export function runQualityChecks(festival: FestivalQualityInput): QualityCheck[] {
  return CHECKS.map((c) => ({
    key: c.key,
    label: c.label,
    passed: c.test(festival),
    weight: c.weight,
  }));
}

export function computeDataQualityScore(festival: FestivalQualityInput): number {
  const earned = runQualityChecks(festival)
    .filter((c) => c.passed)
    .reduce((s, c) => s + c.weight, 0);
  return Math.round((earned / TOTAL_WEIGHT) * 100);
}

export type QualityGrade = "A" | "B" | "C" | "D";

export function getQualityGrade(score: number): QualityGrade {
  if (score >= 80) return "A";
  if (score >= 55) return "B";
  if (score >= 30) return "C";
  return "D";
}

export function getQualityGradeColor(grade: QualityGrade): string {
  switch (grade) {
    case "A": return "var(--primary-neon)";
    case "B": return "var(--secondary-cyan)";
    case "C": return "var(--warning-orange)";
    case "D": return "var(--danger-red)";
  }
}

export function countByGrade(
  festivals: Array<{ score: number }>,
): Record<QualityGrade, number> {
  const result: Record<QualityGrade, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const f of festivals) {
    result[getQualityGrade(f.score)]++;
  }
  return result;
}
