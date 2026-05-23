import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/festevents/[id]/news
 * Returns news items for the festival linked to this festEvent.
 * Query params:
 *   category?: string — filter by category
 *   limit?: number    — default 50
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { id: festEventId } = await params;

  const festEvent = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId: session.user.id },
    select: { festivalId: true },
  });

  if (!festEvent) {
    return NextResponse.json({ error: "FestEvent introuvable." }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

  const newsItems = await prisma.newsItem.findMany({
    where: {
      festivalId: festEvent.festivalId,
      ...(category ? { category } : {}),
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });

  return NextResponse.json(
    newsItems.map((item) => ({
      id: item.id,
      source: item.source,
      sourceUrl: item.sourceUrl ?? null,
      publishedAt: item.publishedAt.toISOString(),
      category: item.category,
      summary: item.summary,
      urgencyLevel: item.urgencyLevel,
      isPinned: item.isPinned,
    })),
  );
}
