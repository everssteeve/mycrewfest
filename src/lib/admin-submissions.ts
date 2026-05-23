export type SubmissionStatus = "en_attente" | "en_traitement" | "ajouté" | "rejeté";

export interface AdminSubmissionRow {
  id: string;
  nameProposed: string;
  status: string;
  submittedAt: Date;
}

export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  en_attente: "var(--warning-orange)",
  en_traitement: "var(--secondary-cyan)",
  ajouté: "var(--primary-neon)",
  rejeté: "var(--danger-red)",
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  en_attente: "En attente",
  en_traitement: "En traitement",
  ajouté: "Ajouté",
  rejeté: "Rejeté",
};

export function getSubmissionStatusColor(status: string): string {
  return SUBMISSION_STATUS_COLORS[status as SubmissionStatus] ?? "var(--border-color)";
}

export function getSubmissionStatusLabel(status: string): string {
  return SUBMISSION_STATUS_LABELS[status as SubmissionStatus] ?? status;
}

export function countSubmissionsByStatus(
  submissions: AdminSubmissionRow[],
): Record<SubmissionStatus, number> {
  const counts: Record<SubmissionStatus, number> = {
    en_attente: 0,
    en_traitement: 0,
    ajouté: 0,
    rejeté: 0,
  };
  for (const sub of submissions) {
    if (sub.status in counts) {
      counts[sub.status as SubmissionStatus]++;
    }
  }
  return counts;
}

export function isSubmissionActionable(status: string): boolean {
  return status === "en_attente" || status === "en_traitement";
}

export function isSubmissionPendingOnly(status: string): boolean {
  return status === "en_attente";
}

/**
 * Filters submissions by status. Null status returns all.
 */
export function filterSubmissionsByStatus<T extends { status: string }>(
  submissions: T[],
  status: string | null,
): T[] {
  if (!status) return submissions;
  return submissions.filter((s) => s.status === status);
}

export function buildSubmissionSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
