import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/festevents/[id]/checklist
 * Returns checklist items for a festEvent.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id: festEventId } = await params;

  const festEvent = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId: session.user.id },
    select: { id: true },
  });

  if (!festEvent) {
    return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
  }

  const items = await prisma.checklistItem.findMany({
    where: { festEventId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      label: true,
      done: true,
      cost: true,
      assigneeName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    items.map((item) => ({
      id: item.id,
      label: item.label,
      done: item.done,
      cost: item.cost ?? null,
      assigneeName: item.assigneeName ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  );
}

/**
 * POST /api/festevents/[id]/checklist
 * Creates a new checklist item.
 * Body: { label: string; cost?: number; assigneeName?: string }
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id: festEventId } = await params;

  const festEvent = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId: session.user.id },
    select: { id: true },
  });

  if (!festEvent) {
    return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
  }

  let body: { label: string; cost?: number; assigneeName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (!body.label || typeof body.label !== "string") {
    return NextResponse.json({ error: "Le champ label est requis." }, { status: 400 });
  }

  const item = await prisma.checklistItem.create({
    data: {
      festEventId,
      userId: session.user.id,
      label: body.label.trim(),
      done: false,
      cost: body.cost ?? null,
      assigneeName: body.assigneeName ?? null,
    },
  });

  return NextResponse.json(
    {
      id: item.id,
      label: item.label,
      done: item.done,
      cost: item.cost ?? null,
      assigneeName: item.assigneeName ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}
