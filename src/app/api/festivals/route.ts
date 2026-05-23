import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { Prisma } from "@prisma/client";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";
  const country = searchParams.get("country") ?? "";
  const city = searchParams.get("city") ?? "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSizeRaw = Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(Math.max(1, pageSizeRaw), MAX_PAGE_SIZE);

  const where: Prisma.FestivalWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q } },
              { city: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {},
      type && type !== "tous" ? { festivalType: type } : {},
      country ? { country: { contains: country } } : {},
      city ? { city: { contains: city } } : {},
      dateFrom ? { startDate: { gte: new Date(dateFrom) } } : {},
      dateTo ? { endDate: { lte: new Date(dateTo) } } : {},
    ],
  };

  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const [total, festivals] = await prisma.$transaction([
      prisma.festival.count({ where }),
      prisma.festival.findMany({
        where,
        orderBy: { startDate: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          startDate: true,
          endDate: true,
          city: true,
          country: true,
          latitude: true,
          longitude: true,
          festivalType: true,
          programType: true,
          programStatus: true,
          ingestionStatus: true,
          confidenceLevel: true,
          capacity: true,
          siteUrl: true,
          instagramHandle: true,
          isFeatured: true,
          _count: { select: { events: true, followers: true } },
        },
      }),
    ]);

    // When authenticated, fetch follow statuses + recent news counts
    let followedIds = new Set<string>();
    const recentNewsMap = new Map<string, { count: number; hasUrgent: boolean }>();
    if (userId && festivals.length > 0) {
      const festivalIds = festivals.map((f) => f.id);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [followed, recentNews] = await Promise.all([
        prisma.userFollowsFestival.findMany({
          where: { userId, festivalId: { in: festivalIds } },
          select: { festivalId: true },
        }),
        prisma.newsItem.findMany({
          where: {
            festivalId: { in: festivalIds },
            publishedAt: { gte: sevenDaysAgo },
          },
          select: { festivalId: true, urgencyLevel: true },
        }),
      ]);

      followedIds = new Set(followed.map((f) => f.festivalId));

      for (const n of recentNews) {
        const entry = recentNewsMap.get(n.festivalId) ?? { count: 0, hasUrgent: false };
        entry.count += 1;
        if (n.urgencyLevel === "critique") entry.hasUrgent = true;
        recentNewsMap.set(n.festivalId, entry);
      }
    }

    const data = festivals.map((f) => {
      const isFollowed = followedIds.has(f.id);
      const news = isFollowed ? recentNewsMap.get(f.id) : undefined;
      return {
        id: f.id,
        name: f.name,
        slug: f.slug,
        description: f.description,
        startDate: f.startDate.toISOString(),
        endDate: f.endDate.toISOString(),
        city: f.city,
        country: f.country,
        latitude: f.latitude,
        longitude: f.longitude,
        festivalType: f.festivalType,
        programType: f.programType,
        programStatus: f.programStatus,
        ingestionStatus: f.ingestionStatus,
        confidenceLevel: f.confidenceLevel,
        capacity: f.capacity,
        siteUrl: f.siteUrl,
        instagramHandle: f.instagramHandle,
        isFeatured: f.isFeatured,
        _count: f._count,
        isFollowed,
        recentNewsCount: news?.count ?? 0,
        hasUrgentNews: news?.hasUrgent ?? false,
      };
    });

    return NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("[GET /api/festivals]", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des festivals." },
      { status: 500 },
    );
  }
}
