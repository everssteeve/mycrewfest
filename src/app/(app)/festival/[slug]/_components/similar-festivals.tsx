import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { rankSimilarFestivals, type SimilarityCandidate } from "@/lib/festival-similarity";

interface SimilarFestivalsProps {
  currentSlug: string;
}

async function fetchSimilarFestivals(currentSlug: string) {
  const now = new Date();

  const [current, candidates] = await Promise.all([
    prisma.festival.findUnique({
      where: { slug: currentSlug },
      select: {
        id: true,
        slug: true,
        festivalType: true,
        country: true,
        startDate: true,
        endDate: true,
      },
    }),
    prisma.festival.findMany({
      where: {
        slug: { not: currentSlug },
        endDate: { gte: now },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        festivalType: true,
        country: true,
        city: true,
        startDate: true,
        endDate: true,
      },
    }),
  ]);

  if (!current) return [];

  const reference: SimilarityCandidate = {
    id: current.id,
    slug: current.slug,
    festivalType: current.festivalType,
    country: current.country,
    startDate: current.startDate.toISOString(),
    endDate: current.endDate.toISOString(),
  };

  const candidatesMapped: SimilarityCandidate[] = candidates.map((c) => ({
    id: c.id,
    slug: c.slug,
    festivalType: c.festivalType,
    country: c.country,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
  }));

  const ranked = rankSimilarFestivals(reference, candidatesMapped, 3);
  const rankedIds = new Set(ranked.map((r) => r.id));

  return candidates
    .filter((c) => rankedIds.has(c.id))
    .sort((a, b) => {
      const scoreA = ranked.find((r) => r.id === a.id)?.score ?? 0;
      const scoreB = ranked.find((r) => r.id === b.id)?.score ?? 0;
      return scoreB - scoreA;
    })
    .map((c) => ({
      ...c,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
    }));
}

export async function SimilarFestivals({ currentSlug }: SimilarFestivalsProps) {
  const festivals = await fetchSimilarFestivals(currentSlug);

  if (festivals.length === 0) return null;

  return (
    <section
      data-testid="similar-festivals"
      style={{ marginTop: 32 }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display, sans-serif)",
          fontSize: "var(--fs-base, 1rem)",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--text-main, #F0F0F0)",
          margin: "0 0 12px",
        }}
      >
        Festivals similaires
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {festivals.map((fest) => {
          const start = new Date(fest.startDate);
          const end = new Date(fest.endDate);
          const sameMonth =
            start.getMonth() === end.getMonth() &&
            start.getFullYear() === end.getFullYear();
          const dateLabel = sameMonth
            ? `${format(start, "d", { locale: fr })}–${format(end, "d MMM yyyy", { locale: fr })}`
            : `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;

          return (
            <Link
              key={fest.slug}
              href={`/festival/${fest.slug}`}
              data-testid={`similar-festival-${fest.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "var(--bg-surface, #1A1B21)",
                  border: "1px solid var(--border-color, #1E1F26)",
                  borderRadius: "var(--radius-md, 12px)",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(0,229,255,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--border-color, #1E1F26)";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-display, sans-serif)",
                      fontSize: "var(--fs-sm, 0.875rem)",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      color: "var(--text-main, #F0F0F0)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fest.name}
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "0.75rem",
                      color: "var(--text-muted, #888)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <CalendarDays size={11} aria-hidden="true" />
                      {dateLabel}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={11} aria-hidden="true" />
                      {fest.city}
                    </span>
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--secondary-cyan, #00E5FF)",
                    flexShrink: 0,
                  }}
                >
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
