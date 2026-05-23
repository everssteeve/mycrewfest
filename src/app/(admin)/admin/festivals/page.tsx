import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FestivalsFilterBar } from "./_components/festivals-filter-bar";
import { FestivalsTable } from "./_components/festivals-table";

async function getAdminFestivals() {
  const [festivals, stats] = await Promise.all([
    prisma.festival.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        festivalType: true,
        startDate: true,
        endDate: true,
        ingestionStatus: true,
        confidenceLevel: true,
        city: true,
        country: true,
        isFeatured: true,
      },
    }),
    prisma.festival.groupBy({
      by: ["ingestionStatus"],
      _count: { id: true },
    }),
  ]);

  const statMap = new Map(stats.map((s) => [s.ingestionStatus, s._count.id]));

  return {
    festivals,
    total: festivals.length,
    détecté: statMap.get("détecté") ?? 0,
    vérifié: statMap.get("vérifié") ?? 0,
    enrichi: statMap.get("enrichi") ?? 0,
  };
}

export default async function AdminFestivalsPage() {
  const { festivals, total, détecté, vérifié, enrichi } = await getAdminFestivals();

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-lg)",
        }}
      >
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
          Festivals
        </h1>
        <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
          <a
            href="/api/admin/export/festivals"
            download
            data-testid="admin-festivals-export-csv"
            style={{
              padding: "10px 20px",
              border: "1px solid var(--border-color)",
              color: "var(--text-muted)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textDecoration: "none",
            }}
          >
            ↓ CSV
          </a>
          <Link
            href="/admin/festivals/new"
            style={{
              padding: "10px 20px",
              background: "var(--primary-neon)",
              color: "var(--text-on-neon)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-bold)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textDecoration: "none",
            }}
          >
            + Nouveau
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {[
          { label: "Total", value: total, color: "var(--text-main)" },
          { label: "Détectés", value: détecté, color: "var(--text-dim)" },
          { label: "Vérifiés", value: vérifié, color: "var(--primary-cyan)" },
          { label: "Enrichis", value: enrichi, color: "var(--primary-neon)" },
        ].map((s) => (
          <div
            key={s.label}
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
                color: s.color,
                margin: 0,
                fontWeight: "var(--fw-bold)",
              }}
            >
              {s.value}
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
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filter bar + table */}
      <FestivalsFilterBar
        festivals={festivals.map((f) => ({
          ...f,
          startDate: f.startDate instanceof Date ? f.startDate.toISOString() : f.startDate,
          endDate: f.endDate instanceof Date ? f.endDate.toISOString() : f.endDate,
        }))}
      >
        {(filtered) => <FestivalsTable festivals={filtered} />}
      </FestivalsFilterBar>
    </div>
  );
}
