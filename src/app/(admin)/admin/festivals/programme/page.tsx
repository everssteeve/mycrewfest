import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import {
  type AdminProgramRow,
  countFestivalsByProgramStatus,
  getProgramStatusColor,
  getProgramStatusLabel,
  PROGRAM_STATUS_VALUES,
  sortByStartDate,
} from "@/lib/admin-programme";
import { prisma } from "@/lib/prisma";
import { updateProgramStatus } from "./actions";

export const metadata = { title: "Admin — Statut programme" };

async function getFestivals(): Promise<AdminProgramRow[]> {
  const rows = await prisma.festival.findMany({
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      startDate: true,
      programStatus: true,
      _count: { select: { events: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    city: r.city,
    startDate: r.startDate.toISOString(),
    programStatus: r.programStatus,
    eventCount: r._count.events,
  }));
}

export default async function AdminProgrammePage() {
  const festivals = sortByStartDate(await getFestivals());
  const counts = countFestivalsByProgramStatus(festivals);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-lg)",
        }}
      >
        <div>
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
            Statut programme
          </h1>
        </div>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-lg)",
        }}
      >
        {PROGRAM_STATUS_VALUES.map((s) => (
          <div
            key={s}
            data-testid={`programme-kpi-${s}`}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-md)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "var(--fs-2xl)",
                fontFamily: "var(--font-mono)",
                color: getProgramStatusColor(s),
                margin: 0,
                fontWeight: 700,
              }}
            >
              {counts[s]}
            </p>
            <p
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "4px 0 0",
              }}
            >
              {getProgramStatusLabel(s)}
            </p>
          </div>
        ))}
      </div>

      {/* Festival list */}
      <div
        data-testid="programme-festival-list"
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}
      >
        {festivals.map((f) => (
          <div
            key={f.id}
            data-testid={`programme-row-${f.id}`}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-md)",
            }}
          >
            {/* Festival info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link
                href={`/festival/${f.slug}`}
                target="_blank"
                rel="noopener noreferrer"
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
              <p
                style={{
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-dim)",
                  margin: "2px 0 0",
                }}
              >
                {f.city} · {format(new Date(f.startDate), "d MMM yyyy", { locale: fr })} ·{" "}
                {f.eventCount} event{f.eventCount !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Current status badge */}
            <span
              style={{
                fontSize: "var(--fs-xs)",
                fontWeight: 700,
                color: getProgramStatusColor(f.programStatus),
                border: `1px solid ${getProgramStatusColor(f.programStatus)}`,
                borderRadius: 20,
                padding: "3px 10px",
                flexShrink: 0,
                whiteSpace: "nowrap",
                opacity: 0.9,
              }}
            >
              {getProgramStatusLabel(f.programStatus)}
            </span>

            {/* Quick-switch buttons */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {PROGRAM_STATUS_VALUES.filter((s) => s !== f.programStatus).map((s) => (
                <form key={s} action={updateProgramStatus.bind(null, f.id, s)}>
                  <button
                    type="submit"
                    data-testid={`programme-set-${f.id}-${s}`}
                    title={`Marquer comme "${getProgramStatusLabel(s)}"`}
                    style={{
                      padding: "4px 10px",
                      fontSize: "var(--fs-xs)",
                      fontFamily: "var(--font-body)",
                      color: getProgramStatusColor(s),
                      background: "transparent",
                      border: `1px solid ${getProgramStatusColor(s)}`,
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      opacity: 0.6,
                      transition: "opacity var(--transition-fast, 150ms)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "0.6";
                    }}
                  >
                    {getProgramStatusLabel(s)}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}

        {festivals.length === 0 && (
          <p
            style={{
              color: "var(--text-dim)",
              textAlign: "center",
              padding: "var(--space-xl)",
              fontSize: "var(--fs-sm)",
            }}
          >
            Aucun festival.
          </p>
        )}
      </div>
    </div>
  );
}
