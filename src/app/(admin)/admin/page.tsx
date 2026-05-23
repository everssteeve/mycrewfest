import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildAdminKpis, hasPendingAlert, formatKpiValue } from "@/lib/admin-stats";

async function getDashboardData() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalUsers, totalFestivals, pendingSubmissions, todaySignals, totalFestEvents] =
    await Promise.all([
      prisma.user.count(),
      prisma.festival.count(),
      prisma.festivalSubmission.count({ where: { status: "en_attente" } }),
      prisma.signal.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.festEvent.count(),
    ]);

  return { totalUsers, totalFestivals, pendingSubmissions, todaySignals, totalFestEvents };
}

async function getRecentActivity() {
  const [recentFestivals, recentUsers] = await Promise.all([
    prisma.festival.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, ingestionStatus: true, createdAt: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, pseudo: true, role: true, createdAt: true },
    }),
  ]);
  return { recentFestivals, recentUsers };
}

export default async function AdminDashboardPage() {
  const [raw, activity] = await Promise.all([getDashboardData(), getRecentActivity()]);
  const kpis = buildAdminKpis(raw);
  const alertPending = hasPendingAlert(raw.pendingSubmissions);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <h1
          data-testid="admin-dashboard-title"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-2xl)",
            color: "var(--text-main)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: "0 0 var(--space-xs)",
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-dim)",
            margin: 0,
          }}
        >
          Vue d'ensemble de la plateforme MyCrewFest
        </p>
      </div>

      {/* KPI grid */}
      <div
        data-testid="admin-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.dataTestid}
            data-testid={kpi.dataTestid}
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
              {formatKpiValue(kpi.value)}
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

      {/* Pending alert */}
      {alertPending && (
        <div
          data-testid="admin-pending-alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            background: "rgba(255,153,0,0.08)",
            border: "1px solid var(--warning-orange)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md) var(--space-lg)",
            marginBottom: "var(--space-xl)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-lg)",
              color: "var(--warning-orange)",
              fontWeight: "var(--fw-bold)",
            }}
          >
            ⚠
          </span>
          <div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                color: "var(--warning-orange)",
                fontWeight: "var(--fw-bold)",
                margin: 0,
              }}
            >
              {raw.pendingSubmissions} soumission{raw.pendingSubmissions > 1 ? "s" : ""} en attente de validation
            </p>
            <Link
              href="/admin/submissions"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
                textDecoration: "underline",
              }}
            >
              Voir les soumissions →
            </Link>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-md)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {[
          { href: "/admin/festivals", label: "Gérer les festivals", color: "var(--primary-neon)", desc: "Créer, éditer, vérifier" },
          { href: "/admin/submissions", label: "Soumissions", color: "var(--warning-orange)", desc: "Valider les propositions" },
          { href: "/admin/users", label: "Utilisateurs", color: "var(--secondary-cyan)", desc: "Gérer les comptes" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            data-testid={`admin-quicklink-${link.href.split("/").pop()}`}
            style={{
              display: "block",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-lg)",
              textDecoration: "none",
              transition: "var(--transition-fast)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-base)",
                color: link.color,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 4px",
              }}
            >
              {link.label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
                margin: 0,
              }}
            >
              {link.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)" }}>
        {/* Recent festivals */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-lg)",
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
            Derniers festivals
          </h2>
          <div data-testid="admin-recent-festivals" style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {activity.recentFestivals.map((f) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-sm)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--text-main)",
                      margin: 0,
                    }}
                  >
                    {f.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-dim)",
                      margin: "2px 0 0",
                    }}
                  >
                    {new Date(f.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  style={{
                    padding: "2px 6px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.ingestionStatus}
                </span>
              </div>
            ))}
            {activity.recentFestivals.length === 0 && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-dim)", margin: 0 }}>
                Aucun festival.
              </p>
            )}
          </div>
        </div>

        {/* Recent users */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-lg)",
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
            Derniers utilisateurs
          </h2>
          <div data-testid="admin-recent-users" style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {activity.recentUsers.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-sm)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--text-main)",
                      margin: 0,
                    }}
                  >
                    {u.pseudo ?? u.name ?? u.email}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-dim)",
                      margin: "2px 0 0",
                    }}
                  >
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {u.role === "admin" && (
                  <span
                    style={{
                      padding: "2px 6px",
                      background: "rgba(255,153,0,0.12)",
                      border: "1px solid var(--warning-orange)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--warning-orange)",
                      textTransform: "uppercase",
                    }}
                  >
                    Admin
                  </span>
                )}
              </div>
            ))}
            {activity.recentUsers.length === 0 && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-dim)", margin: 0 }}>
                Aucun utilisateur.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
