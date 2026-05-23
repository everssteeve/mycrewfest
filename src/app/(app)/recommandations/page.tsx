import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildRecommendationScores, topRecommendations, hasEnoughData } from "@/lib/festival-recommendations";
import { buildRecommendationReason } from "@/lib/recommendation-reason";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Sparkles, CalendarDays, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Recommandations — MyCrewFest",
};

const FESTIVAL_TYPE_LABELS: Record<string, string> = {
  musique: "Musique",
  théâtre_rue: "Théâtre de rue",
  cirque: "Cirque",
  world: "World",
  multidisciplinaire: "Multi",
};

async function fetchRecommendations(userId: string) {
  const followedRows = await prisma.userFollowsFestival.findMany({
    where: { userId },
    select: {
      festival: {
        select: { id: true, name: true, slug: true, festivalType: true, country: true, startDate: true, endDate: true },
      },
    },
  });

  const followedFestivals = followedRows.map((r) => ({
    id: r.festival.id,
    name: r.festival.name,
    slug: r.festival.slug,
    festivalType: r.festival.festivalType,
    country: r.festival.country,
    startDate: r.festival.startDate.toISOString(),
    endDate: r.festival.endDate.toISOString(),
  }));

  if (!hasEnoughData(followedFestivals.length)) return { recommendations: [], followedCount: 0, followedFestivals: [] };

  const followedIds = new Set(followedFestivals.map((f) => f.id));

  const allFestivals = await prisma.festival.findMany({
    where: { startDate: { gte: new Date() } },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      country: true,
      festivalType: true,
      startDate: true,
      endDate: true,
    },
  });

  const candidates = allFestivals.map((f) => ({
    id: f.id,
    slug: f.slug,
    festivalType: f.festivalType,
    country: f.country,
    startDate: f.startDate.toISOString(),
    endDate: f.endDate.toISOString(),
  }));

  const scores = buildRecommendationScores(followedFestivals, candidates);
  const top = topRecommendations(scores, followedIds, 10);

  const scoreById = new Map(top.map((r) => [r.id, r]));
  const recommendations = allFestivals
    .filter((f) => scoreById.has(f.id))
    .map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      city: f.city,
      country: f.country,
      festivalType: f.festivalType,
      startDate: f.startDate.toISOString(),
      endDate: f.endDate.toISOString(),
      score: scoreById.get(f.id)!.totalScore,
    }))
    .sort((a, b) => b.score - a.score);

  return { recommendations, followedCount: followedFestivals.length, followedFestivals };
}

export default async function RecommandationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { recommendations, followedCount, followedFestivals } = await fetchRecommendations(session.user.id);

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
          data-testid="recommandations-title"
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
          <Sparkles size={20} color="var(--primary-neon, #00FF66)" aria-hidden="true" />
          Pour toi
        </h1>
        <p
          style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--text-dim, #666)" }}
        >
          {followedCount === 0
            ? "Suis des festivals pour recevoir des recommandations"
            : `Basé sur tes ${followedCount} festival${followedCount > 1 ? "s" : ""} suivi${followedCount > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* No followed festivals */}
      {followedCount === 0 && (
        <div
          data-testid="recommandations-empty-no-follows"
          style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-dim, #666)" }}
        >
          <p style={{ marginBottom: 16 }}>
            Tu n&apos;as pas encore de festival suivi.
          </p>
          <Link
            href="/catalogue"
            style={{
              color: "var(--primary-neon, #00FF66)",
              border: "1px solid var(--primary-neon, #00FF66)",
              borderRadius: 8,
              padding: "8px 20px",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            Explorer les festivals
          </Link>
        </div>
      )}

      {/* No recommendations but has follows */}
      {followedCount > 0 && recommendations.length === 0 && (
        <div
          data-testid="recommandations-empty"
          style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-dim, #666)" }}
        >
          <p>Aucune recommandation disponible pour le moment.</p>
          <p style={{ marginTop: 8, fontSize: "0.8rem" }}>
            Les recommandations apparaissent quand de nouveaux festivals similaires aux tiens sont ajoutés.
          </p>
        </div>
      )}

      {/* Recommendations list */}
      {recommendations.length > 0 && (
        <ol
          data-testid="recommandations-list"
          style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}
        >
          {recommendations.map((festival) => (
            <li key={festival.id}>
              <Link
                href={`/festival/${festival.slug}`}
                data-testid={`recommandation-${festival.slug}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "var(--bg-surface, #141519)",
                    border: "1px solid var(--border-color, #1E1F26)",
                    borderRadius: "var(--radius-md, 12px)",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "border-color 0.15s",
                  }}
                >
                  <CalendarDays
                    size={18}
                    color="var(--accent-pink, #FF007A)"
                    aria-hidden="true"
                    style={{ flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "var(--text-primary, #F0F0F0)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {festival.name}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 0",
                        fontSize: "0.75rem",
                        color: "var(--text-dim, #666)",
                      }}
                    >
                      {festival.city} ·{" "}
                      {format(new Date(festival.startDate), "d MMM yyyy", { locale: fr })}
                    </p>
                    <p
                      data-testid={`recommandation-reason-${festival.slug}`}
                      style={{
                        margin: "4px 0 0",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "var(--primary-neon, #00FF66)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {buildRecommendationReason(festival, followedFestivals)}
                    </p>
                  </div>
                  {FESTIVAL_TYPE_LABELS[festival.festivalType] && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--secondary-cyan, #00E5FF)",
                        flexShrink: 0,
                      }}
                    >
                      {FESTIVAL_TYPE_LABELS[festival.festivalType]}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
