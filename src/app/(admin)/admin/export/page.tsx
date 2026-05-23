import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { ExportButton } from "./_components/export-button";

export const metadata: Metadata = {
  title: "Export — Admin MyCrewFest",
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") redirect("/catalogue");
}

async function getExportStats() {
  const [festivalCount, userCount, signalCount, submissionCount] =
    await Promise.all([
      prisma.festival.count(),
      prisma.user.count(),
      prisma.signal.count(),
      prisma.festivalSubmission.count(),
    ]);
  return { festivalCount, userCount, signalCount, submissionCount };
}

export default async function AdminExportPage() {
  await requireAdmin();
  const stats = await getExportStats();

  const exports = [
    {
      id: "festivals",
      label: "Festivals",
      description: `${stats.festivalCount} festival${stats.festivalCount !== 1 ? "s" : ""} — nom, slug, type, dates, ville, statut`,
      apiPath: "/api/admin/export/festivals",
      filename: "festivals.csv",
      icon: "🎪",
    },
    {
      id: "users",
      label: "Utilisateurs",
      description: `${stats.userCount} utilisateur${stats.userCount !== 1 ? "s" : ""} — email, pseudo, rôle, date d'inscription`,
      apiPath: "/api/admin/export/users",
      filename: "utilisateurs.csv",
      icon: "👥",
    },
  ];

  return (
    <div
      style={{
        padding: "var(--space-lg, 24px)",
        maxWidth: 720,
        fontFamily: "var(--font-body, sans-serif)",
        color: "var(--text-primary, #F0F0F0)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "var(--space-xl, 32px)" }}>
        <h1
          data-testid="admin-export-title"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "1.5rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Export de données
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "0.85rem",
            color: "var(--text-dim, #666)",
          }}
        >
          Exportez les données de la plateforme au format CSV.
        </p>
      </div>

      {/* KPI row */}
      <div
        data-testid="admin-export-kpis"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "var(--space-sm, 8px)",
          marginBottom: "var(--space-xl, 32px)",
        }}
      >
        {[
          { label: "Festivals", value: stats.festivalCount, color: "var(--accent-pink, #FF007A)" },
          { label: "Utilisateurs", value: stats.userCount, color: "var(--primary-neon, #00FF66)" },
          { label: "Signaux", value: stats.signalCount, color: "var(--secondary-cyan, #00E5FF)" },
          { label: "Soumissions", value: stats.submissionCount, color: "var(--warning-orange, #FF9900)" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "var(--bg-card, #141519)",
              border: "1px solid var(--border-subtle, #1E1F26)",
              borderRadius: 12,
              padding: "12px 16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: kpi.color,
                margin: 0,
              }}
            >
              {kpi.value}
            </p>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-dim, #666)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "4px 0 0",
              }}
            >
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* Export cards */}
      <div
        data-testid="admin-export-list"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        {exports.map((exp) => (
          <div
            key={exp.id}
            data-testid={`admin-export-card-${exp.id}`}
            style={{
              background: "var(--bg-card, #141519)",
              border: "1px solid var(--border-subtle, #1E1F26)",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "var(--font-display, sans-serif)",
                  fontSize: "1rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  margin: 0,
                }}
              >
                {exp.icon} {exp.label}
              </p>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-dim, #666)",
                  margin: "4px 0 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {exp.description}
              </p>
            </div>
            <ExportButton
              apiPath={exp.apiPath}
              filename={exp.filename}
              testId={`admin-export-${exp.id}`}
            />
          </div>
        ))}
      </div>

      {/* Note */}
      <p
        style={{
          marginTop: 24,
          fontSize: "0.75rem",
          color: "var(--text-dim, #666)",
        }}
      >
        Les exports sont générés en temps réel depuis la base de données. Format : CSV UTF-8.
      </p>
    </div>
  );
}
