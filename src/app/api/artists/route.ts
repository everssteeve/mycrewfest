import { NextResponse } from "next/server";
import { parseJsonArray } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const discipline = searchParams.get("discipline")?.trim() ?? "";

  const artists = await prisma.artist.findMany({
    select: {
      id: true,
      name: true,
      disciplines: true,
      countryCode: true,
      _count: { select: { events: true } },
    },
    orderBy: { name: "asc" },
  });

  const mapped = artists.map((a) => ({
    id: a.id,
    name: a.name,
    disciplines: parseJsonArray(a.disciplines) as string[],
    countryCode: a.countryCode,
    festivalCount: a._count.events,
  }));

  const filtered = mapped.filter((a) => {
    const matchesQuery =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.disciplines.some((d: string) => d.toLowerCase().includes(q));
    const matchesDiscipline = !discipline || a.disciplines.includes(discipline);
    return matchesQuery && matchesDiscipline;
  });

  return NextResponse.json({ data: filtered, total: filtered.length });
}
