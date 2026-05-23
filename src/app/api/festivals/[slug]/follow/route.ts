import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * POST /api/festivals/[slug]/follow
 * Follow a festival (auth required).
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour suivre un festival." },
      { status: 401 },
    );
  }

  const { slug } = await params;

  const festival = await prisma.festival.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!festival) {
    return NextResponse.json({ error: "Festival introuvable." }, { status: 404 });
  }

  try {
    await prisma.userFollowsFestival.upsert({
      where: {
        userId_festivalId: {
          userId: session.user.id,
          festivalId: festival.id,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        festivalId: festival.id,
      },
    });

    return NextResponse.json({ followed: true }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/festivals/[slug]/follow]", err);
    return NextResponse.json({ error: "Erreur lors du suivi du festival." }, { status: 500 });
  }
}

/**
 * DELETE /api/festivals/[slug]/follow
 * Unfollow a festival (auth required).
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour ne plus suivre un festival." },
      { status: 401 },
    );
  }

  const { slug } = await params;

  const festival = await prisma.festival.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!festival) {
    return NextResponse.json({ error: "Festival introuvable." }, { status: 404 });
  }

  try {
    await prisma.userFollowsFestival.deleteMany({
      where: {
        userId: session.user.id,
        festivalId: festival.id,
      },
    });

    return NextResponse.json({ followed: false }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/festivals/[slug]/follow]", err);
    return NextResponse.json({ error: "Erreur lors de la suppression du suivi." }, { status: 500 });
  }
}
