import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { festivalsToCsv } from "@/lib/admin-export";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") return null;
  return session;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const festivals = await prisma.festival.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      festivalType: true,
      startDate: true,
      endDate: true,
      city: true,
      country: true,
      ingestionStatus: true,
      confidenceLevel: true,
    },
  });

  const csv = festivalsToCsv(festivals);
  const filename = `festivals-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
