import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  computeDataQualityScore,
  getQualityGrade,
  getQualityGradeColor,
  runQualityChecks,
  countByGrade,
  type FestivalQualityInput,
} from "@/lib/festival-data-quality";

export const metadata = { title: "Admin — Qualité données" };

async function getFestivals() {
  const rows = await prisma.festival.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
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
  });

  return rows.map((r) => {
    const input: FestivalQualityInput = {
      name: r.name,
      description: r.description,
      city: r.city,
      latitude: r.latitude,
      longitude: r.longitude,
      capacity: r.capacity,
      siteUrl: r.siteUrl,
      instagramHandle: r.instagramHandle,
      programStatus: r.programStatus,
      ingestionStatus: r.ingestionStatus,
      eventCount: r._count.events,
    };
    const score = computeDataQualityScore(input);
    const grade = getQualityGrade(score);
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      score,
      grade,
      checks: runQualityChecks(input),
    };
  });
}

export default async function AdminFestivalQualitePage() {
  const festivals = await getFestivals();
  const sorted = [...festivals].sort((a, b) => a.score - b.score);
  const gradeCounts = countByGrade(festivals.map((f) => ({ score: f.score })));

  return (
    <div>
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <Link
          href="/admin/festivals"
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
            textDecoration: "none",
            display: "block",
            marginBottom: 4,
          }}
        >
          ← Festivals
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-2xl)",
            color: "var(--text-main)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Qualité des données
        </h1>
      </div>

      {/* Grade distribution */}
      <div
        data-testid="quality-grade-distribution"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-lg)",
        }}
      >
        {(["A", "B", "C", "D"] as const).map((grade) => (
          <div
            key={grade}
            data-testid={`quality-grade-${grade}`}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: `1px solid ${getQualityGradeColor(grade)}44`,
              borderRadius: "var(--radius-md)",
              padding: "var(--space-md)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "var(--fs-2xl)",
                fontFamily: "var(--font-display)",
                color: getQualityGradeColor(grade),
                margin: 0,
                fontWeight: 900,
                letterSpacing: "0.05em",
              }}
            >
              {grade}
            </p>
            <p
              style={{
                fontSize: "var(--fs-lg)",
                fontFamily: "var(--font-mono)",
                color: getQualityGradeColor(grade),
                margin: "4px 0 0",
                fontWeight: 700,
              }}
            >
              {gradeCounts[grade]}
            </p>
          </div>
        ))}
      </div>

      {/* Festival list — worst quality first */}
      <div
        data-testid="quality-festival-list"
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}
      >
        {sorted.map((f) => (
          <details
            key={f.id}
            data-testid={`quality-row-${f.id}`}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-md)",
                padding: "12px 16px",
                cursor: "pointer",
                listStyle: "none",
                userSelect: "none",
              }}
            >
              {/* Grade badge */}
              <span
                style={{
                  flexShrink: 0,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "var(--fs-sm)",
                  color: getQualityGradeColor(f.grade),
                  border: `1px solid ${getQualityGradeColor(f.grade)}`,
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {f.grade}
              </span>

              {/* Festival name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                  href={`/admin/festivals/${f.slug}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontWeight: 700,
                    fontSize: "var(--fs-sm)",
                    color: "var(--text-main)",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                  }}
                >
                  {f.name}
                </Link>
              </div>

              {/* Score */}
              <span
                style={{
                  flexShrink: 0,
                  fontSize: "var(--fs-xs)",
                  fontFamily: "var(--font-mono)",
                  color: getQualityGradeColor(f.grade),
                  fontWeight: 700,
                }}
              >
                {f.score}/100
              </span>
            </summary>

            {/* Checks detail */}
            <div
              style={{
                padding: "8px 16px 12px",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {f.checks.map((check) => (
                <div
                  key={check.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "var(--fs-xs)",
                    color: check.passed ? "var(--text-muted)" : "var(--text-dim)",
                  }}
                >
                  <span style={{ color: check.passed ? "var(--primary-neon)" : "var(--danger-red)", flexShrink: 0 }}>
                    {check.passed ? "✓" : "✗"}
                  </span>
                  <span>{check.label}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", opacity: 0.6 }}>
                    +{check.weight}
                  </span>
                </div>
              ))}
            </div>
          </details>
        ))}

        {festivals.length === 0 && (
          <p style={{ color: "var(--text-dim)", textAlign: "center", padding: "var(--space-xl)" }}>
            Aucun festival.
          </p>
        )}
      </div>
    </div>
  );
}
