import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Music2, CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TopHeader } from "@/components/ui";
import { parseJsonArray } from "@/lib/api";
import {
  deduplicateArtistsByFestival,
  sortByFestivalDate,
  filterUpcoming,
  filterPast,
  groupByFestival,
  type MesArtistesItem,
} from "@/lib/mes-artistes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const metadata: Metadata = { title: "Mes artistes" };

async function fetchArtistes(userId: string): Promise<MesArtistesItem[]> {
  const follows = await prisma.userFollowsFestival.findMany({
    where: { userId },
    select: {
      festival: {
        select: {
          id: true,
          name: true,
          slug: true,
          startDate: true,
          endDate: true,
          city: true,
          events: {
            where: { artistId: { not: null }, status: { not: "annulé" } },
            select: {
              title: true,
              startTime: true,
              artist: {
                select: {
                  id: true,
                  name: true,
                  disciplines: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const items: MesArtistesItem[] = [];
  for (const follow of follows) {
    const f = follow.festival;
    for (const ev of f.events) {
      if (!ev.artist) continue;
      items.push({
        artistId: ev.artist.id,
        artistName: ev.artist.name,
        disciplines: parseJsonArray(ev.artist.disciplines),
        festivalId: f.id,
        festivalName: f.name,
        festivalSlug: f.slug,
        festivalStartDate: f.startDate.toISOString(),
        festivalEndDate: f.endDate.toISOString(),
        city: f.city,
        eventTitle: ev.title,
        startTime: ev.startTime?.toISOString() ?? null,
      });
    }
  }

  return deduplicateArtistsByFestival(items);
}

export default async function MesArtistesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const allItems = await fetchArtistes(session.user.id);
  const now = new Date();

  const upcoming = sortByFestivalDate(filterUpcoming(allItems, now));
  const past = sortByFestivalDate(filterPast(allItems, now)).reverse();

  const upcomingByFestival = groupByFestival(upcoming);

  return (
    <>
      <TopHeader title="MES ARTISTES" />

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        {/* Back link */}
        <Link
          href="/artistes"
          className="inline-flex items-center gap-1 t-caption"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Artistes
        </Link>

        {/* Empty state */}
        {allItems.length === 0 && (
          <div
            data-testid="mes-artistes-empty"
            style={{
              textAlign: "center",
              marginTop: "var(--space-xl)",
              color: "var(--text-dim)",
            }}
          >
            <Music2 size={32} style={{ margin: "0 auto var(--space-sm)", opacity: 0.4 }} />
            <p className="t-body" style={{ fontSize: "var(--fs-sm)" }}>
              Suis des festivals pour voir leurs artistes ici.
            </p>
            <Link
              href="/catalogue"
              style={{
                marginTop: "var(--space-md)",
                display: "inline-block",
                color: "var(--primary-neon)",
                fontSize: "var(--fs-sm)",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Découvrir des festivals →
            </Link>
          </div>
        )}

        {/* Upcoming artists grouped by festival */}
        {upcomingByFestival.size > 0 && (
          <section data-testid="mes-artistes-upcoming">
            <h2
              className="t-mono"
              style={{
                color: "var(--text-dim)",
                fontSize: "var(--fs-xs, 11px)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "var(--space-sm)",
              }}
            >
              À venir
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              {Array.from(upcomingByFestival.entries()).map(([festId, group]) => (
                <div
                  key={festId}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                  }}
                >
                  {/* Festival header */}
                  <Link
                    href={`/festival/${group.festivalSlug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--border-color)",
                      textDecoration: "none",
                      backgroundColor: "var(--bg-darker)",
                    }}
                  >
                    <CalendarDays size={14} color="var(--accent-pink)" aria-hidden="true" />
                    <span
                      style={{
                        color: "var(--text-main)",
                        fontWeight: 700,
                        fontSize: "var(--fs-sm)",
                        flex: 1,
                      }}
                    >
                      {group.festivalName}
                    </span>
                    <span style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs, 11px)" }}>
                      {group.city} · {format(new Date(group.startDate), "d MMM", { locale: fr })}
                    </span>
                  </Link>

                  {/* Artists list */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {group.artists.map((item, idx) => (
                      <Link
                        key={`${item.artistId}-${idx}`}
                        href={`/artiste/${item.artistId}`}
                        data-testid={`mes-artistes-item-${item.artistId}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 14px",
                          textDecoration: "none",
                          borderBottom: idx < group.artists.length - 1 ? "1px solid var(--border-color)" : "none",
                        }}
                      >
                        <Music2 size={13} color="var(--secondary-cyan)" aria-hidden="true" />
                        <span
                          style={{
                            color: "var(--text-main)",
                            fontSize: "var(--fs-sm)",
                            fontWeight: 500,
                            flex: 1,
                          }}
                        >
                          {item.artistName}
                        </span>
                        {item.disciplines.length > 0 && (
                          <span style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs, 10px)" }}>
                            {item.disciplines[0]}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Past count */}
        {past.length > 0 && (
          <p
            data-testid="mes-artistes-past-count"
            className="t-caption"
            style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs, 11px)", textAlign: "center" }}
          >
            + {past.length} artiste{past.length > 1 ? "s" : ""} de festivals passés
          </p>
        )}
      </div>
    </>
  );
}
