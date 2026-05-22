import Link from "next/link";
import { MapPin, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { FestivalSummary, FestivalType, ProgramStatus } from "@/lib/types";

interface FestivalCardProps {
  festival: FestivalSummary;
}

const TYPE_LABELS: Record<FestivalType, string> = {
  musique: "Musique",
  "théâtre_rue": "Théâtre de rue",
  cirque: "Cirque",
  world: "World",
  multidisciplinaire: "Multidisciplinaire",
  autre: "Autre",
};

const PROGRAM_STATUS_CONFIG: Record<
  ProgramStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  complet: {
    label: "Programme complet",
    color: "var(--primary-neon)",
    bg: "var(--neon-soft)",
    border: "var(--primary-neon)",
  },
  partiel: {
    label: "Programme partiel",
    color: "var(--warning-orange)",
    bg: "var(--orange-soft)",
    border: "var(--warning-orange)",
  },
  "bientôt_disponible": {
    label: "Bientôt disponible",
    color: "var(--text-muted)",
    bg: "rgba(255,255,255,0.06)",
    border: "var(--border-color)",
  },
};

export function FestivalCard({ festival }: FestivalCardProps) {
  const programStatusCfg =
    PROGRAM_STATUS_CONFIG[festival.programStatus] ??
    PROGRAM_STATUS_CONFIG["bientôt_disponible"];

  const startDate = new Date(festival.startDate);
  const endDate = new Date(festival.endDate);

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  const dateLabel = sameMonth
    ? `${format(startDate, "d", { locale: fr })}–${format(endDate, "d MMM yyyy", { locale: fr })}`
    : `${format(startDate, "d MMM", { locale: fr })} – ${format(endDate, "d MMM yyyy", { locale: fr })}`;

  const typeLabel = TYPE_LABELS[festival.festivalType] ?? "Autre";

  return (
    <Link
      href={`/festival/${festival.slug}`}
      className="block"
      style={{ textDecoration: "none" }}
    >
      <article
        className="festival-card group"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          padding: "var(--space-md)",
          transition: "var(--transition-fast)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--glow-neon)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,102,0.4)";
          (e.currentTarget as HTMLElement).style.transform = "scale(1.005)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        }}
      >
        {/* Header row: name + AI badge */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="t-h3 flex-1"
            style={{
              color: "var(--text-main)",
              fontSize: "var(--fs-base)",
              lineHeight: "var(--lh-snug)",
            }}
          >
            {festival.name}
          </h3>
          {festival.confidenceLevel === "auto" && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: "var(--cyan-soft)",
                color: "var(--secondary-cyan)",
                border: "1px solid var(--secondary-cyan)",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 8 }}>✦</span>
              IA
            </span>
          )}
        </div>

        {/* Dates */}
        <p
          className="t-mono text-sm"
          style={{ color: "var(--accent-pink)", fontSize: "var(--fs-sm)" }}
        >
          <CalendarDays
            size={12}
            className="inline mr-1 -mt-0.5"
            aria-hidden="true"
          />
          {dateLabel}
        </p>

        {/* Location */}
        <p
          className="t-caption flex items-center gap-1"
          style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}
        >
          <MapPin size={12} aria-hidden="true" />
          {festival.city}, {festival.country}
        </p>

        {/* Chips row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Festival type chip */}
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "rgba(0,229,255,0.1)",
              color: "var(--secondary-cyan)",
              border: "1px solid rgba(0,229,255,0.3)",
            }}
          >
            {typeLabel}
          </span>

          {/* Program status chip */}
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: programStatusCfg.bg,
              color: programStatusCfg.color,
              border: `1px solid ${programStatusCfg.border}`,
            }}
          >
            {programStatusCfg.label}
          </span>
        </div>
      </article>
    </Link>
  );
}
