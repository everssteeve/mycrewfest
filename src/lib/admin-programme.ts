export type ProgramStatus = "complet" | "partiel" | "bientôt_disponible";

export interface AdminProgramRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  startDate: string;
  programStatus: string;
  eventCount: number;
}

export const PROGRAM_STATUS_VALUES: ProgramStatus[] = [
  "complet",
  "partiel",
  "bientôt_disponible",
];

export function getProgramStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    complet: "Complet",
    partiel: "Partiel",
    bientôt_disponible: "Bientôt dispo",
  };
  return labels[status] ?? status;
}

export function getProgramStatusColor(status: string): string {
  const colors: Record<string, string> = {
    complet: "var(--primary-neon)",
    partiel: "var(--warning-orange)",
    bientôt_disponible: "var(--text-dim)",
  };
  return colors[status] ?? "var(--text-dim)";
}

export function countFestivalsByProgramStatus(
  festivals: AdminProgramRow[],
): Record<ProgramStatus, number> {
  const counts: Record<ProgramStatus, number> = {
    complet: 0,
    partiel: 0,
    bientôt_disponible: 0,
  };
  for (const f of festivals) {
    const key = f.programStatus as ProgramStatus;
    if (key in counts) counts[key]++;
  }
  return counts;
}

export function filterIncompleteProgram(festivals: AdminProgramRow[]): AdminProgramRow[] {
  return festivals.filter((f) => f.programStatus !== "complet");
}

export function sortByStartDate(festivals: AdminProgramRow[]): AdminProgramRow[] {
  return [...festivals].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );
}

export function filterByStatus(
  festivals: AdminProgramRow[],
  status: ProgramStatus | "all",
): AdminProgramRow[] {
  if (status === "all") return festivals;
  return festivals.filter((f) => f.programStatus === status);
}
