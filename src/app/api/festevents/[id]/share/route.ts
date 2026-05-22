import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/festevents/[id]/share
 * Generate or return an existing shareToken for a FestEvent.
 * The returned token can be used to access the public read-only journal
 * at /p/[token].
 */
export async function POST(
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

  const { id } = await params;

  const festEvent = await prisma.festEvent.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, shareToken: true },
  });

  if (!festEvent) {
    return NextResponse.json(
      { error: "FestEvent introuvable." },
      { status: 404 },
    );
  }

  // Return existing token if already set
  if (festEvent.shareToken) {
    return NextResponse.json({ shareToken: festEvent.shareToken });
  }

  // Generate a new random token
  const token = crypto.randomUUID().replace(/-/g, "");

  try {
    const updated = await prisma.festEvent.update({
      where: { id },
      data: { shareToken: token },
      select: { shareToken: true },
    });

    return NextResponse.json({ shareToken: updated.shareToken });
  } catch (err) {
    console.error("[POST /api/festevents/[id]/share]", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération du lien de partage." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/festevents/[id]/share
 * Revoke the shareToken (disables public access).
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

  const { id } = await params;

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
    await prisma.festEvent.update({
      where: { id },
      data: { shareToken: null },
    });

    return NextResponse.json({ revoked: true });
  } catch (err) {
    console.error("[DELETE /api/festevents/[id]/share]", err);
    return NextResponse.json(
      { error: "Erreur lors de la révocation du lien de partage." },
      { status: 500 },
    );
  }
}
