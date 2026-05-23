import { prisma } from "@/lib/prisma";
import {
  computeSouvenirStats,
  sortSouvenirsByDate,
  topContributors,
  type AdminSouvenirRow,
} from "@/lib/admin-souvenirs";
import { parseJsonArray } from "@/lib/api";

export const metadata = { title: "Admin — Souvenirs" };

async function getSouvenirs(): Promise<AdminSouvenirRow[]> {
  const rows = await prisma.souvenir.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, pseudo: true, email: true } },
      festEvent: {
        include: {
          festival: { select: { name: true, slug: true } },
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.pseudo ?? r.user.name ?? r.user.email,
    festivalName: r.festEvent.festival.name,
    festivalSlug: r.festEvent.festival.slug,
    freeText: r.freeText,
    note: r.note,
    hasPhotos: (() => {
      const photos = parseJsonArray(r.photos);
      return Array.isArray(photos) && photos.length > 0;
    })(),
    shareWithCrew: r.shareWithCrew,
    createdAt: r.createdAt.toISOString(),
  }));
}

export default async function AdminSouvenirsPage() {
  const rawSouvenirs = await getSouvenirs();
  const souvenirs = sortSouvenirsByDate(rawSouvenirs);
  const stats = computeSouvenirStats(souvenirs);
  const contributors = topContributors(souvenirs, 5);

  const kpis = [
    { label: "Total", value: stats.total, color: "var(--secondary-cyan)", testid: "admin-souvenirs-kpi-total" },
    { label: "Avec texte", value: stats.withText, color: "var(--primary-neon)", testid: "admin-souvenirs-kpi-text" },
    { label: "Avec photos", value: stats.withPhotos, color: "var(--accent-pink)", testid: "admin-souvenirs-kpi-photos" },
    { label: "Partagés", value: stats.sharedWithCrew, color: "var(--warning-orange)", testid: "admin-souvenirs-kpi-shared" },
  ];

  return (
    <main
      style={{
        padding: "24px 20px 80px",
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "var(--font-body, sans-serif)",
        color: "var(--text-primary, #F0F0F0)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          data-testid="admin-souvenirs-title"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "1.4rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          Souvenirs
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--text-dim, #666)" }}>
          Contenus générés par les festivaliers
        </p>
      </div>

      {/* KPIs */}
      <div
        data-testid="admin-souvenirs-kpis"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 28 }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.testid}
            data-testid={kpi.testid}
            style={{
              background: "var(--bg-card, #141519)",
              border: `1px solid ${kpi.color}40`,
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, fontFamily: "var(--font-mono, monospace)", color: kpi.color }}>
              {kpi.value}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "var(--text-dim, #666)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      {/* Top contributors */}
      {contributors.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "0.85rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 12px",
              color: "var(--secondary-cyan, #00E5FF)",
            }}
          >
            Top contributeurs
          </h2>
          <div
            data-testid="admin-souvenirs-contributors"
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
          >
            {contributors.map((c, i) => (
              <div
                key={c.userId}
                style={{
                  background: "var(--bg-card, #141519)",
                  border: "1px solid var(--border-subtle, #1E1F26)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "0.75rem",
                      color: "var(--text-dim, #666)",
                      minWidth: 20,
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{c.userName}</span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.85rem",
                    color: "var(--secondary-cyan, #00E5FF)",
                    fontWeight: 700,
                  }}
                >
                  {c.count} souvenir{c.count > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Souvenirs list */}
      {souvenirs.length === 0 ? (
        <div
          data-testid="admin-souvenirs-empty"
          style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim, #666)" }}
        >
          <p>Aucun souvenir pour le moment.</p>
        </div>
      ) : (
        <section>
          <h2
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "0.85rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 12px",
              color: "var(--text-dim, #666)",
            }}
          >
            Tous les souvenirs ({souvenirs.length})
          </h2>
          <div
            data-testid="admin-souvenirs-list"
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {souvenirs.map((s) => (
              <div
                key={s.id}
                data-testid={`admin-souvenir-${s.id}`}
                style={{
                  background: "var(--bg-card, #141519)",
                  border: "1px solid var(--border-subtle, #1E1F26)",
                  borderRadius: 10,
                  padding: "12px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{s.userName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--text-dim, #666)" }}>
                      {s.festivalName} · {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {s.hasPhotos && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: "rgba(255,0,122,0.1)",
                          color: "var(--accent-pink, #FF007A)",
                          border: "1px solid rgba(255,0,122,0.3)",
                        }}
                      >
                        📷 Photos
                      </span>
                    )}
                    {s.shareWithCrew && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: "rgba(0,229,255,0.08)",
                          color: "var(--secondary-cyan, #00E5FF)",
                          border: "1px solid rgba(0,229,255,0.3)",
                        }}
                      >
                        Crew
                      </span>
                    )}
                  </div>
                </div>
                {(s.freeText || s.note) && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "0.82rem",
                      color: "var(--text-muted, #888)",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {s.freeText ?? s.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
