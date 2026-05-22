import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Globe, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui";
import type { FestivalDetail, NewsItem } from "@/lib/types";
import { FollowButton } from "./_components/follow-button";
import { ParticipateButton } from "./_components/participate-button";

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
  return {
    title: festival.name,
    description: festival.description ?? undefined,
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

        {/* External link */}
        {festival.siteUrl && (
          <a
            href={festival.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="t-caption inline-flex items-center gap-1"
            style={{
              color: "var(--secondary-cyan)",
              marginTop: "var(--space-xs)",
              textDecoration: "none",
            }}
          >
            <Globe size={14} aria-hidden="true" />
            Site officiel
          </a>
        )}

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
          <div className="flex flex-col gap-2">
            {festival.artists?.map((artist) => (
              <div
                key={artist.id}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  padding: "12px var(--space-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className="t-body"
                    style={{
                      color: "var(--text-main)",
                      fontWeight: "var(--fw-medium)",
                      fontSize: "var(--fs-sm)",
                    }}
                  >
                    {artist.name}
                  </span>
                  {artist.disciplines && artist.disciplines.length > 0 && (
                    <span className="t-caption" style={{ color: "var(--text-muted)" }}>
                      {artist.disciplines.join(", ")}
                    </span>
                  )}
                </div>
                {artist.countryCode && (
                  <span
                    className="t-meta"
                    style={{ color: "var(--text-dim)", flexShrink: 0 }}
                  >
                    {artist.countryCode}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
