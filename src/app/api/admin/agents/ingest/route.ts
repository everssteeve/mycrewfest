import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") return null;
  return session;
}

const schema = z.object({
  festivalId: z.string().min(1, "festivalId requis."),
});

const MOCK_EVENTS = [
  {
    title: "Ouverture — Concert Symphonique",
    eventType: "concert",
    durationMins: 90,
    access: "inclus",
  },
  {
    title: "Atelier de Percussions Monde",
    eventType: "atelier",
    durationMins: 60,
    access: "réservation_séparée",
  },
  {
    title: "Spectacle de Rue — Compagnie Nomade",
    eventType: "spectacle",
    durationMins: 45,
    access: "inclus",
  },
  {
    title: "Conférence : L'avenir des festivals",
    eventType: "conférence",
    durationMins: 75,
    access: "inclus",
  },
  {
    title: "Concert de Clôture",
    eventType: "concert",
    durationMins: 120,
    access: "inclus",
  },
];

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const { festivalId } = parsed.data;

  const festival = await prisma.festival.findUnique({ where: { id: festivalId } });
  if (!festival) {
    return NextResponse.json({ error: "Festival introuvable." }, { status: 404 });
  }

  try {
    const baseDate = festival.startDate ?? new Date();
    const createdEvents = await prisma.$transaction(
      MOCK_EVENTS.map((ev, i) => {
        const startTime = new Date(baseDate.getTime() + i * 2 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + (ev.durationMins ?? 60) * 60 * 1000);
        return prisma.event.create({
          data: {
            festivalId,
            title: ev.title,
            eventType: ev.eventType,
            startTime,
            endTime,
            durationMins: ev.durationMins,
            access: ev.access,
            status: "confirmé",
            confidence: "auto",
          },
        });
      }),
    );

    // Update festival programStatus
    await prisma.festival.update({
      where: { id: festivalId },
      data: { programStatus: "partiel", ingestionStatus: "enrichi" },
    });

    return NextResponse.json({
      data: {
        agent: "Agent 2 — Ingestion programme",
        festivalId,
        eventsCreated: createdEvents.length,
        events: createdEvents.map((e) => ({
          id: e.id,
          title: e.title,
          startTime: e.startTime,
        })),
        note: "Événements simulés créés en base.",
      },
    });
  } catch (err) {
    console.error("[admin/agents/ingest]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
