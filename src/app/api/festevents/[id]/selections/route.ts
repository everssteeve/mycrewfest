import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const upsertSelectionSchema = z.object({
  eventId: z.string().min(1, "L'identifiant de l'événement est requis."),
  status: z.enum(["intéressé", "must-see", "vu"]),
});

/**
 * POST /api/festevents/[id]/selections
 * Add or update a selection (auth required).
 * Body: { eventId: string; status: "intéressé" | "must-see" | "vu" }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vous devez être connecté." },
      { status: 401 },
    );
  }

  const { id } = await params;

  // Verify ownership
  const festEvent = await prisma.festEvent.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, festivalId: true },
  });

  if (!festEvent) {
    return NextResponse.json(
      { error: "FestEvent introuvable." },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const parsed = upsertSelectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const { eventId, status } = parsed.data;

  // Make sure the event belongs to the same festival
  const event = await prisma.event.findFirst({
    where: { id: eventId, festivalId: festEvent.festivalId },
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Événement introuvable dans ce festival." },
      { status: 404 },
    );
  }

  try {
    const selection = await prisma.selection.upsert({
      where: {
        festEventId_eventId: {
          festEventId: festEvent.id,
          eventId,
        },
      },
      update: { status },
      create: {
        festEventId: festEvent.id,
        eventId,
        status,
      },
    });

    return NextResponse.json(
      { id: selection.id, status: selection.status },
      { status: 200 },
    );
  } catch (err) {
    console.error("[POST /api/festevents/[id]/selections]", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la sélection." },
      { status: 500 },
    );
  }
}
