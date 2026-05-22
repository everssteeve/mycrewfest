import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateIcs, type IcsEvent } from "@/lib/ics";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id: festEventId } = await params;

  const festEvent = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId: session.user.id },
    select: {
      id: true,
      festival: { select: { name: true } },
    },
  });

  if (!festEvent) {
    return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
  }

  const selections = await prisma.selection.findMany({
    where: {
      festEventId,
      status: { in: ["must-see", "intéressé"] },
    },
    select: {
      event: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          durationMins: true,
          artist: { select: { name: true } },
          venue: { select: { name: true } },
          festival: { select: { name: true } },
        },
      },
    },
  });

  const icsEvents: IcsEvent[] = [];

  for (const sel of selections) {
    const ev = sel.event;
    if (!ev.startTime) continue;

    let endIso: string;
    if (ev.endTime) {
      endIso = ev.endTime.toISOString();
    } else if (ev.durationMins) {
      const end = new Date(ev.startTime.getTime() + ev.durationMins * 60_000);
      endIso = end.toISOString();
    } else {
      // Default 1-hour duration
      const end = new Date(ev.startTime.getTime() + 60 * 60_000);
      endIso = end.toISOString();
    }

    icsEvents.push({
      uid: ev.id,
      summary: ev.artist?.name ?? "Événement",
      location: ev.venue?.name,
      description: ev.festival?.name,
      startIso: ev.startTime.toISOString(),
      endIso,
    });
  }

  // Sort by start time
  icsEvents.sort((a, b) => a.startIso.localeCompare(b.startIso));

  const calName = `${festEvent.festival.name} — MyCrewFest`;
  const icsContent = generateIcs(icsEvents, calName);

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="mycrewfest-planning.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
