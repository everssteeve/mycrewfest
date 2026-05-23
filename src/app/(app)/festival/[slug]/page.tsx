import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Globe, MapPin, Users, ExternalLink } from "lucide-react";
import { buildFestivalOgDescription } from "@/lib/og-metadata";
import { formatFestivalStats } from "@/lib/format-count";
import type { Metadata } from "next";
import { Badge } from "@/components/ui";
import type { FestivalDetail, NewsItem } from "@/lib/types";
import { FollowButton } from "./_components/follow-button";
import { ParticipateButton } from "./_components/participate-button";
import { ShareButton } from "@/components/ui/share-button";
import { buildFestivalSharePayload } from "@/lib/share";
import { SimilarFestivals } from "./_components/similar-festivals";
import { FestivalLineup } from "./_components/festival-lineup";

async function fetchFestival(slug: string): Promise<FestivalDetail | null> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/festivals/${slug}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Erreur lors du chargement du festival.");
  return res.json() as Promise<FestivalDetail>;
}

async function fetchNews(slug: string): Promise<NewsItem[]> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/festivals/${slug}/news`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const all = (await res.json()) as NewsItem[];
  return all.slice(0, 3);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const festival = await fetchFestival(slug);
  if (!festival) return {};
  const ogDescription = buildFestivalOgDescription({
    city: festival.city,
    country: festival.country,
    startDate: festival.startDate,
    endDate: festival.endDate,
    description: festival.description,
  });
  return {
    title: festival.name,
    description: ogDescription,
    openGraph: {
      title: `${festival.name} — MyCrewFest`,
      description: ogDescription,
      type: "article",
      url: `/festival/${slug}`,
    },
    twitter: {
      card: "summary",
      title: `${festival.name} — MyCrewFest`,
      description: ogDescription,
    },
  };
}

const PROGRAM_STATUS_CONFIG = {
  complet: {
    label: "Programme complet",
    variant: "success" as const,
  },
  partiel: {
    label: "Programme partiel",
    variant: "urgent" as const,
  },
  "bientôt_disponible": {
    label: "Bientôt disponible",
    variant: "default" as const,
  },
} as const;

const NEWS_CATEGORY_LABELS: Record<string, string> = {
  "line-up": "Line-up",
  logistique: "Logistique",
  "programme-change": "Changement",
  annulation: "Annulation",
  urgence: "Urgence",
  autre: "Info",
};

export default async function FestivalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [festival, newsItems] = await Promise.all([
    fetchFestival(slug),
    fetchNews(slug),
  ]);

  if (!festival) notFound();

  const statusCfg =
    PROGRAM_STATUS_CONFIG[
      festival.programStatus as keyof typeof PROGRAM_STATUS_CONFIG
    ] ?? PROGRAM_STATUS_CONFIG["bientôt_disponible"];

  const startDate = new Date(festival.startDate);
  const endDate = new Date(festival.endDate);

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  const dateLabel = sameMonth
    ? `${format(startDate, "d", { locale: fr })}–${format(endDate, "d MMM yyyy", { locale: fr })}`
    : `${format(startDate, "d MMM", { locale: fr })} – ${format(endDate, "d MMM yyyy", { locale: fr })}`;

  const isDeambulatoire =
    festival.programType === "déambulatoire" ||
    festival.programType === "hybride";

  return (
    <div className="flex flex-col gap-0">
      {/* Back nav */}
      <div style={{ paddingBottom: "var(--space-md)" }}>
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-1 t-caption"
          style={{
            color: "var(--text-muted)",
            textDecoration: "none",
            transition: "var(--transition-fast)",
          }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Catalogue
        </Link>
      </div>

      {/* Hero */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          padding: "var(--space-lg)",
          marginBottom: "var(--space-md)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
        }}
      >
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          {festival.confidenceLevel === "auto" && (
            <Badge variant="ai">Données IA</Badge>
          )}
        </div>

        {/* Name */}
        <h1
          className="t-h1"
          style={{
            color: "var(--text-main)",
            fontSize: "var(--fs-2xl)",
            lineHeight: "var(--lh-tight)",
          }}
        >
          {festival.name}
        </h1>

        {/* Dates */}
        <p
          className="t-mono"
          style={{
            color: "var(--accent-pink)",
            fontSize: "var(--fs-md)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {dateLabel}
        </p>

        {/* Location */}
        <p
          className="t-caption flex items-center gap-1"
          style={{ color: "var(--text-muted)" }}
        >
          <MapPin size={14} aria-hidden="true" />
          {festival.address
            ? `${festival.address}, ${festival.city}`
            : `${festival.city}, ${festival.country}`}
        </p>

        {/* Description */}
        {festival.description && (
          <p
            className="t-body"
            style={{
              color: "var(--text-muted)",
              marginTop: "var(--space-sm)",
              lineHeight: "var(--lh-base)",
            }}
          >
            {festival.description}
          </p>
        )}

        {/* Stats row */}
        {festival._count && (festival._count.events > 0 || festival._count.followers > 0) && (
          <p
            className="t-caption"
            style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs, 11px)" }}
            aria-label="Statistiques du festival"
          >
            {formatFestivalStats(festival._count)}
          </p>
        )}

        {/* Social & external links */}
        <div className="flex flex-wrap items-center gap-3" style={{ marginTop: "var(--space-xs)" }}>
          {festival.siteUrl && (
            <a
              href={festival.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="t-caption inline-flex items-center gap-1"
              style={{ color: "var(--secondary-cyan)", textDecoration: "none" }}
              aria-label="Site officiel du festival"
            >
              <Globe size={13} aria-hidden="true" />
              Site officiel
            </a>
          )}
          {festival.instagramHandle && (
            <a
              href={`https://instagram.com/${festival.instagramHandle.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="t-caption inline-flex items-center gap-1"
              style={{ color: "var(--accent-pink)", textDecoration: "none" }}
              aria-label={`Instagram : ${festival.instagramHandle}`}
            >
              <ExternalLink size={12} aria-hidden="true" />
              Instagram
            </a>
          )}
          {festival.facebookPage && (
            <a
              href={festival.facebookPage}
              target="_blank"
              rel="noopener noreferrer"
              className="t-caption inline-flex items-center gap-1"
              style={{ color: "var(--secondary-cyan)", textDecoration: "none" }}
              aria-label="Page Facebook du festival"
            >
              <ExternalLink size={12} aria-hidden="true" />
              Facebook
            </a>
          )}
          {festival.xHandle && (
            <a
              href={`https://x.com/${festival.xHandle.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="t-caption inline-flex items-center gap-1"
              style={{ color: "var(--text-muted)", textDecoration: "none" }}
              aria-label={`X (Twitter) : ${festival.xHandle}`}
            >
              <ExternalLink size={12} aria-hidden="true" />
              X / Twitter
            </a>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-3 pt-2"
          style={{ marginTop: "var(--space-sm)" }}
        >
          <ParticipateButton
                festivalId={festival.id}
                festivalSlug={festival.slug}
                festivalName={festival.name}
                startDate={festival.startDate}
                endDate={festival.endDate}
              />
          <FollowButton festivalId={festival.id} initialFollowed={festival.isFollowed} festivalSlug={festival.slug} />
          <ShareButton
            payload={buildFestivalSharePayload(festival.name, festival.slug)}
          />
          <a
            href={`/api/festivals/${festival.slug}/ics`}
            download={`${festival.slug}.ics`}
            data-testid="festival-ics-download"
            aria-label="Ajouter au calendrier (.ics)"
            title="Ajouter au calendrier"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-bold)",
              color: "var(--secondary-cyan)",
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            📅 .ics
          </a>
        </div>
      </div>

      {/* News section */}
      {newsItems.length > 0 && (
        <section style={{ marginBottom: "var(--space-md)" }}>
          <h2
            className="t-h3"
            style={{
              color: "var(--text-main)",
              fontSize: "var(--fs-base)",
              marginBottom: "var(--space-sm)",
            }}
          >
            Actus récentes
          </h2>
          <div className="flex flex-col gap-2">
            {newsItems.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  border: item.urgencyLevel === "critique"
                    ? "1px solid var(--danger-red)"
                    : "1px solid var(--border-color)",
                  padding: "var(--space-md)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="t-meta"
                    style={{
                      color: item.urgencyLevel === "critique"
                        ? "var(--danger-red)"
                        : "var(--text-dim)",
                    }}
                  >
                    {NEWS_CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                  <span className="t-meta" style={{ color: "var(--text-dim)" }}>
                    {format(new Date(item.publishedAt), "d MMM", { locale: fr })}
                  </span>
                </div>
                <p className="t-body" style={{ color: "var(--text-main)", fontSize: "var(--fs-sm)" }}>
                  {item.summary}
                </p>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-caption"
                    style={{ color: "var(--secondary-cyan)", textDecoration: "none" }}
                  >
                    Source : {item.source}
                  </a>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, textAlign: "right" }}>
            <Link
              href={`/festival/${slug}/actualites`}
              data-testid="festival-news-see-all"
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-pink, #FF007A)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Voir toutes les actus →
            </Link>
          </div>
        </section>
      )}

      {/* Artists / Compagnies section */}
      {(festival.artists?.length ?? 0) > 0 && (
        <section style={{ marginBottom: "var(--space-md)" }}>
          <h2
            className="t-h3 flex items-center gap-2"
            style={{
              color: "var(--text-main)",
              fontSize: "var(--fs-base)",
              marginBottom: "var(--space-sm)",
            }}
          >
            <Users size={16} aria-hidden="true" />
            {isDeambulatoire ? "Compagnies" : "Artistes"}
          </h2>
          <FestivalLineup
            artists={festival.artists ?? []}
            isDeambulatoire={isDeambulatoire}
          />
        </section>
      )}

      <Suspense fallback={null}>
        <SimilarFestivals currentSlug={slug} />
      </Suspense>
    </div>
  );
}
