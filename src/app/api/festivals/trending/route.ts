import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { selectTrendingFestivals } from "@/lib/trending-festivals";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit") ?? "3")), 10);

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
    },
  });

  const mapped = festivals.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    city: f.city,
    country: f.country,
    startDate: f.startDate.toISOString(),
    endDate: f.endDate.toISOString(),
    festivalType: f.festivalType,
    followerCount: f._count.followers,
  }));

  const data = selectTrendingFestivals(mapped, limit);

  return NextResponse.json({ data });
}
