import Link from "next/link";
import { redirect } from "next/navigation";
import { FollowButton } from "@/app/(app)/festival/[slug]/_components/follow-button";
import { auth } from "@/auth";
import { TopHeader } from "@/components/ui";
import {
  formatDaysUntilLabel,
  getDaysUntil,
  getDaysUntilColor,
  sortFollowedByDate,
} from "@/lib/mes-festivals";
import { prisma } from "@/lib/prisma";
import type { FestivalSummary } from "@/types";

export const metadata = { title: "Mes Festivals" };

async function fetchFollowedFestivals(userId: string): Promise<FestivalSummary[]> {
  const follows = await prisma.userFollowsFestival.findMany({
    where: { userId },
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
          festivalType: true,
          programType: true,
          programStatus: true,
          confidenceLevel: true,
          capacity: true,
          isFeatured: true,
          _count: { select: { events: true, followers: true } },
        },
      },
    },
  });

  return follows.map((f) => ({
    id: f.festival.id,
    name: f.festival.name,
    slug: f.festival.slug,
    startDate: f.festival.startDate.toISOString(),
    endDate: f.festival.endDate.toISOString(),
    city: f.festival.city,
    country: f.festival.country,
    festivalType: f.festival.festivalType as FestivalSummary["festivalType"],
    programType: f.festival.programType as FestivalSummary["programType"],
    programStatus: f.festival.programStatus as FestivalSummary["programStatus"],
    confidenceLevel: f.festival.confidenceLevel as FestivalSummary["confidenceLevel"],
    capacity: f.festival.capacity,
    isFeatured: f.festival.isFeatured,
    isFollowed: true,
    _count: f.festival._count,
  }));
}

export default async function MesFestivalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const raw = await fetchFollowedFestivals(session.user.id);
  const festivals = sortFollowedByDate(raw);

  return (
    <>
      <TopHeader title="MES FESTIVALS" />

      <main
        style={{
          padding: "var(--space-md)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        {festivals.length === 0 ? (
          <div
            data-testid="mes-festivals-empty"
            style={{
              textAlign: "center",
              padding: "var(--space-xl) 0",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-lg)",
                fontWeight: 900,
                textTransform: "uppercase",
                color: "var(--text-dim)",
                margin: 0,
              }}
            >
              Aucun festival suivi
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              Suis des festivals depuis le{" "}
              <Link href="/catalogue" style={{ color: "var(--primary-neon)" }}>
                catalogue
              </Link>{" "}
              pour les retrouver ici.
            </p>
          </div>
        ) : (
          <ul
            data-testid="mes-festivals-list"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {festivals.map((festival) => {
              const days = getDaysUntil(festival.startDate);
              const label = formatDaysUntilLabel(festival.startDate);
              const color = getDaysUntilColor(days);
              const startYear = new Date(festival.startDate).getUTCFullYear();
              const endYear = new Date(festival.endDate).getUTCFullYear();
              const startStr = new Date(festival.startDate).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                timeZone: "UTC",
              });
              const endStr = new Date(festival.endDate).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: startYear !== endYear ? "numeric" : undefined,
                timeZone: "UTC",
              });

              return (
                <li key={festival.id} data-testid={`mes-festivals-item-${festival.slug}`}>
                  <div
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-md)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {/* Header row: name + days badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <Link
                        href={`/festival/${festival.slug}`}
                        style={{ textDecoration: "none", minWidth: 0, flex: 1 }}
                      >
                        <p
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "var(--fs-md)",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            color: "var(--text-main)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {festival.name}
                        </p>
                      </Link>
                      <span
                        data-testid={`mes-festivals-days-${festival.slug}`}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--fs-xs)",
                          fontWeight: 700,
                          color,
                          flexShrink: 0,
                          paddingTop: 2,
                        }}
                      >
                        {label}
                      </span>
                    </div>

                    {/* Meta row: city · dates */}
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      {festival.city} · {startStr} – {endStr}
                    </p>

                    {/* Stats + follow button row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", gap: 12 }}>
                        {(festival._count?.events ?? 0) > 0 && (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "var(--fs-xs)",
                              color: "var(--secondary-cyan)",
                            }}
                          >
                            {festival._count?.events} événements
                          </span>
                        )}
                      </div>
                      <FollowButton
                        festivalId={festival.id}
                        festivalSlug={festival.slug}
                        initialFollowed={true}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
