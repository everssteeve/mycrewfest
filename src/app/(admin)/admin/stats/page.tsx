import { prisma } from "@/lib/prisma";
import {
  sortFestivalsByEngagement,
  getEngagementTier,
  getEngagementTierColor,
  computeFestivalEngagementScore,
  computeTotalEngagement,
  type TopFestivalEntry,
} from "@/lib/admin-platform-stats";

async function getPlatformStats() {
  const [
    totalSignals,
    totalSouvenirs,
    totalSelections,
    totalCrews,
    topFestivalsRaw,
    signalsByDay,
  ] = await Promise.all([
    prisma.signal.count(),
    prisma.souvenir.count(),
    prisma.selection.count(),
    prisma.crew.count(),
    prisma.festival.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            followers: true,
            festEvents: true,
          },
        },
      },
    }),
    // Last 7 days signal counts
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT DATE(createdAt) as day, COUNT(*) as count
      FROM Signal
      WHERE createdAt >= datetime('now', '-7 days')
      GROUP BY DATE(createdAt)
      ORDER BY day ASC
    `,
  ]);

  const topFestivals: TopFestivalEntry[] = topFestivalsRaw.map((f) => ({
    id: f.id,
    name: f.name,
    followersCount: f._count.followers,
    festEventsCount: f._count.festEvents,
  }));

  return {
    activity: { totalSignals, totalSouvenirs, totalSelections, totalCrews },
    topFestivals: sortFestivalsByEngagement(topFestivals),
    signalsByDay: signalsByDay.map((r) => ({
      day: String(r.day),
      count: Number(r.count),
    })),
    totalEngagement: computeTotalEngagement(topFestivals),
  };
}

export default async function AdminStatsPage() {
  const stats = await getPlatformStats();

  return (
    <div>
      <h1
        data-testid="admin-stats-title"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-2xl)",
          color: "var(--text-main)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          margin: "0 0 var(--space-xl)",
        }}
      >
        Statistiques plateforme
      </h1>

      {/* Activity summary */}
      <div
        data-testid="admin-stats-activity"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {[
          { label: "Signaux total", value: stats.activity.totalSignals, color: "var(--accent-pink)", testid: "admin-stat-signals" },
          { label: "Souvenirs", value: stats.activity.totalSouvenirs, color: "var(--secondary-cyan)", testid: "admin-stat-souvenirs" },
          { label: "Sélections", value: stats.activity.totalSelections, color: "var(--primary-neon)", testid: "admin-stat-selections" },
          { label: "Crews actifs", value: stats.activity.totalCrews, color: "var(--warning-orange)", testid: "admin-stat-crews" },
        ].map((s) => (
          <div
            key={s.testid}
            data-testid={s.testid}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-md)",
              textAlign: "center",
            }}
          >
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-2xl)", color: s.color, margin: 0, fontWeight: "var(--fw-bold)" }}>
              {s.value}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "4px 0 0" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Signals per day (last 7 days) */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-lg)",
          marginBottom: "var(--space-xl)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: "0 0 var(--space-md)",
          }}
        >
          Signaux — 7 derniers jours
        </h2>
        <div
          data-testid="admin-stats-signals-chart"
          style={{ display: "flex", gap: "var(--space-sm)", alignItems: "flex-end", height: 80 }}
        >
          {stats.signalsByDay.length === 0 ? (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-dim)", margin: 0 }}>
              Aucun signal cette semaine.
            </p>
          ) : (
            stats.signalsByDay.map((row) => {
              const max = Math.max(...stats.signalsByDay.map((r) => r.count), 1);
              const heightPct = Math.max(4, Math.round((row.count / max) * 100));
              return (
                <div
                  key={row.day}
                  title={`${row.day}: ${row.count} signal${row.count > 1 ? "s" : ""}`}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)" }}>
                    {row.count}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      height: `${heightPct}%`,
                      background: "var(--accent-pink)",
                      borderRadius: "2px 2px 0 0",
                      opacity: 0.8,
                    }}
                  />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-dim)" }}>
                    {new Date(row.day + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top festivals by engagement */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-lg)", borderBottom: "1px solid var(--border-color)" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: 0,
            }}
          >
            Festivals par engagement
          </h2>
          <span
            data-testid="admin-stats-total-engagement"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-dim)",
            }}
          >
            Score total : {stats.totalEngagement}
          </span>
        </div>
        <table
          data-testid="admin-stats-festivals-table"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              {["Festival", "Abonnés", "Participations", "Score", "Tier"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "var(--space-sm) var(--space-md)",
                    textAlign: "left",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: "var(--fw-bold)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.topFestivals.map((f, i) => {
              const score = computeFestivalEngagementScore(f);
              const tier = getEngagementTier(score);
              const tierColor = getEngagementTierColor(tier);
              return (
                <tr
                  key={f.id}
                  data-testid={`admin-festival-stat-row-${f.id}`}
                  style={{ borderBottom: i < stats.topFestivals.length - 1 ? "1px solid var(--border-color)" : "none" }}
                >
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-main)", fontWeight: "var(--fw-bold)" }}>
                      {f.name}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>
                      {f.followersCount}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: "var(--text-dim)" }}>
                      {f.festEventsCount}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: tierColor, fontWeight: "var(--fw-bold)" }}>
                      {score}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        border: `1px solid ${tierColor}`,
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-xs)",
                        color: tierColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {tier}
                    </span>
                  </td>
                </tr>
              );
            })}
            {stats.topFestivals.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: "var(--space-2xl)", textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)" }}
                >
                  Aucune donnée d'engagement.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
