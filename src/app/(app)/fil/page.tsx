import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { countCriticalItems, type FeedItem } from "@/lib/news-feed";
import { FeedView } from "./_components/feed-view";

export const metadata: Metadata = {
  title: "Fil d'actu — MyCrewFest",
};

const MAX_ITEMS = 100;

async function fetchFeedItems(userId: string): Promise<FeedItem[]> {
  const followedFestivals = await prisma.userFollowsFestival.findMany({
    where: { userId },
    select: { festivalId: true },
  });

  if (followedFestivals.length === 0) return [];

  const festivalIds = followedFestivals.map((f) => f.festivalId);

  const newsItems = await prisma.newsItem.findMany({
    where: { festivalId: { in: festivalIds } },
    orderBy: { publishedAt: "desc" },
    take: MAX_ITEMS,
    select: {
      id: true,
      festivalId: true,
      summary: true,
      category: true,
      urgencyLevel: true,
      isPinned: true,
      publishedAt: true,
      sourceUrl: true,
      festival: { select: { name: true, slug: true } },
    },
  });

  return newsItems.map((n) => ({
    id: n.id,
    festivalId: n.festivalId,
    festivalName: n.festival.name,
    festivalSlug: n.festival.slug,
    summary: n.summary,
    category: n.category,
    urgencyLevel: n.urgencyLevel as "normal" | "critique",
    isPinned: n.isPinned,
    publishedAt: n.publishedAt.toISOString(),
    sourceUrl: n.sourceUrl,
  }));
}

export default async function FilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const items = await fetchFeedItems(session.user.id);
  const criticalCount = countCriticalItems(items);

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
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          data-testid="feed-title"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "1.5rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          Fil d'actu
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--text-dim, #666)" }}>
          {items.length === 0
            ? "Suivez des festivals pour voir leurs actualités ici"
            : `${items.length} actualité${items.length > 1 ? "s" : ""} de vos festivals suivis`}
        </p>
        {criticalCount > 0 && (
          <p
            data-testid="feed-critical-count"
            style={{
              marginTop: 8,
              fontSize: "0.8rem",
              color: "var(--danger-red, #FF3355)",
              fontWeight: 700,
            }}
          >
            ⚠ {criticalCount} alerte{criticalCount > 1 ? "s" : ""} urgente{criticalCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div
          data-testid="feed-empty"
          style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-dim, #666)" }}
        >
          <p style={{ marginBottom: 16 }}>Aucune actualité pour le moment.</p>
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

      {/* Feed with festival filter */}
      {items.length > 0 && <FeedView items={items} />}

      {/* Back to profil */}
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Link href="/profil" style={{ fontSize: "0.8rem", color: "var(--text-dim, #666)", textDecoration: "none" }}>
          ← Retour au profil
        </Link>
      </div>
    </main>
  );
}
