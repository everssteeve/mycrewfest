import { type ActivityEntry, countActivityByType } from "@/lib/admin-activity";
import { prisma } from "@/lib/prisma";
import { ActivityFilter } from "./_components/activity-filter";

const LIMIT = 50;

async function getActivityEntries(): Promise<ActivityEntry[]> {
  const [users, signals, submissions, festivals] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: { id: true, pseudo: true, name: true, email: true, createdAt: true },
    }),
    prisma.signal.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: { id: true, scope: true, discoveryType: true, createdAt: true },
    }),
    prisma.festivalSubmission.findMany({
      orderBy: { submittedAt: "desc" },
      take: LIMIT,
      select: { id: true, nameProposed: true, status: true, submittedAt: true },
    }),
    prisma.festival.findMany({
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: { id: true, name: true, ingestionStatus: true, createdAt: true },
    }),
  ]);

  const entries: ActivityEntry[] = [
    ...users.map((u) => ({
      id: `user_${u.id}`,
      type: "user_signup" as const,
      label: "Nouvel utilisateur inscrit",
      detail: u.pseudo ?? u.name ?? u.email,
      occurredAt: u.createdAt,
    })),
    ...signals.map((s) => ({
      id: `signal_${s.id}`,
      type: "signal_posted" as const,
      label: "Signal posté",
      detail: [s.scope, s.discoveryType].filter(Boolean).join(" · ") || "Signal communauté",
      occurredAt: s.createdAt,
    })),
    ...submissions.map((sub) => ({
      id: `submission_${sub.id}`,
      type: "submission_received" as const,
      label: "Soumission de festival reçue",
      detail: `${sub.nameProposed} — ${sub.status}`,
      occurredAt: sub.submittedAt,
    })),
    ...festivals.map((f) => ({
      id: `festival_${f.id}`,
      type: "festival_detected" as const,
      label: "Festival détecté",
      detail: `${f.name} (${f.ingestionStatus})`,
      occurredAt: f.createdAt,
    })),
  ];

  return entries;
}

export default async function AdminActivityPage() {
  const entries = await getActivityEntries();
  const counts = countActivityByType(entries);
  const total = entries.length;

  const serialized = entries.map((e) => ({
    ...e,
    occurredAt: e.occurredAt.toISOString(),
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <h1
          data-testid="admin-activity-title"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-2xl)",
            color: "var(--text-main)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: "0 0 var(--space-xs)",
          }}
        >
          Activité récente
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-dim)",
            margin: 0,
          }}
        >
          Agrégation des {LIMIT} derniers événements par type
        </p>
      </div>

      {/* KPI strip */}
      <div
        data-testid="admin-activity-kpis"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {[
          {
            label: "Inscriptions",
            value: counts.user_signup,
            color: "var(--secondary-cyan)",
            testid: "admin-activity-kpi-signups",
          },
          {
            label: "Signaux",
            value: counts.signal_posted,
            color: "var(--primary-neon)",
            testid: "admin-activity-kpi-signals",
          },
          {
            label: "Soumissions",
            value: counts.submission_received,
            color: "var(--warning-orange)",
            testid: "admin-activity-kpi-submissions",
          },
          {
            label: "Festivals",
            value: counts.festival_detected,
            color: "var(--accent-pink)",
            testid: "admin-activity-kpi-festivals",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            data-testid={kpi.testid}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-md)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-2xl)",
                color: kpi.color,
                margin: 0,
                fontWeight: "var(--fw-bold)",
              }}
            >
              {kpi.value}
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
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

      {total === 0 && (
        <p
          style={{
            color: "var(--text-dim)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            textAlign: "center",
            padding: "var(--space-2xl) 0",
          }}
        >
          Aucune activité enregistrée.
        </p>
      )}

      {total > 0 && <ActivityFilter entries={serialized} />}
    </div>
  );
}
