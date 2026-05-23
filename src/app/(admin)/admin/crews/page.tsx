import { prisma } from "@/lib/prisma";
import {
  resolveCrewDisplayName,
  getCrewSizeTier,
  getCrewSizeTierColor,
  sortCrewsBySize,
  computeCrewStats,
  type AdminCrewRow,
} from "@/lib/admin-crews";

async function getAdminCrews(): Promise<AdminCrewRow[]> {
  const crews = await prisma.crew.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      createdAt: true,
      _count: {
        select: { members: true, festEvents: true },
      },
    },
  });

  return crews.map((c) => ({
    id: c.id,
    name: c.name,
    inviteCode: c.inviteCode,
    memberCount: c._count.members,
    festEventCount: c._count.festEvents,
    createdAt: c.createdAt,
  }));
}

export default async function AdminCrewsPage() {
  const raw = await getAdminCrews();
  const crews = sortCrewsBySize(raw);
  const stats = computeCrewStats(crews);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <h1
          data-testid="admin-crews-title"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-2xl)",
            color: "var(--text-main)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Crews
        </h1>
      </div>

      {/* KPIs */}
      <div
        data-testid="admin-crews-kpis"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {[
          { label: "Total crews", value: stats.total, color: "var(--text-main)", testid: "admin-crews-kpi-total" },
          { label: "Total membres", value: stats.totalMembers, color: "var(--secondary-cyan)", testid: "admin-crews-kpi-members" },
          { label: "Taille moy.", value: stats.avgSize, color: "var(--primary-neon)", testid: "admin-crews-kpi-avg" },
          { label: "Avec fest.", value: stats.withFestEvent, color: "var(--accent-pink)", testid: "admin-crews-kpi-withfest" },
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

      {/* Table */}
      <div
        data-testid="admin-crews-table"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              {["Crew", "Membres", "Taille", "FestEvents", "Créé le"].map((h) => (
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
            {crews.map((crew, i) => {
              const tier = getCrewSizeTier(crew.memberCount);
              const tierColor = getCrewSizeTierColor(tier);
              return (
                <tr
                  key={crew.id}
                  data-testid={`admin-crew-row-${crew.id}`}
                  style={{
                    borderBottom: i < crews.length - 1 ? "1px solid var(--border-color)" : "none",
                  }}
                >
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-sm)",
                        color: "var(--text-main)",
                        margin: 0,
                        fontWeight: "var(--fw-bold)",
                      }}
                    >
                      {resolveCrewDisplayName(crew.name, crew.id)}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-dim)",
                        margin: "2px 0 0",
                      }}
                    >
                      {crew.inviteCode.slice(0, 8)}…
                    </p>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-sm)",
                        color: "var(--text-main)",
                        fontWeight: "var(--fw-bold)",
                      }}
                    >
                      {crew.memberCount}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${tierColor}`,
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
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-xs)",
                        color: crew.festEventCount > 0 ? "var(--secondary-cyan)" : "var(--text-dim)",
                      }}
                    >
                      {crew.festEventCount}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-dim)",
                      }}
                    >
                      {crew.createdAt.toLocaleDateString("fr-FR")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {crews.length === 0 && (
          <div
            style={{
              padding: "var(--space-2xl)",
              textAlign: "center",
              color: "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
            }}
          >
            Aucun crew dans la base.
          </div>
        )}
      </div>
    </div>
  );
}
