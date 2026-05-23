import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { countByUrgency, countPinned, sortNewsItems } from "@/lib/festival-news";
import { prisma } from "@/lib/prisma";
import type { NewsItemSummary } from "@/lib/types";

type PageContext = { params: Promise<{ slug: string }> };

const CATEGORY_LABELS: Record<string, string> = {
  "line-up": "Line-up",
  logistique: "Logistique",
  "programme-change": "Changement programme",
  annulation: "Annulation",
  urgence: "Urgence",
  autre: "Info",
};

async function fetchFestivalNews(
  slug: string,
): Promise<{ festivalName: string; items: NewsItemSummary[] } | null> {
  const festival = await prisma.festival.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!festival) return null;

  const news = await prisma.newsItem.findMany({
    where: { festivalId: festival.id },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      source: true,
      sourceUrl: true,
      publishedAt: true,
      category: true,
      summary: true,
      urgencyLevel: true,
      isPinned: true,
    },
  });

  return {
    festivalName: festival.name,
    items: news.map((n) => ({
      id: n.id,
      source: n.source,
      sourceUrl: n.sourceUrl ?? undefined,
      publishedAt: n.publishedAt.toISOString(),
      category: n.category,
      summary: n.summary,
      urgencyLevel: n.urgencyLevel as "normal" | "critique",
      isPinned: n.isPinned,
    })),
  };
}

export async function generateMetadata({ params }: PageContext): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchFestivalNews(slug);
  if (!data) return {};
  return { title: `Actualités — ${data.festivalName}` };
}

export default async function FestivalActualitesPage({ params }: PageContext) {
  const { slug } = await params;
  const data = await fetchFestivalNews(slug);
  if (!data) notFound();

  const sorted = sortNewsItems(data.items);
  const { critique } = countByUrgency(sorted);
  const pinned = countPinned(sorted);

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "24px 16px 80px",
        fontFamily: "var(--font-body, sans-serif)",
        color: "var(--text-primary, #F0F0F0)",
      }}
    >
      {/* Back */}
      <Link
        href={`/festival/${slug}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.8rem",
          color: "var(--text-dim, #666)",
          textDecoration: "none",
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {data.festivalName}
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          data-testid="festival-actualites-title"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "1.5rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--accent-pink, #FF007A)",
            margin: 0,
          }}
        >
          Actualités
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--text-dim, #666)" }}>
          {sorted.length} actualité{sorted.length > 1 ? "s" : ""}
          {critique > 0 && (
            <span style={{ color: "var(--danger-red, #FF3355)", marginLeft: 8, fontWeight: 700 }}>
              · ⚠ {critique} urgente{critique > 1 ? "s" : ""}
            </span>
          )}
          {pinned > 0 && (
            <span style={{ color: "var(--warning-orange, #FF9900)", marginLeft: 8 }}>
              · ★ {pinned} épinglée{pinned > 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <p
          data-testid="festival-actualites-empty"
          style={{ color: "var(--text-dim, #666)", fontSize: "0.9rem" }}
        >
          Aucune actualité pour ce festival.
        </p>
      )}

      {/* News list */}
      <div
        data-testid="festival-actualites-list"
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        {sorted.map((item) => (
          <div
            key={item.id}
            data-testid={`festival-news-item-${item.id}`}
            style={{
              background: "var(--bg-card, #141519)",
              border:
                item.urgencyLevel === "critique"
                  ? "1px solid rgba(255,51,85,0.4)"
                  : "1px solid var(--border-subtle, #1E1F26)",
              borderLeft:
                item.urgencyLevel === "critique"
                  ? "3px solid var(--danger-red, #FF3355)"
                  : item.isPinned
                    ? "3px solid var(--warning-orange, #FF9900)"
                    : "3px solid transparent",
              borderRadius: 10,
              padding: "12px 16px",
            }}
          >
            {/* Meta row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color:
                      item.urgencyLevel === "critique"
                        ? "var(--danger-red, #FF3355)"
                        : "var(--secondary-cyan, #00E5FF)",
                  }}
                >
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </span>
                {item.isPinned && (
                  <span style={{ fontSize: "0.68rem", color: "var(--warning-orange, #FF9900)" }}>
                    ★
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-dim, #666)",
                  fontFamily: "var(--font-mono, monospace)",
                  flexShrink: 0,
                }}
              >
                {new Date(item.publishedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>

            {/* Summary */}
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                lineHeight: 1.5,
                color: "var(--text-primary, #F0F0F0)",
              }}
            >
              {item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "inherit",
                    textDecoration: "underline",
                    textDecorationColor: "var(--text-dim, #666)",
                  }}
                >
                  {item.summary}
                </a>
              ) : (
                item.summary
              )}
            </p>

            {/* Source */}
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.68rem",
                color: "var(--text-dim, #666)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {item.source}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
