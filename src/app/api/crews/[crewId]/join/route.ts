import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ crewId: string }> };

const joinSchema = z.object({
  inviteCode: z.string().min(1),
  festEventId: z.string().min(1).optional(),
});

/**
 * POST /api/crews/[crewId]/join
 * Join a crew using its invite code.
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

  const { crewId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const { inviteCode, festEventId } = parsed.data;

  try {
    const crew = await prisma.crew.findFirst({
      where: { id: crewId, inviteCode },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!crew) {
      return NextResponse.json(
        { error: "Code d'invitation invalide ou crew introuvable." },
        { status: 404 },
      );
    }

    const alreadyMember = crew.members.some((m) => m.userId === session.user?.id);
    if (alreadyMember) {
      return NextResponse.json(
        { error: "Vous êtes déjà membre de ce crew." },
        { status: 409 },
      );
    }

    await prisma.crewMember.create({
      data: {
        crewId: crew.id,
        userId: session.user.id,
        role: "membre",
      },
    });

    // If festEventId provided, link crew to that FestEvent
    if (festEventId) {
      const festEvent = await prisma.festEvent.findFirst({
        where: { id: festEventId, userId: session.user.id },
      });
      if (festEvent) {
        await prisma.festEvent.update({
          where: { id: festEventId },
          data: { crewId: crew.id, mode: "crew" },
        });
      }
    }

    return NextResponse.json({ joined: true, crewId: crew.id }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/crews/[crewId]/join]", err);
    return NextResponse.json(
      { error: "Erreur lors de la tentative de rejoindre le crew." },
      { status: 500 },
    );
  }
}
