import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { submissionsToCsv } from "@/lib/admin-export";

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

  const submissions = await prisma.festivalSubmission.findMany({
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      nameProposed: true,
      officialUrl: true,
      status: true,
      submittedAt: true,
      author: { select: { email: true } },
    },
  });

  const csv = submissionsToCsv(
    submissions.map((s) => ({
      id: s.id,
      nameProposed: s.nameProposed,
      siteUrl: s.officialUrl,
      authorEmail: s.author.email,
      status: s.status,
      submittedAt: s.submittedAt,
    })),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="soumissions-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
