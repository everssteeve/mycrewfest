import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const festival = await prisma.festival.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!festival) {
      return NextResponse.json(
        { error: "Festival introuvable." },
        { status: 404 },
      );
    }

    const newsItems = await prisma.newsItem.findMany({
      where: { festivalId: festival.id },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 10,
    });

    return NextResponse.json(
      newsItems.map((item) => ({
        id: item.id,
        source: item.source,
        sourceUrl: item.sourceUrl,
        publishedAt: item.publishedAt.toISOString(),
        category: item.category,
        summary: item.summary,
        urgencyLevel: item.urgencyLevel,
        isPinned: item.isPinned,
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des news." },
      { status: 500 },
    );
  }
}
