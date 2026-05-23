import { prisma } from "@/lib/prisma";
import {
  countSignalsByScope,
  countActiveSignals,
  sortSignalsByRecency,
  type AdminSignalRow,
} from "@/lib/admin-signals";
import { SignalsScopeFilter } from "./_components/signals-scope-filter";

async function getSignals(): Promise<AdminSignalRow[]> {
  const rows = await prisma.signal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, pseudo: true, email: true } },
      festival: { select: { name: true, slug: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    scope: r.scope,
    description: r.description,
    predefinedPhrase: r.predefinedPhrase,
    confirmations: r.confirmations,
    infirmations: r.infirmations,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    author: r.author,
    festival: r.festival,
  }));
}

export default async function AdminSignalsPage() {
  const signals = await getSignals();
  const sorted = sortSignalsByRecency(signals);
  const scopeCounts = countSignalsByScope(signals);
  const activeCount = countActiveSignals(signals);

  return (
    <div>
      <h1
        data-testid="admin-signals-title"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-2xl)",
          color: "var(--text-main)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          margin: "0 0 var(--space-lg)",
        }}
      >
        Signaux communautaires
      </h1>

      {/* KPIs */}
      <div
        data-testid="admin-signals-kpis"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {[
          {
            label: "Total",
            value: signals.length,
            color: "var(--text-main)",
            testid: "admin-signals-kpi-total",
          },
          {
            label: "Actifs",
            value: activeCount,
            color: "var(--primary-neon)",
            testid: "admin-signals-kpi-active",
          },
          {
            label: "Communauté",
            value: scopeCounts["communauté"] ?? 0,
            color: "var(--primary-neon)",
            testid: "admin-signals-kpi-community",
          },
          {
            label: "Crew",
            value: scopeCounts["crew"] ?? 0,
            color: "var(--secondary-cyan)",
            testid: "admin-signals-kpi-crew",
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

      <SignalsScopeFilter signals={sorted} />
    </div>
  );
}
