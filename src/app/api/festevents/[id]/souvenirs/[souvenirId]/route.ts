import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseJsonArray } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string; souvenirId: string }> };

/**
 * PATCH /api/festevents/[id]/souvenirs/[souvenirId]
 * Update note, photos, or timestamp of a souvenir.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id, souvenirId } = await params;

  const souvenir = await prisma.souvenir.findFirst({
    where: {
      id: souvenirId,
      festEventId: id,
      userId: session.user.id,
    },
  });

  if (!souvenir) {
    return NextResponse.json({ error: "Souvenir introuvable." }, { status: 404 });
  }

  let body: {
    note?: string;
    photos?: string[];
    timestamp?: string;
    freeText?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const updated = await prisma.souvenir.update({
    where: { id: souvenirId },
    data: {
      ...(body.note !== undefined ? { note: body.note } : {}),
      ...(body.freeText !== undefined ? { freeText: body.freeText } : {}),
      ...(body.photos !== undefined ? { photos: JSON.stringify(body.photos) } : {}),
      ...(body.timestamp !== undefined ? { timestamp: new Date(body.timestamp) } : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    note: updated.note,
    freeText: updated.freeText,
    photos: parseJsonArray(updated.photos),
    timestamp: updated.timestamp.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

/**
 * DELETE /api/festevents/[id]/souvenirs/[souvenirId]
 * Permanently delete a souvenir.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id, souvenirId } = await params;

  const souvenir = await prisma.souvenir.findFirst({
    where: {
      id: souvenirId,
      festEventId: id,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!souvenir) {
    return NextResponse.json({ error: "Souvenir introuvable." }, { status: 404 });
  }

  await prisma.souvenir.delete({ where: { id: souvenirId } });

  return new NextResponse(null, { status: 204 });
}
