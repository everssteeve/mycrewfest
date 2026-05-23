/**
 * Pure helpers for admin dashboard KPI display.
 * No DB access — fully unit-testable.
 */

export interface AdminKpiRaw {
  totalUsers: number;
  totalFestivals: number;
  pendingSubmissions: number;
  todaySignals: number;
  totalFestEvents: number;
}

export interface AdminKpiDisplay {
  label: string;
  value: number;
  color: string;
  dataTestid: string;
}

/**
 * Converts raw DB counts into display-ready KPI objects for the admin dashboard.
 */
export function buildAdminKpis(raw: AdminKpiRaw): AdminKpiDisplay[] {
  return [
    {
      label: "Utilisateurs",
      value: raw.totalUsers,
      color: "var(--secondary-cyan)",
      dataTestid: "admin-kpi-users",
    },
    {
      label: "Festivals",
      value: raw.totalFestivals,
      color: "var(--primary-neon)",
      dataTestid: "admin-kpi-festivals",
    },
    {
      label: "Soumissions en attente",
      value: raw.pendingSubmissions,
      color: raw.pendingSubmissions > 0 ? "var(--warning-orange)" : "var(--text-dim)",
      dataTestid: "admin-kpi-pending-submissions",
    },
    {
      label: "Signaux aujourd'hui",
      value: raw.todaySignals,
      color: raw.todaySignals > 0 ? "var(--accent-pink)" : "var(--text-dim)",
      dataTestid: "admin-kpi-today-signals",
    },
    {
      label: "Participations festival",
      value: raw.totalFestEvents,
      color: "var(--text-muted)",
      dataTestid: "admin-kpi-fest-events",
    },
  ];
}

/**
 * Returns true when the pending submission count warrants an alert badge
 * (more than 0 submissions waiting for review).
 */
export function hasPendingAlert(pendingSubmissions: number): boolean {
  return pendingSubmissions > 0;
}

/**
 * Formats a raw count as a display string.
 * Values ≥ 1000 are formatted as "1.2k", ≥ 1_000_000 as "1.2M".
 */
export function formatKpiValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}
