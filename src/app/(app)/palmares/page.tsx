import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Calendar, Music2, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getRankMedal,
  type RankableFestival,
  rankByFollowers,
  rankByProgramme,
  rankByUpcoming,
} from "@/lib/festival-rankings";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Palmarès — MyCrewFest",
};

const FESTIVAL_TYPE_LABELS: Record<string, string> = {
  musique: "Musique",
  théâtre_rue: "Théâtre",
  cirque: "Cirque",
  world: "World",
  multidisciplinaire: "Multi",
};

async function fetchRankingData(): Promise<RankableFestival[]> {
  const festivals = await prisma.festival.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      country: true,
      festivalType: true,
      startDate: true,
      endDate: true,
      programStatus: true,
      _count: { select: { followers: true, events: true } },
    },
  });

  return festivals.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    city: f.city,
    country: f.country,
    festivalType: f.festivalType,
    startDate: f.startDate.toISOString(),
    endDate: f.endDate.toISOString(),
    followerCount: f._count.followers,
    programStatus: f.programStatus,
    eventCount: f._count.events,
  }));
}

function RankingRow({
  rank,
  name,
  slug,
  city,
  startDate,
  festivalType,
  metaValue,
  metaLabel,
  metaColor,
}: {
  rank: number;
  name: string;
  slug: string;
  city: string;
  startDate: string;
  festivalType: string;
  metaValue: string;
  metaLabel: string;
  metaColor: string;
}) {
  const medal = getRankMedal(rank);
  return (
    <Link
      href={`/festival/${slug}`}
      data-testid={`palmares-entry-${slug}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "var(--bg-surface, #141519)",
          border: "1px solid var(--border-color, #1E1F26)",
          borderRadius: "var(--radius-md, 12px)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.85rem",
            fontWeight: 700,
            minWidth: 28,
            flexShrink: 0,
            color: "var(--text-dim, #666)",
          }}
        >
          {medal || `#${rank}`}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "var(--text-primary, #F0F0F0)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--text-dim, #666)" }}>
            {city} · {format(new Date(startDate), "d MMM yyyy", { locale: fr })}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            flexShrink: 0,
            gap: 2,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: metaColor,
            }}
          >
            {metaValue}
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              color: "var(--text-dim, #666)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {metaLabel}
          </span>
        </div>
        {FESTIVAL_TYPE_LABELS[festivalType] && (
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "var(--secondary-cyan, #00E5FF)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}
          >
            {FESTIVAL_TYPE_LABELS[festivalType]}
          </span>
        )}
      </div>
    </Link>
  );
}

export default async function PalmaresPage() {
  const allFestivals = await fetchRankingData();

  const topFollowed = rankByFollowers(allFestivals, 10);
  const topUpcoming = rankByUpcoming(allFestivals, 30, 10);
  const topProgramme = rankByProgramme(allFestivals, 10);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg-darker, #0D0E12)",
        color: "var(--text-primary, #F0F0F0)",
        padding: "24px 16px 80px",
        maxWidth: 640,
        margin: "0 auto",
        fontFamily: "var(--font-body, sans-serif)",
      }}
    >
      {/* Back nav */}
      <Link
        href="/catalogue"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.8rem",
          color: "var(--text-dim, #666)",
          textDecoration: "none",
          marginBottom: 24,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Catalogue
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          data-testid="palmares-title"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "1.5rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Trophy size={22} color="var(--warning-orange, #FF9900)" aria-hidden="true" />
          Palmarès
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--text-dim, #666)" }}>
          Les festivals qui font le buzz
        </p>
      </div>

      {/* Section 1: Most followed */}
      {topFollowed.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2
            data-testid="palmares-followers-section"
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "0.85rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 12px",
              color: "var(--accent-pink, #FF007A)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Trophy size={14} aria-hidden="true" />
            Les plus suivis
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topFollowed.map((f) => (
              <RankingRow
                key={f.id}
                rank={f.rank}
                name={f.name}
                slug={f.slug}
                city={f.city}
                startDate={f.startDate}
                festivalType={f.festivalType}
                metaValue={f.followerCount.toLocaleString("fr-FR")}
                metaLabel="fans"
                metaColor="var(--accent-pink, #FF007A)"
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Upcoming soon */}
      {topUpcoming.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2
            data-testid="palmares-upcoming-section"
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "0.85rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 12px",
              color: "var(--primary-neon, #00FF66)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Calendar size={14} aria-hidden="true" />À venir ce mois-ci
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topUpcoming.map((f) => (
              <RankingRow
                key={f.id}
                rank={f.rank}
                name={f.name}
                slug={f.slug}
                city={f.city}
                startDate={f.startDate}
                festivalType={f.festivalType}
                metaValue={format(new Date(f.startDate), "d MMM", { locale: fr })}
                metaLabel="début"
                metaColor="var(--primary-neon, #00FF66)"
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Richest programme */}
      {topProgramme.length > 0 && (
        <section>
          <h2
            data-testid="palmares-programme-section"
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "0.85rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 12px",
              color: "var(--secondary-cyan, #00E5FF)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Music2 size={14} aria-hidden="true" />
            Programmes les plus riches
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topProgramme.map((f) => (
              <RankingRow
                key={f.id}
                rank={f.rank}
                name={f.name}
                slug={f.slug}
                city={f.city}
                startDate={f.startDate}
                festivalType={f.festivalType}
                metaValue={String(f.eventCount)}
                metaLabel="événements"
                metaColor="var(--secondary-cyan, #00E5FF)"
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {topFollowed.length === 0 && topUpcoming.length === 0 && topProgramme.length === 0 && (
        <div
          data-testid="palmares-empty"
          style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim, #666)" }}
        >
          <p>Aucun festival dans la base pour le moment.</p>
          <Link
            href="/catalogue"
            style={{
              color: "var(--primary-neon, #00FF66)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Voir le catalogue
          </Link>
        </div>
      )}
    </main>
  );
}
