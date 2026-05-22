import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string; eventId: string }> };

/**
 * DELETE /api/festevents/[id]/selections/[eventId]
 * Remove a selection (auth required).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vous devez être connecté." },
      { status: 401 },
    );
  }

  const { id, eventId } = await params;

  // Verify ownership of the FestEvent
  const festEvent = await prisma.festEvent.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!festEvent) {
    return NextResponse.json(
      { error: "FestEvent introuvable." },
      { status: 404 },
    );
  }

  try {
    const deleted = await prisma.selection.deleteMany({
      where: {
        festEventId: festEvent.id,
        eventId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Sélection introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/festevents/[id]/selections/[eventId]]", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la sélection." },
      { status: 500 },
    );
  }
}
