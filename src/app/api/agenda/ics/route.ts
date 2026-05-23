import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateIcs } from "@/lib/ics";
import { buildAgendaIcsEvents, type AgendaIcsEvent } from "@/lib/agenda-ics";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const userId = session.user.id;

  const selections = await prisma.selection.findMany({
    where: {
      status: { in: ["must-see", "intéressé"] },
      festEvent: { userId },
      event: { startTime: { not: null } },
    },
    select: {
      status: true,
      event: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          durationMins: true,
          venue: { select: { name: true } },
          artist: { select: { name: true } },
          festival: { select: { name: true } },
        },
      },
    },
    orderBy: { event: { startTime: "asc" } },
  });

  const events: AgendaIcsEvent[] = selections
    .filter((s) => s.event.startTime !== null)
    .map((s) => ({
      id: s.event.id,
      title: s.event.title,
      startTime: s.event.startTime!.toISOString(),
      endTime: s.event.endTime?.toISOString() ?? null,
      durationMins: s.event.durationMins,
      venue: s.event.venue?.name ?? null,
      artist: s.event.artist?.name ?? null,
      festivalName: s.event.festival?.name ?? "",
      status: s.status,
    }));

  const icsEvents = buildAgendaIcsEvents(events);
  const icsContent = generateIcs(icsEvents, "Mon agenda MyCrewFest");

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agenda-mycrewfest.ics"',
      "Cache-Control": "no-store",
    },
  });
}
