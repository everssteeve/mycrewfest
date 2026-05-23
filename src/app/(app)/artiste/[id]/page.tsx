import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Music } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/lib/api";
import {
  sortAppearancesByDate,
  splitByTemporality,
  formatDisciplines,
  buildInstagramUrl,
  buildSpotifyUrl,
  type ArtistFestivalAppearance,
} from "@/lib/artist-profile";

type PageContext = { params: Promise<{ id: string }> };

async function fetchArtistData(id: string) {
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      events: {
        include: {
          festival: {
            select: {
              id: true,
              name: true,
              slug: true,
              startDate: true,
              endDate: true,
              city: true,
              country: true,
            },
          },
        },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!artist) return null;

  const appearances: ArtistFestivalAppearance[] = artist.events.map((ev) => ({
    festivalId: ev.festival.id,
    festivalName: ev.festival.name,
    festivalSlug: ev.festival.slug,
    startDate: ev.festival.startDate.toISOString(),
    endDate: ev.festival.endDate.toISOString(),
    city: ev.festival.city,
    country: ev.festival.country,
    eventTitle: ev.title,
    startTime: ev.startTime?.toISOString() ?? null,
  }));

  const sorted = sortAppearancesByDate(appearances);
  const split = splitByTemporality(sorted);

  return {
    id: artist.id,
    name: artist.name,
    description: artist.description,
    disciplines: parseJsonArray(artist.disciplines) as string[],
    countryCode: artist.countryCode,
    siteUrl: artist.siteUrl,
    instagram: artist.instagram,
    spotifyId: artist.spotifyId,
    upcoming: split.upcoming,
    past: split.past,
  };
}

export async function generateMetadata({ params }: PageContext): Promise<Metadata> {
  const { id } = await params;
  const artist = await prisma.artist.findUnique({ where: { id }, select: { name: true, description: true } });
  if (!artist) return {};
  return {
    title: artist.name,
    description: artist.description ?? undefined,
  };
}

export default async function ArtistePage({ params }: PageContext) {
  const { id } = await params;
  const artist = await fetchArtistData(id);

  if (!artist) notFound();

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
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Catalogue
      </Link>

      {/* Artist header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          data-testid="artiste-name"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "1.8rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--accent-pink, #FF007A)",
            margin: 0,
          }}
        >
          {artist.name}
        </h1>

        {/* Meta row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {artist.disciplines.length > 0 && (
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--secondary-cyan, #00E5FF)",
                background: "rgba(0,229,255,0.08)",
                border: "1px solid rgba(0,229,255,0.3)",
                borderRadius: 20,
                padding: "3px 10px",
              }}
            >
              {formatDisciplines(artist.disciplines)}
            </span>
          )}
          {artist.countryCode && (
            <span
              data-testid="artiste-country"
              style={{
                fontSize: "0.72rem",
                color: "var(--text-dim, #666)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: "3px 10px",
              }}
            >
              {artist.countryCode}
            </span>
          )}
        </div>

        {/* Description */}
        {artist.description && (
          <p
            data-testid="artiste-description"
            style={{
              marginTop: 14,
              fontSize: "0.9rem",
              lineHeight: 1.5,
              color: "var(--text-muted, #888)",
            }}
          >
            {artist.description}
          </p>
        )}

        {/* Links */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {artist.siteUrl && (
            <a
              href={artist.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="artiste-site-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.75rem",
                color: "var(--primary-neon, #00FF66)",
                border: "1px solid rgba(0,255,102,0.3)",
                borderRadius: 6,
                padding: "5px 10px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <Globe size={12} aria-hidden="true" />
              Site officiel
            </a>
          )}
          {artist.instagram && (
            <a
              href={buildInstagramUrl(artist.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="artiste-instagram-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.75rem",
                color: "var(--accent-pink, #FF007A)",
                border: "1px solid rgba(255,0,122,0.3)",
                borderRadius: 6,
                padding: "5px 10px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Instagram
            </a>
          )}
          {artist.spotifyId && (
            <a
              href={buildSpotifyUrl(artist.spotifyId)}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="artiste-spotify-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.75rem",
                color: "#1DB954",
                border: "1px solid rgba(29,185,84,0.3)",
                borderRadius: 6,
                padding: "5px 10px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <Music size={12} aria-hidden="true" />
              Spotify
            </a>
          )}
        </div>
      </div>

      {/* Upcoming appearances */}
      {artist.upcoming.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "0.9rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--primary-neon, #00FF66)",
              margin: "0 0 12px",
            }}
          >
            À venir
          </h2>
          <div
            data-testid="artiste-upcoming"
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {artist.upcoming.map((app) => (
              <Link
                key={`${app.festivalId}-${app.eventTitle}`}
                href={`/festival/${app.festivalSlug}`}
                data-testid={`artiste-appearance-${app.festivalSlug}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "var(--bg-card, #141519)",
                    border: "1px solid var(--border-subtle, #1E1F26)",
                    borderLeft: "3px solid var(--primary-neon, #00FF66)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-display, sans-serif)",
                        fontSize: "0.9rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        color: "var(--text-primary, #F0F0F0)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {app.festivalName}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 0",
                        fontSize: "0.75rem",
                        color: "var(--text-dim, #666)",
                      }}
                    >
                      {app.city} ·{" "}
                      {new Date(app.startDate).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--primary-neon, #00FF66)", flexShrink: 0 }}>
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past appearances */}
      {artist.past.length > 0 && (
        <section>
          <h2
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "0.9rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-dim, #666)",
              margin: "0 0 12px",
            }}
          >
            Passé
          </h2>
          <div
            data-testid="artiste-past"
            style={{ display: "flex", flexDirection: "column", gap: 8, opacity: 0.7 }}
          >
            {artist.past.map((app) => (
              <Link
                key={`${app.festivalId}-${app.eventTitle}`}
                href={`/festival/${app.festivalSlug}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "var(--bg-card, #141519)",
                    border: "1px solid var(--border-subtle, #1E1F26)",
                    borderRadius: 10,
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "var(--text-muted, #888)",
                        margin: 0,
                      }}
                    >
                      {app.festivalName}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--text-dim, #666)" }}>
                      {app.city} · {new Date(app.startDate).getFullYear()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {artist.upcoming.length === 0 && artist.past.length === 0 && (
        <p
          data-testid="artiste-no-appearances"
          style={{ color: "var(--text-dim, #666)", fontSize: "0.9rem" }}
        >
          Aucun festival référencé pour cet artiste.
        </p>
      )}
    </div>
  );
}
