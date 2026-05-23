import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  type AgendaEvent,
  type AgendaFestival,
  buildAgendaFestival,
  getTotalEventCount,
  sortFestivalsByStartDate,
} from "@/lib/agenda-view";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Mon agenda",
};

async function fetchAgendaData(userId: string): Promise<AgendaFestival[]> {
  const festEvents = await prisma.festEvent.findMany({
    where: { userId },
    include: {
      festival: {
        select: {
          name: true,
          slug: true,
          startDate: true,
          endDate: true,
        },
      },
      selections: {
        where: { status: { in: ["must-see", "intéressé"] } },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              venue: { select: { name: true } },
              artist: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const festivals: AgendaFestival[] = festEvents
    .filter((fe) => fe.selections.length > 0)
    .map((fe) => {
      const events: AgendaEvent[] = fe.selections.map((sel) => ({
        id: sel.event.id,
        title: sel.event.title,
        startTime: sel.event.startTime?.toISOString() ?? null,
        endTime: sel.event.endTime?.toISOString() ?? null,
        status: sel.status as AgendaEvent["status"],
        venue: sel.event.venue?.name ?? null,
        artist: sel.event.artist?.name ?? null,
      }));

      return buildAgendaFestival(
        fe.id,
        fe.festival.name,
        fe.festival.slug,
        fe.festival.startDate.toISOString(),
        fe.festival.endDate.toISOString(),
        events,
      );
    });

  return sortFestivalsByStartDate(festivals);
}

export default async function AgendaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const festivals = await fetchAgendaData(session.user.id);
  const totalEvents = getTotalEventCount(festivals);

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <h1
            data-testid="agenda-title"
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: "1.5rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Mon agenda
          </h1>
          {totalEvents > 0 && (
            <a
              href="/api/agenda/ics"
              download="agenda-mycrewfest.ics"
              data-testid="agenda-ics-export"
              aria-label="Exporter l'agenda au format iCalendar"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: "transparent",
                color: "var(--secondary-cyan, #00E5FF)",
                border: "1px solid var(--secondary-cyan, #00E5FF)",
                borderRadius: 8,
                fontFamily: "var(--font-body, sans-serif)",
                fontSize: "0.72rem",
                fontWeight: 700,
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              .ics
            </a>
          )}
        </div>
        {totalEvents > 0 && (
          <p
            data-testid="agenda-total-count"
            style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--text-dim, #666)" }}
          >
            {totalEvents} événement{totalEvents > 1 ? "s" : ""} sélectionné
            {totalEvents > 1 ? "s" : ""} sur {festivals.length} festival
            {festivals.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Empty state */}
      {festivals.length === 0 && (
        <div
          data-testid="agenda-empty"
          style={{
            textAlign: "center",
            padding: "60px 24px",
            color: "var(--text-dim)",
          }}
        >
          <p style={{ fontSize: "1rem", marginBottom: 16 }}>Aucune sélection pour le moment.</p>
          <Link
            href="/catalogue"
            style={{
              color: "var(--primary-neon, #00FF66)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              border: "1px solid var(--primary-neon, #00FF66)",
              padding: "8px 20px",
              borderRadius: 8,
              display: "inline-block",
            }}
          >
            Explorer les festivals
          </Link>
        </div>
      )}

      {/* Festival list */}
      <div
        data-testid="agenda-festivals"
        style={{ display: "flex", flexDirection: "column", gap: 32 }}
      >
        {festivals.map((fest) => (
          <section key={fest.festEventId} data-testid={`agenda-festival-${fest.festivalSlug}`}>
            {/* Festival header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "1px solid var(--border-subtle, #1E1F26)",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    margin: 0,
                    color: "var(--accent-pink, #FF007A)",
                  }}
                >
                  {fest.festivalName}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                  {fest.mustSeeCount > 0 && (
                    <span style={{ color: "var(--primary-neon, #00FF66)", marginRight: 8 }}>
                      {fest.mustSeeCount} must-see
                    </span>
                  )}
                  {fest.intéresséCount > 0 && (
                    <span style={{ color: "var(--text-dim)" }}>
                      {fest.intéresséCount} intéressé{fest.intéresséCount > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
              <Link
                href={`/festevent/${fest.festEventId}/programme`}
                style={{
                  fontSize: "0.75rem",
                  color: "var(--primary-neon, #00FF66)",
                  textDecoration: "none",
                  fontWeight: 600,
                  padding: "4px 10px",
                  border: "1px solid var(--primary-neon)",
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              >
                Programme →
              </Link>
            </div>

            {/* Days */}
            {fest.days.map((day) => (
              <div key={day.dateKey} style={{ marginBottom: 16 }}>
                <p
                  data-testid={`agenda-day-label-${day.dateKey}`}
                  style={{
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "var(--secondary-cyan, #00E5FF)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: "0 0 6px",
                  }}
                >
                  {day.label}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {day.events.map((ev) => (
                    <div
                      key={ev.id}
                      data-testid={`agenda-event-${ev.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        background: "var(--bg-card, #141519)",
                        borderRadius: 8,
                        borderLeft: `3px solid ${ev.status === "must-see" ? "var(--primary-neon, #00FF66)" : "var(--text-dim, #666)"}`,
                      }}
                    >
                      {ev.startTime && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.75rem",
                            color: "var(--text-dim)",
                            flexShrink: 0,
                            minWidth: 36,
                          }}
                        >
                          {new Date(ev.startTime).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Europe/Paris",
                          })}
                        </span>
                      )}
                      <span
                        style={{
                          flex: 1,
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ev.title}
                      </span>
                      {ev.venue && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-dim)",
                            flexShrink: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 100,
                          }}
                        >
                          {ev.venue}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
