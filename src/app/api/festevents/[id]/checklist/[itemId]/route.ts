import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string; itemId: string }> };

/**
 * PATCH /api/festevents/[id]/checklist/[itemId]
 * Toggle done, update label or cost.
 * Body: { done?: boolean; label?: string; cost?: number | null; assigneeName?: string | null }
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id: festEventId, itemId } = await params;

  // Verify ownership via festEvent
  const festEvent = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId: session.user.id },
    select: { id: true },
  });

  if (!festEvent) {
    return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
  }

  const existing = await prisma.checklistItem.findFirst({
    where: { id: itemId, festEventId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Item introuvable." }, { status: 404 });
  }

  let body: {
    done?: boolean;
    label?: string;
    cost?: number | null;
    assigneeName?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const updated = await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      ...(body.done !== undefined ? { done: body.done } : {}),
      ...(body.label !== undefined ? { label: body.label.trim() } : {}),
      ...(body.cost !== undefined ? { cost: body.cost } : {}),
      ...(body.assigneeName !== undefined ? { assigneeName: body.assigneeName } : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    label: updated.label,
    done: updated.done,
    cost: updated.cost ?? null,
    assigneeName: updated.assigneeName ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

/**
 * DELETE /api/festevents/[id]/checklist/[itemId]
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id: festEventId, itemId } = await params;

  const festEvent = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId: session.user.id },
    select: { id: true },
  });

  if (!festEvent) {
    return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
  }

  const existing = await prisma.checklistItem.findFirst({
    where: { id: itemId, festEventId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Item introuvable." }, { status: 404 });
  }

  await prisma.checklistItem.delete({ where: { id: itemId } });

  return new NextResponse(null, { status: 204 });
}
