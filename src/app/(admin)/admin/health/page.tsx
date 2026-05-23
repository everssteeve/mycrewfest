import {
  buildHealthMetrics,
  computeHealthScore,
  getHealthScoreColor,
  getHealthScoreLabel,
  type PlatformHealthInput,
} from "@/lib/admin-health";
import { prisma } from "@/lib/prisma";

async function getPlatformHealthInput(): Promise<PlatformHealthInput> {
  const [
    totalFestivals,
    enrichedFestivals,
    totalUsers,
    usersWithPseudo,
    totalSignals,
    totalFestEvents,
  ] = await Promise.all([
    prisma.festival.count(),
    prisma.festival.count({
      where: { ingestionStatus: { not: "détecté" } },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { pseudo: { not: null } } }),
    prisma.signal.count(),
    prisma.festEvent.count(),
  ]);

  return {
    totalFestivals,
    enrichedFestivals,
    totalUsers,
    usersWithPseudo,
    totalSignals,
    totalFestEvents,
  };
}

export default async function AdminHealthPage() {
  const input = await getPlatformHealthInput();
  const score = computeHealthScore(input);
  const label = getHealthScoreLabel(score);
  const color = getHealthScoreColor(score);
  const metrics = buildHealthMetrics(input);

  return (
    <div>
      <h1
        data-testid="admin-health-title"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-2xl)",
          color: "var(--text-main)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          margin: "0 0 var(--space-lg)",
        }}
      >
        Santé de la plateforme
      </h1>

      {/* Score global */}
      <div
        data-testid="admin-health-score"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-sm)",
          padding: "var(--space-2xl)",
          marginBottom: "var(--space-xl)",
          background: "var(--bg-surface)",
          border: `2px solid ${color}`,
          borderRadius: "var(--radius-md)",
          boxShadow: `0 0 32px ${color}33`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: `4px solid ${color}`,
            boxShadow: `0 0 24px ${color}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-darker)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-2xl)",
              color: color,
              fontWeight: "var(--fw-bold)",
              lineHeight: 1,
            }}
          >
            {score}
          </span>
        </div>

        <div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-xl)",
              color: color,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 4px",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            Score global sur 100
          </p>
        </div>
      </div>

      {/* Métriques détaillées */}
      <div
        data-testid="admin-health-metrics"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-md)",
        }}
      >
        {metrics.map((metric) => {
          const metricColor = getHealthScoreColor(metric.score);

          return (
            <div
              key={metric.label}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-lg)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
              }}
            >
              {/* Label */}
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: "var(--fw-bold)",
                  margin: 0,
                }}
              >
                {metric.label}
              </p>

              {/* Valeur */}
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-2xl)",
                  color: metricColor,
                  fontWeight: "var(--fw-bold)",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {metric.value}
                <span
                  style={{
                    fontSize: "var(--fs-sm)",
                    color: "var(--text-dim)",
                    marginLeft: 4,
                  }}
                >
                  {metric.unit}
                </span>
              </p>

              {/* Barre de progression */}
              <div
                style={{
                  height: 4,
                  background: "var(--border-color)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, metric.score)}%`,
                    background: metricColor,
                    boxShadow: `0 0 8px ${metricColor}88`,
                    borderRadius: 2,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              {/* Description */}
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-dim)",
                  margin: 0,
                }}
              >
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
