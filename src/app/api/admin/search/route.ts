import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatFestivalSearchResult, formatUserSearchResult, rankSearchResults } from "@/lib/admin-search";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") return null;
  return session;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [festivals, users] = await Promise.all([
    prisma.festival.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { slug: { contains: q } },
        ],
      },
      take: 10,
      select: { id: true, name: true, slug: true, ingestionStatus: true },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { pseudo: { contains: q } },
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 10,
      select: { id: true, pseudo: true, name: true, email: true, role: true },
    }),
  ]);

  const rawResults = [
    ...festivals.map(formatFestivalSearchResult),
    ...users.map(formatUserSearchResult),
  ];

  const results = rankSearchResults(rawResults, q).slice(0, 12);
  return NextResponse.json({ results });
}
