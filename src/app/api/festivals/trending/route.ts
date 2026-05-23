import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankByTrendingScore } from "@/lib/festival-trending-score";

const RECENT_DAYS = 7;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit") ?? "3")), 10);

  const recentCutoff = new Date(Date.now() - RECENT_DAYS * 86_400_000);

  const festivals = await prisma.festival.findMany({
    where: { startDate: { gte: new Date() } },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      country: true,
      startDate: true,
      endDate: true,
      festivalType: true,
      _count: { select: { followers: true } },
      newsItems: {
        where: { publishedAt: { gte: recentCutoff } },
        select: { id: true },
      },
    },
  });

  const ranked = rankByTrendingScore(
    festivals.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      city: f.city,
      country: f.country,
      startDate: f.startDate.toISOString(),
      endDate: f.endDate.toISOString(),
      festivalType: f.festivalType,
      followerCount: f._count.followers,
      recentNewsCount: f.newsItems.length,
    })),
  );

  const data = ranked.slice(0, limit).map(({ trendingScore: _, ...f }) => f);

  return NextResponse.json({ data });
}
