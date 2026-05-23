import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ crewId: string; userId: string }> };

const updateMemberSchema = z.object({
  geolocStatus: z.enum(["off", "active", "background"]).optional(),
  isPrivate: z.boolean().optional(),
});

/**
 * PATCH /api/crews/[crewId]/members/[userId]
 * Update a crew member's geoloc status or privacy flag.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const { crewId, userId } = await params;

  // Users can only update their own member record
  if (userId !== session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez modifier que votre propre statut." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  try {
    const member = await prisma.crewMember.findFirst({
      where: { crewId, userId },
    });

    if (!member) {
      return NextResponse.json({ error: "Membre introuvable dans ce crew." }, { status: 404 });
    }

    const updated = await prisma.crewMember.update({
      where: { id: member.id },
      data: {
        ...(parsed.data.geolocStatus !== undefined && {
          geolocStatus: parsed.data.geolocStatus,
        }),
        ...(parsed.data.isPrivate !== undefined && {
          isPrivate: parsed.data.isPrivate,
        }),
      },
    });

    return NextResponse.json({
      id: updated.id,
      userId: updated.userId,
      geolocStatus: updated.geolocStatus,
      isPrivate: updated.isPrivate,
    });
  } catch (err) {
    console.error("[PATCH /api/crews/[crewId]/members/[userId]]", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du membre." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/crews/[crewId]/members/[userId]
 * Leave a crew (or remove a member as admin).
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const { crewId, userId } = await params;

  try {
    const sessionMember = await prisma.crewMember.findFirst({
      where: { crewId, userId: session.user.id },
    });

    if (!sessionMember) {
      return NextResponse.json({ error: "Vous n'êtes pas membre de ce crew." }, { status: 403 });
    }

    // Can only remove self, or admin can remove anyone
    if (userId !== session.user.id && sessionMember.role !== "admin") {
      return NextResponse.json({ error: "Permission insuffisante." }, { status: 403 });
    }

    const targetMember = await prisma.crewMember.findFirst({
      where: { crewId, userId },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });
    }

    await prisma.crewMember.delete({ where: { id: targetMember.id } });

    // Unlink this user's FestEvent from the crew
    await prisma.festEvent.updateMany({
      where: { userId, crewId },
      data: { crewId: null, mode: "solo" },
    });

    return NextResponse.json({ left: true });
  } catch (err) {
    console.error("[DELETE /api/crews/[crewId]/members/[userId]]", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du membre." },
      { status: 500 },
    );
  }
}
