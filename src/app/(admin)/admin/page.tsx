import Link from "next/link";
import {
  buildHealthMetrics,
  computeHealthScore,
  getHealthScoreColor,
  getHealthScoreLabel,
} from "@/lib/admin-health";
import { buildAdminKpis, formatKpiValue, hasPendingAlert } from "@/lib/admin-stats";
import {
  computeDataQualityScore,
  getQualityGrade,
  getQualityGradeColor,
} from "@/lib/festival-data-quality";
import { prisma } from "@/lib/prisma";

async function getDashboardData() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalFestivals,
    pendingSubmissions,
    todaySignals,
    totalFestEvents,
    enrichedFestivals,
    usersWithPseudo,
    totalSignals,
    festivalQualityRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.festival.count(),
    prisma.festivalSubmission.count({ where: { status: "en_attente" } }),
    prisma.signal.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.festEvent.count(),
    prisma.festival.count({ where: { ingestionStatus: "enrichi" } }),
    prisma.user.count({ where: { pseudo: { not: null } } }),
    prisma.signal.count(),
    prisma.festival.findMany({
      select: {
        name: true,
        description: true,
        city: true,
        latitude: true,
        longitude: true,
        capacity: true,
        siteUrl: true,
        instagramHandle: true,
        programStatus: true,
        ingestionStatus: true,
        _count: { select: { events: true } },
      },
    }),
  ]);

  const avgQualityScore =
    festivalQualityRows.length === 0
      ? 0
      : Math.round(
          festivalQualityRows.reduce(
            (sum, f) =>
              sum +
              computeDataQualityScore({
                name: f.name,
                description: f.description,
                city: f.city,
                latitude: f.latitude,
                longitude: f.longitude,
                capacity: f.capacity,
                siteUrl: f.siteUrl,
                instagramHandle: f.instagramHandle,
                programStatus: f.programStatus,
                ingestionStatus: f.ingestionStatus,
                eventCount: f._count.events,
              }),
            0,
          ) / festivalQualityRows.length,
        );

  return {
    totalUsers,
    totalFestivals,
    pendingSubmissions,
    todaySignals,
    totalFestEvents,
    enrichedFestivals,
    usersWithPseudo,
    totalSignals,
    avgQualityScore,
  };
}

async function getUrgentProgramme() {
  const now = new Date();
  const in60days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  return prisma.festival.findMany({
    where: {
      programStatus: "bientôt_disponible",
      startDate: { gte: now, lte: in60days },
    },
    orderBy: { startDate: "asc" },
    take: 10,
    select: { id: true, name: true, slug: true, startDate: true },
  });
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
  const [raw, activity, urgentProgramme] = await Promise.all([
    getDashboardData(),
    getRecentActivity(),
    getUrgentProgramme(),
  ]);
  const kpis = buildAdminKpis(raw);
  const alertPending = hasPendingAlert(raw.pendingSubmissions);

  const healthInput = {
    totalFestivals: raw.totalFestivals,
    enrichedFestivals: raw.enrichedFestivals,
    totalUsers: raw.totalUsers,
    usersWithPseudo: raw.usersWithPseudo,
    totalSignals: raw.totalSignals,
    totalFestEvents: raw.totalFestEvents,
  };
  const healthScore = computeHealthScore(healthInput);
  const healthLabel = getHealthScoreLabel(healthScore);
  const healthColor = getHealthScoreColor(healthScore);
  const healthMetrics = buildHealthMetrics(healthInput);

  const qualityGrade = getQualityGrade(raw.avgQualityScore);
  const qualityColor = getQualityGradeColor(qualityGrade);

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
          gridTemplateColumns: "repeat(6, 1fr)",
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
        {/* Quality KPI */}
        <Link
          href="/admin/festivals/qualite"
          data-testid="admin-kpi-avg-quality"
          style={{
            background: "var(--bg-surface)",
            border: `1px solid ${qualityColor}44`,
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            textAlign: "center",
            textDecoration: "none",
            display: "block",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-2xl)",
              color: qualityColor,
              margin: 0,
              fontWeight: "var(--fw-bold)",
            }}
          >
            {qualityGrade}{" "}
            <span style={{ fontSize: "var(--fs-sm)", opacity: 0.7 }}>
              {raw.avgQualityScore}/100
            </span>
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
            Qualité moy.
          </p>
        </Link>
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
              {raw.pendingSubmissions} soumission{raw.pendingSubmissions > 1 ? "s" : ""} en attente
              de validation
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

      {/* Platform health */}
      <div
        data-testid="admin-health-section"
        style={{
          background: "var(--bg-surface)",
          border: `1px solid ${healthColor}`,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-lg)",
          marginBottom: "var(--space-xl)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            marginBottom: "var(--space-md)",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 2px",
              }}
            >
              Santé de la plateforme
            </h2>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)" }}>
              <span
                data-testid="admin-health-score"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-2xl)",
                  color: healthColor,
                  fontWeight: "var(--fw-bold)",
                }}
              >
                {healthScore}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-dim)",
                }}
              >
                / 100
              </span>
              <span
                data-testid="admin-health-label"
                style={{
                  padding: "2px 8px",
                  border: `1px solid ${healthColor}`,
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: healthColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginLeft: "var(--space-xs)",
                }}
              >
                {healthLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          data-testid="admin-health-metrics"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-md)" }}
        >
          {healthMetrics.map((m) => (
            <div
              key={m.label}
              style={{
                background: "var(--bg-darker)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-md)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-lg)",
                  color: "var(--text-main)",
                  margin: "0 0 2px",
                  fontWeight: "var(--fw-bold)",
                }}
              >
                {m.value}
                {m.unit}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 4px",
                }}
              >
                {m.label}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-dim)",
                  margin: 0,
                }}
              >
                {m.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Urgent programme */}
      {urgentProgramme.length > 0 && (
        <div
          data-testid="admin-urgent-programme"
          style={{
            background: "rgba(255,153,0,0.06)",
            border: "1px solid var(--warning-orange)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-lg)",
            marginBottom: "var(--space-xl)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-sm)",
              color: "var(--warning-orange)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 var(--space-md)",
            }}
          >
            Programme manquant — dans les 60 jours
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {urgentProgramme.map((f) => {
              const daysLeft = Math.ceil(
                (new Date(f.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
              );
              return (
                <div
                  key={f.id}
                  data-testid={`admin-urgent-programme-item-${f.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-sm)",
                  }}
                >
                  <Link
                    href={`/admin/festivals/${f.slug}/edit`}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--text-main)",
                      textDecoration: "none",
                    }}
                  >
                    {f.name}
                  </Link>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-xs)",
                      color: daysLeft <= 30 ? "var(--danger-red)" : "var(--warning-orange)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    J-{daysLeft}
                  </span>
                </div>
              );
            })}
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
          {
            href: "/admin/festivals",
            label: "Gérer les festivals",
            color: "var(--primary-neon)",
            desc: "Créer, éditer, vérifier",
          },
          {
            href: "/admin/submissions",
            label: "Soumissions",
            color: "var(--warning-orange)",
            desc: "Valider les propositions",
          },
          {
            href: "/admin/users",
            label: "Utilisateurs",
            color: "var(--secondary-cyan)",
            desc: "Gérer les comptes",
          },
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
          <div
            data-testid="admin-recent-festivals"
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}
          >
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
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-dim)",
                  margin: 0,
                }}
              >
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
          <div
            data-testid="admin-recent-users"
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}
          >
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
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-dim)",
                  margin: 0,
                }}
              >
                Aucun utilisateur.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
